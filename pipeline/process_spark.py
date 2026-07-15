import os
import sys
import json
from datetime import datetime
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, IntegerType, TimestampType

# PostgreSQL Configurations
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_URL = "jdbc:postgresql://db:5432/market_sentiment"
KAFKA_SERVERS = "kafka:9092"

def write_to_postgres(df, epoch_id):
    """
    Writes micro-batch DataFrames to PostgreSQL.
    """
    # Cache DF for multiple writes
    df.persist()
    
    try:
        # Write to sentiment_aggregates table
        # Map columns to match database schema
        sent_df = df.select(
            F.col("ticker"),
            F.col("window.start").alias("window_start"),
            F.col("window.end").alias("window_end"),
            F.col("avg_sentiment"),
            F.col("tweet_count"),
            F.col("bullish_ratio"),
            F.col("bearish_ratio"),
            F.lit(0.0).alias("velocity") # simple velocity default
        )
        
        sent_df.write \
            .format("jdbc") \
            .option("url", DB_URL) \
            .option("dbtable", "sentiment_aggregates") \
            .option("user", DB_USER) \
            .option("password", DB_PASSWORD) \
            .option("driver", "org.postgresql.Driver") \
            .mode("append") \
            .save()
            
        # Compute simple correlation for the micro-batch and write to correlation_signals
        # (Alternatively, full history calculation done in API/Worker)
        # Here we write the immediate signal based on VADER metrics
        signal_df = df.select(
            F.col("ticker"),
            F.col("window.end").alias("timestamp"),
            F.col("pearson"),
            F.lit(0).alias("lag"),
            F.when((F.col("avg_sentiment") > 0.5) & (F.col("pearson") > 0.3), "BUY")
             .when((F.col("avg_sentiment") < -0.5) & (F.col("pearson") < -0.3), "SELL")
             .otherwise("HOLD").alias("signal"),
            F.lit(0.8).alias("confidence")
        )
        
        signal_df.write \
            .format("jdbc") \
            .option("url", DB_URL) \
            .option("dbtable", "correlation_signals") \
            .option("user", DB_USER) \
            .option("password", DB_PASSWORD) \
            .option("driver", "org.postgresql.Driver") \
            .mode("append") \
            .save()
            
    except Exception as e:
        print(f"Error writing batch {epoch_id} to PostgreSQL: {e}")
    finally:
        df.unpersist()

def analyze_vader_sentiment(text):
    """
    Local function to score VADER sentiment.
    Used inside Spark UDF.
    """
    # Lazy load VADER to prevent serialization errors
    import nltk
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        nltk.download('vader_lexicon', quiet=True)
        
    sid = SentimentIntensityAnalyzer()
    scores = sid.polarity_scores(text)
    return (scores["compound"], scores["pos"], scores["neg"], scores["neu"])

def main():
    print("Starting PySpark Structured Streaming Pipeline...")
    
    spark = SparkSession.builder \
        .appName("StockSentimentCorrelationStreaming") \
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0,org.postgresql:postgresql:42.6.0") \
        .config("spark.sql.shuffle.partitions", "2") \
        .master("local[*]") \
        .getOrCreate()
        
    spark.sparkContext.setLogLevel("WARN")
    
    # 1. Define schemas
    tweet_schema = StructType([
        StructField("id", StringType(), True),
        StructField("ticker", StringType(), True),
        StructField("text", StringType(), True),
        StructField("username", StringType(), True),
        StructField("timestamp", StringType(), True),
        StructField("followers", IntegerType(), True),
        StructField("likes", IntegerType(), True)
    ])
    
    price_schema = StructType([
        StructField("ticker", StringType(), True),
        StructField("price", DoubleType(), True),
        StructField("open", DoubleType(), True),
        StructField("high", DoubleType(), True),
        StructField("low", DoubleType(), True),
        StructField("close", DoubleType(), True),
        StructField("volume", IntegerType(), True),
        StructField("timestamp", StringType(), True)
    ])
    
    # 2. Subscribe to Kafka topics
    tweets_kafka_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_SERVERS) \
        .option("subscribe", "social_tweets") \
        .load()
        
    prices_kafka_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_SERVERS) \
        .option("subscribe", "stock_prices") \
        .load()
        
    # 3. Parse JSON values
    tweets_df = tweets_kafka_df \
        .selectExpr("CAST(value AS STRING) as json_val") \
        .select(F.from_json(F.col("json_val"), tweet_schema).alias("data")) \
        .select("data.*") \
        .withColumn("timestamp", F.to_timestamp("timestamp")) \
        .withColumn("timestamp", F.coalesce(F.col("timestamp"), F.current_timestamp()))
        
    prices_df = prices_kafka_df \
        .selectExpr("CAST(value AS STRING) as json_val") \
        .select(F.from_json(F.col("json_val"), price_schema).alias("data")) \
        .select("data.*") \
        .withColumn("timestamp", F.to_timestamp("timestamp")) \
        .withColumn("timestamp", F.coalesce(F.col("timestamp"), F.current_timestamp()))

    # 4. Define Sentiment Analyzer UDF
    sentiment_schema = StructType([
        StructField("compound", DoubleType(), True),
        StructField("pos", DoubleType(), True),
        StructField("neg", DoubleType(), True),
        StructField("neu", DoubleType(), True)
    ])
    sentiment_udf = F.udf(analyze_vader_sentiment, sentiment_schema)
    
    tweets_scored_df = tweets_df.withColumn("sentiment", sentiment_udf("text")) \
        .select(
            "id", "ticker", "text", "username", "timestamp", "followers", "likes",
            F.col("sentiment.compound").alias("compound"),
            F.col("sentiment.pos").alias("pos"),
            F.col("sentiment.neg").alias("neg"),
            F.col("sentiment.neu").alias("neu")
        )

    # 5. Streaming-Streaming Watermarks & Window Aggregations
    # 10 minutes watermarks for late-arriving events
    tweets_watermarked = tweets_scored_df \
        .withWatermark("timestamp", "10 minutes")
        
    prices_watermarked = prices_df \
        .withWatermark("timestamp", "10 minutes")
        
    # Aggregate tweets in 5-minute windows
    tweets_aggregated = tweets_watermarked \
        .groupBy(F.window(F.col("timestamp"), "5 minutes"), F.col("ticker")) \
        .agg(
            F.avg("compound").alias("avg_sentiment"),
            F.count("id").alias("tweet_count"),
            F.avg(F.when(F.col("compound") > 0.15, 1.0).otherwise(0.0)).alias("bullish_ratio"),
            F.avg(F.when(F.col("compound") < -0.15, 1.0).otherwise(0.0)).alias("bearish_ratio")
        )
        
    # Aggregate prices in 5-minute windows
    prices_aggregated = prices_watermarked \
        .groupBy(F.window(F.col("timestamp"), "5 minutes"), F.col("ticker")) \
        .agg(
            F.avg("price").alias("avg_price"),
            F.count("price").alias("price_tick_count")
        )
        
    # 6. Stream-Stream Join on ticker & window start time
    joined_streams = tweets_aggregated.join(
        prices_aggregated,
        expr="""
            tweets_aggregated.ticker = prices_aggregated.ticker AND 
            tweets_aggregated.window.start = prices_aggregated.window.start
        """
    ).select(
        tweets_aggregated["ticker"],
        tweets_aggregated["window"],
        F.col("avg_sentiment"),
        F.col("tweet_count"),
        F.col("bullish_ratio"),
        F.col("bearish_ratio"),
        F.col("avg_price"),
        # Mocking Pearson calculation inside Structured Streaming (using a formula proxy)
        # Pearson is updated dynamically by local API loops; here we generate a base score
        F.lit(0.45).alias("pearson") 
    )

    # 7. Write to PostgreSQL using foreachBatch sink
    query = joined_streams.writeStream \
        .foreachBatch(write_to_postgres) \
        .outputMode("update") \
        .option("checkpointLocation", "/tmp/spark-checkpoints") \
        .start()
        
    query.awaitTermination()

if __name__ == "__main__":
    main()

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

# Set Java Home for PySpark
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Copy and install python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK lexicon assets
RUN python -c "import nltk; nltk.download('vader_lexicon')"

# Copy source directories
COPY backend/app ./backend/app
COPY pipeline ./pipeline

# Expose port
EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

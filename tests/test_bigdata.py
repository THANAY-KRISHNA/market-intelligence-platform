import unittest
import sys
import os

# Add parent path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.bigdata_service import (
    get_dataset_preview,
    calculate_data_quality_profile,
    clean_dataset,
    execute_processing_pipeline,
    run_benchmarks,
    get_dataset_statistics
)

class TestBigDataAnalyticsPipeline(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_dataset_preview_structure(self):
        preview = get_dataset_preview(page=1, page_size=10)
        self.assertIn("total_records", preview)
        self.assertIn("columns", preview)
        self.assertIn("column_types", preview)
        self.assertIn("records", preview)
        self.assertGreater(preview["total_records"], 0)
        self.assertEqual(len(preview["records"]), 10)

    def test_dataset_statistics(self):
        stats = get_dataset_statistics()
        self.assertIn("numeric_summary", stats)
        self.assertIn("categorical_summary", stats)
        if "sentiment_score" in stats["numeric_summary"]:
            score_stats = stats["numeric_summary"]["sentiment_score"]
            self.assertIn("mean", score_stats)
            self.assertIn("std", score_stats)

    def test_data_quality_scoring_model(self):
        profile = calculate_data_quality_profile()
        self.assertIn("composite_quality_score", profile)
        self.assertIn("grade", profile)
        self.assertIn("metrics", profile)
        self.assertGreaterEqual(profile["composite_quality_score"], 0)
        self.assertLessEqual(profile["composite_quality_score"], 100)
        self.assertIn("completeness_score", profile["metrics"])
        self.assertIn("uniqueness_score", profile["metrics"])

    def test_non_destructive_cleaning(self):
        clean_res = clean_dataset(
            dataset_id="default",
            drop_duplicates=True,
            missing_strategy="impute_mean"
        )
        self.assertEqual(clean_res["status"], "success")
        self.assertIn("new_version_id", clean_res)
        self.assertGreater(clean_res["records_after"], 0)
        # Verify new version exists
        cleaned_preview = get_dataset_preview(dataset_id=clean_res["new_version_id"])
        self.assertEqual(cleaned_preview["total_records"], clean_res["records_after"])

    def test_pipeline_execution_stages(self):
        run = execute_processing_pipeline("default")
        self.assertEqual(run["status"], "SUCCESS")
        self.assertIn("run_id", run)
        self.assertIn("duration_ms", run)
        self.assertIn("throughput_records_sec", run)
        self.assertEqual(len(run["stages"]), 7)

    def test_empirical_benchmarks(self):
        benchmarks = run_benchmarks()
        self.assertIn("benchmark_runs", benchmarks)
        self.assertIn("average_throughput", benchmarks)
        self.assertGreater(len(benchmarks["benchmark_runs"]), 0)
        self.assertGreater(benchmarks["average_throughput"], 0)

    def test_api_upload_validation_non_csv(self):
        response = self.client.post(
            "/api/dataset/upload",
            files={"file": ("test.txt", b"plain text content", "text/plain")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Only CSV formatted files", response.json()["detail"])

if __name__ == '__main__':
    unittest.main()

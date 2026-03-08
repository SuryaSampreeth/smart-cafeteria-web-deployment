"""
Smoke tests for the ML Service Flask app.

These tests verify that:
1. The Flask app can be created and configured.
2. The /api/health endpoint is reachable (returns 200).
3. The / root endpoint returns expected JSON structure.

No trained model files are required — where the model is missing
the routes gracefully return 503, which is also tested.
"""

import pytest
import os

# Prevent the module-level load_best_model() from failing loudly
# when model files don't exist in CI (they won't be committed).
os.environ.setdefault("CI", "true")


@pytest.fixture
def client():
    """Create a Flask test client."""
    from app import app
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_root_endpoint(client):
    """Root endpoint should always return 200 with status field."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert data["status"] == "ok"


def test_health_endpoint(client):
    """Health endpoint should always return 200."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"


def test_forecast_daily_no_model(client):
    """Daily forecast should return 503 when no model is loaded."""
    from app import loaded_model
    # In CI there's no model file, so loaded_model should be None
    if loaded_model is None:
        response = client.get("/api/forecast/daily")
        assert response.status_code == 503

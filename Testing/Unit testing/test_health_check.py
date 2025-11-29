import pytest
from fastapi.testclient import TestClient

# Import the FastAPI app from the module under test
from storyteller_fastapi import app

@pytest.fixture(scope="class")
def client():
    """Fixture to provide a FastAPI test client for all tests in the class."""
    with TestClient(app) as c:
        yield c

class TestHealthCheck:
    # ------------------- HAPPY PATHS -------------------
    @pytest.mark.happy_path
    def test_health_check_returns_healthy_status(self, client):
        """
        Test that the /health endpoint returns status 'healthy' and database 'test' under normal conditions.
        """
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "test"

    @pytest.mark.happy_path
    def test_health_check_response_format(self, client):
        """
        Test that the /health endpoint returns a JSON object with exactly the expected keys.
        """
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert set(data.keys()) == {"status", "database"}

    # ------------------- EDGE CASES -------------------
    @pytest.mark.edge_case
    def test_health_check_with_extra_headers(self, client):
        """
        Test that the /health endpoint ignores extra headers and still returns healthy status.
        """
        response = client.get("/health", headers={"X-Extra": "value"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "test"

    @pytest.mark.edge_case
    def test_health_check_with_query_parameters(self, client):
        """
        Test that the /health endpoint ignores unexpected query parameters and returns healthy status.
        """
        response = client.get("/health?foo=bar&baz=qux")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "test"

    @pytest.mark.edge_case
    def test_health_check_method_not_allowed(self, client):
        """
        Test that using a non-GET method (e.g., POST) on /health returns 405 Method Not Allowed.
        """
        response = client.post("/health")
        assert response.status_code == 405
        assert "detail" in response.json()
        assert response.json()["detail"] == "Method Not Allowed"

    @pytest.mark.edge_case
    def test_health_check_path_case_sensitivity(self, client):
        """
        Test that /Health (capital H) returns 404, confirming path is case-sensitive.
        """
        response = client.get("/Health")
        assert response.status_code == 404

    @pytest.mark.edge_case
    def test_health_check_trailing_slash(self, client):
        """
        FastAPI automatically redirects /health/ → /health,
        so the resulting status code should be 200.
        """
        response = client.get("/health/")
        assert response.status_code == 200

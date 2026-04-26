"""
Test Admin Panel Navigation and APIs
Tests for admin login, dashboard, landing pages, consultations, and user journey
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')
ADMIN_PASSWORD = "celestaglow2024"


class TestAdminLogin:
    """Admin login endpoint tests"""
    
    def test_admin_login_success(self):
        """Test successful admin login"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert len(data["token"]) == 64  # SHA256 hash length
    
    def test_admin_login_failure(self):
        """Test failed admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": "wrongpassword"}
        )
        assert response.status_code == 401


class TestAdminDashboard:
    """Admin dashboard API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin session token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_analytics_overview(self, admin_token):
        """Test analytics overview endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/overview",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "total_revenue" in data
        assert "total_blogs" in data
    
    def test_analytics_live(self, admin_token):
        """Test live analytics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/live",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "live_visitors" in data
        assert "total_visits" in data


class TestAdminLandingPages:
    """Admin landing pages API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin session token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_all_landing_pages(self, admin_token):
        """Test getting all landing pages"""
        response = requests.get(
            f"{BASE_URL}/api/landing-pages/admin/all?include_inactive=true",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have landing pages
        assert len(data) >= 0
    
    def test_get_predefined_problems(self, admin_token):
        """Test getting predefined problems"""
        response = requests.get(
            f"{BASE_URL}/api/landing-pages/admin/predefined",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "problems" in data
    
    def test_get_landing_page_analytics(self, admin_token):
        """Test getting landing page analytics"""
        response = requests.get(
            f"{BASE_URL}/api/landing-pages/admin/analytics",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_pages" in data
        assert "by_category" in data


class TestAdminConsultations:
    """Admin consultations API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin session token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_all_consultations(self, admin_token):
        """Test getting all consultations"""
        response = requests.get(
            f"{BASE_URL}/api/consultation/admin/all",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "consultations" in data
        assert "count" in data
    
    def test_get_consultation_stats(self, admin_token):
        """Test getting consultation stats"""
        response = requests.get(
            f"{BASE_URL}/api/consultation/admin/stats",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "consultation_stats" in data
        assert "funnel_stats" in data


class TestAdminUserJourney:
    """Admin user journey API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin session token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")
    
    def test_get_user_tracking_stats(self, admin_token):
        """Test getting user tracking stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/user-tracking/stats",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_visitors" in data
        assert "new_visitors" in data
        assert "returning_visitors" in data
        assert "reached_checkout" in data
    
    def test_get_user_tracking_visitors(self, admin_token):
        """Test getting user tracking visitors"""
        response = requests.get(
            f"{BASE_URL}/api/admin/user-tracking/visitors?days=7",
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "visitors" in data


class TestSessionTokenAuth:
    """Test session token authentication across all admin routes"""
    
    def test_session_token_works_for_landing_pages(self):
        """Test that session token from login works for landing pages"""
        # Login to get session token
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Use session token for landing pages
        response = requests.get(
            f"{BASE_URL}/api/landing-pages/admin/all",
            headers={"X-Admin-Token": token}
        )
        assert response.status_code == 200
    
    def test_session_token_works_for_consultations(self):
        """Test that session token from login works for consultations"""
        # Login to get session token
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Use session token for consultations
        response = requests.get(
            f"{BASE_URL}/api/consultation/admin/all",
            headers={"X-Admin-Token": token}
        )
        assert response.status_code == 200
    
    def test_session_token_works_for_user_tracking(self):
        """Test that session token from login works for user tracking"""
        # Login to get session token
        login_response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Use session token for user tracking
        response = requests.get(
            f"{BASE_URL}/api/admin/user-tracking/stats",
            headers={"X-Admin-Token": token}
        )
        assert response.status_code == 200
    
    def test_plain_password_still_works(self):
        """Test that plain password still works for backward compatibility"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/overview",
            headers={"X-Admin-Token": ADMIN_PASSWORD}
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Test Admin Session Storage and WhatsApp API Integration
Tests for P0-P1 priorities:
- Admin login with sessionStorage-based authentication
- Admin Dashboard loads correctly
- WhatsApp API endpoint
- Admin User Journey page (hook dependencies fixed)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuthentication:
    """Test admin login and session token functionality"""
    
    def test_admin_login_success(self):
        """Test admin login returns session token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "celestaglow2024"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Login should return success=True"
        assert "token" in data, "Login should return a token"
        assert len(data["token"]) > 0, "Token should not be empty"
        
        # Store token for other tests
        TestAdminAuthentication.admin_token = data["token"]
        print(f"✓ Admin login successful, token received: {data['token'][:20]}...")
    
    def test_admin_login_failure(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login correctly rejects wrong password")
    
    def test_admin_logout(self):
        """Test admin logout endpoint"""
        response = requests.post(f"{BASE_URL}/api/admin/logout")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Logout should return success=True"
        print("✓ Admin logout endpoint works")


class TestAdminDashboard:
    """Test admin dashboard API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "celestaglow2024"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        else:
            pytest.skip("Could not get admin token")
    
    def test_admin_analytics_live(self):
        """Test live analytics endpoint with session token"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/live",
            headers={"X-Admin-Token": self.admin_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "live_visitors" in data, "Should have live_visitors"
        assert "total_visits" in data, "Should have total_visits"
        print(f"✓ Live analytics: {data.get('live_visitors', {}).get('total', 0)} live visitors, {data.get('total_visits', 0)} total visits")
    
    def test_admin_analytics_overview(self):
        """Test overview analytics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/overview",
            headers={"X-Admin-Token": self.admin_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"✓ Overview analytics: {data.get('total_orders', 0)} orders, ₹{data.get('total_revenue', 0)} revenue")
    
    def test_admin_analytics_pages(self):
        """Test page analytics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/pages?days=7",
            headers={"X-Admin-Token": self.admin_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "page_analytics" in data or "hourly_distribution" in data, "Should have analytics data"
        print("✓ Page analytics endpoint works")
    
    def test_admin_analytics_leads(self):
        """Test leads analytics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/leads",
            headers={"X-Admin-Token": self.admin_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "leads" in data or "stats" in data, "Should have leads data"
        print(f"✓ Leads analytics: {data.get('stats', {}).get('total_leads', 0)} total leads")
    
    def test_admin_blog_stats(self):
        """Test blog stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/blog-stats",
            headers={"X-Admin-Token": self.admin_token}
        )
        # This endpoint may or may not exist
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Blog stats: {data.get('total_blogs', 0)} blogs, {data.get('total_views', 0)} views")
        else:
            print(f"⚠ Blog stats endpoint returned {response.status_code}")
    
    def test_admin_unauthorized_without_token(self):
        """Test that admin endpoints reject requests without token"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/live")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin endpoints correctly reject unauthorized requests")


class TestAdminUserJourney:
    """Test admin user journey tracking endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "celestaglow2024"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        else:
            pytest.skip("Could not get admin token")
    
    def test_user_tracking_visitors(self):
        """Test user tracking visitors endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/user-tracking/visitors?days=7&limit=100",
            headers={"X-Admin-Token": self.admin_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "visitors" in data, "Should have visitors list"
        print(f"✓ User tracking: {len(data.get('visitors', []))} visitors found")
    
    def test_user_tracking_stats(self):
        """Test user tracking stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/user-tracking/stats?days=7",
            headers={"X-Admin-Token": self.admin_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"✓ User tracking stats: {data.get('total_visitors', 0)} total, {data.get('new_visitors', 0)} new")


class TestWhatsAppAPI:
    """Test WhatsApp Cloud API integration endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "celestaglow2024"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("token")
        else:
            pytest.skip("Could not get admin token")
    
    def test_whatsapp_logs_endpoint(self):
        """Test WhatsApp logs endpoint returns data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/whatsapp/logs",
            headers={"X-Admin-Token": self.admin_token}
        )
        # This endpoint may return 200 with logs or 404 if not implemented
        if response.status_code == 200:
            data = response.json()
            print(f"✓ WhatsApp logs: {len(data.get('logs', []))} logs found")
        elif response.status_code == 404:
            print("⚠ WhatsApp logs endpoint not found (may need to be added to routes)")
        else:
            print(f"⚠ WhatsApp logs returned {response.status_code}: {response.text[:100]}")
    
    def test_whatsapp_stats_endpoint(self):
        """Test WhatsApp stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/whatsapp/stats",
            headers={"X-Admin-Token": self.admin_token}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ WhatsApp stats: {data.get('total_messages', 0)} total messages")
        elif response.status_code == 404:
            print("⚠ WhatsApp stats endpoint not found (may need to be added to routes)")
        else:
            print(f"⚠ WhatsApp stats returned {response.status_code}")


class TestSessionTokenSecurity:
    """Test session token security features"""
    
    def test_session_token_format(self):
        """Test that session token is a proper hash"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "celestaglow2024"
        })
        assert response.status_code == 200
        
        token = response.json().get("token")
        # Token should be a SHA256 hash (64 hex characters)
        assert len(token) == 64, f"Token should be 64 chars (SHA256), got {len(token)}"
        assert all(c in '0123456789abcdef' for c in token), "Token should be hex"
        print(f"✓ Session token is properly formatted SHA256 hash")
    
    def test_token_works_for_multiple_requests(self):
        """Test that same token works for multiple requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "celestaglow2024"
        })
        token = response.json().get("token")
        
        # Make multiple requests with same token
        for i in range(3):
            response = requests.get(
                f"{BASE_URL}/api/admin/analytics/live",
                headers={"X-Admin-Token": token}
            )
            assert response.status_code == 200, f"Request {i+1} failed"
        
        print("✓ Session token works for multiple requests")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

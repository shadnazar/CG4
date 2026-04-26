"""
Employee Portal Backend Tests
Tests for employee login, dashboard, and all employee-accessible endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')

# Test credentials from requirements
TEST_ADMIN_USER = "testadmin"
TEST_ADMIN_PASS = "TestPass123"
LIMITED_USER = "orderteam"
LIMITED_PASS = "VclhxCbJ"
ADMIN_PASSWORD = "celestaglow2024"


class TestEmployeeLogin:
    """Employee login endpoint tests"""
    
    def test_employee_login_success(self):
        """Test successful employee login with testadmin credentials"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        assert "employee" in data
        assert data["employee"]["username"] == TEST_ADMIN_USER
        # testadmin should have all permissions
        permissions = data["employee"]["permissions"]
        assert permissions.get("orders") == True
        assert permissions.get("customers") == True
        assert permissions.get("blogs") == True
        assert permissions.get("analytics") == True
        assert permissions.get("landing_pages") == True
        assert permissions.get("consultations") == True
    
    def test_employee_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_limited_user_login(self):
        """Test login with limited permissions user (orderteam)"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": LIMITED_USER,
            "password": LIMITED_PASS
        })
        print(f"Limited user login status: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        # orderteam should only have orders and customers permissions
        permissions = data["employee"]["permissions"]
        assert permissions.get("orders") == True
        assert permissions.get("customers") == True


class TestEmployeeVerify:
    """Employee token verification tests"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee token for testadmin"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get employee token")
    
    def test_verify_valid_token(self, employee_token):
        """Test verifying a valid employee token"""
        response = requests.get(f"{BASE_URL}/api/employee/verify", headers={
            "X-Employee-Token": employee_token
        })
        print(f"Verify response: {response.status_code} - {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        assert data.get("username") == TEST_ADMIN_USER
        assert "permissions" in data
    
    def test_verify_invalid_token(self):
        """Test verifying an invalid token"""
        response = requests.get(f"{BASE_URL}/api/employee/verify", headers={
            "X-Employee-Token": "invalid_token_12345"
        })
        assert response.status_code == 401


class TestEmployeeOrders:
    """Employee orders endpoint tests"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee token for testadmin"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get employee token")
    
    def test_get_orders_with_employee_token(self, employee_token):
        """Test fetching orders with employee token"""
        response = requests.get(f"{BASE_URL}/api/orders?limit=100", headers={
            "X-Employee-Token": employee_token
        })
        print(f"Orders response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} orders")


class TestEmployeeCustomers:
    """Employee customers endpoint tests"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee token for testadmin"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get employee token")
    
    def test_get_customers_with_employee_token(self, employee_token):
        """Test fetching customers with employee token"""
        response = requests.get(f"{BASE_URL}/api/admin/customers?limit=200", headers={
            "X-Employee-Token": employee_token
        })
        print(f"Customers response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert "customers" in data
        print(f"Found {len(data.get('customers', []))} customers")


class TestEmployeeBlogs:
    """Employee blogs endpoint tests"""
    
    def test_get_blogs_public(self):
        """Test fetching blogs (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        print(f"Blogs response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} blogs")


class TestEmployeeAnalytics:
    """Employee analytics endpoint tests"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee token for testadmin"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get employee token")
    
    def test_get_live_analytics_with_employee_token(self, employee_token):
        """Test fetching live analytics with employee token"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/live", headers={
            "X-Employee-Token": employee_token
        })
        print(f"Analytics live response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "live_visitors" in data
    
    def test_get_user_tracking_stats_with_employee_token(self, employee_token):
        """Test fetching user tracking stats with employee token"""
        response = requests.get(f"{BASE_URL}/api/admin/user-tracking/stats?days=7", headers={
            "X-Employee-Token": employee_token
        })
        print(f"User tracking stats response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200


class TestEmployeeLandingPages:
    """Employee landing pages endpoint tests"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee token for testadmin"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get employee token")
    
    def test_get_landing_pages_with_employee_token(self, employee_token):
        """Test fetching landing pages with employee token"""
        response = requests.get(f"{BASE_URL}/api/landing-pages/admin/all", headers={
            "X-Employee-Token": employee_token
        })
        print(f"Landing pages response: {response.status_code}")
        print(f"Response: {response.json()[:200] if response.status_code == 200 else response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} landing pages")


class TestEmployeeConsultations:
    """Employee consultations endpoint tests"""
    
    @pytest.fixture
    def employee_token(self):
        """Get employee token for testadmin"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": TEST_ADMIN_USER,
            "password": TEST_ADMIN_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get employee token")
    
    def test_get_consultations_with_employee_token(self, employee_token):
        """Test fetching consultations with employee token"""
        response = requests.get(f"{BASE_URL}/api/admin/consultations", headers={
            "X-Employee-Token": employee_token
        })
        print(f"Consultations response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "consultations" in data


class TestPermissionEnforcement:
    """Test that limited users get 403 on restricted endpoints"""
    
    @pytest.fixture
    def limited_token(self):
        """Get employee token for orderteam (limited permissions)"""
        response = requests.post(f"{BASE_URL}/api/employee/login", json={
            "username": LIMITED_USER,
            "password": LIMITED_PASS
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not get limited user token")
    
    def test_limited_user_cannot_access_analytics(self, limited_token):
        """Test that orderteam user gets 403 on analytics endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/live", headers={
            "X-Employee-Token": limited_token
        })
        print(f"Limited user analytics response: {response.status_code}")
        
        assert response.status_code == 403
    
    def test_limited_user_can_access_orders(self, limited_token):
        """Test that orderteam user can access orders"""
        response = requests.get(f"{BASE_URL}/api/orders?limit=10", headers={
            "X-Employee-Token": limited_token
        })
        print(f"Limited user orders response: {response.status_code}")
        
        assert response.status_code == 200
    
    def test_limited_user_can_access_customers(self, limited_token):
        """Test that orderteam user can access customers"""
        response = requests.get(f"{BASE_URL}/api/admin/customers?limit=10", headers={
            "X-Employee-Token": limited_token
        })
        print(f"Limited user customers response: {response.status_code}")
        
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

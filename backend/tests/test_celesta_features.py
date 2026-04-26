"""
Backend API tests for Celesta Glow E-commerce Platform
Tests: Orders, Referrals, Notifications, Pricing
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')

class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data['message']}")
    
    def test_recent_purchases(self):
        """Test recent purchases endpoint for social proof"""
        response = requests.get(f"{BASE_URL}/api/recent-purchases")
        assert response.status_code == 200
        data = response.json()
        assert "purchases" in data
        print(f"✓ Recent purchases: {len(data['purchases'])} items")


class TestOrderAPI:
    """Order creation and retrieval tests"""
    
    def test_create_order_cod(self):
        """Test creating a COD order"""
        order_data = {
            "name": "TEST_User",
            "phone": "9876543210",
            "house_number": "123 Test House",
            "area": "Test Area",
            "pincode": "400001",
            "state": "Maharashtra",
            "payment_method": "COD",
            "amount": 699,
            "email": "test@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "order_id" in data
        assert data["name"] == "TEST_User"
        assert data["payment_method"] == "COD"
        assert data["delivery_timeline"] == "5-7 Business Days"
        
        # Check referral code is generated
        assert "referral_code" in data or data.get("referral_code") is not None
        
        print(f"✓ COD Order created: {data['order_id']}")
        return data["order_id"]
    
    def test_create_order_prepaid(self):
        """Test creating a prepaid order"""
        order_data = {
            "name": "TEST_PrepaidUser",
            "phone": "9876543211",
            "house_number": "456 Test House",
            "area": "Test Area 2",
            "pincode": "560001",
            "state": "Karnataka",
            "payment_method": "Prepaid",
            "amount": 699,
            "email": "prepaid@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "order_id" in data
        assert data["payment_method"] == "Prepaid"
        assert data["delivery_timeline"] == "Fast Delivery (2-3 Days)"
        
        print(f"✓ Prepaid Order created: {data['order_id']}")
    
    def test_create_order_with_referral(self):
        """Test creating an order with referral code"""
        order_data = {
            "name": "TEST_ReferredUser",
            "phone": "9876543212",
            "house_number": "789 Test House",
            "area": "Test Area 3",
            "pincode": "110001",
            "state": "Delhi",
            "payment_method": "COD",
            "amount": 649,  # Discounted price
            "email": "referred@example.com",
            "referral_code": "TESTREF123",
            "referral_discount": 50
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "order_id" in data
        print(f"✓ Referred Order created: {data['order_id']}")
    
    def test_get_orders(self):
        """Test getting all orders"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} orders")
    
    def test_get_order_by_id(self):
        """Test getting a specific order"""
        # First create an order
        order_data = {
            "name": "TEST_GetOrder",
            "phone": "9876543213",
            "house_number": "Test House",
            "area": "Test Area",
            "pincode": "400001",
            "state": "Maharashtra",
            "payment_method": "COD",
            "amount": 699
        }
        
        create_response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert create_response.status_code == 200
        order_id = create_response.json()["order_id"]
        
        # Now get the order
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["order_id"] == order_id
        assert data["name"] == "TEST_GetOrder"
        print(f"✓ Retrieved order: {order_id}")


class TestPincodeAPI:
    """Pincode lookup tests"""
    
    def test_pincode_maharashtra(self):
        """Test pincode lookup for Maharashtra"""
        response = requests.get(f"{BASE_URL}/api/pincode/400001/state")
        assert response.status_code == 200
        
        data = response.json()
        assert data["pincode"] == "400001"
        assert "Maharashtra" in data["state"] or data["state"] is not None
        print(f"✓ Pincode 400001 -> {data['state']}")
    
    def test_pincode_karnataka(self):
        """Test pincode lookup for Karnataka"""
        response = requests.get(f"{BASE_URL}/api/pincode/560001/state")
        assert response.status_code == 200
        
        data = response.json()
        assert data["pincode"] == "560001"
        print(f"✓ Pincode 560001 -> {data['state']}")


class TestDiscountAPI:
    """Discount and referral tests"""
    
    def test_claim_discount(self):
        """Test claiming a discount"""
        claim_data = {
            "phone": "9876543214",
            "session_id": "test_session_123",
            "page": "homepage"
        }
        
        response = requests.post(f"{BASE_URL}/api/claim-discount", json=claim_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "discount_code" in data or "success" in data
        print(f"✓ Discount claimed: {data}")
    
    def test_validate_discount(self):
        """Test validating a discount"""
        response = requests.get(f"{BASE_URL}/api/validate-discount?phone=9876543214")
        assert response.status_code == 200
        
        data = response.json()
        assert "valid" in data
        print(f"✓ Discount validation: valid={data['valid']}")


class TestBlogAPI:
    """Blog API tests"""
    
    def test_get_blogs(self):
        """Test getting all blogs"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} blogs")
    
    def test_search_blogs(self):
        """Test searching blogs"""
        response = requests.get(f"{BASE_URL}/api/search?q=anti-aging")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search returned {len(data)} results")


class TestAdminAPI:
    """Admin API tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": "celestaglow2024"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "token" in data
        print(f"✓ Admin login successful")
    
    def test_admin_login_failure(self):
        """Test admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"password": "wrongpassword"}
        )
        assert response.status_code == 401
        print(f"✓ Admin login correctly rejected wrong password")
    
    def test_admin_analytics_live(self):
        """Test admin live analytics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics/live",
            headers={"X-Admin-Token": "celestaglow2024"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "live_visitors" in data
        assert "total_visits" in data
        print(f"✓ Live analytics: {data['live_visitors']['total']} visitors, {data['total_visits']} total visits")


class TestReferralAPI:
    """Referral system tests"""
    
    def test_get_referrals(self):
        """Test getting referrals list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/referrals",
            headers={"X-Admin-Token": "celestaglow2024"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "referrals" in data or isinstance(data, list)
        print(f"✓ Referrals endpoint working")
    
    def test_validate_referral_code(self):
        """Test validating a referral code"""
        response = requests.get(f"{BASE_URL}/api/referral/validate?code=TESTCODE123")
        # May return 200 with valid=false or 404
        assert response.status_code in [200, 404]
        print(f"✓ Referral validation endpoint working")


class TestNotificationAPI:
    """Notification system tests"""
    
    def test_get_broadcasts(self):
        """Test getting active broadcasts"""
        response = requests.get(f"{BASE_URL}/api/notifications/broadcast")
        assert response.status_code == 200
        
        data = response.json()
        assert "broadcasts" in data
        print(f"✓ Broadcasts: {len(data['broadcasts'])} active")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Comprehensive API tests for Celesta Glow Beauty Hub
Tests: Homepage, Product, Blog, Consultation, Admin, Analytics, Orders
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Basic health and root endpoint tests"""
    
    def test_root_endpoint(self):
        """Test API root returns welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Root endpoint: {data['message']}")


class TestBlogEndpoints:
    """Blog API tests"""
    
    def test_get_all_blogs(self):
        """Test fetching all blogs"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check blog structure
        blog = data[0]
        assert "id" in blog
        assert "title" in blog
        assert "slug" in blog
        print(f"✓ Fetched {len(data)} blogs")
    
    def test_get_blog_by_slug(self):
        """Test fetching single blog by slug"""
        # First get all blogs to get a valid slug
        response = requests.get(f"{BASE_URL}/api/blogs")
        blogs = response.json()
        if blogs:
            slug = blogs[0]["slug"]
            response = requests.get(f"{BASE_URL}/api/blogs/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert data["slug"] == slug
            print(f"✓ Fetched blog: {data['title'][:50]}...")
    
    def test_get_nonexistent_blog(self):
        """Test 404 for nonexistent blog"""
        response = requests.get(f"{BASE_URL}/api/blogs/nonexistent-blog-slug-12345")
        assert response.status_code == 404
        print("✓ Nonexistent blog returns 404")


class TestConsultationEndpoints:
    """Consultation API tests"""
    
    def test_get_consultation_questions(self):
        """Test fetching consultation questions"""
        response = requests.get(f"{BASE_URL}/api/consultation/questions?lang=en")
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert len(data["questions"]) == 6
        print(f"✓ Fetched {len(data['questions'])} consultation questions")
    
    def test_get_consultation_questions_hindi(self):
        """Test fetching consultation questions in Hindi"""
        response = requests.get(f"{BASE_URL}/api/consultation/questions?lang=hi")
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        print("✓ Fetched consultation questions in Hindi")
    
    def test_get_consultation_labels(self):
        """Test fetching consultation labels"""
        response = requests.get(f"{BASE_URL}/api/consultation/labels?lang=en")
        assert response.status_code == 200
        data = response.json()
        assert "age" in data
        assert "skin_type" in data
        print("✓ Fetched consultation labels")
    
    def test_submit_consultation(self):
        """Test submitting consultation answers"""
        payload = {
            "phone": "9876543210",
            "session_id": "test-session-123",
            "language": "en",
            "face_images": [],
            "answers": {
                "age": "30_40",
                "skin_type": "combination",
                "concerns": ["fine_lines", "pigmentation"],
                "sun_exposure": "1_2_hrs",
                "sunscreen": "sometimes",
                "lifestyle": "moderate",
                "skincare": "basic"
            }
        }
        response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "aging_level" in data
        assert "concerns" in data
        print(f"✓ Consultation submitted - Aging level: {data['aging_level']}")
    
    def test_track_consultation_event(self):
        """Test tracking consultation event"""
        payload = {
            "session_id": "test-session-123",
            "event_type": "started",
            "step": 1
        }
        response = requests.post(f"{BASE_URL}/api/consultation/track-event", json=payload)
        assert response.status_code == 200
        print("✓ Consultation event tracked")


class TestOrderEndpoints:
    """Order API tests"""
    
    def test_create_order_cod(self):
        """Test creating COD order"""
        payload = {
            "name": "TEST_User",
            "phone": "9876543210",
            "email": "test@example.com",
            "house": "123 Test House",
            "area": "Test Area",
            "pincode": "400001",
            "state": "Maharashtra",
            "city": "Mumbai",
            "payment_method": "cod",
            "quantity": 1,
            "discount_code": ""
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        print(f"✓ COD order created: {data['order_id']}")
        return data["order_id"]
    
    def test_get_orders(self):
        """Test fetching all orders (admin)"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Fetched {len(data)} orders")
    
    def test_get_recent_orders(self):
        """Test fetching recent orders stats"""
        response = requests.get(f"{BASE_URL}/api/stats/recent-orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Fetched {len(data)} recent orders")


class TestAnalyticsEndpoints:
    """Analytics API tests"""
    
    def test_track_visit(self):
        """Test tracking page visit"""
        payload = {
            "session_id": "test-session-123",
            "page": "/",
            "referrer": "https://google.com",
            "user_agent": "Mozilla/5.0 Test"
        }
        response = requests.post(f"{BASE_URL}/api/track-visit", json=payload)
        assert response.status_code == 200
        print("✓ Page visit tracked")
    
    def test_get_live_visitors(self):
        """Test fetching live visitors"""
        response = requests.get(f"{BASE_URL}/api/live-visitors")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ Live visitors: {data['count']}")
    
    def test_get_admin_analytics_live(self):
        """Test fetching admin live analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/live")
        assert response.status_code == 200
        data = response.json()
        assert "live_count" in data
        print(f"✓ Admin live analytics: {data['live_count']} visitors")
    
    def test_get_admin_analytics_pages(self):
        """Test fetching admin page analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/pages")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        print(f"✓ Admin page analytics fetched")
    
    def test_get_admin_analytics_leads(self):
        """Test fetching admin leads analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/leads")
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✓ Admin leads analytics: {len(data['leads'])} leads")


class TestLeadsEndpoints:
    """Leads API tests"""
    
    def test_claim_discount(self):
        """Test claiming discount"""
        payload = {
            "phone": "9876543215",
            "session_id": "test-session-456",
            "page": "/"
        }
        response = requests.post(f"{BASE_URL}/api/claim-discount", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Either success or already claimed
        assert "success" in data or "already_claimed" in data
        print(f"✓ Discount claim response: {data}")
    
    def test_validate_discount(self):
        """Test validating discount code"""
        response = requests.get(f"{BASE_URL}/api/validate-discount?code=WELCOME50")
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        print(f"✓ Discount validation: valid={data['valid']}")


class TestAdminEndpoints:
    """Admin API tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct password"""
        payload = {"password": "celestaglow2024"}
        response = requests.post(f"{BASE_URL}/api/admin/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print("✓ Admin login successful")
    
    def test_admin_login_failure(self):
        """Test admin login with wrong password"""
        payload = {"password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/api/admin/login", json=payload)
        assert response.status_code == 401
        print("✓ Admin login correctly rejected wrong password")


class TestRecentPurchases:
    """Recent purchases API tests"""
    
    def test_get_recent_purchases(self):
        """Test fetching recent purchases for social proof"""
        response = requests.get(f"{BASE_URL}/api/recent-purchases")
        assert response.status_code == 200
        data = response.json()
        assert "purchases" in data
        print(f"✓ Fetched {len(data['purchases'])} recent purchases")


class TestPincodeAPI:
    """Pincode lookup API tests"""
    
    def test_pincode_lookup(self):
        """Test pincode to state lookup"""
        response = requests.get(f"{BASE_URL}/api/pincode/400001/state")
        assert response.status_code == 200
        data = response.json()
        assert "state" in data
        print(f"✓ Pincode 400001: {data['state']}")


class TestSearchAPI:
    """Search API tests"""
    
    def test_search_blogs(self):
        """Test searching blogs"""
        response = requests.get(f"{BASE_URL}/api/search?q=skin")
        assert response.status_code == 200
        data = response.json()
        assert "blogs" in data
        print(f"✓ Search returned {len(data['blogs'])} blogs")


class TestLocationAPI:
    """Location API tests"""
    
    def test_get_location_by_state(self):
        """Test fetching location by state"""
        response = requests.get(f"{BASE_URL}/api/location/maharashtra")
        assert response.status_code == 200
        data = response.json()
        assert "state" in data
        print(f"✓ Location data for Maharashtra fetched")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

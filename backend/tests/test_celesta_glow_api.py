"""
Celesta Glow E-commerce API Tests
Tests for: Homepage, Product, Blog, Search, Location APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')


class TestHealthAndRoot:
    """Test basic API health and root endpoint"""
    
    def test_root_endpoint(self):
        """Test API root returns correct message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Celesta Glow API"


class TestStatsAPI:
    """Test statistics endpoints"""
    
    def test_recent_orders_count(self):
        """Test recent orders count endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats/recent-orders")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 30  # Base count is 30


class TestPincodeAPI:
    """Test pincode lookup functionality"""
    
    def test_pincode_state_lookup_valid(self):
        """Test valid pincode returns state"""
        response = requests.get(f"{BASE_URL}/api/pincode/400001/state")
        assert response.status_code == 200
        data = response.json()
        assert "pincode" in data
        assert "state" in data
        assert data["pincode"] == "400001"
        assert data["state"] == "Maharashtra"
    
    def test_pincode_state_lookup_delhi(self):
        """Test Delhi pincode"""
        response = requests.get(f"{BASE_URL}/api/pincode/110001/state")
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "Delhi"


class TestBlogAPI:
    """Test blog CRUD operations"""
    
    def test_get_all_blogs(self):
        """Test fetching all published blogs"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the test blog
        assert len(data) >= 1
    
    def test_get_blog_by_slug(self):
        """Test fetching a specific blog by slug"""
        response = requests.get(f"{BASE_URL}/api/blogs/how-to-reduce-wrinkles-naturally")
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "content" in data
        assert "slug" in data
        assert data["slug"] == "how-to-reduce-wrinkles-naturally"
        assert data["title"] == "How to Reduce Wrinkles Naturally"
    
    def test_get_blog_not_found(self):
        """Test 404 for non-existent blog"""
        response = requests.get(f"{BASE_URL}/api/blogs/non-existent-blog-slug")
        assert response.status_code == 404
    
    def test_create_blog(self):
        """Test creating a new blog post"""
        blog_data = {
            "title": "TEST_Best Anti-Aging Tips for 2026",
            "content": "Here are the best anti-aging tips for maintaining youthful skin in 2026.",
            "meta_description": "Top anti-aging tips for 2026",
            "keywords": ["anti-aging", "skincare", "2026"],
            "status": "published"
        }
        response = requests.post(f"{BASE_URL}/api/blogs", json=blog_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "slug" in data
        assert data["title"] == blog_data["title"]
        assert data["content"] == blog_data["content"]
        
        # Verify blog was created by fetching it
        get_response = requests.get(f"{BASE_URL}/api/blogs/{data['slug']}")
        assert get_response.status_code == 200
        fetched_blog = get_response.json()
        assert fetched_blog["title"] == blog_data["title"]


class TestSearchAPI:
    """Test search functionality"""
    
    def test_search_with_results(self):
        """Test search returns matching blogs"""
        response = requests.get(f"{BASE_URL}/api/search?q=wrinkles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should find the test blog about wrinkles
        assert len(data) >= 1
        # Verify search result contains the keyword
        found_match = any("wrinkle" in blog.get("title", "").lower() or 
                         "wrinkle" in blog.get("content", "").lower() 
                         for blog in data)
        assert found_match
    
    def test_search_no_results(self):
        """Test search with no matching results"""
        response = requests.get(f"{BASE_URL}/api/search?q=xyznonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_search_empty_query(self):
        """Test search with empty query returns error"""
        response = requests.get(f"{BASE_URL}/api/search?q=")
        # Should return 422 for validation error (min_length=1)
        assert response.status_code == 422


class TestLocationAPI:
    """Test location-based content endpoints"""
    
    def test_get_state_location(self):
        """Test getting location content for a state"""
        response = requests.get(f"{BASE_URL}/api/location/maharashtra")
        assert response.status_code == 200
        data = response.json()
        assert "state" in data
        assert "content" in data
        assert data["state"].lower() == "maharashtra"
        assert "title" in data["content"]
        assert "description" in data["content"]
    
    def test_get_city_location(self):
        """Test getting location content for a city"""
        response = requests.get(f"{BASE_URL}/api/location/maharashtra/mumbai")
        assert response.status_code == 200
        data = response.json()
        assert "state" in data
        assert "city" in data
        assert "content" in data
        assert data["city"].lower() == "mumbai"
        assert "Mumbai" in data["content"]["title"]
    
    def test_get_location_karnataka_bangalore(self):
        """Test Karnataka/Bangalore location"""
        response = requests.get(f"{BASE_URL}/api/location/karnataka/bangalore")
        assert response.status_code == 200
        data = response.json()
        assert data["state"].lower() == "karnataka"
        assert data["city"].lower() == "bangalore"


class TestRazorpayAPI:
    """Test Razorpay payment integration endpoints"""
    
    def test_create_razorpay_order(self):
        """Test creating a Razorpay order"""
        order_data = {"amount": 399}
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "amount" in data
        assert data["amount"] == 39900  # Amount in paise
        assert data["currency"] == "INR"
    
    def test_create_razorpay_order_cod_advance(self):
        """Test creating Razorpay order for COD advance payment"""
        order_data = {"amount": 49}
        response = requests.post(f"{BASE_URL}/api/create-razorpay-order", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 4900  # 49 * 100 paise


class TestOrderAPI:
    """Test order creation and retrieval"""
    
    def test_create_order_prepaid(self):
        """Test creating a prepaid order"""
        order_data = {
            "name": "TEST_John Doe",
            "phone": "9876543210",
            "house_number": "123",
            "area": "Test Area",
            "pincode": "400001",
            "state": "Maharashtra",
            "payment_method": "Prepaid",
            "amount": 399,
            "email": "test@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["order_id"].startswith("CG")
        assert data["name"] == order_data["name"]
        assert data["amount"] == 399
        assert data["delivery_timeline"] == "Fast Delivery (2-3 Days)"
        
        # Verify order was created by fetching it
        get_response = requests.get(f"{BASE_URL}/api/orders/{data['order_id']}")
        assert get_response.status_code == 200
        fetched_order = get_response.json()
        assert fetched_order["name"] == order_data["name"]
    
    def test_create_order_cod(self):
        """Test creating a COD order"""
        order_data = {
            "name": "TEST_Jane Doe",
            "phone": "9876543211",
            "house_number": "456",
            "area": "Test Colony",
            "pincode": "110001",
            "state": "Delhi",
            "payment_method": "COD",
            "amount": 450
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["delivery_timeline"] == "5-7 Business Days"
    
    def test_get_order_not_found(self):
        """Test 404 for non-existent order"""
        response = requests.get(f"{BASE_URL}/api/orders/CGNONEXISTENT")
        assert response.status_code == 404
    
    def test_get_all_orders(self):
        """Test fetching all orders"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestTrackingAPI:
    """Test page tracking endpoint"""
    
    def test_track_page_visit(self):
        """Test tracking a page visit"""
        response = requests.post(f"{BASE_URL}/api/track?page=homepage&session_id=test_session_123")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "tracked"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

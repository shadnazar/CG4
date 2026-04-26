"""
Admin Panel and SEO Platform API Tests
Tests for: Admin Login, Blog Management, Location Management, Orders, i18n
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com').rstrip('/')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "celestaglow2024")


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token via login"""
    return ADMIN_PASSWORD


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Celesta Glow API"
        print("✓ API root endpoint working")


class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with correct password"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data
        assert data["token"] == ADMIN_PASSWORD
        print("✓ Admin login successful with correct password")
    
    def test_admin_login_invalid_password(self, api_client):
        """Test admin login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Admin login correctly rejects invalid password")


class TestAdminAnalytics:
    """Admin analytics/dashboard tests"""
    
    def test_analytics_overview_with_auth(self, api_client, admin_token):
        """Test analytics overview endpoint with valid token"""
        response = api_client.get(f"{BASE_URL}/api/admin/analytics/overview", headers={
            "X-Admin-Token": admin_token
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields are present
        assert "total_orders" in data
        assert "total_revenue" in data
        assert "total_blogs" in data
        assert "published_blogs" in data
        assert "draft_blogs" in data
        assert "total_locations" in data
        assert "recent_orders" in data
        assert "top_blogs" in data
        
        # Verify data types
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["total_blogs"], int)
        assert isinstance(data["recent_orders"], list)
        assert isinstance(data["top_blogs"], list)
        print(f"✓ Analytics overview: {data['total_orders']} orders, ₹{data['total_revenue']} revenue, {data['total_blogs']} blogs, {data['total_locations']} locations")
    
    def test_analytics_overview_without_auth(self, api_client):
        """Test analytics overview endpoint without token"""
        response = api_client.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 401
        print("✓ Analytics overview correctly requires authentication")


class TestAdminBlogManagement:
    """Admin blog CRUD tests"""
    
    @pytest.fixture(scope="class")
    def test_blog_id(self, api_client, admin_token):
        """Create a test blog and return its ID for other tests"""
        unique_id = str(uuid.uuid4())[:8]
        response = api_client.post(f"{BASE_URL}/api/admin/blogs", 
            headers={"X-Admin-Token": admin_token},
            json={
                "title": f"TEST_Blog_{unique_id}",
                "content": "This is test blog content for automated testing.",
                "meta_description": "Test meta description",
                "keywords": ["test", "automation"],
                "status": "draft",
                "language": "en"
            }
        )
        assert response.status_code == 200
        data = response.json()
        yield data["id"]
        
        # Cleanup - delete the test blog
        api_client.delete(f"{BASE_URL}/api/admin/blogs/{data['id']}", 
            headers={"X-Admin-Token": admin_token})
    
    def test_get_all_blogs(self, api_client, admin_token):
        """Test getting all blogs (admin)"""
        response = api_client.get(f"{BASE_URL}/api/admin/blogs", headers={
            "X-Admin-Token": admin_token
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin blogs list: {len(data)} blogs found")
    
    def test_create_blog(self, api_client, admin_token):
        """Test creating a new blog"""
        unique_id = str(uuid.uuid4())[:8]
        response = api_client.post(f"{BASE_URL}/api/admin/blogs", 
            headers={"X-Admin-Token": admin_token},
            json={
                "title": f"TEST_Create_Blog_{unique_id}",
                "content": "Test content for blog creation test.",
                "meta_description": "Test meta",
                "keywords": ["test"],
                "status": "draft",
                "language": "en"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "title" in data
        assert "slug" in data
        assert "status" in data
        assert data["status"] == "draft"
        
        blog_id = data["id"]
        print(f"✓ Blog created: {data['title']} (ID: {blog_id})")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}", 
            headers={"X-Admin-Token": admin_token})
    
    def test_update_blog(self, api_client, admin_token, test_blog_id):
        """Test updating a blog"""
        response = api_client.put(f"{BASE_URL}/api/admin/blogs/{test_blog_id}", 
            headers={"X-Admin-Token": admin_token},
            json={
                "title": "TEST_Updated_Blog_Title",
                "content": "Updated content"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Updated_Blog_Title"
        print(f"✓ Blog updated successfully")
    
    def test_publish_blog(self, api_client, admin_token, test_blog_id):
        """Test publishing a draft blog"""
        response = api_client.post(f"{BASE_URL}/api/admin/blogs/{test_blog_id}/publish", 
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Blog published successfully")
    
    def test_delete_blog(self, api_client, admin_token):
        """Test deleting a blog"""
        # First create a blog to delete
        unique_id = str(uuid.uuid4())[:8]
        create_response = api_client.post(f"{BASE_URL}/api/admin/blogs", 
            headers={"X-Admin-Token": admin_token},
            json={
                "title": f"TEST_Delete_Blog_{unique_id}",
                "content": "Blog to be deleted",
                "status": "draft"
            }
        )
        blog_id = create_response.json()["id"]
        
        # Delete the blog
        response = api_client.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}", 
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Blog deleted successfully")


class TestAdminLocationManagement:
    """Admin location CRUD tests"""
    
    @pytest.fixture(scope="class")
    def test_location_id(self, api_client, admin_token):
        """Create a test location and return its ID"""
        unique_id = str(uuid.uuid4())[:8]
        response = api_client.post(f"{BASE_URL}/api/admin/locations", 
            headers={"X-Admin-Token": admin_token},
            json={
                "state": f"TestState{unique_id}",
                "city": f"TestCity{unique_id}",
                "title": f"Test Location {unique_id}",
                "description": "Test location description",
                "climate": "Tropical",
                "skin_issues": ["dryness", "acne"],
                "recommendations": "Use daily"
            }
        )
        assert response.status_code == 200
        data = response.json()
        yield data["id"]
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/admin/locations/{data['id']}", 
            headers={"X-Admin-Token": admin_token})
    
    def test_get_all_locations(self, api_client, admin_token):
        """Test getting all locations (admin)"""
        response = api_client.get(f"{BASE_URL}/api/admin/locations", headers={
            "X-Admin-Token": admin_token
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin locations list: {len(data)} locations found")
    
    def test_create_location(self, api_client, admin_token):
        """Test creating a new location"""
        unique_id = str(uuid.uuid4())[:8]
        response = api_client.post(f"{BASE_URL}/api/admin/locations", 
            headers={"X-Admin-Token": admin_token},
            json={
                "state": f"CreateState{unique_id}",
                "city": f"CreateCity{unique_id}",
                "title": f"Create Test Location {unique_id}",
                "description": "Test description",
                "climate": "Humid",
                "skin_issues": ["oily skin"],
                "recommendations": "Use twice daily"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "state" in data
        assert "city" in data
        assert "content" in data
        
        location_id = data["id"]
        print(f"✓ Location created: {data['state']}/{data['city']} (ID: {location_id})")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/admin/locations/{location_id}", 
            headers={"X-Admin-Token": admin_token})
    
    def test_update_location(self, api_client, admin_token, test_location_id):
        """Test updating a location"""
        response = api_client.put(f"{BASE_URL}/api/admin/locations/{test_location_id}", 
            headers={"X-Admin-Token": admin_token},
            json={
                "title": "Updated Location Title",
                "description": "Updated description"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["content"]["title"] == "Updated Location Title"
        print(f"✓ Location updated successfully")
    
    def test_delete_location(self, api_client, admin_token):
        """Test deleting a location"""
        # First create a location to delete
        unique_id = str(uuid.uuid4())[:8]
        create_response = api_client.post(f"{BASE_URL}/api/admin/locations", 
            headers={"X-Admin-Token": admin_token},
            json={
                "state": f"DeleteState{unique_id}",
                "city": f"DeleteCity{unique_id}",
                "title": "Location to delete",
                "description": "Will be deleted"
            }
        )
        location_id = create_response.json()["id"]
        
        # Delete the location
        response = api_client.delete(f"{BASE_URL}/api/admin/locations/{location_id}", 
            headers={"X-Admin-Token": admin_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Location deleted successfully")


class TestAdminOrders:
    """Admin orders tests"""
    
    def test_get_all_orders(self, api_client, admin_token):
        """Test getting all orders (admin)"""
        response = api_client.get(f"{BASE_URL}/api/admin/orders", headers={
            "X-Admin-Token": admin_token
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin orders list: {len(data)} orders found")
    
    def test_orders_without_auth(self, api_client):
        """Test orders endpoint without authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 401
        print("✓ Orders endpoint correctly requires authentication")


class TestPublicBlogAPI:
    """Public blog API tests"""
    
    def test_get_published_blogs(self, api_client):
        """Test getting published blogs (public)"""
        response = api_client.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned blogs should be published
        for blog in data:
            assert blog.get("status") == "published"
        print(f"✓ Public blogs list: {len(data)} published blogs")


class TestPublicLocationAPI:
    """Public location API tests"""
    
    def test_get_location_state(self, api_client):
        """Test getting location by state"""
        response = api_client.get(f"{BASE_URL}/api/location/maharashtra")
        assert response.status_code == 200
        data = response.json()
        assert "state" in data or "content" in data
        print(f"✓ Location state endpoint working")
    
    def test_get_location_city(self, api_client):
        """Test getting location by state and city"""
        response = api_client.get(f"{BASE_URL}/api/location/maharashtra/mumbai")
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "title" in data["content"]
        print(f"✓ Location city endpoint working: {data['content']['title']}")


class TestI18nAPI:
    """Internationalization API tests"""
    
    def test_get_supported_languages(self, api_client):
        """Test getting supported languages"""
        response = api_client.get(f"{BASE_URL}/api/i18n/languages")
        assert response.status_code == 200
        data = response.json()
        
        assert "languages" in data
        assert "default" in data
        assert data["default"] == "en"
        
        # Verify English and Hindi are supported
        language_codes = [lang["code"] for lang in data["languages"]]
        assert "en" in language_codes
        assert "hi" in language_codes
        print(f"✓ Supported languages: {language_codes}")
    
    def test_get_english_translations(self, api_client):
        """Test getting English translations"""
        response = api_client.get(f"{BASE_URL}/api/i18n/translations/en")
        assert response.status_code == 200
        data = response.json()
        
        assert data["language"] == "en"
        assert "translations" in data
        
        # Verify some key translations exist
        translations = data["translations"]
        assert "nav.home" in translations
        assert "hero.title" in translations
        assert "product.price" in translations
        print(f"✓ English translations: {len(translations)} keys")
    
    def test_get_hindi_translations(self, api_client):
        """Test getting Hindi translations"""
        response = api_client.get(f"{BASE_URL}/api/i18n/translations/hi")
        assert response.status_code == 200
        data = response.json()
        
        assert data["language"] == "hi"
        assert "translations" in data
        
        # Verify Hindi translations exist
        translations = data["translations"]
        assert "nav.home" in translations
        assert translations["nav.home"] == "होम"
        print(f"✓ Hindi translations: {len(translations)} keys")
    
    def test_unsupported_language(self, api_client):
        """Test requesting unsupported language"""
        response = api_client.get(f"{BASE_URL}/api/i18n/translations/fr")
        assert response.status_code == 404
        print("✓ Unsupported language correctly returns 404")
    
    def test_single_translation(self, api_client):
        """Test getting a single translation"""
        response = api_client.get(f"{BASE_URL}/api/i18n/translate/hi/nav.home")
        assert response.status_code == 200
        data = response.json()
        
        assert data["key"] == "nav.home"
        assert data["language"] == "hi"
        assert data["translation"] == "होम"
        print(f"✓ Single translation working: nav.home = {data['translation']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

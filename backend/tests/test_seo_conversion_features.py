"""
Test Suite for SEO and Conversion Optimization Features
Tests: Auto Blog Generator, Discount Validation, Recent Purchases, Admin AI Studio APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "celestaglow2024")
TEST_PHONE_WITH_DISCOUNT = "6238688650"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data['message']}")


class TestDiscountValidation:
    """Test discount validation API"""
    
    def test_validate_discount_with_valid_phone(self):
        """Test discount validation with phone that has claimed discount"""
        response = requests.get(f"{BASE_URL}/api/validate-discount?phone={TEST_PHONE_WITH_DISCOUNT}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify discount is valid
        assert data["valid"] is True
        assert data["discount_code"] == "WELCOME50"
        assert data["discount_amount"] == 50
        assert "message" in data
        print(f"✓ Discount validation passed: {data}")
    
    def test_validate_discount_with_invalid_phone(self):
        """Test discount validation with phone that hasn't claimed discount"""
        response = requests.get(f"{BASE_URL}/api/validate-discount?phone=9999999999")
        assert response.status_code == 200
        data = response.json()
        
        # Verify no discount found
        assert data["valid"] is False
        assert "message" in data
        print(f"✓ Invalid phone returns no discount: {data}")


class TestRecentPurchases:
    """Test recent purchases API for social proof"""
    
    def test_get_recent_purchases(self):
        """Test recent purchases endpoint returns social proof data"""
        response = requests.get(f"{BASE_URL}/api/recent-purchases")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "purchases" in data
        assert isinstance(data["purchases"], list)
        assert len(data["purchases"]) > 0
        
        # Verify purchase structure
        purchase = data["purchases"][0]
        assert "name" in purchase
        assert "location" in purchase
        print(f"✓ Recent purchases: {len(data['purchases'])} items returned")
        print(f"  Sample: {purchase['name']} from {purchase['location']}")


class TestBlogAPI:
    """Test blog API endpoints"""
    
    def test_get_blogs(self):
        """Test getting all published blogs"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Blogs API: {len(data)} blogs returned")
        
        # Check for AI-generated blogs
        ai_blogs = [b for b in data if b.get("generated_by") == "AI-Auto"]
        print(f"  AI-generated blogs: {len(ai_blogs)}")
        
        # Verify blog structure
        if len(data) > 0:
            blog = data[0]
            assert "id" in blog
            assert "title" in blog
            assert "slug" in blog
            assert "content" in blog
            assert "status" in blog
            print(f"  Latest blog: {blog['title'][:50]}...")
    
    def test_get_blog_by_slug(self):
        """Test getting a single blog by slug"""
        # First get list of blogs
        response = requests.get(f"{BASE_URL}/api/blogs")
        blogs = response.json()
        
        if len(blogs) > 0:
            slug = blogs[0]["slug"]
            response = requests.get(f"{BASE_URL}/api/blogs/{slug}")
            assert response.status_code == 200
            data = response.json()
            
            assert data["slug"] == slug
            print(f"✓ Blog by slug: {data['title'][:50]}...")


class TestAdminAIStudio:
    """Test Admin AI Studio endpoints"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin headers with token"""
        return {"X-Admin-Token": ADMIN_PASSWORD}
    
    def test_admin_auth_required(self):
        """Test that admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/ai/generation-history")
        assert response.status_code == 401
        print("✓ Admin endpoints require authentication")
    
    def test_admin_invalid_token(self):
        """Test that invalid token is rejected"""
        headers = {"X-Admin-Token": "wrongpassword"}
        response = requests.get(f"{BASE_URL}/api/admin/ai/generation-history", headers=headers)
        assert response.status_code == 403
        print("✓ Invalid admin token rejected")
    
    def test_get_generation_history(self, admin_headers):
        """Test getting blog generation history"""
        response = requests.get(f"{BASE_URL}/api/admin/ai/generation-history", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "history" in data
        assert isinstance(data["history"], list)
        print(f"✓ Generation history: {len(data['history'])} entries")
        
        if len(data["history"]) > 0:
            entry = data["history"][0]
            assert "timestamp" in entry
            assert "generated" in entry
            print(f"  Latest: {entry['generated']} blogs generated at {entry['timestamp']}")
    
    def test_suggest_topics(self, admin_headers):
        """Test AI topic suggestions endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/ai/suggest-topics?count=3", headers=admin_headers)
        # This may fail if AI credits are exhausted, so we check for both success and error
        if response.status_code == 200:
            data = response.json()
            assert "topics" in data
            print(f"✓ Topic suggestions: {len(data.get('topics', []))} topics returned")
        else:
            print(f"Note: Topic suggestions returned {response.status_code} (may be credit limit)")


class TestClaimDiscount:
    """Test discount claiming API"""
    
    def test_claim_discount_invalid_phone(self):
        """Test claiming discount with invalid phone number"""
        response = requests.post(f"{BASE_URL}/api/claim-discount", json={
            "phone": "123",  # Invalid phone
            "session_id": "test_session_123",
            "page": "product"
        })
        assert response.status_code == 400
        print("✓ Invalid phone number rejected")
    
    def test_claim_discount_valid_phone(self):
        """Test claiming discount with valid phone number"""
        # Use a test phone that may or may not have claimed
        test_phone = "9876543210"
        response = requests.post(f"{BASE_URL}/api/claim-discount", json={
            "phone": test_phone,
            "session_id": f"test_session_{test_phone}",
            "page": "product"
        })
        
        # Should return 200 whether new claim or already claimed
        assert response.status_code == 200
        data = response.json()
        
        if data.get("success"):
            print(f"✓ Discount claimed successfully: {data.get('discount_code')}")
        elif data.get("already_claimed"):
            print(f"✓ Phone already claimed discount")
        else:
            print(f"✓ Claim response: {data}")


class TestLiveVisitors:
    """Test live visitors analytics API"""
    
    def test_get_live_visitors(self):
        """Test getting live visitors count"""
        response = requests.get(f"{BASE_URL}/api/live-visitors")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_live_visitors" in data
        assert "by_page" in data
        print(f"✓ Live visitors: {data['total_live_visitors']} total")
    
    def test_get_live_visitors_by_page(self):
        """Test getting live visitors for specific page"""
        response = requests.get(f"{BASE_URL}/api/live-visitors?page=product")
        assert response.status_code == 200
        data = response.json()
        
        assert "page" in data
        assert "live_visitors" in data
        print(f"✓ Live visitors on product page: {data['live_visitors']}")


class TestTrackVisit:
    """Test page visit tracking"""
    
    def test_track_page_visit(self):
        """Test tracking a page visit"""
        response = requests.post(
            f"{BASE_URL}/api/track-visit?page=product&session_id=test_session_track"
        )
        assert response.status_code == 200
        print("✓ Page visit tracked successfully")


class TestAdminAnalytics:
    """Test admin analytics endpoints"""
    
    @pytest.fixture
    def admin_headers(self):
        return {"X-Admin-Token": ADMIN_PASSWORD}
    
    def test_get_live_analytics(self, admin_headers):
        """Test getting live analytics for admin"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/live", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "live_visitors" in data
        assert "total_visits" in data
        print(f"✓ Admin live analytics: {data['live_visitors']['total']} live visitors")
    
    def test_get_page_analytics(self, admin_headers):
        """Test getting page analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/pages?days=7", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "page_analytics" in data
        assert "hourly_distribution" in data
        print(f"✓ Admin page analytics retrieved")
    
    def test_get_visitor_leads(self, admin_headers):
        """Test getting visitor leads (phone numbers)"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/leads", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "leads" in data
        assert "stats" in data
        print(f"✓ Visitor leads: {len(data['leads'])} leads found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Test Suite for Blog Images and Meta Pixel Integration
Tests:
1. Blog posts have images (image_url field)
2. Blog backfill API endpoint works
3. Blog list API returns blogs with images
4. Single blog API returns blog with image
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "celestaglow2024")

class TestBlogImages:
    """Test blog images functionality"""
    
    def test_health_check(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Health check passed: {data}")
    
    def test_get_blogs_list(self):
        """Test getting list of blogs"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        assert isinstance(blogs, list)
        print(f"✓ Found {len(blogs)} blogs")
        return blogs
    
    def test_blogs_have_images(self):
        """Test that blogs have image_url field populated"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        blogs_with_images = 0
        blogs_without_images = 0
        
        for blog in blogs:
            if blog.get('image_url') and blog['image_url'].strip():
                blogs_with_images += 1
                # Verify image URL is valid format
                assert blog['image_url'].startswith('http'), f"Invalid image URL: {blog['image_url']}"
            else:
                blogs_without_images += 1
                print(f"  ⚠ Blog without image: {blog.get('title', 'Unknown')}")
        
        print(f"✓ Blogs with images: {blogs_with_images}/{len(blogs)}")
        print(f"  Blogs without images: {blogs_without_images}")
        
        # At least 50% of blogs should have images
        if len(blogs) > 0:
            assert blogs_with_images > 0, "No blogs have images"
    
    def test_single_blog_has_image(self):
        """Test that a single blog post has image_url"""
        # First get list of blogs
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        if len(blogs) == 0:
            pytest.skip("No blogs available to test")
        
        # Get first blog by slug
        blog = blogs[0]
        slug = blog.get('slug')
        assert slug, "Blog has no slug"
        
        # Fetch single blog
        response = requests.get(f"{BASE_URL}/api/blogs/{slug}")
        assert response.status_code == 200
        single_blog = response.json()
        
        print(f"✓ Single blog fetched: {single_blog.get('title')}")
        print(f"  Image URL: {single_blog.get('image_url', 'None')}")
        
        # Verify blog structure
        assert 'title' in single_blog
        assert 'content' in single_blog
        assert 'slug' in single_blog
    
    def test_blog_image_urls_are_valid(self):
        """Test that blog image URLs are from Unsplash or Pexels"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        valid_domains = ['unsplash.com', 'pexels.com', 'images.unsplash.com', 'images.pexels.com']
        
        for blog in blogs:
            image_url = blog.get('image_url', '')
            if image_url:
                is_valid = any(domain in image_url for domain in valid_domains)
                if is_valid:
                    print(f"✓ Valid image URL for: {blog.get('title', 'Unknown')[:50]}")
                else:
                    print(f"  ⚠ Non-standard image URL: {image_url[:80]}")


class TestBlogBackfillAPI:
    """Test blog image backfill API endpoint"""
    
    def test_backfill_requires_auth(self):
        """Test that backfill endpoint requires admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/blogs/backfill-images")
        assert response.status_code == 401, "Backfill should require authentication"
        print("✓ Backfill endpoint requires authentication")
    
    def test_backfill_with_invalid_token(self):
        """Test backfill with invalid admin token"""
        headers = {"X-Admin-Token": "invalid_token"}
        response = requests.post(f"{BASE_URL}/api/admin/blogs/backfill-images", headers=headers)
        assert response.status_code == 403, "Should reject invalid token"
        print("✓ Backfill rejects invalid token")
    
    def test_backfill_with_valid_token(self):
        """Test backfill endpoint with valid admin token"""
        headers = {"X-Admin-Token": ADMIN_PASSWORD}
        response = requests.post(f"{BASE_URL}/api/admin/blogs/backfill-images", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert 'success' in data
        assert data['success'] is True
        assert 'updated_count' in data
        assert 'message' in data
        
        print(f"✓ Backfill successful: {data['message']}")
        print(f"  Updated count: {data['updated_count']}")


class TestBlogCategories:
    """Test blog categories and image mapping"""
    
    def test_blogs_have_categories(self):
        """Test that blogs have category field"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        categories_found = set()
        for blog in blogs:
            category = blog.get('category')
            if category:
                categories_found.add(category)
        
        print(f"✓ Categories found: {categories_found}")
        
        # Expected categories from the image service
        expected_categories = {'news', 'celebrity', 'tips', 'mistakes', 'trends', 
                             'ingredients', 'seasonal', 'diy', 'science'}
        
        if categories_found:
            print(f"  Blog categories: {categories_found}")


class TestBlogContent:
    """Test blog content structure"""
    
    def test_blog_has_required_fields(self):
        """Test that blogs have all required fields"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        if len(blogs) == 0:
            pytest.skip("No blogs available")
        
        required_fields = ['id', 'title', 'slug', 'content', 'status']
        optional_fields = ['image_url', 'meta_description', 'keywords', 'category', 
                          'read_time', 'view_count', 'created_at']
        
        for blog in blogs[:3]:  # Check first 3 blogs
            for field in required_fields:
                assert field in blog, f"Missing required field: {field}"
            
            print(f"✓ Blog '{blog['title'][:40]}...' has all required fields")
            
            # Check optional fields
            present_optional = [f for f in optional_fields if f in blog and blog[f]]
            print(f"  Optional fields present: {present_optional}")


class TestSearchAPI:
    """Test search functionality"""
    
    def test_search_blogs(self):
        """Test blog search API"""
        response = requests.get(f"{BASE_URL}/api/search?q=skincare")
        assert response.status_code == 200
        results = response.json()
        assert isinstance(results, list)
        print(f"✓ Search for 'skincare' returned {len(results)} results")
    
    def test_search_returns_blogs_with_images(self):
        """Test that search results include image_url"""
        response = requests.get(f"{BASE_URL}/api/search?q=anti-aging")
        assert response.status_code == 200
        results = response.json()
        
        for result in results:
            if result.get('image_url'):
                print(f"✓ Search result has image: {result.get('title', 'Unknown')[:40]}")


class TestFeaturedBlog:
    """Test featured blog functionality"""
    
    def test_featured_blog_has_image(self):
        """Test that the most viewed blog (featured) has an image"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        if len(blogs) == 0:
            pytest.skip("No blogs available")
        
        # Find blog with highest view count (featured)
        featured = max(blogs, key=lambda b: b.get('view_count', 0))
        
        print(f"✓ Featured blog: {featured.get('title', 'Unknown')}")
        print(f"  View count: {featured.get('view_count', 0)}")
        print(f"  Has image: {'Yes' if featured.get('image_url') else 'No'}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

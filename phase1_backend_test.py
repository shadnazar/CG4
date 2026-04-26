#!/usr/bin/env python3
"""
Phase 1 Backend Testing for Celesta Glow TBL (To-Be-Launched) System
Tests the 8 specific endpoints mentioned in the review request.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List

class Phase1BackendTester:
    def __init__(self):
        # Read backend URL from frontend .env
        self.base_url = "https://cg-git-integration.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.admin_password = "celestaglow2024"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        print(f"🔧 Backend URL: {self.api_url}")
        print(f"🔑 Admin Password: {self.admin_password}")
        print("=" * 80)

    def get_admin_token(self):
        """Login and get admin session token"""
        if self.admin_token:
            return self.admin_token
        
        try:
            response = requests.post(
                f"{self.api_url}/admin/login",
                json={"password": self.admin_password},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                print(f"🔑 Admin token obtained: {self.admin_token[:20]}...")
                return self.admin_token
            else:
                print(f"❌ Failed to get admin token: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Admin login error: {str(e)}")
            return None

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            status = "PASS"
            emoji = "✅"
        else:
            status = "FAIL"
            emoji = "❌"
        
        result = f"{emoji} {test_name}: {status}"
        if details:
            result += f" - {details}"
        
        self.test_results.append(result)
        print(result)

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_url}/{endpoint}"
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=15)
            else:
                return False, {}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return response.status_code < 400, response_data, response.status_code
        
        except Exception as e:
            print(f"   ⚠️  Request failed: {str(e)}")
            return False, {"error": str(e)}, 0

    def test_1_get_all_products(self):
        """Test 1: GET /api/products - Must return 5 products with correct TBL fields"""
        print("\n🔍 Test 1: GET /api/products")
        
        success, data, status = self.make_request('GET', 'products')
        
        if not success or status != 200:
            self.log_result("GET /api/products", False, f"Status {status}")
            return False
        
        # Check we have 5 products
        if not isinstance(data, list) or len(data) != 5:
            self.log_result("GET /api/products", False, f"Expected 5 products, got {len(data) if isinstance(data, list) else 'non-list'}")
            return False
        
        # Find anti-aging-serum (should be live)
        serum = next((p for p in data if p.get('slug') == 'anti-aging-serum'), None)
        if not serum:
            self.log_result("GET /api/products", False, "anti-aging-serum not found")
            return False
        
        # Verify anti-aging-serum is live
        if serum.get('is_to_be_launched') != False:
            self.log_result("GET /api/products", False, f"anti-aging-serum should have is_to_be_launched=false, got {serum.get('is_to_be_launched')}")
            return False
        
        if serum.get('launch_date') is not None:
            self.log_result("GET /api/products", False, f"anti-aging-serum should have launch_date=null, got {serum.get('launch_date')}")
            return False
        
        if serum.get('preorder_enabled') != False:
            self.log_result("GET /api/products", False, f"anti-aging-serum should have preorder_enabled=false, got {serum.get('preorder_enabled')}")
            return False
        
        # Check TBL products
        tbl_slugs = ['anti-aging-cream', 'under-eye-cream', 'sunscreen', 'cleanser']
        tbl_products = [p for p in data if p.get('slug') in tbl_slugs]
        
        if len(tbl_products) != 4:
            self.log_result("GET /api/products", False, f"Expected 4 TBL products, found {len(tbl_products)}")
            return False
        
        for product in tbl_products:
            slug = product.get('slug')
            
            # Check TBL fields
            if product.get('is_to_be_launched') != True:
                self.log_result("GET /api/products", False, f"{slug} should have is_to_be_launched=true")
                return False
            
            if not product.get('launch_date'):
                self.log_result("GET /api/products", False, f"{slug} missing launch_date")
                return False
            
            if product.get('preorder_enabled') != True:
                self.log_result("GET /api/products", False, f"{slug} should have preorder_enabled=true")
                return False
            
            # Check days_to_launch is reasonable (23-26 days)
            days_to_launch = product.get('days_to_launch')
            if not isinstance(days_to_launch, int) or not (23 <= days_to_launch <= 26):
                self.log_result("GET /api/products", False, f"{slug} days_to_launch should be 23-26, got {days_to_launch}")
                return False
            
            # Check images array exists and has at least one image
            images = product.get('images', [])
            if not isinstance(images, list) or len(images) == 0:
                self.log_result("GET /api/products", False, f"{slug} should have at least one image")
                return False
        
        self.log_result("GET /api/products", True, "All 5 products with correct TBL fields")
        return True

    def test_2_get_single_product(self):
        """Test 2: GET /api/products/anti-aging-cream - Single product with TBL fields"""
        print("\n🔍 Test 2: GET /api/products/anti-aging-cream")
        
        success, data, status = self.make_request('GET', 'products/anti-aging-cream')
        
        if not success or status != 200:
            self.log_result("GET /api/products/anti-aging-cream", False, f"Status {status}")
            return False
        
        # Verify TBL fields
        required_fields = ['is_to_be_launched', 'launch_date', 'preorder_enabled', 'days_to_launch', 'hours_to_launch']
        for field in required_fields:
            if field not in data:
                self.log_result("GET /api/products/anti-aging-cream", False, f"Missing field: {field}")
                return False
        
        if data.get('is_to_be_launched') != True:
            self.log_result("GET /api/products/anti-aging-cream", False, f"Expected is_to_be_launched=true, got {data.get('is_to_be_launched')}")
            return False
        
        if data.get('preorder_enabled') != True:
            self.log_result("GET /api/products/anti-aging-cream", False, f"Expected preorder_enabled=true, got {data.get('preorder_enabled')}")
            return False
        
        self.log_result("GET /api/products/anti-aging-cream", True, "Single product with all TBL fields")
        return True

    def test_3_get_site_settings(self):
        """Test 3: GET /api/site-settings - Must include banner_carousel and carousel_autoplay_ms"""
        print("\n🔍 Test 3: GET /api/site-settings")
        
        success, data, status = self.make_request('GET', 'site-settings')
        
        if not success or status != 200:
            self.log_result("GET /api/site-settings", False, f"Status {status}")
            return False
        
        # Check banner_carousel
        banner_carousel = data.get('banner_carousel')
        if not isinstance(banner_carousel, list):
            self.log_result("GET /api/site-settings", False, "banner_carousel should be an array")
            return False
        
        if len(banner_carousel) != 3:
            self.log_result("GET /api/site-settings", False, f"Expected 3 banners, got {len(banner_carousel)}")
            return False
        
        # Check each banner has required fields
        required_banner_fields = ['id', 'image', 'title', 'subtitle', 'cta_text', 'cta_link', 'sort_order']
        for i, banner in enumerate(banner_carousel):
            for field in required_banner_fields:
                if field not in banner:
                    self.log_result("GET /api/site-settings", False, f"Banner {i} missing field: {field}")
                    return False
        
        # Check carousel_autoplay_ms
        if data.get('carousel_autoplay_ms') != 2000:
            self.log_result("GET /api/site-settings", False, f"Expected carousel_autoplay_ms=2000, got {data.get('carousel_autoplay_ms')}")
            return False
        
        self.log_result("GET /api/site-settings", True, "3 banners with all fields and autoplay=2000ms")
        return True

    def test_4_admin_launch_status_toggle(self):
        """Test 4: PUT /api/admin/products/under-eye-cream/launch-status - Toggle TBL status"""
        print("\n🔍 Test 4: Admin launch status toggle")
        
        # Get admin token first
        admin_token = self.get_admin_token()
        if not admin_token:
            self.log_result("Admin login", False, "Could not get admin token")
            return False
        
        admin_headers = {'X-Admin-Token': admin_token}
        
        # First, set to not TBL
        success, data, status = self.make_request('PUT', 'admin/products/under-eye-cream/launch-status', 
                                                 {'is_to_be_launched': False}, admin_headers)
        
        if not success or status != 200:
            self.log_result("PUT launch-status (disable TBL)", False, f"Status {status}")
            return False
        
        # Verify the change
        success, product_data, status = self.make_request('GET', 'products/under-eye-cream')
        if not success or status != 200:
            self.log_result("GET after disable TBL", False, f"Status {status}")
            return False
        
        if product_data.get('is_to_be_launched') != False:
            self.log_result("Verify disable TBL", False, f"Expected is_to_be_launched=false, got {product_data.get('is_to_be_launched')}")
            return False
        
        if product_data.get('launch_date') is not None:
            self.log_result("Verify disable TBL", False, f"Expected launch_date=null, got {product_data.get('launch_date')}")
            return False
        
        if product_data.get('preorder_enabled') != False:
            self.log_result("Verify disable TBL", False, f"Expected preorder_enabled=false, got {product_data.get('preorder_enabled')}")
            return False
        
        # Now revert back to TBL
        success, data, status = self.make_request('PUT', 'admin/products/under-eye-cream/launch-status', 
                                                 {'is_to_be_launched': True, 'preorder_enabled': True}, admin_headers)
        
        if not success or status != 200:
            self.log_result("PUT launch-status (enable TBL)", False, f"Status {status}")
            return False
        
        # Verify the revert
        success, product_data, status = self.make_request('GET', 'products/under-eye-cream')
        if not success or status != 200:
            self.log_result("GET after enable TBL", False, f"Status {status}")
            return False
        
        if product_data.get('is_to_be_launched') != True:
            self.log_result("Verify enable TBL", False, f"Expected is_to_be_launched=true, got {product_data.get('is_to_be_launched')}")
            return False
        
        if product_data.get('preorder_enabled') != True:
            self.log_result("Verify enable TBL", False, f"Expected preorder_enabled=true, got {product_data.get('preorder_enabled')}")
            return False
        
        self.log_result("Admin launch status toggle", True, "Successfully toggled and reverted TBL status")
        return True

    def test_5_admin_custom_launch_date(self):
        """Test 5: PUT /api/admin/products/anti-aging-cream/launch-status - Custom launch date"""
        print("\n🔍 Test 5: Admin custom launch date")
        
        # Get admin token first
        admin_token = self.get_admin_token()
        if not admin_token:
            self.log_result("Admin login", False, "Could not get admin token")
            return False
        
        admin_headers = {'X-Admin-Token': admin_token}
        
        # Set custom launch date
        custom_data = {
            'is_to_be_launched': True,
            'launch_date': '2026-06-15T00:00:00+00:00',
            'preorder_enabled': False
        }
        
        success, data, status = self.make_request('PUT', 'admin/products/anti-aging-cream/launch-status', 
                                                 custom_data, admin_headers)
        
        if not success or status != 200:
            self.log_result("PUT custom launch date", False, f"Status {status}")
            return False
        
        # Verify the change
        success, product_data, status = self.make_request('GET', 'products/anti-aging-cream')
        if not success or status != 200:
            self.log_result("GET after custom date", False, f"Status {status}")
            return False
        
        # Check launch_date reflects 2026-06-15
        launch_date = product_data.get('launch_date')
        if not launch_date or '2026-06-15' not in launch_date:
            self.log_result("Verify custom launch date", False, f"Expected 2026-06-15 in launch_date, got {launch_date}")
            return False
        
        if product_data.get('preorder_enabled') != False:
            self.log_result("Verify custom preorder", False, f"Expected preorder_enabled=false, got {product_data.get('preorder_enabled')}")
            return False
        
        # Revert to default (today+25 with preorder=true)
        revert_data = {
            'is_to_be_launched': True,
            'preorder_enabled': True
        }
        
        success, data, status = self.make_request('PUT', 'admin/products/anti-aging-cream/launch-status', 
                                                 revert_data, admin_headers)
        
        if not success or status != 200:
            self.log_result("PUT revert to default", False, f"Status {status}")
            return False
        
        self.log_result("Admin custom launch date", True, "Set custom date and reverted successfully")
        return True

    def test_6_preorder_count_valid(self):
        """Test 6: POST /api/products/anti-aging-cream/preorder-count - Valid preorder"""
        print("\n🔍 Test 6: Valid preorder count increment")
        
        # Get current preorder count
        success, product_data, status = self.make_request('GET', 'products/anti-aging-cream')
        if not success or status != 200:
            self.log_result("GET before preorder", False, f"Status {status}")
            return False
        
        initial_count = product_data.get('preorder_count', 0)
        
        # Increment preorder count
        success, data, status = self.make_request('POST', 'products/anti-aging-cream/preorder-count')
        
        if not success or status != 200:
            self.log_result("POST preorder count", False, f"Status {status}")
            return False
        
        # Verify count increased
        success, product_data, status = self.make_request('GET', 'products/anti-aging-cream')
        if not success or status != 200:
            self.log_result("GET after preorder", False, f"Status {status}")
            return False
        
        new_count = product_data.get('preorder_count', 0)
        if new_count != initial_count + 1:
            self.log_result("Verify preorder count", False, f"Expected count {initial_count + 1}, got {new_count}")
            return False
        
        self.log_result("Valid preorder count", True, f"Count increased from {initial_count} to {new_count}")
        return True

    def test_7_preorder_count_invalid(self):
        """Test 7: POST /api/products/anti-aging-serum/preorder-count - Should return 400"""
        print("\n🔍 Test 7: Invalid preorder count (non-TBL product)")
        
        success, data, status = self.make_request('POST', 'products/anti-aging-serum/preorder-count')
        
        if status == 400:
            self.log_result("Invalid preorder count", True, "Correctly returned 400 for non-TBL product")
            return True
        else:
            self.log_result("Invalid preorder count", False, f"Expected 400, got {status}")
            return False

    def test_8_admin_site_settings(self):
        """Test 8: PUT /api/admin/site-settings - Update banner carousel"""
        print("\n🔍 Test 8: Admin site settings update")
        
        # Get admin token first
        admin_token = self.get_admin_token()
        if not admin_token:
            self.log_result("Admin login", False, "Could not get admin token")
            return False
        
        admin_headers = {'X-Admin-Token': admin_token}
        
        # Get original settings first
        success, original_data, status = self.make_request('GET', 'site-settings')
        if not success or status != 200:
            self.log_result("GET original settings", False, f"Status {status}")
            return False
        
        original_banners = original_data.get('banner_carousel', [])
        original_autoplay = original_data.get('carousel_autoplay_ms', 2000)
        
        # Update with test banner
        test_data = {
            'banner_carousel': [{
                'id': 'test-banner',
                'image': 'https://example.com/x.jpg',
                'title': 'Test',
                'subtitle': 'Sub',
                'cta_text': 'Go',
                'cta_link': '/shop',
                'sort_order': 1
            }],
            'carousel_autoplay_ms': 3000
        }
        
        success, data, status = self.make_request('PUT', 'admin/site-settings', test_data, admin_headers)
        
        if not success or status != 200:
            self.log_result("PUT test settings", False, f"Status {status}")
            return False
        
        # Verify the change
        success, updated_data, status = self.make_request('GET', 'site-settings')
        if not success or status != 200:
            self.log_result("GET updated settings", False, f"Status {status}")
            return False
        
        # Check test banner
        banner_carousel = updated_data.get('banner_carousel', [])
        if len(banner_carousel) != 1 or banner_carousel[0].get('id') != 'test-banner':
            self.log_result("Verify test banner", False, f"Expected test-banner, got {banner_carousel}")
            return False
        
        if updated_data.get('carousel_autoplay_ms') != 3000:
            self.log_result("Verify test autoplay", False, f"Expected 3000ms, got {updated_data.get('carousel_autoplay_ms')}")
            return False
        
        # Revert to original settings
        revert_data = {
            'banner_carousel': [
                {
                    'id': 'banner-1',
                    'image': 'https://images.unsplash.com/photo-1581182815808-b6eb627a8798?auto=format&fit=crop&w=1920&q=80',
                    'title': 'Clinically Proven Anti-Aging',
                    'subtitle': 'Visible results in 4 weeks',
                    'cta_text': 'Shop Now',
                    'cta_link': '/shop',
                    'sort_order': 1
                },
                {
                    'id': 'banner-2',
                    'image': 'https://images.pexels.com/photos/3762871/pexels-photo-3762871.jpeg?auto=compress&cs=tinysrgb&w=1920',
                    'title': 'Glow That Speaks',
                    'subtitle': 'Dermatologist tested · Cruelty free',
                    'cta_text': 'Explore Range',
                    'cta_link': '/shop',
                    'sort_order': 2
                },
                {
                    'id': 'banner-3',
                    'image': 'https://images.pexels.com/photos/5468629/pexels-photo-5468629.jpeg?auto=compress&cs=tinysrgb&w=1920',
                    'title': 'Free Skin Analysis',
                    'subtitle': 'Personalized routine in 60 seconds',
                    'cta_text': 'Get Started',
                    'cta_link': '/consultation',
                    'sort_order': 3
                }
            ],
            'carousel_autoplay_ms': 2000
        }
        
        success, data, status = self.make_request('PUT', 'admin/site-settings', revert_data, admin_headers)
        
        if not success or status != 200:
            self.log_result("PUT revert settings", False, f"Status {status}")
            return False
        
        self.log_result("Admin site settings", True, "Updated test banner and reverted successfully")
        return True

    def run_all_tests(self):
        """Run all Phase 1 backend tests"""
        print("🚀 Starting Phase 1 Backend Testing")
        print("Testing TBL (To-Be-Launched) system endpoints")
        
        tests = [
            self.test_1_get_all_products,
            self.test_2_get_single_product,
            self.test_3_get_site_settings,
            self.test_4_admin_launch_status_toggle,
            self.test_5_admin_custom_launch_date,
            self.test_6_preorder_count_valid,
            self.test_7_preorder_count_invalid,
            self.test_8_admin_site_settings
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_result(test.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 PHASE 1 BACKEND TEST SUMMARY")
        print("=" * 80)
        
        for result in self.test_results:
            print(result)
        
        print(f"\n📈 Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL PHASE 1 BACKEND TESTS PASSED!")
            return True
        else:
            print("⚠️  SOME PHASE 1 BACKEND TESTS FAILED!")
            return False

def main():
    tester = Phase1BackendTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
"""
Multi-Product E-commerce Transformation Tests
Tests for 5 products, 3 combos, cart validation, and legacy migration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')

class TestProductsAPI:
    """Test product endpoints - 5 products with images"""
    
    def test_get_all_products_returns_5(self):
        """GET /api/products should return 5 active products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 5, f"Expected 5 products, got {len(products)}"
        print(f"✓ GET /api/products returns {len(products)} products")
    
    def test_products_have_images(self):
        """All products should have non-empty images arrays"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        for product in products:
            assert product.get('images'), f"Product {product['slug']} has no images"
            assert len(product['images']) > 0, f"Product {product['slug']} has empty images array"
        print("✓ All products have images")
    
    def test_serum_product_details(self):
        """GET /api/products/anti-aging-serum should return correct details"""
        response = requests.get(f"{BASE_URL}/api/products/anti-aging-serum")
        assert response.status_code == 200
        product = response.json()
        assert product['slug'] == 'anti-aging-serum'
        assert product['mrp'] == 1699
        assert product['prepaid_price'] == 999
        assert product['cod_price'] == 1099
        assert product['badge'] == 'Bestseller'
        print("✓ Anti-aging serum product details correct")
    
    def test_night_cream_product_details(self):
        """GET /api/products/anti-aging-cream should return correct details"""
        response = requests.get(f"{BASE_URL}/api/products/anti-aging-cream")
        assert response.status_code == 200
        product = response.json()
        assert product['slug'] == 'anti-aging-cream'
        assert product['mrp'] == 1499
        assert product['prepaid_price'] == 899
        print("✓ Night cream product details correct")
    
    def test_under_eye_cream_product_details(self):
        """GET /api/products/under-eye-cream should return correct details"""
        response = requests.get(f"{BASE_URL}/api/products/under-eye-cream")
        assert response.status_code == 200
        product = response.json()
        assert product['slug'] == 'under-eye-cream'
        assert product['mrp'] == 899
        assert product['prepaid_price'] == 549
        print("✓ Under eye cream product details correct")
    
    def test_sunscreen_product_details(self):
        """GET /api/products/sunscreen should return correct details"""
        response = requests.get(f"{BASE_URL}/api/products/sunscreen")
        assert response.status_code == 200
        product = response.json()
        assert product['slug'] == 'sunscreen'
        assert product['mrp'] == 799
        assert product['prepaid_price'] == 499
        print("✓ Sunscreen product details correct")
    
    def test_cleanser_product_details(self):
        """GET /api/products/cleanser should return correct details"""
        response = requests.get(f"{BASE_URL}/api/products/cleanser")
        assert response.status_code == 200
        product = response.json()
        assert product['slug'] == 'cleanser'
        assert product['mrp'] == 799
        assert product['prepaid_price'] == 499
        print("✓ Cleanser product details correct")


class TestCombosAPI:
    """Test combo endpoints - 3 combo bundles"""
    
    def test_get_all_combos_returns_3(self):
        """GET /api/combos should return 3 active combos"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        assert len(combos) == 3, f"Expected 3 combos, got {len(combos)}"
        print(f"✓ GET /api/combos returns {len(combos)} combos")
    
    def test_complete_kit_combo(self):
        """Complete Anti-Aging Kit should have 5 products and 51% discount"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        kit = next((c for c in combos if c['combo_id'] == 'complete-anti-aging-kit'), None)
        assert kit is not None, "Complete Anti-Aging Kit not found"
        assert len(kit['product_slugs']) == 5
        assert kit['discount_percent'] == 51
        assert kit['combo_prepaid_price'] == 2799
        print("✓ Complete Anti-Aging Kit combo correct")
    
    def test_day_night_duo_combo(self):
        """Day & Night Power Duo should have 2 products"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        duo = next((c for c in combos if c['combo_id'] == 'day-night-duo'), None)
        assert duo is not None, "Day & Night Power Duo not found"
        assert len(duo['product_slugs']) == 2
        assert duo['discount_percent'] == 48
        print("✓ Day & Night Power Duo combo correct")
    
    def test_glow_essentials_combo(self):
        """Glow Essentials Trio should have 3 products"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        trio = next((c for c in combos if c['combo_id'] == 'glow-essentials'), None)
        assert trio is not None, "Glow Essentials Trio not found"
        assert len(trio['product_slugs']) == 3
        assert trio['discount_percent'] == 48
        print("✓ Glow Essentials Trio combo correct")


class TestCartValidation:
    """Test cart validation endpoint"""
    
    def test_validate_single_product(self):
        """POST /api/cart/validate should validate single product"""
        payload = {
            "items": [{"product_slug": "anti-aging-serum", "quantity": 1}],
            "payment_method": "prepaid"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['item_count'] == 1
        assert data['subtotal'] == 999
        assert data['total'] == 999
        print("✓ Cart validation for single product works")
    
    def test_validate_multiple_products(self):
        """POST /api/cart/validate should validate multiple products"""
        payload = {
            "items": [
                {"product_slug": "anti-aging-serum", "quantity": 1},
                {"product_slug": "sunscreen", "quantity": 2}
            ],
            "payment_method": "prepaid"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['item_count'] == 3
        assert data['subtotal'] == 999 + (499 * 2)  # serum + 2x sunscreen
        print("✓ Cart validation for multiple products works")
    
    def test_validate_combo(self):
        """POST /api/cart/validate should validate combo"""
        payload = {
            "items": [{"combo_id": "complete-anti-aging-kit", "quantity": 1}],
            "payment_method": "prepaid"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['item_count'] == 1
        assert data['subtotal'] == 2799
        print("✓ Cart validation for combo works")
    
    def test_validate_cod_pricing(self):
        """POST /api/cart/validate should use COD pricing when specified"""
        payload = {
            "items": [{"product_slug": "anti-aging-serum", "quantity": 1}],
            "payment_method": "COD"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['subtotal'] == 1099  # COD price
        print("✓ Cart validation uses COD pricing correctly")


class TestSiteSettings:
    """Test site settings endpoint"""
    
    def test_get_site_settings(self):
        """GET /api/site-settings should return settings"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200
        settings = response.json()
        assert 'hero_title' in settings or settings == {}
        print("✓ Site settings endpoint works")


class TestAdminProducts:
    """Test admin product management (requires auth)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "celestaglow2024"})
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Admin login failed")
    
    def test_admin_login(self):
        """POST /api/admin/login should authenticate admin"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "celestaglow2024"})
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        print("✓ Admin login works")
    
    def test_admin_get_all_products(self, admin_token):
        """Admin should be able to get all products including inactive"""
        headers = {"X-Admin-Token": admin_token}
        response = requests.get(f"{BASE_URL}/api/products?active_only=false", headers=headers)
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 5
        print("✓ Admin can get all products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

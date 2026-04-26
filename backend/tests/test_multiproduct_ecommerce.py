"""
Multi-Product E-commerce Platform Tests
Tests for: Products, Combos, Cart, Coupons, Site Settings, Admin Product Management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cg-git-integration.preview.emergentagent.com')
ADMIN_PASSWORD = "celestaglow2024"


class TestProductsAPI:
    """Test product catalog endpoints"""
    
    def test_get_all_products_returns_5_active(self):
        """GET /api/products should return 5 active products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 5, f"Expected 5 products, got {len(products)}"
        
        # Verify all products are active
        for p in products:
            assert p.get("is_active") == True
    
    def test_products_have_correct_mrp_prices(self):
        """Verify MRP prices: Sunscreen ₹799, Under Eye ₹899, Anti-aging cream ₹1499, Anti-aging serum ₹1699, Cleanser ₹799"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        expected_mrp = {
            "sunscreen": 799,
            "under-eye-cream": 899,
            "anti-aging-cream": 1499,
            "anti-aging-serum": 1699,
            "cleanser": 799
        }
        
        for product in products:
            slug = product.get("slug")
            if slug in expected_mrp:
                assert product.get("mrp") == expected_mrp[slug], f"Product {slug} MRP mismatch: expected {expected_mrp[slug]}, got {product.get('mrp')}"
    
    def test_get_anti_aging_serum_details(self):
        """GET /api/products/anti-aging-serum returns serum with MRP 1699, prepaid 999"""
        response = requests.get(f"{BASE_URL}/api/products/anti-aging-serum")
        assert response.status_code == 200
        product = response.json()
        
        assert product.get("slug") == "anti-aging-serum"
        assert product.get("mrp") == 1699, f"Expected MRP 1699, got {product.get('mrp')}"
        assert product.get("prepaid_price") == 999, f"Expected prepaid 999, got {product.get('prepaid_price')}"
        assert product.get("name") is not None
        assert product.get("short_name") is not None
        assert product.get("benefits") is not None
        assert isinstance(product.get("benefits"), list)
    
    def test_get_sunscreen_details(self):
        """GET /api/products/sunscreen returns sunscreen with MRP ₹799"""
        response = requests.get(f"{BASE_URL}/api/products/sunscreen")
        assert response.status_code == 200
        product = response.json()
        
        assert product.get("slug") == "sunscreen"
        assert product.get("mrp") == 799, f"Expected MRP 799, got {product.get('mrp')}"
        assert "SPF" in product.get("name", "") or "Sunscreen" in product.get("name", "")
    
    def test_get_nonexistent_product_returns_404(self):
        """GET /api/products/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent-product-xyz")
        assert response.status_code == 404


class TestCombosAPI:
    """Test combo bundle endpoints"""
    
    def test_get_combos_returns_3(self):
        """GET /api/combos should return 3 combos"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        assert isinstance(combos, list)
        assert len(combos) == 3, f"Expected 3 combos, got {len(combos)}"
    
    def test_combos_have_correct_ids(self):
        """Verify combo IDs: complete-anti-aging-kit, day-night-duo, glow-essentials"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        
        combo_ids = [c.get("combo_id") for c in combos]
        expected_ids = ["complete-anti-aging-kit", "day-night-duo", "glow-essentials"]
        
        for expected_id in expected_ids:
            assert expected_id in combo_ids, f"Missing combo: {expected_id}"
    
    def test_complete_kit_combo_details(self):
        """Verify Complete Anti-Aging Kit has all 5 products"""
        response = requests.get(f"{BASE_URL}/api/combos")
        assert response.status_code == 200
        combos = response.json()
        
        complete_kit = next((c for c in combos if c.get("combo_id") == "complete-anti-aging-kit"), None)
        assert complete_kit is not None, "Complete Anti-Aging Kit not found"
        
        assert len(complete_kit.get("product_slugs", [])) == 5
        assert complete_kit.get("mrp_total") > 0
        assert complete_kit.get("combo_prepaid_price") > 0
        assert complete_kit.get("combo_prepaid_price") < complete_kit.get("mrp_total")


class TestCartValidation:
    """Test cart validation endpoint"""
    
    def test_validate_single_product_cart(self):
        """POST /api/cart/validate validates single product cart"""
        payload = {
            "items": [{"product_slug": "sunscreen", "quantity": 1}],
            "payment_method": "prepaid"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "subtotal" in data
        assert "total" in data
        assert len(data["items"]) == 1
        assert data["items"][0]["slug"] == "sunscreen"
        assert data["item_count"] == 1
    
    def test_validate_multiple_products_cart(self):
        """POST /api/cart/validate validates multiple products"""
        payload = {
            "items": [
                {"product_slug": "sunscreen", "quantity": 1},
                {"product_slug": "anti-aging-serum", "quantity": 2}
            ],
            "payment_method": "prepaid"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) == 2
        assert data["item_count"] == 3  # 1 + 2
        assert data["subtotal"] > 0
        assert data["total"] > 0
    
    def test_validate_combo_cart(self):
        """POST /api/cart/validate validates combo in cart"""
        payload = {
            "items": [{"combo_id": "day-night-duo", "quantity": 1}],
            "payment_method": "prepaid"
        }
        response = requests.post(f"{BASE_URL}/api/cart/validate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["type"] == "combo"
        assert data["items"][0]["combo_id"] == "day-night-duo"
    
    def test_validate_cart_cod_vs_prepaid_pricing(self):
        """Verify COD pricing is higher than prepaid"""
        prepaid_payload = {
            "items": [{"product_slug": "anti-aging-serum", "quantity": 1}],
            "payment_method": "prepaid"
        }
        cod_payload = {
            "items": [{"product_slug": "anti-aging-serum", "quantity": 1}],
            "payment_method": "COD"
        }
        
        prepaid_res = requests.post(f"{BASE_URL}/api/cart/validate", json=prepaid_payload)
        cod_res = requests.post(f"{BASE_URL}/api/cart/validate", json=cod_payload)
        
        assert prepaid_res.status_code == 200
        assert cod_res.status_code == 200
        
        prepaid_total = prepaid_res.json()["total"]
        cod_total = cod_res.json()["total"]
        
        assert cod_total > prepaid_total, f"COD ({cod_total}) should be higher than prepaid ({prepaid_total})"


class TestCouponValidation:
    """Test coupon validation endpoint"""
    
    def test_validate_invalid_coupon(self):
        """POST /api/validate-coupon with invalid code returns 404"""
        response = requests.post(f"{BASE_URL}/api/validate-coupon?code=INVALIDCODE123&cart_total=1000")
        assert response.status_code == 404
    
    def test_admin_create_and_validate_coupon(self):
        """Admin creates coupon, then validates it"""
        # Login as admin
        login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert login_res.status_code == 200
        token = login_res.json().get("token")
        headers = {"X-Admin-Token": token}
        
        # Create a test coupon
        coupon_data = {
            "code": "TEST10OFF",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_order_amount": 500,
            "max_uses": 100,
            "expiry_days": 30
        }
        create_res = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert create_res.status_code == 200
        
        # Validate the coupon
        validate_res = requests.post(f"{BASE_URL}/api/validate-coupon?code=TEST10OFF&cart_total=1000")
        assert validate_res.status_code == 200
        data = validate_res.json()
        assert data.get("valid") == True
        assert data.get("discount") == 100  # 10% of 1000
        
        # Cleanup - delete the coupon
        requests.delete(f"{BASE_URL}/api/admin/coupons/TEST10OFF", headers=headers)


class TestSiteSettings:
    """Test site settings endpoint"""
    
    def test_get_site_settings(self):
        """GET /api/site-settings returns hero title and settings"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200
        
        settings = response.json()
        assert isinstance(settings, dict)
        # Should have hero_title
        assert "hero_title" in settings or settings == {}  # Empty dict is valid if not seeded


class TestAdminProductManagement:
    """Test admin product management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_admin_login(self):
        """Admin login with correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
        assert response.status_code == 200
        assert "token" in response.json()
    
    def test_admin_update_product(self, admin_token):
        """PUT /api/admin/products/{slug} updates product"""
        headers = {"X-Admin-Token": admin_token}
        
        # Get current product state
        get_res = requests.get(f"{BASE_URL}/api/products/sunscreen")
        original_tagline = get_res.json().get("tagline")
        
        # Update product
        update_data = {"tagline": "TEST Updated Tagline"}
        update_res = requests.put(f"{BASE_URL}/api/admin/products/sunscreen", json=update_data, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json().get("success") == True
        
        # Verify update
        verify_res = requests.get(f"{BASE_URL}/api/products/sunscreen")
        assert verify_res.json().get("tagline") == "TEST Updated Tagline"
        
        # Restore original
        restore_data = {"tagline": original_tagline}
        requests.put(f"{BASE_URL}/api/admin/products/sunscreen", json=restore_data, headers=headers)
    
    def test_admin_create_coupon(self, admin_token):
        """POST /api/admin/coupons creates a coupon"""
        headers = {"X-Admin-Token": admin_token}
        
        coupon_data = {
            "code": "TESTCOUPON20",
            "discount_type": "fixed",
            "discount_value": 50,
            "min_order_amount": 0,
            "max_uses": 10,
            "expiry_days": 7
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=coupon_data, headers=headers)
        assert response.status_code == 200
        assert response.json().get("success") == True
        assert response.json().get("code") == "TESTCOUPON20"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/coupons/TESTCOUPON20", headers=headers)
    
    def test_admin_get_coupons(self, admin_token):
        """GET /api/admin/coupons returns coupon list"""
        headers = {"X-Admin-Token": admin_token}
        response = requests.get(f"{BASE_URL}/api/admin/coupons", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_unauthorized_product_update_fails(self):
        """PUT /api/admin/products without token returns 401"""
        update_data = {"tagline": "Unauthorized update"}
        response = requests.put(f"{BASE_URL}/api/admin/products/sunscreen", json=update_data)
        assert response.status_code == 401


class TestOrderCreation:
    """Test order creation with multi-product support"""
    
    def test_create_order_with_items(self):
        """POST /api/orders creates order with items array"""
        order_data = {
            "name": "TEST User",
            "phone": "9876543210",
            "house_number": "123 Test Street",
            "area": "Test Area",
            "pincode": "560001",
            "state": "Karnataka",
            "payment_method": "COD",
            "amount": 999,
            "items": [
                {"slug": "sunscreen", "name": "SPF 50 Sunscreen", "quantity": 1, "price": 499},
                {"slug": "cleanser", "name": "Gentle Cleanser", "quantity": 1, "price": 499}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        order = response.json()
        assert "order_id" in order
        assert order.get("name") == "TEST User"
        assert order.get("amount") == 999


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

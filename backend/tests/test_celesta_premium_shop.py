"""Smoke tests for backend after Shop/Homepage premium redesign + cart sound feature."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cg-git-integration.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Products endpoint
def test_get_products_returns_list(client):
    r = client.get(f"{BASE_URL}/api/products", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    p = data[0]
    for key in ("slug", "short_name", "mrp", "prepaid_price", "images"):
        assert key in p, f"Missing key {key} in product"


# Combos endpoint with complete-anti-aging-kit
def test_get_combos_includes_complete_kit(client):
    r = client.get(f"{BASE_URL}/api/combos", timeout=20)
    assert r.status_code == 200
    combos = r.json()
    assert isinstance(combos, list)
    kit = next((c for c in combos if c.get("combo_id") == "complete-anti-aging-kit"), None)
    assert kit is not None, "complete-anti-aging-kit combo missing"
    for key in ("name", "combo_prepaid_price", "mrp_total", "discount_percent", "product_slugs"):
        assert key in kit, f"Missing key {key} in combo"
    assert kit["combo_prepaid_price"] == 2799
    assert kit["mrp_total"] == 5695
    assert len(kit.get("product_slugs", [])) == 5


# Site settings
def test_get_site_settings(client):
    r = client.get(f"{BASE_URL}/api/site-settings", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)

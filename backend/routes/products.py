"""
Product Management Routes - Multi-product catalog, combos, coupons, cart
"""
from fastapi import APIRouter, Header, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import secrets
import logging

router = APIRouter()
db = None
admin_sessions = {}
employee_sessions = {}

def set_db(database):
    global db
    db = database

def set_admin_sessions(sessions):
    global admin_sessions
    admin_sessions = sessions

def set_employee_sessions(sessions):
    global employee_sessions
    employee_sessions = sessions

def verify_auth(x_admin_token=None, x_employee_token=None, permission=None):
    if x_admin_token and x_admin_token in admin_sessions:
        return True
    if x_employee_token and x_employee_token in employee_sessions:
        session = employee_sessions[x_employee_token]
        if permission and not session.get("permissions", {}).get(permission):
            raise HTTPException(status_code=403, detail=f"No permission: {permission}")
        return True
    raise HTTPException(status_code=401, detail="Unauthorized")


# ==================== PRODUCT ENDPOINTS ====================

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    key_ingredients: Optional[str] = None
    ingredients_full: Optional[str] = None
    benefits: Optional[List[str]] = None
    how_to_use: Optional[str] = None
    size: Optional[str] = None
    images: Optional[List[str]] = None
    mrp: Optional[float] = None
    prepaid_price: Optional[float] = None
    cod_price: Optional[float] = None
    cod_advance: Optional[float] = None
    discount_percent: Optional[float] = None
    badge: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    category: Optional[str] = None
    concerns: Optional[List[str]] = None
    niche: Optional[str] = None
    # TBL / Preorder
    is_to_be_launched: Optional[bool] = None
    launch_date: Optional[str] = None  # ISO date string
    preorder_enabled: Optional[bool] = None

class ProductCreate(BaseModel):
    slug: str
    name: str
    short_name: str
    tagline: str = ""
    description: str = ""
    category: str = "skincare"
    concerns: List[str] = []
    niche: str = "anti-aging"  # 'anti-aging' | 'skincare' | 'cosmetics'
    key_ingredients: str = ""
    ingredients_full: str = ""
    benefits: List[str] = []
    how_to_use: str = ""
    size: str = ""
    images: List[str] = []
    mrp: float = 0
    prepaid_price: float = 0
    cod_price: float = 0
    cod_advance: float = 29
    discount_percent: float = 0
    badge: str = ""
    is_active: bool = True
    sort_order: int = 99
    # TBL / Preorder
    is_to_be_launched: bool = False
    launch_date: Optional[str] = None
    preorder_enabled: bool = False


@router.get("/products")
async def get_all_products(
    active_only: bool = Query(True),
    niche: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    concern: Optional[str] = Query(None),
):
    """Public: Get all active products (with TBL auto-flip), optionally filter by niche/category/concern"""
    query = {"is_active": True} if active_only else {}
    if niche:
        query["niche"] = niche
    if category:
        query["category"] = category
    if concern:
        query["concerns"] = concern
    products = await db.products.find(query, {"_id": 0}).sort("sort_order", 1).to_list(100)
    # Auto-flip TBL → launched on read if launch_date passed
    now = datetime.now(timezone.utc)
    for p in products:
        if p.get("is_to_be_launched") and p.get("launch_date"):
            try:
                ld = datetime.fromisoformat(str(p["launch_date"]).replace("Z", "+00:00"))
                if ld <= now:
                    p["is_to_be_launched"] = False
                    p["launch_date"] = None
                    await db.products.update_one(
                        {"slug": p["slug"]},
                        {"$set": {"is_to_be_launched": False, "launch_date": None,
                                  "updated_at": now.isoformat()}}
                    )
            except Exception:
                pass
        # Compute days_to_launch convenience field
        if p.get("is_to_be_launched") and p.get("launch_date"):
            try:
                ld = datetime.fromisoformat(str(p["launch_date"]).replace("Z", "+00:00"))
                delta = ld - now
                p["days_to_launch"] = max(0, delta.days)
                p["hours_to_launch"] = max(0, int(delta.total_seconds() // 3600))
            except Exception:
                p["days_to_launch"] = None
        else:
            p["days_to_launch"] = None
    return products


@router.get("/products/{slug}")
async def get_product(slug: str):
    """Public: Get single product by slug (with TBL auto-flip + countdown)"""
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    now = datetime.now(timezone.utc)
    if product.get("is_to_be_launched") and product.get("launch_date"):
        try:
            ld = datetime.fromisoformat(str(product["launch_date"]).replace("Z", "+00:00"))
            if ld <= now:
                product["is_to_be_launched"] = False
                product["launch_date"] = None
                await db.products.update_one(
                    {"slug": slug},
                    {"$set": {"is_to_be_launched": False, "launch_date": None,
                              "updated_at": now.isoformat()}}
                )
            else:
                delta = ld - now
                product["days_to_launch"] = max(0, delta.days)
                product["hours_to_launch"] = max(0, int(delta.total_seconds() // 3600))
        except Exception:
            pass
    return product


class LaunchStatusUpdate(BaseModel):
    is_to_be_launched: bool
    launch_date: Optional[str] = None  # ISO date; required if is_to_be_launched=True
    preorder_enabled: Optional[bool] = None


@router.put("/admin/products/{slug}/launch-status")
async def set_product_launch_status(
    slug: str,
    data: LaunchStatusUpdate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    """Admin: Toggle a product's TBL (To-Be-Launched) status, set launch date, toggle preorder."""
    verify_auth(x_admin_token=x_admin_token)
    product = await db.products.find_one({"slug": slug})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update = {
        "is_to_be_launched": data.is_to_be_launched,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.is_to_be_launched:
        # When marking as TBL, default to +25 days from today if no date provided
        if data.launch_date:
            update["launch_date"] = data.launch_date
        else:
            from datetime import timedelta as _td
            update["launch_date"] = (datetime.now(timezone.utc) + _td(days=25)).isoformat()
        if data.preorder_enabled is not None:
            update["preorder_enabled"] = data.preorder_enabled
    else:
        # When marking as launched, clear launch_date and disable preorder
        update["launch_date"] = None
        update["preorder_enabled"] = False

    await db.products.update_one({"slug": slug}, {"$set": update})
    return {"success": True, "slug": slug, "is_to_be_launched": data.is_to_be_launched, "launch_date": update.get("launch_date")}


@router.post("/products/{slug}/preorder-count")
async def increment_preorder_count(slug: str):
    """Public: Increment preorder counter when a TBL item is added to cart."""
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product or not product.get("is_to_be_launched"):
        raise HTTPException(status_code=400, detail="Product is not in preorder state")
    await db.products.update_one({"slug": slug}, {"$inc": {"preorder_count": 1}})
    return {"success": True}




@router.post("/admin/products")
async def create_product(
    data: ProductCreate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    """Admin: Create a new product"""
    verify_auth(x_admin_token=x_admin_token)
    existing = await db.products.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Product slug already exists")
    
    product = data.dict()
    product["created_at"] = datetime.now(timezone.utc).isoformat()
    product["updated_at"] = datetime.now(timezone.utc).isoformat()
    product["reviews_count"] = 0
    product["rating"] = 4.8
    await db.products.insert_one(product)
    return {"success": True, "slug": data.slug}


@router.put("/admin/products/{slug}")
async def update_product(
    slug: str,
    data: ProductUpdate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    """Admin: Update product details"""
    verify_auth(x_admin_token=x_admin_token)
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"slug": slug}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}


@router.delete("/admin/products/{slug}")
async def delete_product(
    slug: str,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    """Admin: Delete product"""
    verify_auth(x_admin_token=x_admin_token)
    result = await db.products.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}


# ==================== COMBO ENDPOINTS ====================

class ComboCreate(BaseModel):
    combo_id: str
    name: str
    description: str = ""
    product_slugs: List[str]
    mrp_total: float = 0
    combo_prepaid_price: float = 0
    combo_cod_price: float = 0
    discount_percent: float = 0
    badge: str = ""
    is_active: bool = True
    sort_order: int = 99
    image: Optional[str] = None
    # TBL / Preorder
    is_to_be_launched: bool = False
    launch_date: Optional[str] = None
    preorder_enabled: bool = False

class ComboUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_slugs: Optional[List[str]] = None
    mrp_total: Optional[float] = None
    combo_prepaid_price: Optional[float] = None
    combo_cod_price: Optional[float] = None
    discount_percent: Optional[float] = None
    badge: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    image: Optional[str] = None
    # TBL / Preorder
    is_to_be_launched: Optional[bool] = None
    launch_date: Optional[str] = None
    preorder_enabled: Optional[bool] = None


@router.get("/combos")
async def get_all_combos(active_only: bool = Query(True)):
    """Public: Get all active combos with TBL auto-flip + countdown"""
    query = {"is_active": True} if active_only else {}
    combos = await db.combos.find(query, {"_id": 0}).sort("sort_order", 1).to_list(50)
    now = datetime.now(timezone.utc)
    for c in combos:
        if c.get("is_to_be_launched") and c.get("launch_date"):
            try:
                ld = datetime.fromisoformat(str(c["launch_date"]).replace("Z", "+00:00"))
                if ld <= now:
                    c["is_to_be_launched"] = False
                    c["launch_date"] = None
                    await db.combos.update_one(
                        {"combo_id": c["combo_id"]},
                        {"$set": {"is_to_be_launched": False, "launch_date": None,
                                  "updated_at": now.isoformat()}}
                    )
                else:
                    delta = ld - now
                    c["days_to_launch"] = max(0, delta.days)
                    c["hours_to_launch"] = max(0, int(delta.total_seconds() // 3600))
            except Exception:
                pass
        else:
            c["days_to_launch"] = None
    return combos


@router.put("/admin/combos/{combo_id}/launch-status")
async def set_combo_launch_status(
    combo_id: str,
    data: LaunchStatusUpdate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    """Admin: Toggle a combo's TBL status."""
    verify_auth(x_admin_token=x_admin_token)
    combo = await db.combos.find_one({"combo_id": combo_id})
    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    update = {
        "is_to_be_launched": data.is_to_be_launched,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.is_to_be_launched:
        if data.launch_date:
            update["launch_date"] = data.launch_date
        else:
            from datetime import timedelta as _td
            update["launch_date"] = (datetime.now(timezone.utc) + _td(days=25)).isoformat()
        if data.preorder_enabled is not None:
            update["preorder_enabled"] = data.preorder_enabled
    else:
        update["launch_date"] = None
        update["preorder_enabled"] = False

    await db.combos.update_one({"combo_id": combo_id}, {"$set": update})
    return {"success": True, "combo_id": combo_id, "is_to_be_launched": data.is_to_be_launched}


@router.post("/admin/combos")
async def create_combo(
    data: ComboCreate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    verify_auth(x_admin_token=x_admin_token)
    combo = data.dict()
    combo["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.combos.insert_one(combo)
    return {"success": True, "combo_id": data.combo_id}


@router.put("/admin/combos/{combo_id}")
async def update_combo(
    combo_id: str,
    data: ComboUpdate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    verify_auth(x_admin_token=x_admin_token)
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.combos.update_one({"combo_id": combo_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Combo not found")
    return {"success": True}


@router.delete("/admin/combos/{combo_id}")
async def delete_combo(
    combo_id: str,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    verify_auth(x_admin_token=x_admin_token)
    await db.combos.delete_one({"combo_id": combo_id})
    return {"success": True}


# ==================== COUPON ENDPOINTS ====================

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage or fixed
    discount_value: float = 10
    min_order_amount: float = 0
    max_uses: int = 100
    expiry_days: int = 30
    is_active: bool = True


@router.get("/admin/coupons")
async def get_all_coupons(x_admin_token: str = Header(None, alias="X-Admin-Token")):
    verify_auth(x_admin_token=x_admin_token)
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return coupons


@router.post("/admin/coupons")
async def create_coupon(data: CouponCreate, x_admin_token: str = Header(None, alias="X-Admin-Token")):
    verify_auth(x_admin_token=x_admin_token)
    coupon = data.dict()
    coupon["used_count"] = 0
    coupon["created_at"] = datetime.now(timezone.utc).isoformat()
    from datetime import timedelta
    coupon["expiry_date"] = (datetime.now(timezone.utc) + timedelta(days=data.expiry_days)).isoformat()
    del coupon["expiry_days"]
    await db.coupons.insert_one(coupon)
    return {"success": True, "code": data.code}


@router.post("/validate-coupon")
async def validate_coupon(code: str = Query(...), cart_total: float = Query(0)):
    """Public: Validate a coupon code"""
    coupon = await db.coupons.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if coupon.get("expiry_date") and datetime.fromisoformat(coupon["expiry_date"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon expired")
    if coupon.get("max_uses") and coupon.get("used_count", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    if cart_total < coupon.get("min_order_amount", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order amount: ₹{coupon['min_order_amount']}")
    
    discount = coupon["discount_value"]
    if coupon["discount_type"] == "percentage":
        discount = round(cart_total * coupon["discount_value"] / 100, 2)
    
    return {"valid": True, "discount": discount, "discount_type": coupon["discount_type"], "discount_value": coupon["discount_value"]}


@router.delete("/admin/coupons/{code}")
async def delete_coupon(code: str, x_admin_token: str = Header(None, alias="X-Admin-Token")):
    verify_auth(x_admin_token=x_admin_token)
    await db.coupons.delete_one({"code": code})
    return {"success": True}


# ==================== CART VALIDATION ====================

class CartItem(BaseModel):
    product_slug: Optional[str] = None
    combo_id: Optional[str] = None
    quantity: int = 1

class CartValidateRequest(BaseModel):
    items: List[CartItem]
    coupon_code: Optional[str] = None
    payment_method: str = "prepaid"


@router.post("/cart/validate")
async def validate_cart(data: CartValidateRequest):
    """Validate cart items, calculate totals"""
    validated_items = []
    subtotal = 0
    mrp_total = 0
    
    is_cod = (data.payment_method or "").lower() == "cod"
    cod_premium = 50 if is_cod else 0  # COD costs ₹50 more (achieved by reducing savings)

    for item in data.items:
        if item.product_slug:
            product = await db.products.find_one({"slug": item.product_slug, "is_active": True}, {"_id": 0})
            if not product:
                continue
            # Always use prepaid price as base — COD premium is applied at cart-level (not per-item)
            price = product["prepaid_price"]
            line_total = price * item.quantity
            mrp_line = product["mrp"] * item.quantity
            validated_items.append({
                "type": "product",
                "slug": product["slug"],
                "name": product["name"],
                "short_name": product["short_name"],
                "image": product["images"][0] if product.get("images") else "",
                "mrp": product["mrp"],
                "price": price,
                "quantity": item.quantity,
                "line_total": line_total
            })
            subtotal += line_total
            mrp_total += mrp_line
        elif item.combo_id:
            combo = await db.combos.find_one({"combo_id": item.combo_id, "is_active": True}, {"_id": 0})
            if not combo:
                continue
            price = combo["combo_prepaid_price"]  # uniform prepaid base
            line_total = price * item.quantity
            mrp_line = combo["mrp_total"] * item.quantity
            validated_items.append({
                "type": "combo",
                "combo_id": combo["combo_id"],
                "name": combo["name"],
                "product_slugs": combo["product_slugs"],
                "mrp_total": combo["mrp_total"],
                "price": price,
                "quantity": item.quantity,
                "line_total": line_total
            })
            subtotal += line_total
            mrp_total += mrp_line
    
    # Apply coupon
    discount = 0
    if data.coupon_code:
        coupon = await db.coupons.find_one({"code": data.coupon_code.upper(), "is_active": True}, {"_id": 0})
        if coupon:
            if coupon["discount_type"] == "percentage":
                discount = round(subtotal * coupon["discount_value"] / 100, 2)
            else:
                discount = coupon["discount_value"]
    
    total = max(subtotal - discount, 0)
    
    # Apply volume discount
    total_items = sum(i["quantity"] for i in validated_items)
    volume_discount = 0
    volume_discount_percent = 0
    settings_doc = await db.site_settings.find_one({"_id": "main"}, {"_id": 0})
    volume_tiers = (settings_doc or {}).get("volume_discounts", [
        {"min_items": 2, "discount_percent": 5},
        {"min_items": 3, "discount_percent": 10},
        {"min_items": 4, "discount_percent": 15},
    ])
    for tier in sorted(volume_tiers, key=lambda x: x.get("min_items", 0), reverse=True):
        if total_items >= tier.get("min_items", 0):
            volume_discount_percent = tier.get("discount_percent", 0)
            volume_discount = round(total * volume_discount_percent / 100, 2)
            break
    
    final_total = max(total - volume_discount, 0) + cod_premium
    total_savings = max(mrp_total - final_total, 0)
    
    return {
        "items": validated_items,
        "mrp_total": mrp_total,
        "subtotal": subtotal,
        "discount": discount,
        "volume_discount": volume_discount,
        "volume_discount_percent": volume_discount_percent,
        "cod_premium": cod_premium,
        "payment_method": data.payment_method,
        "total": final_total,
        "savings": total_savings,
        "item_count": total_items,
        "prepaid_savings_hint": cod_premium  # ₹ saved by switching to prepaid
    }


# ==================== ADMIN SITE SETTINGS ====================

class SiteSettingsUpdate(BaseModel):
    hero_banner_image: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    presale_enabled: Optional[bool] = None
    presale_title: Optional[str] = None
    presale_badge: Optional[str] = None
    presale_price: Optional[float] = None
    cod_advance_amount: Optional[float] = None
    before_after_images: Optional[List[Dict]] = None
    result_images: Optional[List[str]] = None
    bundle_hero_image: Optional[str] = None
    homepage_feature_image: Optional[str] = None  # NEW: editable landscape banner that replaces 3-product hero side panel
    homepage_feature_title: Optional[str] = None
    homepage_feature_subtitle: Optional[str] = None
    volume_discounts: Optional[List[Dict]] = None  # [{min_items: 2, discount_percent: 5}, ...]
    # Multi-banner hero carousel
    banner_carousel: Optional[List[Dict]] = None  # [{id, image, title, subtitle, cta_text, cta_link, sort_order}, ...]
    carousel_autoplay_ms: Optional[int] = None  # default 2000


@router.get("/site-settings")
async def get_site_settings():
    """Public: Get site settings"""
    settings = await db.site_settings.find_one({"_id": "main"}, {"_id": 0})
    return settings or {}


@router.put("/admin/site-settings")
async def update_site_settings(
    data: SiteSettingsUpdate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    verify_auth(x_admin_token=x_admin_token)
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_settings.update_one({"_id": "main"}, {"$set": update}, upsert=True)
    return {"success": True}


# ==================== CUSTOMER RETENTION ====================

@router.get("/admin/retention/customers")
async def get_retention_customers(
    x_admin_token: str = Header(None, alias="X-Admin-Token"),
    days: int = Query(15)
):
    """Get customers due for follow-up (15 or 30 days after purchase)"""
    verify_auth(x_admin_token=x_admin_token)
    from datetime import timedelta
    target_date = datetime.now(timezone.utc) - timedelta(days=days)
    window_start = target_date - timedelta(days=2)
    window_end = target_date + timedelta(days=2)
    
    orders = await db.orders.find({
        "status": {"$in": ["confirmed", "delivered"]},
        "created_at": {"$gte": window_start.isoformat(), "$lte": window_end.isoformat()}
    }, {"_id": 0}).to_list(500)
    
    # Check for existing retention notes
    for order in orders:
        note = await db.retention_notes.find_one({"order_id": order.get("order_id")}, {"_id": 0})
        order["retention_note"] = note
    
    return {"customers": orders, "days": days}


class RetentionNoteCreate(BaseModel):
    order_id: str
    status: str  # interested, not_interested, reorder, callback
    notes: str = ""


@router.post("/admin/retention/note")
async def add_retention_note(
    data: RetentionNoteCreate,
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    verify_auth(x_admin_token=x_admin_token)
    note = data.dict()
    note["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.retention_notes.update_one(
        {"order_id": data.order_id},
        {"$set": note},
        upsert=True
    )
    return {"success": True}


# ==================== BEFORE/AFTER IMAGE MANAGEMENT ====================

class BeforeAfterImage(BaseModel):
    product_slug: str
    customer_name: str = ""
    before_image: str
    after_image: str
    duration: str = ""
    description: str = ""


@router.get("/admin/before-after")
async def get_before_after(x_admin_token: str = Header(None, alias="X-Admin-Token")):
    verify_auth(x_admin_token=x_admin_token)
    images = await db.before_after_images.find({}, {"_id": 0}).to_list(100)
    return images


@router.get("/before-after/{product_slug}")
async def get_product_before_after(product_slug: str):
    """Public: Get before/after images for a product"""
    images = await db.before_after_images.find({"product_slug": product_slug}, {"_id": 0}).to_list(20)
    return images


@router.post("/admin/before-after")
async def add_before_after(data: BeforeAfterImage, x_admin_token: str = Header(None, alias="X-Admin-Token")):
    verify_auth(x_admin_token=x_admin_token)
    doc = data.dict()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["ba_id"] = f"ba_{secrets.token_hex(4)}"
    await db.before_after_images.insert_one(doc)
    return {"success": True, "ba_id": doc["ba_id"]}


@router.delete("/admin/before-after/{ba_id}")
async def delete_before_after(ba_id: str, x_admin_token: str = Header(None, alias="X-Admin-Token")):
    verify_auth(x_admin_token=x_admin_token)
    await db.before_after_images.delete_one({"ba_id": ba_id})
    return {"success": True}


# ==================== IMAGE UPLOAD (admin) ====================

@router.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    x_admin_token: str = Header(None, alias="X-Admin-Token")
):
    """Upload an image and return a data-URL that can be used anywhere (product images, hero banner, etc.).
    Stores as base64 data URL — no filesystem dependency, persists in MongoDB through product/settings docs."""
    verify_auth(x_admin_token=x_admin_token)
    import base64
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5 MB cap
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")
    mime = file.content_type or "image/jpeg"
    if not mime.startswith("image/"):
        raise HTTPException(status_code=400, detail="File is not an image")
    encoded = base64.b64encode(contents).decode("utf-8")
    data_url = f"data:{mime};base64,{encoded}"
    return {"success": True, "url": data_url, "size": len(contents), "mime": mime}


# ==================== SEED DATA ====================

async def seed_products():
    """Seed initial product catalog if empty"""
    count = await db.products.count_documents({})
    if count > 0:
        return
    
    logging.info("Seeding product catalog...")
    
    products = [
        {
            "slug": "anti-aging-serum",
            "name": "Celesta Glow Advanced Face Serum",
            "short_name": "Anti-Aging Serum",
            "tagline": "Anti-Aging + Brightening Formula",
            "description": "A lightweight, fast-absorbing formula designed to improve skin clarity and enhance overall radiance. Formulated with Niacinamide, Alpha Arbutin, and a stable form of Vitamin C, it helps reduce dullness, refine skin texture, and promote a more even-looking complexion. Suitable for daily use across all skin types.",
            "category": "serum",
            "key_ingredients": "Niacinamide + Alpha Arbutin + Vitamin C",
            "ingredients_full": "Aqua, Aloe Barbadensis Leaf Extract, Coco-Caprylate/Caprate, Glycerin, Helianthus Annuus (Sunflower) Seed Oil, Sodium Polyacrylate, Xylitol, Caprylic Acid, Glyceryl Stearate, Diethylhexyl Maleate, Cetearyl Alcohol, Propanediol, Sodium Hyaluronate, Phenoxyethanol, Ethylhexylglycerin, Hydrolyzed Pea Protein, Tocopherol, Stevioside, 4-n-Butylresorcinol, Dimethyl Isosorbide, Hydroxypinacolone Retinoate, Sodium Gluconate, Cyamopsis Tetragonoloba (Guar) Gum",
            "benefits": ["Reduces Dullness & Dark Spots", "Supports Firm, Youthful Skin", "Brightens & Evens Skin Tone", "Lightweight Daily Use Formula"],
            "how_to_use": "Apply to clean, dry skin on the face and neck. Use in the evening. Follow with sunscreen during the day.",
            "size": "30ml / 1.01 fl oz",
            "images": [],
            "mrp": 1699,
            "prepaid_price": 999,
            "cod_price": 1099,
            "cod_advance": 29,
            "discount_percent": 41,
            "badge": "Bestseller",
            "is_active": True,
            "sort_order": 1,
            "rating": 4.8,
            "reviews_count": 2847,
            "skin_type": "All Skin Types",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "slug": "anti-aging-cream",
            "name": "Celesta Glow Advanced Retinoid Night Cream",
            "short_name": "Anti-Aging Night Cream",
            "tagline": "Anti-Aging + Brightening Formula",
            "description": "An advanced night cream formulated with Retinoid and Hyaluronic Acid. Works overnight to reduce fine lines and wrinkles, improve skin firmness, brighten and even skin tone, and deeply hydrate for a youthful morning glow.",
            "category": "cream",
            "key_ingredients": "Retinoid + Hyaluronic Acid",
            "ingredients_full": "Aqua, Aloe Barbadensis Leaf Extract, Coco-Caprylate/Caprate, Glycerin, Helianthus Annuus (Sunflower) Seed Oil, Sodium Polyacrylate, Xylitol, Caprylic Acid, Glyceryl Stearate, Diethylhexyl Maleate, Cetearyl Alcohol, Propanediol, Sodium Hyaluronate, Phenoxyethanol, Ethylhexylglycerin, Hydrolyzed Pea Protein, Tocopherol, Stevioside, 4-n-Butylresorcinol, Dimethyl Isosorbide, Hydroxypinacolone Retinoate, Sodium Gluconate, Cyamopsis Tetragonoloba (Guar) Gum",
            "benefits": ["Reduces Fine Lines & Wrinkles", "Improves Skin Firmness", "Brightens & Evens Skin Tone", "Deeply Hydrates Overnight"],
            "how_to_use": "Apply to clean, dry skin on the face and neck. Use in the evening. Follow with sunscreen during the day.",
            "size": "50ml / 1.69 fl oz",
            "images": [],
            "mrp": 1499,
            "prepaid_price": 899,
            "cod_price": 999,
            "cod_advance": 29,
            "discount_percent": 40,
            "badge": "New Launch",
            "is_active": True,
            "sort_order": 2,
            "rating": 4.7,
            "reviews_count": 1293,
            "skin_type": "All Skin Types",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "slug": "under-eye-cream",
            "name": "Celesta Glow Caffeine Under Eye Cream",
            "short_name": "Under Eye Cream",
            "tagline": "Dark Circle + Puffiness + Anti-Aging Formula",
            "description": "A lightweight formula designed for the delicate under-eye area. Enriched with Caffeine, Niacinamide, and Hyaluronic Acid, it helps reduce the appearance of puffiness, improve under-eye brightness, and smooth the look of fine lines while providing lasting hydration.",
            "category": "eye-care",
            "key_ingredients": "Caffeine + Niacinamide + Hyaluronic Acid",
            "ingredients_full": "Aqua, Aloe Barbadensis Leaf Extract, Caffeine, Butyrospermum Parkii (Shea) Butter Extract, Sodium Starch Octenylsuccinate, Cera Alba (Beeswax), Hydroxyethyl Behenamidopropyl Dimonium Chloride, Polyquaternium-67, Hydrated Silica, Isopropyl Myristate, PEG-100 Stearate, Glyceryl Stearate, Stearic Acid, Cetyl Alcohol, Glycerin, Propanediol, Butyrospermum Parkii (Shea) Butter, Glyceryl Stearate SE, Olea Europaea (Olive) Fruit Oil, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Glycyrrhiza Glabra (Licorice) Root Extract, Sodium Hyaluronate, Hydrolyzed Pea Protein, Niacinamide, Phenoxyethanol, Ethylhexylglycerin, Ammonium Acryloyldimethyltaurate/VP Copolymer, Stevioside, Allantoin, Sodium Gluconate, Tocopherol",
            "benefits": ["Reduces Appearance of Puffiness", "Improves Under-Eye Brightness", "Smooths Fine Lines Around Eyes", "Provides Lightweight Hydration", "Suitable for Daily Use"],
            "how_to_use": "Apply a small amount to the under-eye area. Gently pat with fingertips until absorbed. Use morning and evening.",
            "size": "15g / 0.52 oz",
            "images": [],
            "mrp": 899,
            "prepaid_price": 549,
            "cod_price": 649,
            "cod_advance": 29,
            "discount_percent": 39,
            "badge": "New Launch",
            "is_active": True,
            "sort_order": 3,
            "rating": 4.7,
            "reviews_count": 987,
            "skin_type": "All Skin Types",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "slug": "sunscreen",
            "name": "Celesta Glow SPF 50 PA+++ Sunscreen",
            "short_name": "SPF 50 Sunscreen",
            "tagline": "Broad Spectrum + Lightweight + Matte Feel",
            "description": "A lightweight, broad-spectrum formula designed to protect the skin from harmful UVA and UVB rays. Enriched with Niacinamide and antioxidant Vitamin E, it helps support skin clarity while providing a comfortable, non-greasy matte finish.",
            "category": "sunscreen",
            "key_ingredients": "Niacinamide + Vitamin E",
            "ingredients_full": "Aqua, Aloe Barbadensis Leaf Extract, Methylene Bis-Benzotriazolyl Tetramethylbutylphenol, Decyl Glucoside, Propylene Glycol, Xanthan Gum, Propanediol, Glycerin, Titanium Dioxide, Niacinamide, Betaine, Chamomilla Recutita (Chamomile) Flower Water, Benzyl Alcohol, Ethylhexylglycerin, Tocopherol, Carbomer, Hydrolyzed Pea Protein, 4-n-Butylresorcinol, Stevioside, Sodium Gluconate, Cyamopsis Tetragonoloba (Guar) Gum",
            "benefits": ["Broad Spectrum UVA/UVB Protection", "Prevents Sun-Induced Skin Damage", "Lightweight, Non-Greasy Texture", "Provides a Matte Finish"],
            "how_to_use": "Apply generously to face and exposed areas 15 minutes before sun exposure. Reapply every 2-3 hours, or after sweating or washing.",
            "size": "50g / 1.76 oz",
            "images": [],
            "mrp": 799,
            "prepaid_price": 499,
            "cod_price": 599,
            "cod_advance": 29,
            "discount_percent": 38,
            "badge": "Daily Essential",
            "is_active": True,
            "sort_order": 4,
            "rating": 4.6,
            "reviews_count": 1542,
            "skin_type": "All Skin Types",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "slug": "cleanser",
            "name": "Celesta Glow Gentle Cleanser",
            "short_name": "Gentle Cleanser",
            "tagline": "Anti-Aging Formula",
            "description": "A mild, pH-balanced face cleanser formulated to effectively remove dirt, excess oil, and impurities without disrupting the skin barrier. Enriched with Niacinamide and Salicylic Acid, it helps improve skin clarity, refine texture, and support a healthier-looking complexion.",
            "category": "cleanser",
            "key_ingredients": "Niacinamide + Salicylic Acid + Pea Protein",
            "ingredients_full": "Aqua, Stearic Acid, Sodium Laureth Sulfate, Coco Fatty Acids, Potassium Hydroxide, Sorbitol, Lauric Acid, Aloe Barbadensis Leaf Extract, Cocamide MEA, Myristic Acid, Sodium Lactate, Sodium Gluconate, Palmitic Acid, Propylene Glycol, Salicylic Acid, Hydrolyzed Pea Protein, Phenoxyethanol, Ethylhexylglycerin, Stevioside, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Syzygium Aromaticum (Clove) Flower Oil",
            "benefits": ["Gently Cleanses Without Stripping Moisture", "Reduces Excess Oil & Prevents Clogged Pores", "Supports Smoother, Even Skin Texture", "Maintains Skin's Natural Barrier", "Suitable for All Skin Types"],
            "how_to_use": "Apply to damp skin and gently massage in circular motions. Rinse thoroughly with water. Use twice daily, morning and evening.",
            "size": "100ml / 3.38 fl oz",
            "images": [],
            "mrp": 799,
            "prepaid_price": 499,
            "cod_price": 599,
            "cod_advance": 29,
            "discount_percent": 38,
            "badge": "Daily Essential",
            "is_active": True,
            "sort_order": 5,
            "rating": 4.6,
            "reviews_count": 1128,
            "skin_type": "All Skin Types",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(products)
    logging.info(f"Seeded {len(products)} products")
    
    # Seed combos
    combos = [
        {
            "combo_id": "complete-anti-aging-kit",
            "name": "Complete Anti-Aging Kit",
            "description": "All 5 products for a complete anti-aging routine. Cleanse, treat, hydrate, protect.",
            "product_slugs": ["cleanser", "anti-aging-serum", "anti-aging-cream", "under-eye-cream", "sunscreen"],
            "mrp_total": 5695,
            "combo_prepaid_price": 2799,
            "combo_cod_price": 3099,
            "discount_percent": 51,
            "badge": "Best Value",
            "is_active": True,
            "sort_order": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "combo_id": "day-night-duo",
            "name": "Day & Night Power Duo",
            "description": "Sunscreen for day protection + Retinoid Night Cream for overnight repair.",
            "product_slugs": ["sunscreen", "anti-aging-cream"],
            "mrp_total": 2298,
            "combo_prepaid_price": 1199,
            "combo_cod_price": 1399,
            "discount_percent": 48,
            "badge": "Popular",
            "is_active": True,
            "sort_order": 2,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "combo_id": "glow-essentials",
            "name": "Glow Essentials Trio",
            "description": "Cleanser + Serum + Sunscreen. The essential 3-step routine for radiant skin.",
            "product_slugs": ["cleanser", "anti-aging-serum", "sunscreen"],
            "mrp_total": 3297,
            "combo_prepaid_price": 1699,
            "combo_cod_price": 1899,
            "discount_percent": 48,
            "badge": "Starter Kit",
            "is_active": True,
            "sort_order": 3,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.combos.insert_many(combos)
    logging.info(f"Seeded {len(combos)} combos")
    
    # Seed default site settings
    await db.site_settings.update_one(
        {"_id": "main"},
        {"$setOnInsert": {
            "hero_title": "India's #1 Complete Anti-Aging Solution",
            "hero_subtitle": "5 clinically-formulated products designed exclusively to fight aging. Cleanse, treat, hydrate, protect & brighten.",
            "presale_enabled": False,
            "presale_title": "",
            "presale_badge": "",
            "cod_advance_amount": 29,
            "before_after_images": [],
            "result_images": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    logging.info("Site settings initialized")
    
    # Auto-generate monthly coupons
    await generate_monthly_coupons()


async def generate_monthly_coupons():
    """Auto-generate monthly coupons if not already generated"""
    now = datetime.now(timezone.utc)
    months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    current_month = months[now.month - 1]
    next_month = months[now.month % 12]
    
    monthly_coupons = [
        {"code": f"{current_month}{now.year % 100}", "discount_type": "fixed", "discount_value": 25, "min_order_amount": 499, "max_uses": 5000},
        {"code": f"{current_month}GLOW", "discount_type": "fixed", "discount_value": 30, "min_order_amount": 799, "max_uses": 3000},
        {"code": f"{next_month}EARLY", "discount_type": "fixed", "discount_value": 20, "min_order_amount": 499, "max_uses": 2000},
    ]
    
    for coupon in monthly_coupons:
        existing = await db.coupons.find_one({"code": coupon["code"]})
        if not existing:
            from datetime import timedelta
            coupon["used_count"] = 0
            coupon["is_active"] = True
            coupon["created_at"] = now.isoformat()
            coupon["expiry_date"] = (now + timedelta(days=45)).isoformat()
            coupon["auto_generated"] = True
            await db.coupons.insert_one(coupon)
            logging.info(f"Auto-generated monthly coupon: {coupon['code']}")
    
    # Ensure WELCOME50 exists
    if not await db.coupons.find_one({"code": "WELCOME50"}):
        from datetime import timedelta
        await db.coupons.insert_one({
            "code": "WELCOME50", "discount_type": "fixed", "discount_value": 50,
            "min_order_amount": 499, "max_uses": 99999, "used_count": 0, "is_active": True,
            "created_at": now.isoformat(), "expiry_date": (now + timedelta(days=365)).isoformat()
        })
        logging.info("Created WELCOME50 coupon")

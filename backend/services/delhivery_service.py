"""
Delhivery Shipping Integration Service
Handles shipment creation, tracking, and status updates
"""
import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class DelhiveryService:
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get('DELHIVERY_API_KEY')
        self.pickup_location = os.environ.get('DELHIVERY_PICKUP_LOCATION', 'PARAAKAL')
        self.base_url = "https://track.delhivery.com"
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def create_shipment(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """Create a shipment in Delhivery for an order"""
        try:
            # Prepare shipment data
            shipment_data = {
                "shipments": [{
                    "name": order.get("name", ""),
                    "add": f"{order.get('house_number', '')} {order.get('area', '')}",
                    "pin": order.get("pincode", ""),
                    "city": order.get("city", ""),
                    "state": order.get("state", ""),
                    "country": "India",
                    "phone": order.get("phone", ""),
                    "order": order.get("order_id", ""),
                    "payment_mode": "COD" if order.get("payment_method") == "cod" else "Prepaid",
                    "return_pin": "",
                    "return_city": "",
                    "return_phone": "",
                    "return_add": "",
                    "return_state": "",
                    "return_country": "",
                    "products_desc": "Celesta Glow Anti-Aging Products",
                    "hsn_code": "",
                    "cod_amount": str(order.get("cod_balance", 0)) if order.get("payment_method") == "cod" else "0",
                    "order_date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                    "total_amount": str(order.get("total_amount", 0)),
                    "seller_add": "",
                    "seller_name": "Celesta Glow",
                    "seller_inv": "",
                    "quantity": "1",
                    "waybill": "",
                    "shipment_width": "10",
                    "shipment_height": "5",
                    "weight": "0.1",
                    "seller_gst_tin": "",
                    "shipping_mode": "Surface",
                    "address_type": "home"
                }],
                "pickup_location": {
                    "name": self.pickup_location
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/cmu/create.json",
                    headers=self.headers,
                    json=shipment_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extract AWB number from response
                    packages = result.get("packages", [])
                    if packages:
                        awb = packages[0].get("waybill", "")
                        
                        # Store AWB in order
                        await self.db.orders.update_one(
                            {"order_id": order.get("order_id")},
                            {"$set": {
                                "awb_number": awb,
                                "shipping_provider": "delhivery",
                                "shipment_created_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        
                        return {
                            "success": True,
                            "awb": awb,
                            "message": "Shipment created successfully"
                        }
                    
                    return {
                        "success": False,
                        "error": "No AWB generated",
                        "response": result
                    }
                else:
                    logger.error(f"Delhivery API error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            logger.error(f"Delhivery shipment creation error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def track_shipment(self, waybill: str) -> Dict[str, Any]:
        """Track a shipment using AWB/waybill number"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/packages/json/",
                    params={"waybill": waybill},
                    headers=self.headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    shipment_data = result.get("ShipmentData", [])
                    
                    if shipment_data:
                        shipment = shipment_data[0].get("Shipment", {})
                        status = shipment.get("Status", {})
                        
                        return {
                            "success": True,
                            "waybill": waybill,
                            "status": status.get("Status", "Unknown"),
                            "status_location": status.get("StatusLocation", ""),
                            "status_datetime": status.get("StatusDateTime", ""),
                            "instructions": status.get("Instructions", ""),
                            "scans": shipment.get("Scans", []),
                            "origin": shipment.get("Origin", ""),
                            "destination": shipment.get("Destination", ""),
                            "expected_delivery": shipment.get("ExpectedDeliveryDate", ""),
                            "pickup_date": shipment.get("PickUpDate", ""),
                            "delivered_date": shipment.get("DeliveredDate", "")
                        }
                    
                    return {
                        "success": False,
                        "error": "Shipment not found"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Delhivery tracking error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def track_by_phone(self, phone: str) -> Dict[str, Any]:
        """Track orders by customer phone number"""
        try:
            # Find all orders for this phone number
            orders = await self.db.orders.find(
                {"phone": {"$regex": phone[-10:]}},
                {"_id": 0}
            ).sort("created_at", -1).to_list(10)
            
            if not orders:
                return {
                    "success": False,
                    "error": "No orders found for this phone number"
                }
            
            result_orders = []
            
            for order in orders:
                order_data = {
                    "order_id": order.get("order_id"),
                    "name": order.get("name"),
                    "status": order.get("status"),
                    "total_amount": order.get("total_amount"),
                    "payment_method": order.get("payment_method"),
                    "created_at": order.get("created_at"),
                    "awb_number": order.get("awb_number"),
                    "tracking_url": None,
                    "delivery_status": None
                }
                
                # If AWB exists, get tracking info
                awb = order.get("awb_number")
                if awb:
                    tracking = await self.track_shipment(awb)
                    if tracking.get("success"):
                        order_data["delivery_status"] = tracking.get("status")
                        order_data["expected_delivery"] = tracking.get("expected_delivery")
                        order_data["status_location"] = tracking.get("status_location")
                        order_data["tracking_url"] = f"https://www.delhivery.com/track/package/{awb}"
                        order_data["scans"] = tracking.get("scans", [])
                
                result_orders.append(order_data)
            
            return {
                "success": True,
                "orders": result_orders,
                "total_orders": len(result_orders)
            }
            
        except Exception as e:
            logger.error(f"Track by phone error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def check_serviceability(self, pincode: str) -> Dict[str, Any]:
        """Check if a pincode is serviceable by Delhivery"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/c/api/pin-codes/json/",
                    params={"filter_codes": pincode},
                    headers=self.headers,
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    delivery_codes = result.get("delivery_codes", [])
                    
                    if delivery_codes:
                        postal = delivery_codes[0].get("postal_code", {})
                        return {
                            "success": True,
                            "serviceable": True,
                            "pincode": pincode,
                            "district": postal.get("district", ""),
                            "state": postal.get("state_code", ""),
                            "cod_available": postal.get("cod", "") == "Y",
                            "prepaid_available": postal.get("pre_paid", "") == "Y"
                        }
                    
                    return {
                        "success": True,
                        "serviceable": False,
                        "pincode": pincode
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"Serviceability check error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Initialize service (to be done in server.py)
delhivery_service = None

def init_delhivery_service(db):
    global delhivery_service
    delhivery_service = DelhiveryService(db)
    return delhivery_service

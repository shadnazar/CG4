import requests
import sys
from datetime import datetime
import json

class CelestaGlowAPITester:
    def __init__(self, base_url="https://cg-git-integration.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error Response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error Text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        if success and response.get('message') == 'Celesta Glow API':
            print("✅ Root endpoint returned correct message")
            return True
        else:
            print("❌ Root endpoint message incorrect")
            return False

    def test_recent_orders_stats(self):
        """Test the recent orders stats endpoint (NEW FEATURE)"""
        success, response = self.run_test(
            "Recent Orders Stats",
            "GET",
            "stats/recent-orders",
            200
        )
        
        if success:
            if 'count' in response and isinstance(response['count'], int) and response['count'] >= 30:
                print(f"✅ Recent orders count: {response['count']}")
                return True
            else:
                print(f"❌ Invalid recent orders response: {response}")
                return False
        
        return False

    def test_create_razorpay_order(self):
        """Test Razorpay order creation (NEW FEATURE)"""
        order_data = {
            "amount": 899.0
        }
        
        success, response = self.run_test(
            "Create Razorpay Order",
            "POST",
            "create-razorpay-order",
            200,
            data=order_data
        )
        
        if success:
            required_fields = ['id', 'amount', 'currency']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"❌ Missing fields in Razorpay response: {missing_fields}")
                return False
            
            if response.get('amount') != 89900:  # Amount in paise
                print(f"❌ Wrong amount in Razorpay order: {response.get('amount')}")
                return False
            
            if response.get('currency') != 'INR':
                print(f"❌ Wrong currency in Razorpay order: {response.get('currency')}")
                return False
            
            print(f"✅ Razorpay order created successfully: {response.get('id')}")
            return True
        
        return False

    def test_create_order_with_new_fields(self):
        """Test creating order with new separated address fields"""
        order_data = {
            "name": "Riya Patel",
            "phone": "9123456789",
            "email": "riya@example.com",
            "house_number": "Flat 405, Skyline Apartments",
            "area": "Koramangala, Bangalore",
            "pincode": "560034",
            "payment_method": "PREPAID",
            "amount": 899.0
        }
        
        success, response = self.run_test(
            "Create Order with New Fields",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success:
            # Validate response structure with new fields
            required_fields = ['order_id', 'name', 'phone', 'house_number', 'area', 'pincode', 'email', 'payment_method', 'amount', 'delivery_timeline', 'status']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"❌ Missing fields in response: {missing_fields}")
                return False
            
            # Validate order_id format (CG followed by 6 digits)
            order_id = response.get('order_id', '')
            if not (order_id.startswith('CG') and len(order_id) == 8 and order_id[2:].isdigit()):
                print(f"❌ Invalid order_id format: {order_id}")
                return False
            
            # Validate new address fields
            if response.get('house_number') != order_data['house_number']:
                print(f"❌ House number mismatch: {response.get('house_number')}")
                return False
            
            if response.get('area') != order_data['area']:
                print(f"❌ Area mismatch: {response.get('area')}")
                return False
            
            if response.get('pincode') != order_data['pincode']:
                print(f"❌ Pincode mismatch: {response.get('pincode')}")
                return False
            
            if response.get('email') != order_data['email']:
                print(f"❌ Email mismatch: {response.get('email')}")
                return False
            
            # Validate delivery timeline for prepaid
            if response.get('delivery_timeline') != 'Fast Delivery (2-3 Days)':
                print(f"❌ Wrong delivery timeline for prepaid: {response.get('delivery_timeline')}")
                return False
            
            # Store order_id for later tests
            self.created_order_id = order_id
            print(f"✅ Order created successfully with ID: {order_id}")
            print(f"✅ All new address fields validated correctly")
            return True
        
        return False

    def test_create_cod_order_with_new_fields(self):
        """Test creating COD order with new fields"""
        order_data = {
            "name": "Test Customer COD",
            "phone": "9876543211",
            "house_number": "House 123",
            "area": "Brigade Road, Bangalore",
            "pincode": "560025",
            "email": "test@example.com",
            "payment_method": "COD",
            "amount": 1199.0
        }
        
        success, response = self.run_test(
            "Create COD Order with New Fields",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success:
            # Validate delivery timeline for COD
            if response.get('delivery_timeline') != '5-7 Business Days':
                print(f"❌ Wrong delivery timeline for COD: {response.get('delivery_timeline')}")
                return False
            
            print(f"✅ COD Order created successfully with ID: {response.get('order_id')}")
            return True
        
        return False

    def test_get_order_by_id(self):
        """Test retrieving order by ID"""
        if not self.created_order_id:
            print("❌ No order ID available for testing")
            return False
        
        success, response = self.run_test(
            f"Get Order by ID ({self.created_order_id})",
            "GET",
            f"orders/{self.created_order_id}",
            200
        )
        
        if success:
            if response.get('order_id') == self.created_order_id:
                print(f"✅ Successfully retrieved order: {self.created_order_id}")
                # Validate that new fields are present
                new_fields = ['house_number', 'area', 'pincode', 'email']
                for field in new_fields:
                    if field not in response:
                        print(f"❌ Missing new field in retrieved order: {field}")
                        return False
                print("✅ All new fields present in retrieved order")
                return True
            else:
                print(f"❌ Retrieved wrong order ID: {response.get('order_id')}")
                return False
        
        return False

    def test_get_all_orders(self):
        """Test retrieving all orders"""
        success, response = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"✅ Retrieved {len(response)} orders")
                # Check if orders have new fields
                if len(response) > 0:
                    first_order = response[0]
                    new_fields = ['house_number', 'area', 'pincode']
                    for field in new_fields:
                        if field not in first_order:
                            print(f"❌ Missing new field in orders list: {field}")
                            return False
                    print("✅ Orders contain new address fields")
                return True
            else:
                print("❌ Response is not a list")
                return False
        
        return False

    def test_invalid_order_id(self):
        """Test retrieving non-existent order"""
        success, response = self.run_test(
            "Get Non-existent Order",
            "GET",
            "orders/CG999999",
            404
        )
        
        if success:
            print("✅ Correctly returned 404 for non-existent order")
            return True
        
        return False

    def test_pincode_state_detection(self):
        """Test the NEW pincode state detection API"""
        test_cases = [
            ("560034", "Karnataka"),
            ("110001", "Delhi"),
            ("400001", "Maharashtra"),
            ("600001", "Tamil Nadu"),
            ("000000", None),  # Invalid pincode
            ("12345", None),   # 5 digits
            ("999999", None)   # Non-existent pincode
        ]
        
        all_passed = True
        
        for pincode, expected_state in test_cases:
            success, response = self.run_test(
                f"Pincode State Detection ({pincode})",
                "GET",
                f"pincode/{pincode}/state",
                200
            )
            
            if success:
                if response.get('pincode') == pincode:
                    actual_state = response.get('state')
                    if expected_state is None:
                        if actual_state is None or actual_state == "":
                            print(f"✅ Correctly returned no state for invalid pincode {pincode}")
                        else:
                            print(f"❌ Expected no state for {pincode}, got: {actual_state}")
                            all_passed = False
                    else:
                        if actual_state == expected_state:
                            print(f"✅ Correctly detected state {expected_state} for pincode {pincode}")
                        else:
                            print(f"❌ Expected state {expected_state} for {pincode}, got: {actual_state}")
                            all_passed = False
                else:
                    print(f"❌ Pincode mismatch in response for {pincode}")
                    all_passed = False
            else:
                print(f"❌ Failed to get state for pincode {pincode}")
                all_passed = False
        
        return all_passed

    def test_create_order_with_state_field(self):
        """Test creating order with state field (NEW FEATURE)"""
        order_data = {
            "name": "Ananya Sharma",
            "phone": "9123456789",
            "email": "ananya@test.com",
            "house_number": "Flat 501, Tower B",
            "area": "Whitefield, Bangalore",
            "pincode": "560066",
            "state": "Karnataka",  # NEW: State field
            "payment_method": "PREPAID",
            "amount": 899.0
        }
        
        success, response = self.run_test(
            "Create Order with State Field",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success:
            # Validate that state field is included in response
            if response.get('state') != order_data['state']:
                print(f"❌ State field mismatch: expected {order_data['state']}, got {response.get('state')}")
                return False
            
            print(f"✅ Order created successfully with state: {response.get('state')}")
            return True
        
        return False

def main():
    print("🚀 Starting Enhanced Celesta Glow API Tests")
    print("Testing NEW FEATURES: Separated address fields, Razorpay integration, Recent orders stats")
    print("=" * 80)
    
    # Setup
    tester = CelestaGlowAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_recent_orders_stats,
        tester.test_pincode_state_detection,
        tester.test_create_razorpay_order,
        tester.test_create_order_with_new_fields,
        tester.test_create_order_with_state_field,
        tester.test_create_cod_order_with_new_fields,
        tester.test_get_order_by_id,
        tester.test_get_all_orders,
        tester.test_invalid_order_id
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print results
    print("\n" + "=" * 80)
    print(f"📊 API Tests Summary:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print("⚠️  Some API tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
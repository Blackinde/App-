#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for ProcedimientosMX SaaS Platform
Tests all authentication, services, orders, payments, documents, and admin APIs
"""

import requests
import json
import base64
import uuid
from datetime import datetime
import time

class ProcedimientosMXTester:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://procedimientos-api.preview.emergentagent.com/api"
        self.admin_token = None
        self.client_token = None
        self.test_user_id = None
        self.test_service_id = None
        self.test_order_id = None
        self.test_payment_id = None
        self.results = {
            "authentication": {},
            "services": {},
            "orders": {},
            "payments": {},
            "documents": {},
            "admin": {}
        }
        
    def log_test(self, category, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} [{category}] {test_name}: {message}")
        
        self.results[category][test_name] = {
            "success": success,
            "message": message,
            "response_data": response_data if success else None
        }
        
    def setup_test_data(self):
        """Seed initial data if needed"""
        try:
            response = requests.post(f"{self.base_url}/seed", timeout=10)
            if response.status_code == 200:
                print("✅ Database seeded successfully")
            else:
                print(f"ℹ️  Seed response: {response.status_code} - {response.text[:200]}")
        except Exception as e:
            print(f"⚠️  Seed attempt failed: {e}")
    
    # ==================== AUTHENTICATION TESTS ====================
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        try:
            payload = {
                "email": "admin@procedimientos.mx",
                "password": "Admin123!"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                user_data = data.get("user", {})
                
                if user_data.get("role") == "admin":
                    self.log_test("authentication", "admin_login", True, 
                                f"Admin login successful, role: {user_data.get('role')}")
                    return True
                else:
                    self.log_test("authentication", "admin_login", False, 
                                f"Login successful but role is not admin: {user_data.get('role')}")
            else:
                self.log_test("authentication", "admin_login", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("authentication", "admin_login", False, f"Exception: {e}")
            
        return False
    
    def test_user_registration(self):
        """Test new user registration"""
        try:
            # Generate unique email for testing
            test_email = f"test.user.{int(time.time())}@procedimientos.mx"
            
            payload = {
                "full_name": "Juan Carlos Pérez López",
                "email": test_email,
                "phone": "+52 55 9876 5432",
                "password": "TestUser123!"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.client_token = data.get("token")
                user_data = data.get("user", {})
                self.test_user_id = user_data.get("id")
                
                if user_data.get("role") == "client":
                    self.log_test("authentication", "user_registration", True, 
                                f"User registered: {user_data.get('full_name')}, ID: {self.test_user_id}")
                    return True
                else:
                    self.log_test("authentication", "user_registration", False, 
                                f"Registration successful but role is not client: {user_data.get('role')}")
            else:
                self.log_test("authentication", "user_registration", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("authentication", "user_registration", False, f"Exception: {e}")
            
        return False
    
    def test_get_current_user(self):
        """Test GET /auth/me with Bearer token"""
        if not self.admin_token:
            self.log_test("authentication", "get_current_user", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("authentication", "get_current_user", True, 
                            f"Current user: {data.get('full_name')} ({data.get('role')})")
                return True
            else:
                self.log_test("authentication", "get_current_user", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("authentication", "get_current_user", False, f"Exception: {e}")
            
        return False
    
    # ==================== SERVICES TESTS ====================
    
    def test_get_services(self):
        """Test GET /services - List all services"""
        try:
            response = requests.get(f"{self.base_url}/services", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.test_service_id = data[0].get("id")  # Store first service ID for later tests
                    self.log_test("services", "get_services", True, 
                                f"Retrieved {len(data)} services. First service: {data[0].get('name')}")
                    return True
                else:
                    self.log_test("services", "get_services", False, "No services returned")
            else:
                self.log_test("services", "get_services", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "get_services", False, f"Exception: {e}")
            
        return False
    
    def test_get_service_by_id(self):
        """Test GET /services/{id} - Get specific service"""
        if not self.test_service_id:
            self.log_test("services", "get_service_by_id", False, "No service ID available")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/services/{self.test_service_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("services", "get_service_by_id", True, 
                            f"Service details: {data.get('name')} - ${data.get('price')} MXN")
                return True
            else:
                self.log_test("services", "get_service_by_id", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "get_service_by_id", False, f"Exception: {e}")
            
        return False
    
    def test_get_categories(self):
        """Test GET /categories - Get service categories"""
        try:
            response = requests.get(f"{self.base_url}/categories", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("services", "get_categories", True, 
                                f"Retrieved categories: {', '.join(data)}")
                    return True
                else:
                    self.log_test("services", "get_categories", False, "Categories not in list format")
            else:
                self.log_test("services", "get_categories", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "get_categories", False, f"Exception: {e}")
            
        return False
    
    def test_admin_create_service(self):
        """Test POST /services - Create service (admin only)"""
        if not self.admin_token:
            self.log_test("services", "admin_create_service", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {
                "name": "Test Service API",
                "slug": "test-service-api",
                "category": "Testing",
                "short_description": "Service created via API testing",
                "full_description": "This is a test service created during automated API testing to verify the POST /services endpoint functionality.",
                "price": 199.00,
                "delivery_time": "1-2 horas",
                "required_fields": ["full_name", "email", "phone"],
                "requirements": ["Valid email", "Phone number"],
                "notes": ["This is a test service"],
                "is_active": True
            }
            
            response = requests.post(f"{self.base_url}/services", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("services", "admin_create_service", True, 
                            f"Service created: {data.get('name')} (ID: {data.get('id')})")
                return True
            else:
                self.log_test("services", "admin_create_service", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "admin_create_service", False, f"Exception: {e}")
            
        return False
    
    # ==================== ORDERS TESTS ====================
    
    def test_create_order(self):
        """Test POST /orders - Create order with submitted_data"""
        if not self.test_service_id:
            self.log_test("orders", "create_order", False, "No service ID available")
            return False
            
        try:
            headers = {}
            if self.client_token:
                headers["Authorization"] = f"Bearer {self.client_token}"
                
            payload = {
                "service_id": self.test_service_id,
                "submitted_data": {
                    "full_name": "Juan Carlos Pérez López",
                    "curp": "PELJ850315HDFRMN09",
                    "nss": "12345678901",
                    "rfc": "PELJ850315ABC",
                    "email": "juan.perez@email.com",
                    "phone": "+52 55 9876 5432",
                    "additional_notes": "Solicito el trámite con urgencia"
                }
            }
            
            response = requests.post(f"{self.base_url}/orders", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_order_id = data.get("id")
                self.log_test("orders", "create_order", True, 
                            f"Order created: {data.get('order_number')} (ID: {self.test_order_id})")
                return True
            else:
                self.log_test("orders", "create_order", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "create_order", False, f"Exception: {e}")
            
        return False
    
    def test_get_orders(self):
        """Test GET /orders - List user's orders"""
        if not self.client_token:
            self.log_test("orders", "get_orders", False, "No client token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.client_token}"}
            response = requests.get(f"{self.base_url}/orders", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("orders", "get_orders", True, 
                                f"Retrieved {len(data)} orders for user")
                    return True
                else:
                    self.log_test("orders", "get_orders", False, "Orders not in list format")
            else:
                self.log_test("orders", "get_orders", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "get_orders", False, f"Exception: {e}")
            
        return False
    
    def test_get_order_by_id(self):
        """Test GET /orders/{id} - Get specific order"""
        if not self.test_order_id:
            self.log_test("orders", "get_order_by_id", False, "No order ID available")
            return False
            
        try:
            headers = {}
            if self.client_token:
                headers["Authorization"] = f"Bearer {self.client_token}"
                
            response = requests.get(f"{self.base_url}/orders/{self.test_order_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("orders", "get_order_by_id", True, 
                            f"Order details: {data.get('order_number')} - Status: {data.get('status')}")
                return True
            else:
                self.log_test("orders", "get_order_by_id", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "get_order_by_id", False, f"Exception: {e}")
            
        return False
    
    def test_update_order_status_admin(self):
        """Test PUT /orders/{id}/status - Update order status (admin only)"""
        if not self.admin_token or not self.test_order_id:
            self.log_test("orders", "update_order_status_admin", False, 
                        "No admin token or order ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {
                "status": "under_review",
                "admin_notes": "Order received and under review by admin team"
            }
            
            response = requests.put(f"{self.base_url}/orders/{self.test_order_id}/status", 
                                  json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("orders", "update_order_status_admin", True, 
                            "Order status updated to 'under_review'")
                return True
            else:
                self.log_test("orders", "update_order_status_admin", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "update_order_status_admin", False, f"Exception: {e}")
            
        return False
    
    # ==================== PAYMENTS TESTS ====================
    
    def test_create_payment(self):
        """Test POST /payments - Create payment record"""
        if not self.test_order_id:
            self.log_test("payments", "create_payment", False, "No order ID available")
            return False
            
        try:
            headers = {}
            if self.client_token:
                headers["Authorization"] = f"Bearer {self.client_token}"
                
            # Create a simple base64 receipt image (1x1 pixel PNG)
            receipt_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            
            payload = {
                "order_id": self.test_order_id,
                "method": "bank_transfer",
                "reference": f"TRANS{int(time.time())}",
                "receipt_data": receipt_data
            }
            
            response = requests.post(f"{self.base_url}/payments", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_payment_id = data.get("id")
                self.log_test("payments", "create_payment", True, 
                            f"Payment created: {data.get('method')} - Ref: {data.get('reference')}")
                return True
            else:
                self.log_test("payments", "create_payment", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("payments", "create_payment", False, f"Exception: {e}")
            
        return False
    
    def test_get_payment(self):
        """Test GET /payments/{order_id} - Get payment for order"""
        if not self.test_order_id:
            self.log_test("payments", "get_payment", False, "No order ID available")
            return False
            
        try:
            headers = {}
            if self.client_token:
                headers["Authorization"] = f"Bearer {self.client_token}"
                
            response = requests.get(f"{self.base_url}/payments/{self.test_order_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data:  # Payment exists
                    self.log_test("payments", "get_payment", True, 
                                f"Payment found: {data.get('method')} - Status: {data.get('status')}")
                else:  # Payment is null/None
                    self.log_test("payments", "get_payment", True, "No payment found for order (expected)")
                return True
            else:
                self.log_test("payments", "get_payment", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("payments", "get_payment", False, f"Exception: {e}")
            
        return False
    
    def test_confirm_payment_admin(self):
        """Test PUT /payments/{id}/confirm - Confirm payment (admin only)"""
        if not self.admin_token or not self.test_payment_id:
            self.log_test("payments", "confirm_payment_admin", False, 
                        "No admin token or payment ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{self.base_url}/payments/{self.test_payment_id}/confirm", 
                                  headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("payments", "confirm_payment_admin", True, 
                            "Payment confirmed by admin")
                return True
            else:
                self.log_test("payments", "confirm_payment_admin", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("payments", "confirm_payment_admin", False, f"Exception: {e}")
            
        return False
    
    # ==================== DOCUMENTS TESTS ====================
    
    def test_upload_document_admin(self):
        """Test POST /documents - Upload document (admin only, base64)"""
        if not self.admin_token or not self.test_order_id:
            self.log_test("documents", "upload_document_admin", False, 
                        "No admin token or order ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a simple base64 PDF document
            pdf_content = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer<</Size 4/Root 1 0 R>>startxref 186 %%EOF"
            document_data = base64.b64encode(pdf_content.encode()).decode()
            
            payload = {
                "order_id": self.test_order_id,
                "file_name": "historial_laboral_imss.pdf",
                "file_data": document_data
            }
            
            response = requests.post(f"{self.base_url}/documents", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("documents", "upload_document_admin", True, 
                            f"Document uploaded: {data.get('file_name')} (ID: {data.get('id')})")
                return True
            else:
                self.log_test("documents", "upload_document_admin", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("documents", "upload_document_admin", False, f"Exception: {e}")
            
        return False
    
    def test_get_documents(self):
        """Test GET /documents/{order_id} - Get documents for order"""
        if not self.test_order_id:
            self.log_test("documents", "get_documents", False, "No order ID available")
            return False
            
        try:
            headers = {}
            if self.client_token:
                headers["Authorization"] = f"Bearer {self.client_token}"
                
            response = requests.get(f"{self.base_url}/documents/{self.test_order_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("documents", "get_documents", True, 
                                f"Retrieved {len(data)} documents for order")
                    return True
                else:
                    self.log_test("documents", "get_documents", False, "Documents not in list format")
            else:
                self.log_test("documents", "get_documents", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("documents", "get_documents", False, f"Exception: {e}")
            
        return False
    
    # ==================== ADMIN TESTS ====================
    
    def test_admin_dashboard(self):
        """Test GET /admin/dashboard - Dashboard stats (admin only)"""
        if not self.admin_token:
            self.log_test("admin", "admin_dashboard", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/dashboard", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("admin", "admin_dashboard", True, 
                            f"Dashboard stats: {data.get('total_orders')} orders, {data.get('total_clients')} clients, ${data.get('total_revenue'):.2f} MXN revenue")
                return True
            else:
                self.log_test("admin", "admin_dashboard", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_dashboard", False, f"Exception: {e}")
            
        return False
    
    def test_admin_get_clients(self):
        """Test GET /admin/clients - List all clients (admin only)"""
        if not self.admin_token:
            self.log_test("admin", "admin_get_clients", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/clients", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("admin", "admin_get_clients", True, 
                                f"Retrieved {len(data)} clients")
                    return True
                else:
                    self.log_test("admin", "admin_get_clients", False, "Clients not in list format")
            else:
                self.log_test("admin", "admin_get_clients", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_get_clients", False, f"Exception: {e}")
            
        return False
    
    def test_admin_get_all_orders(self):
        """Test GET /admin/orders - List all orders with filters (admin only)"""
        if not self.admin_token:
            self.log_test("admin", "admin_get_all_orders", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test without filter
            response = requests.get(f"{self.base_url}/admin/orders", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Test with status filter
                    filtered_response = requests.get(f"{self.base_url}/admin/orders?status=under_review", 
                                                   headers=headers, timeout=10)
                    if filtered_response.status_code == 200:
                        filtered_data = filtered_response.json()
                        self.log_test("admin", "admin_get_all_orders", True, 
                                    f"Retrieved {len(data)} total orders, {len(filtered_data)} under review")
                        return True
                    else:
                        self.log_test("admin", "admin_get_all_orders", False, 
                                    f"Filter test failed: {filtered_response.status_code}")
                else:
                    self.log_test("admin", "admin_get_all_orders", False, "Orders not in list format")
            else:
                self.log_test("admin", "admin_get_all_orders", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_get_all_orders", False, f"Exception: {e}")
            
        return False
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all tests in proper sequence"""
        print("=" * 80)
        print("🚀 STARTING PROCEDIMIENTOSMX BACKEND API TESTS")
        print(f"📡 Base URL: {self.base_url}")
        print("=" * 80)
        
        # Setup initial data
        print("\n🔧 SETUP")
        self.setup_test_data()
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_admin_login()
        self.test_user_registration()
        self.test_get_current_user()
        
        # Services Tests
        print("\n🛍️ SERVICES TESTS")
        self.test_get_services()
        self.test_get_service_by_id()
        self.test_get_categories()
        self.test_admin_create_service()
        
        # Orders Tests
        print("\n📋 ORDERS TESTS")
        self.test_create_order()
        self.test_get_orders()
        self.test_get_order_by_id()
        self.test_update_order_status_admin()
        
        # Payments Tests
        print("\n💳 PAYMENTS TESTS")
        self.test_create_payment()
        self.test_get_payment()
        self.test_confirm_payment_admin()
        
        # Documents Tests
        print("\n📄 DOCUMENTS TESTS")
        self.test_upload_document_admin()
        self.test_get_documents()
        
        # Admin Tests
        print("\n👨‍💼 ADMIN TESTS")
        self.test_admin_dashboard()
        self.test_admin_get_clients()
        self.test_admin_get_all_orders()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 80)
        
        total_tests = 0
        passed_tests = 0
        failed_tests = []
        
        for category, tests in self.results.items():
            category_passed = 0
            category_total = len(tests)
            total_tests += category_total
            
            print(f"\n📁 {category.upper()}")
            for test_name, result in tests.items():
                status = "✅" if result["success"] else "❌"
                print(f"  {status} {test_name}")
                if result["success"]:
                    category_passed += 1
                    passed_tests += 1
                else:
                    failed_tests.append(f"{category}.{test_name}: {result['message']}")
            
            if category_total > 0:
                print(f"  📈 Category Score: {category_passed}/{category_total} ({(category_passed/category_total)*100:.1f}%)")
        
        print(f"\n🎯 OVERALL RESULTS")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {len(failed_tests)}")
        print(f"📊 Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "📊 No tests run")
        
        if failed_tests:
            print(f"\n🚨 FAILED TESTS DETAILS:")
            for failure in failed_tests:
                print(f"   • {failure}")
        
        print("\n" + "=" * 80)
        print("🏁 TESTING COMPLETE")
        print("=" * 80)

if __name__ == "__main__":
    tester = ProcedimientosMXTester()
    tester.run_all_tests()
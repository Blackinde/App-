#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for TRAMITLY SaaS Platform
Tests all authentication, services, orders, transactions, dashboard and admin APIs
"""

import requests
import json
import uuid
from datetime import datetime
import time

class TramitlyAPITester:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://procedimientos-api.preview.emergentagent.com/api"
        self.admin_token = None
        self.demo_user_token = None
        self.new_user_token = None
        self.test_service_id = None
        self.test_order_id = None
        self.results = {
            "seed": {},
            "authentication": {},
            "services": {},
            "orders": {},
            "transactions": {},
            "dashboard": {},
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
        
    # ==================== SEED DATA TESTS ====================
    
    def test_seed_data(self):
        """Test POST /api/seed - Creates demo data"""
        try:
            response = requests.post(f"{self.base_url}/seed", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("seed", "seed_data", True, 
                            f"Seed successful: {data.get('services_count', 0)} services created")
                return True
            else:
                self.log_test("seed", "seed_data", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("seed", "seed_data", False, f"Exception: {e}")
            
        return False
    
    # ==================== AUTHENTICATION TESTS ====================
    
    def test_admin_login(self):
        """Test admin login with admin@tramitly.mx / Admin123!"""
        try:
            payload = {
                "email": "admin@tramitly.mx",
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
    
    def test_demo_user_login(self):
        """Test demo user login with demo@tramitly.mx / Demo123!"""
        try:
            payload = {
                "email": "demo@tramitly.mx",
                "password": "Demo123!"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.demo_user_token = data.get("token")
                user_data = data.get("user", {})
                
                if user_data.get("role") == "user" and user_data.get("balance") == 1500:
                    self.log_test("authentication", "demo_user_login", True, 
                                f"Demo user login successful, balance: ${user_data.get('balance')}")
                    return True
                else:
                    self.log_test("authentication", "demo_user_login", False, 
                                f"Login successful but role: {user_data.get('role')}, balance: ${user_data.get('balance')}")
            else:
                self.log_test("authentication", "demo_user_login", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("authentication", "demo_user_login", False, f"Exception: {e}")
            
        return False
    
    def test_user_registration(self):
        """Test new user registration"""
        try:
            # Generate unique email for testing
            test_email = f"test.user.{int(time.time())}@tramitly.mx"
            
            payload = {
                "name": "Carlos Mendoza Ruiz",
                "email": test_email,
                "password": "TestUser123!"
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.new_user_token = data.get("token")
                user_data = data.get("user", {})
                
                if user_data.get("role") == "user":
                    self.log_test("authentication", "user_registration", True, 
                                f"User registered: {user_data.get('name')}, balance: ${user_data.get('balance')}")
                    return True
                else:
                    self.log_test("authentication", "user_registration", False, 
                                f"Registration successful but role is not user: {user_data.get('role')}")
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
                            f"Current user: {data.get('name')} ({data.get('role')})")
                return True
            else:
                self.log_test("authentication", "get_current_user", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("authentication", "get_current_user", False, f"Exception: {e}")
            
        return False
    
    def test_update_profile(self):
        """Test PUT /auth/profile with Bearer token"""
        if not self.demo_user_token:
            self.log_test("authentication", "update_profile", False, "No demo user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            payload = {"name": "Usuario Demo Actualizado"}
            
            response = requests.put(f"{self.base_url}/auth/profile", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("authentication", "update_profile", True, 
                            f"Profile updated: {data.get('name')}")
                return True
            else:
                self.log_test("authentication", "update_profile", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("authentication", "update_profile", False, f"Exception: {e}")
            
        return False
    
    # ==================== SERVICES TESTS ====================
    
    def test_get_services(self):
        """Test GET /services - List all services"""
        try:
            response = requests.get(f"{self.base_url}/services", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= 6:  # Should have 6 services from seed
                    self.test_service_id = data[0].get("id")  # Store first service ID for later tests
                    self.log_test("services", "get_services", True, 
                                f"Retrieved {len(data)} services. First service: {data[0].get('name')}")
                    return True
                else:
                    self.log_test("services", "get_services", False, f"Expected 6+ services, got {len(data) if isinstance(data, list) else 'non-list'}")
            else:
                self.log_test("services", "get_services", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "get_services", False, f"Exception: {e}")
            
        return False
    
    def test_get_service_categories(self):
        """Test GET /services/categories"""
        try:
            response = requests.get(f"{self.base_url}/services/categories", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= 4:  # Should have 4 categories
                    categories = [cat.get('name') for cat in data]
                    self.log_test("services", "get_service_categories", True, 
                                f"Retrieved {len(data)} categories: {', '.join(categories)}")
                    return True
                else:
                    self.log_test("services", "get_service_categories", False, f"Expected 4+ categories, got {len(data) if isinstance(data, list) else 'non-list'}")
            else:
                self.log_test("services", "get_service_categories", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "get_service_categories", False, f"Exception: {e}")
            
        return False
    
    def test_get_service_by_slug(self):
        """Test GET /services/historial-laboral-imss - Get service by slug"""
        try:
            response = requests.get(f"{self.base_url}/services/historial-laboral-imss", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("services", "get_service_by_slug", True, 
                            f"Service by slug: {data.get('name')} - ${data.get('price')} MXN")
                return True
            else:
                self.log_test("services", "get_service_by_slug", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("services", "get_service_by_slug", False, f"Exception: {e}")
            
        return False
    
    # ==================== ORDERS TESTS ====================
    
    def test_create_order(self):
        """Test POST /orders - Create order with demo user (should deduct from balance)"""
        if not self.demo_user_token or not self.test_service_id:
            self.log_test("orders", "create_order", False, "No demo user token or service ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            payload = {
                "service_id": self.test_service_id,
                "input_data": {
                    "name": "Carlos Mendoza Ruiz", 
                    "curp": "MERC850315HDFNRL09", 
                    "email": "carlos.mendoza@test.com"
                }
            }
            
            response = requests.post(f"{self.base_url}/orders", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_order_id = data.get("id")
                self.log_test("orders", "create_order", True, 
                            f"Order created: {data.get('order_number')} - Amount: ${data.get('amount')} (ID: {self.test_order_id})")
                return True
            else:
                self.log_test("orders", "create_order", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "create_order", False, f"Exception: {e}")
            
        return False
    
    def test_get_user_orders(self):
        """Test GET /orders - List user's orders"""
        if not self.demo_user_token:
            self.log_test("orders", "get_user_orders", False, "No demo user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            response = requests.get(f"{self.base_url}/orders", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("orders", "get_user_orders", True, 
                                f"Retrieved {len(data)} orders for demo user")
                    return True
                else:
                    self.log_test("orders", "get_user_orders", False, "Orders not in list format")
            else:
                self.log_test("orders", "get_user_orders", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "get_user_orders", False, f"Exception: {e}")
            
        return False
    
    def test_get_order_by_id(self):
        """Test GET /orders/{order_id} - Get specific order"""
        if not self.test_order_id or not self.demo_user_token:
            self.log_test("orders", "get_order_by_id", False, "No order ID or demo user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
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
        """Test PUT /orders/{order_id}/status - Update order status (admin only)"""
        if not self.admin_token or not self.test_order_id:
            self.log_test("orders", "update_order_status_admin", False, 
                        "No admin token or order ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {
                "status": "processing",
                "admin_notes": "Order reviewed by admin team and approved for processing"
            }
            
            response = requests.put(f"{self.base_url}/orders/{self.test_order_id}/status", 
                                  json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("orders", "update_order_status_admin", True, 
                            "Order status updated to 'processing'")
                return True
            else:
                self.log_test("orders", "update_order_status_admin", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("orders", "update_order_status_admin", False, f"Exception: {e}")
            
        return False
    
    # ==================== TRANSACTIONS TESTS ====================
    
    def test_get_transactions(self):
        """Test GET /transactions - Get user's transaction history"""
        if not self.demo_user_token:
            self.log_test("transactions", "get_transactions", False, "No demo user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            response = requests.get(f"{self.base_url}/transactions", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    total_amount = sum(t.get('amount', 0) for t in data)
                    self.log_test("transactions", "get_transactions", True, 
                                f"Retrieved {len(data)} transactions, total amount: ${total_amount}")
                    return True
                else:
                    self.log_test("transactions", "get_transactions", False, "Transactions not in list format")
            else:
                self.log_test("transactions", "get_transactions", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("transactions", "get_transactions", False, f"Exception: {e}")
            
        return False
    
    def test_create_deposit(self):
        """Test POST /transactions/deposit - Recharge balance"""
        if not self.demo_user_token:
            self.log_test("transactions", "create_deposit", False, "No demo user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            payload = {
                "type": "deposit",
                "amount": 500.00
            }
            
            response = requests.post(f"{self.base_url}/transactions/deposit", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("transactions", "create_deposit", True, 
                            f"Deposit successful: ${payload['amount']} - New balance: ${data.get('new_balance')}")
                return True
            else:
                self.log_test("transactions", "create_deposit", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("transactions", "create_deposit", False, f"Exception: {e}")
            
        return False
    
    # ==================== DASHBOARD TESTS ====================
    
    def test_user_dashboard_stats(self):
        """Test GET /dashboard/stats - Get user dashboard stats"""
        if not self.demo_user_token:
            self.log_test("dashboard", "user_dashboard_stats", False, "No demo user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.demo_user_token}"}
            response = requests.get(f"{self.base_url}/dashboard/stats", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("dashboard", "user_dashboard_stats", True, 
                            f"Dashboard stats - Balance: ${data.get('balance')}, Total orders: {data.get('total_orders')}, Recent activity items: {len(data.get('recent_activity', []))}")
                return True
            else:
                self.log_test("dashboard", "user_dashboard_stats", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("dashboard", "user_dashboard_stats", False, f"Exception: {e}")
            
        return False
    
    # ==================== ADMIN TESTS ====================
    
    def test_admin_dashboard_stats(self):
        """Test GET /admin/dashboard - Get admin dashboard stats"""
        if not self.admin_token:
            self.log_test("admin", "admin_dashboard_stats", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/dashboard", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("admin", "admin_dashboard_stats", True, 
                            f"Admin dashboard - Users: {data.get('total_users')}, Orders: {data.get('total_orders')}, Revenue: ${data.get('total_revenue'):.2f}")
                return True
            else:
                self.log_test("admin", "admin_dashboard_stats", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_dashboard_stats", False, f"Exception: {e}")
            
        return False
    
    def test_admin_get_users(self):
        """Test GET /admin/users - List all users"""
        if not self.admin_token:
            self.log_test("admin", "admin_get_users", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/users", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    user_roles = {}
                    for user in data:
                        role = user.get('role', 'unknown')
                        user_roles[role] = user_roles.get(role, 0) + 1
                    
                    self.log_test("admin", "admin_get_users", True, 
                                f"Retrieved {len(data)} users - Roles: {user_roles}")
                    return True
                else:
                    self.log_test("admin", "admin_get_users", False, "Users not in list format")
            else:
                self.log_test("admin", "admin_get_users", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_get_users", False, f"Exception: {e}")
            
        return False
    
    def test_admin_get_all_orders(self):
        """Test GET /admin/orders - List all orders with user info"""
        if not self.admin_token:
            self.log_test("admin", "admin_get_all_orders", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/orders", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    status_counts = {}
                    for order in data:
                        status = order.get('status', 'unknown')
                        status_counts[status] = status_counts.get(status, 0) + 1
                    
                    self.log_test("admin", "admin_get_all_orders", True, 
                                f"Retrieved {len(data)} orders - Status counts: {status_counts}")
                    return True
                else:
                    self.log_test("admin", "admin_get_all_orders", False, "Orders not in list format")
            else:
                self.log_test("admin", "admin_get_all_orders", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_get_all_orders", False, f"Exception: {e}")
            
        return False
    
    def test_admin_api_logs(self):
        """Test GET /admin/api-logs - Get API activity logs"""
        if not self.admin_token:
            self.log_test("admin", "admin_api_logs", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/api-logs", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("admin", "admin_api_logs", True, 
                                f"Retrieved {len(data)} API log entries")
                    return True
                else:
                    self.log_test("admin", "admin_api_logs", False, "API logs not in list format")
            else:
                self.log_test("admin", "admin_api_logs", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_api_logs", False, f"Exception: {e}")
            
        return False
    
    def test_admin_get_settings(self):
        """Test GET /admin/settings - Get platform settings"""
        if not self.admin_token:
            self.log_test("admin", "admin_get_settings", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/settings", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    settings_keys = [setting.get('key') for setting in data]
                    self.log_test("admin", "admin_get_settings", True, 
                                f"Retrieved {len(data)} settings: {', '.join(settings_keys)}")
                    return True
                else:
                    self.log_test("admin", "admin_get_settings", False, "Settings not in list format")
            else:
                self.log_test("admin", "admin_get_settings", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("admin", "admin_get_settings", False, f"Exception: {e}")
            
        return False
    
    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all tests in proper sequence"""
        print("=" * 80)
        print("🚀 STARTING TRAMITLY BACKEND API TESTS")
        print(f"📡 Base URL: {self.base_url}")
        print("=" * 80)
        
        # Seed Data Tests
        print("\n🌱 SEED DATA TESTS")
        self.test_seed_data()
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_admin_login()
        self.test_demo_user_login()
        self.test_user_registration()
        self.test_get_current_user()
        self.test_update_profile()
        
        # Services Tests
        print("\n🛍️ SERVICES TESTS")
        self.test_get_services()
        self.test_get_service_categories()
        self.test_get_service_by_slug()
        
        # Orders Tests (requires balance from demo user)
        print("\n📋 ORDERS TESTS")
        self.test_create_order()
        self.test_get_user_orders()
        self.test_get_order_by_id()
        self.test_update_order_status_admin()
        
        # Transactions Tests
        print("\n💳 TRANSACTIONS TESTS")
        self.test_get_transactions()
        self.test_create_deposit()
        
        # Dashboard Tests
        print("\n📊 DASHBOARD TESTS")
        self.test_user_dashboard_stats()
        
        # Admin Tests
        print("\n👨‍💼 ADMIN TESTS")
        self.test_admin_dashboard_stats()
        self.test_admin_get_users()
        self.test_admin_get_all_orders()
        self.test_admin_api_logs()
        self.test_admin_get_settings()
        
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
            
            if category_total > 0:
                print(f"\n📁 {category.upper()}")
                for test_name, result in tests.items():
                    status = "✅" if result["success"] else "❌"
                    print(f"  {status} {test_name}: {result['message']}")
                    if result["success"]:
                        category_passed += 1
                        passed_tests += 1
                    else:
                        failed_tests.append(f"{category}.{test_name}: {result['message']}")
                
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
    tester = TramitlyAPITester()
    tester.run_all_tests()
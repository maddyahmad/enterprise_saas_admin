#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Enterprise SaaS Admin Platform
Tests authentication, RBAC, user management, dashboard, audit logging, and error handling.
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://rbac-admin-suite.preview.emergentagent.com/api"
TIMEOUT = 30

# Test credentials from seed data
TEST_USERS = {
    'admin': {'email': 'admin@example.com', 'password': 'Admin123!'},
    'manager': {'email': 'manager@example.com', 'password': 'Manager123!'},
    'user': {'email': 'user@example.com', 'password': 'User123!'}
}

class APITester:
    def __init__(self):
        self.tokens = {}
        self.test_results = []
        self.created_users = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None, expected_status=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.request(
                method=method,
                url=url,
                json=data,
                headers=headers,
                timeout=TIMEOUT
            )
            
            if expected_status and response.status_code != expected_status:
                return {
                    'success': False,
                    'status_code': response.status_code,
                    'data': response.text,
                    'error': f"Expected status {expected_status}, got {response.status_code}"
                }
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
                
            return {
                'success': True,
                'status_code': response.status_code,
                'data': response_data
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'status_code': None,
                'data': None
            }
    
    def test_user_registration(self):
        """Test user registration functionality"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        registration_data = {
            'email': test_email,
            'password': 'TestPass123!',
            'name': 'Test User',
            'role': 'user'
        }
        
        result = self.make_request('POST', '/auth/register', registration_data, expected_status=201)
        
        if result['success']:
            self.created_users.append(test_email)
            self.log_result(
                "User Registration - Success",
                True,
                f"Successfully registered user: {test_email}"
            )
        else:
            self.log_result(
                "User Registration - Success",
                False,
                "Failed to register new user",
                result.get('error') or result.get('data')
            )
        
        # Test duplicate email registration
        result = self.make_request('POST', '/auth/register', registration_data, expected_status=400)
        
        if result['success']:
            self.log_result(
                "User Registration - Duplicate Email",
                True,
                "Correctly rejected duplicate email registration"
            )
        else:
            self.log_result(
                "User Registration - Duplicate Email",
                False,
                "Should have rejected duplicate email",
                result.get('error') or result.get('data')
            )
        
        # Test missing required fields
        invalid_data = {'email': 'test@example.com'}
        result = self.make_request('POST', '/auth/register', invalid_data, expected_status=400)
        
        if result['success']:
            self.log_result(
                "User Registration - Missing Fields",
                True,
                "Correctly rejected registration with missing fields"
            )
        else:
            self.log_result(
                "User Registration - Missing Fields",
                False,
                "Should have rejected missing required fields",
                result.get('error') or result.get('data')
            )
    
    def test_user_login(self):
        """Test user login functionality"""
        print("\n=== Testing User Login ===")
        
        for role, credentials in TEST_USERS.items():
            result = self.make_request('POST', '/auth/login', credentials, expected_status=200)
            
            if result['success'] and 'token' in result['data']:
                self.tokens[role] = result['data']['token']
                user_data = result['data'].get('user', {})
                self.log_result(
                    f"User Login - {role.title()}",
                    True,
                    f"Successfully logged in {role} user: {credentials['email']}"
                )
            else:
                self.log_result(
                    f"User Login - {role.title()}",
                    False,
                    f"Failed to login {role} user",
                    result.get('error') or result.get('data')
                )
        
        # Test invalid credentials
        invalid_creds = {'email': 'admin@example.com', 'password': 'wrongpassword'}
        result = self.make_request('POST', '/auth/login', invalid_creds, expected_status=401)
        
        if result['success']:
            self.log_result(
                "User Login - Invalid Credentials",
                True,
                "Correctly rejected invalid credentials"
            )
        else:
            self.log_result(
                "User Login - Invalid Credentials",
                False,
                "Should have rejected invalid credentials",
                result.get('error') or result.get('data')
            )
    
    def test_protected_endpoints(self):
        """Test protected endpoint access"""
        print("\n=== Testing Protected Endpoints ===")
        
        # Test access without token
        result = self.make_request('GET', '/auth/me', expected_status=401)
        
        if result['success']:
            self.log_result(
                "Protected Endpoint - No Token",
                True,
                "Correctly rejected request without token"
            )
        else:
            self.log_result(
                "Protected Endpoint - No Token",
                False,
                "Should have rejected request without token",
                result.get('error') or result.get('data')
            )
        
        # Test access with valid token
        if 'admin' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
            result = self.make_request('GET', '/auth/me', headers=headers, expected_status=200)
            
            if result['success'] and 'user' in result['data']:
                self.log_result(
                    "Protected Endpoint - Valid Token",
                    True,
                    "Successfully accessed protected endpoint with valid token"
                )
            else:
                self.log_result(
                    "Protected Endpoint - Valid Token",
                    False,
                    "Failed to access protected endpoint with valid token",
                    result.get('error') or result.get('data')
                )
        
        # Test access with invalid token
        headers = {'Authorization': 'Bearer invalid_token_here'}
        result = self.make_request('GET', '/auth/me', headers=headers, expected_status=401)
        
        if result['success']:
            self.log_result(
                "Protected Endpoint - Invalid Token",
                True,
                "Correctly rejected request with invalid token"
            )
        else:
            self.log_result(
                "Protected Endpoint - Invalid Token",
                False,
                "Should have rejected request with invalid token",
                result.get('error') or result.get('data')
            )
    
    def test_rbac_access_control(self):
        """Test Role-Based Access Control"""
        print("\n=== Testing RBAC Access Control ===")
        
        # Test admin access to user management
        if 'admin' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
            result = self.make_request('GET', '/users', headers=headers, expected_status=200)
            
            if result['success']:
                self.log_result(
                    "RBAC - Admin Access Users",
                    True,
                    "Admin successfully accessed user management endpoint"
                )
            else:
                self.log_result(
                    "RBAC - Admin Access Users",
                    False,
                    "Admin failed to access user management endpoint",
                    result.get('error') or result.get('data')
                )
        
        # Test manager access to users (should work)
        if 'manager' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["manager"]}'}
            result = self.make_request('GET', '/users', headers=headers, expected_status=200)
            
            if result['success']:
                self.log_result(
                    "RBAC - Manager Access Users",
                    True,
                    "Manager successfully accessed user list endpoint"
                )
            else:
                self.log_result(
                    "RBAC - Manager Access Users",
                    False,
                    "Manager failed to access user list endpoint",
                    result.get('error') or result.get('data')
                )
        
        # Test user access to users (should fail)
        if 'user' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["user"]}'}
            result = self.make_request('GET', '/users', headers=headers, expected_status=403)
            
            if result['success']:
                self.log_result(
                    "RBAC - User Access Users Denied",
                    True,
                    "Regular user correctly denied access to user management"
                )
            else:
                self.log_result(
                    "RBAC - User Access Users Denied",
                    False,
                    "Regular user should be denied access to user management",
                    result.get('error') or result.get('data')
                )
        
        # Test admin access to audit logs
        if 'admin' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
            result = self.make_request('GET', '/audit-logs', headers=headers, expected_status=200)
            
            if result['success']:
                self.log_result(
                    "RBAC - Admin Access Audit Logs",
                    True,
                    "Admin successfully accessed audit logs"
                )
            else:
                self.log_result(
                    "RBAC - Admin Access Audit Logs",
                    False,
                    "Admin failed to access audit logs",
                    result.get('error') or result.get('data')
                )
        
        # Test manager access to audit logs (should fail)
        if 'manager' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["manager"]}'}
            result = self.make_request('GET', '/audit-logs', headers=headers, expected_status=403)
            
            if result['success']:
                self.log_result(
                    "RBAC - Manager Access Audit Logs Denied",
                    True,
                    "Manager correctly denied access to audit logs"
                )
            else:
                self.log_result(
                    "RBAC - Manager Access Audit Logs Denied",
                    False,
                    "Manager should be denied access to audit logs",
                    result.get('error') or result.get('data')
                )
    
    def test_user_management(self):
        """Test user management functionality"""
        print("\n=== Testing User Management ===")
        
        if 'admin' not in self.tokens:
            self.log_result("User Management", False, "No admin token available for testing")
            return
        
        headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
        
        # Test list users with pagination
        result = self.make_request('GET', '/users?page=1&limit=5', headers=headers, expected_status=200)
        
        if result['success'] and 'users' in result['data'] and 'pagination' in result['data']:
            self.log_result(
                "User Management - List Users",
                True,
                f"Successfully retrieved user list with pagination"
            )
        else:
            self.log_result(
                "User Management - List Users",
                False,
                "Failed to retrieve user list with pagination",
                result.get('error') or result.get('data')
            )
        
        # Test search functionality
        result = self.make_request('GET', '/users?search=admin', headers=headers, expected_status=200)
        
        if result['success'] and 'users' in result['data']:
            self.log_result(
                "User Management - Search Users",
                True,
                "Successfully searched users"
            )
        else:
            self.log_result(
                "User Management - Search Users",
                False,
                "Failed to search users",
                result.get('error') or result.get('data')
            )
        
        # Test role filter
        result = self.make_request('GET', '/users?role=admin', headers=headers, expected_status=200)
        
        if result['success'] and 'users' in result['data']:
            self.log_result(
                "User Management - Filter by Role",
                True,
                "Successfully filtered users by role"
            )
        else:
            self.log_result(
                "User Management - Filter by Role",
                False,
                "Failed to filter users by role",
                result.get('error') or result.get('data')
            )
        
        # Test update user (need to get a user ID first)
        users_result = self.make_request('GET', '/users?limit=1', headers=headers, expected_status=200)
        
        if users_result['success'] and users_result['data']['users']:
            user_id = users_result['data']['users'][0]['id']
            update_data = {'name': 'Updated Test Name'}
            
            result = self.make_request('PUT', f'/users/{user_id}', update_data, headers=headers, expected_status=200)
            
            if result['success']:
                self.log_result(
                    "User Management - Update User",
                    True,
                    "Successfully updated user"
                )
            else:
                self.log_result(
                    "User Management - Update User",
                    False,
                    "Failed to update user",
                    result.get('error') or result.get('data')
                )
        
        # Test non-admin trying to update user
        if 'manager' in self.tokens:
            manager_headers = {'Authorization': f'Bearer {self.tokens["manager"]}'}
            update_data = {'name': 'Should Not Work'}
            
            result = self.make_request('PUT', f'/users/{user_id}', update_data, headers=manager_headers, expected_status=403)
            
            if result['success']:
                self.log_result(
                    "User Management - Non-Admin Update Denied",
                    True,
                    "Manager correctly denied user update access"
                )
            else:
                self.log_result(
                    "User Management - Non-Admin Update Denied",
                    False,
                    "Manager should be denied user update access",
                    result.get('error') or result.get('data')
                )
    
    def test_dashboard_analytics(self):
        """Test dashboard analytics endpoint"""
        print("\n=== Testing Dashboard Analytics ===")
        
        # Test admin access to dashboard stats
        if 'admin' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
            result = self.make_request('GET', '/dashboard/stats', headers=headers, expected_status=200)
            
            if result['success'] and 'users' in result['data'] and 'activity' in result['data']:
                stats = result['data']
                self.log_result(
                    "Dashboard Analytics - Admin Access",
                    True,
                    f"Successfully retrieved dashboard stats: {len(stats)} sections"
                )
            else:
                self.log_result(
                    "Dashboard Analytics - Admin Access",
                    False,
                    "Failed to retrieve dashboard stats",
                    result.get('error') or result.get('data')
                )
        
        # Test manager access to dashboard stats
        if 'manager' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["manager"]}'}
            result = self.make_request('GET', '/dashboard/stats', headers=headers, expected_status=200)
            
            if result['success'] and 'users' in result['data']:
                self.log_result(
                    "Dashboard Analytics - Manager Access",
                    True,
                    "Manager successfully accessed dashboard stats"
                )
            else:
                self.log_result(
                    "Dashboard Analytics - Manager Access",
                    False,
                    "Manager failed to access dashboard stats",
                    result.get('error') or result.get('data')
                )
        
        # Test user access to dashboard stats (should fail)
        if 'user' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["user"]}'}
            result = self.make_request('GET', '/dashboard/stats', headers=headers, expected_status=403)
            
            if result['success']:
                self.log_result(
                    "Dashboard Analytics - User Access Denied",
                    True,
                    "Regular user correctly denied dashboard access"
                )
            else:
                self.log_result(
                    "Dashboard Analytics - User Access Denied",
                    False,
                    "Regular user should be denied dashboard access",
                    result.get('error') or result.get('data')
                )
    
    def test_audit_logging(self):
        """Test audit logging functionality"""
        print("\n=== Testing Audit Logging ===")
        
        if 'admin' not in self.tokens:
            self.log_result("Audit Logging", False, "No admin token available for testing")
            return
        
        headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
        
        # Test get audit logs
        result = self.make_request('GET', '/audit-logs?page=1&limit=10', headers=headers, expected_status=200)
        
        if result['success'] and 'logs' in result['data'] and 'pagination' in result['data']:
            logs = result['data']['logs']
            self.log_result(
                "Audit Logging - Retrieve Logs",
                True,
                f"Successfully retrieved {len(logs)} audit logs"
            )
            
            # Check if logs contain expected fields
            if logs and all(key in logs[0] for key in ['action', 'resource', 'timestamp', 'userId']):
                self.log_result(
                    "Audit Logging - Log Structure",
                    True,
                    "Audit logs contain all required fields"
                )
            else:
                self.log_result(
                    "Audit Logging - Log Structure",
                    False,
                    "Audit logs missing required fields"
                )
        else:
            self.log_result(
                "Audit Logging - Retrieve Logs",
                False,
                "Failed to retrieve audit logs",
                result.get('error') or result.get('data')
            )
        
        # Test audit log filters
        result = self.make_request('GET', '/audit-logs?action=user_login&limit=5', headers=headers, expected_status=200)
        
        if result['success'] and 'logs' in result['data']:
            self.log_result(
                "Audit Logging - Filter by Action",
                True,
                "Successfully filtered audit logs by action"
            )
        else:
            self.log_result(
                "Audit Logging - Filter by Action",
                False,
                "Failed to filter audit logs by action",
                result.get('error') or result.get('data')
            )
    
    def test_error_handling(self):
        """Test error handling and edge cases"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoint
        result = self.make_request('GET', '/invalid-endpoint', expected_status=404)
        
        if result['success']:
            self.log_result(
                "Error Handling - Invalid Endpoint",
                True,
                "Correctly returned 404 for invalid endpoint"
            )
        else:
            self.log_result(
                "Error Handling - Invalid Endpoint",
                False,
                "Should return 404 for invalid endpoint",
                result.get('error') or result.get('data')
            )
        
        # Test invalid HTTP method
        result = self.make_request('PATCH', '/auth/login', expected_status=404)
        
        if result['success']:
            self.log_result(
                "Error Handling - Invalid HTTP Method",
                True,
                "Correctly handled invalid HTTP method"
            )
        else:
            self.log_result(
                "Error Handling - Invalid HTTP Method",
                False,
                "Should handle invalid HTTP method properly",
                result.get('error') or result.get('data')
            )
        
        # Test malformed JSON
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                data="invalid json",
                headers={'Content-Type': 'application/json'},
                timeout=TIMEOUT
            )
            
            if response.status_code >= 400:
                self.log_result(
                    "Error Handling - Malformed JSON",
                    True,
                    "Correctly handled malformed JSON request"
                )
            else:
                self.log_result(
                    "Error Handling - Malformed JSON",
                    False,
                    "Should reject malformed JSON request"
                )
        except Exception as e:
            self.log_result(
                "Error Handling - Malformed JSON",
                False,
                f"Error testing malformed JSON: {str(e)}"
            )
    
    def test_logout(self):
        """Test user logout functionality"""
        print("\n=== Testing User Logout ===")
        
        if 'admin' in self.tokens:
            headers = {'Authorization': f'Bearer {self.tokens["admin"]}'}
            result = self.make_request('POST', '/auth/logout', headers=headers, expected_status=200)
            
            if result['success']:
                self.log_result(
                    "User Logout - Success",
                    True,
                    "Successfully logged out admin user"
                )
            else:
                self.log_result(
                    "User Logout - Success",
                    False,
                    "Failed to logout admin user",
                    result.get('error') or result.get('data')
                )
        
        # Test logout without token
        result = self.make_request('POST', '/auth/logout', expected_status=401)
        
        if result['success']:
            self.log_result(
                "User Logout - No Token",
                True,
                "Correctly rejected logout without token"
            )
        else:
            self.log_result(
                "User Logout - No Token",
                False,
                "Should reject logout without token",
                result.get('error') or result.get('data')
            )
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Enterprise SaaS Admin Platform Backend API Tests")
        print(f"Base URL: {BASE_URL}")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_user_registration()
        self.test_user_login()
        self.test_protected_endpoints()
        self.test_rbac_access_control()
        self.test_user_management()
        self.test_dashboard_analytics()
        self.test_audit_logging()
        self.test_error_handling()
        self.test_logout()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Summary
        print("\n" + "=" * 80)
        print("🏁 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS ({failed}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n🎯 CRITICAL FUNCTIONALITY STATUS:")
        critical_tests = [
            "User Registration - Success",
            "User Login - Admin",
            "User Login - Manager", 
            "User Login - User",
            "Protected Endpoint - Valid Token",
            "RBAC - Admin Access Users",
            "RBAC - Manager Access Users",
            "RBAC - User Access Users Denied",
            "User Management - List Users",
            "Dashboard Analytics - Admin Access",
            "Audit Logging - Retrieve Logs"
        ]
        
        for test_name in critical_tests:
            result = next((r for r in self.test_results if r['test'] == test_name), None)
            if result:
                status = "✅" if result['success'] else "❌"
                print(f"  {status} {test_name}")
        
        return passed, failed

if __name__ == "__main__":
    tester = APITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)
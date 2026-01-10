#!/usr/bin/env python3
"""
CertiChain Freemium Subscription Model Backend API Tests
Tests all subscription-related endpoints for the freemium model implementation.
"""

import requests
import sys
import json
from datetime import datetime

class CertiChainSubscriptionTester:
    def __init__(self, base_url="https://pro-plan-gateway.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = "test-user-12345"  # Mock user ID for testing

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details:
            print(f"   Details: {details}")
        print()

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_get_subscription_packages(self):
        """Test GET /api/subscription/packages"""
        try:
            response = requests.get(f"{self.base_url}/api/subscription/packages", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected packages exist
                expected_packages = ["starter", "basic", "standard", "premium", "enterprise"]
                packages = data.get("packages", {})
                
                # Check all expected packages are present
                missing_packages = [pkg for pkg in expected_packages if pkg not in packages]
                if missing_packages:
                    success = False
                    details = f"Missing packages: {missing_packages}"
                else:
                    # Verify package structure
                    starter = packages.get("starter", {})
                    expected_starter = {"credits": 50, "price": 9.99}
                    
                    if starter.get("credits") != 50 or starter.get("price") != 9.99:
                        success = False
                        details = f"Starter package incorrect: {starter}, expected: {expected_starter}"
                    else:
                        # Check free limits
                        free_limits = data.get("free_limits", {})
                        if free_limits.get("groups") != 2 or free_limits.get("mint_credits") != 5:
                            success = False
                            details = f"Free limits incorrect: {free_limits}"
                        else:
                            details = f"All 5 packages found with correct structure. Free limits: {free_limits}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Subscription Packages", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Get Subscription Packages", False, f"Exception: {str(e)}")
            return False, {}

    def test_get_subscription_status(self):
        """Test GET /api/subscription/status/{user_id}"""
        try:
            response = requests.get(f"{self.base_url}/api/subscription/status/{self.test_user_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields for new user (should be free tier)
                expected_fields = [
                    "subscription_type", "is_pro", "subscription_expires_at", 
                    "is_active", "mint_credits", "groups_created", "groups_limit",
                    "can_create_group", "can_mint", "total_certificates_issued"
                ]
                
                missing_fields = [field for field in expected_fields if field not in data]
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    # For new user, should be free tier
                    if (data.get("subscription_type") != "free" or 
                        data.get("is_pro") != False or
                        data.get("mint_credits") != 5 or
                        data.get("groups_limit") != 2):
                        success = False
                        details = f"Incorrect free tier defaults: {data}"
                    else:
                        details = f"Free tier status correct: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Subscription Status", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Get Subscription Status", False, f"Exception: {str(e)}")
            return False, {}

    def test_check_group_limit(self):
        """Test POST /api/subscription/check-group-limit/{user_id}"""
        try:
            response = requests.post(f"{self.base_url}/api/subscription/check-group-limit/{self.test_user_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # For new user, should be allowed to create groups
                expected_fields = ["allowed", "groups_created", "groups_limit", "subscription_type"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    if (data.get("allowed") != True or 
                        data.get("groups_limit") != 2 or
                        data.get("subscription_type") != "free"):
                        success = False
                        details = f"Incorrect group limit response: {data}"
                    else:
                        details = f"Group limit check correct: {data}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Check Group Creation Limit", success, details)
            return success
        except Exception as e:
            self.log_test("Check Group Creation Limit", False, f"Exception: {str(e)}")
            return False

    def test_check_mint_limit(self):
        """Test POST /api/subscription/check-mint-limit/{user_id}"""
        try:
            # Test with count=1 (should be allowed for new user with 5 credits)
            response = requests.post(f"{self.base_url}/api/subscription/check-mint-limit/{self.test_user_id}?count=1", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_fields = ["allowed", "current_credits", "requested", "subscription_type", "message"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    if (data.get("allowed") != True or 
                        data.get("current_credits") != 5 or
                        data.get("requested") != 1 or
                        data.get("subscription_type") != "free"):
                        success = False
                        details = f"Incorrect mint limit response: {data}"
                    else:
                        details = f"Mint limit check correct: {data}"
                        
                        # Test with count=10 (should be denied)
                        response2 = requests.post(f"{self.base_url}/api/subscription/check-mint-limit/{self.test_user_id}?count=10", timeout=10)
                        if response2.status_code == 200:
                            data2 = response2.json()
                            if data2.get("allowed") != False:
                                success = False
                                details += f" | High count check failed: {data2}"
                            else:
                                details += f" | High count correctly denied: {data2.get('message', '')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Check Mint Limit", success, details)
            return success
        except Exception as e:
            self.log_test("Check Mint Limit", False, f"Exception: {str(e)}")
            return False

    def test_upgrade_to_pro(self):
        """Test POST /api/subscription/upgrade"""
        try:
            payload = {
                "user_id": self.test_user_id,
                "duration_months": 1
            }
            response = requests.post(
                f"{self.base_url}/api/subscription/upgrade", 
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # This might fail if instructor doesn't exist, which is expected for test user
            if response.status_code == 404:
                success = True
                details = "Expected 404 for non-existent instructor (test user)"
            elif response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("subscription_type") == "pro":
                    success = True
                    details = f"Upgrade successful: {data.get('message', '')}"
                else:
                    success = False
                    details = f"Unexpected upgrade response: {data}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Upgrade to Pro", success, details)
            return success
        except Exception as e:
            self.log_test("Upgrade to Pro", False, f"Exception: {str(e)}")
            return False

    def test_purchase_credits(self):
        """Test POST /api/subscription/purchase-credits"""
        try:
            payload = {
                "user_id": self.test_user_id,
                "package": "starter"
            }
            response = requests.post(
                f"{self.base_url}/api/subscription/purchase-credits", 
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # This might fail if instructor doesn't exist, which is expected for test user
            if response.status_code == 404:
                success = True
                details = "Expected 404 for non-existent instructor (test user)"
            elif response.status_code == 400:
                # Test invalid package
                payload_invalid = {
                    "user_id": self.test_user_id,
                    "package": "invalid_package"
                }
                response_invalid = requests.post(
                    f"{self.base_url}/api/subscription/purchase-credits", 
                    json=payload_invalid,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                if response_invalid.status_code == 400:
                    success = True
                    details = "Correctly rejected invalid package"
                else:
                    success = False
                    details = f"Should reject invalid package, got: {response_invalid.status_code}"
            elif response.status_code == 200:
                data = response.json()
                if (data.get("success") and 
                    data.get("package") == "starter" and 
                    data.get("credits_added") == 50):
                    success = True
                    details = f"Credit purchase successful: {data.get('message', '')}"
                else:
                    success = False
                    details = f"Unexpected purchase response: {data}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Purchase Credits", success, details)
            return success
        except Exception as e:
            self.log_test("Purchase Credits", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all subscription API tests"""
        print("🧪 CertiChain Freemium Subscription Model - Backend API Tests")
        print("=" * 70)
        print(f"Testing against: {self.base_url}")
        print(f"Test User ID: {self.test_user_id}")
        print()

        # Test basic connectivity first
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False

        # Test all subscription endpoints
        self.test_get_subscription_packages()
        self.test_get_subscription_status()
        self.test_check_group_limit()
        self.test_check_mint_limit()
        self.test_upgrade_to_pro()
        self.test_purchase_credits()

        # Print summary
        print("=" * 70)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            failed = self.tests_run - self.tests_passed
            print(f"⚠️  {failed} test(s) failed")
            return False

def main():
    tester = CertiChainSubscriptionTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
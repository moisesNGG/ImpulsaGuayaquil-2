#!/usr/bin/env python3
import requests
import json
import time
import sys
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

# Get the backend URL from the frontend/.env file
BACKEND_URL = "https://c83cb33b-a761-4aab-88c1-6b19d5a1ae02.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test_result(test_name: str, passed: bool, response: Optional[requests.Response] = None, error: Optional[str] = None):
    """Log test results for reporting"""
    result = {
        "test_name": test_name,
        "passed": passed,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    if response:
        try:
            result["status_code"] = response.status_code
            result["response"] = response.json() if response.headers.get('content-type') == 'application/json' else str(response.text)[:200]
        except:
            result["response"] = "Could not parse response"
    
    if error:
        result["error"] = error
    
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {test_name}")
    else:
        test_results["failed"] += 1
        print(f"❌ FAIL: {test_name}")
        if error:
            print(f"   Error: {error}")
        if response:
            print(f"   Status: {response.status_code}")
            try:
                print(f"   Response: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"   Response: {response.text[:200]}")
    
    test_results["tests"].append(result)

def test_initialize_data():
    """Test the initialize-data endpoint"""
    try:
        response = requests.post(f"{BACKEND_URL}/initialize-data")
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Sample data initialized successfully"
            log_test_result("Initialize Data", success, response)
            return success
        else:
            log_test_result("Initialize Data", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Initialize Data", False, error=str(e))
        return False

def test_admin_login() -> Optional[Dict[str, Any]]:
    """Test admin login with default credentials"""
    try:
        login_data = {
            "cedula": "0000000000",
            "password": "admin"
        }
        
        response = requests.post(f"{BACKEND_URL}/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "access_token" in data and
                "token_type" in data and
                "user" in data and
                data["token_type"] == "bearer" and
                isinstance(data["access_token"], str) and
                len(data["access_token"]) > 0
            )
            log_test_result("Admin Login", success, response)
            return data if success else None
        else:
            log_test_result("Admin Login", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Admin Login", False, error=str(e))
        return None

def test_register_user() -> Optional[Dict[str, Any]]:
    """Test user registration with complete fields"""
    try:
        # Generate unique values to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "nombre": f"Test",
            "apellido": f"User {unique_id}",
            "cedula": f"1{unique_id[:9]}",  # 10-digit cedula
            "email": f"test.user.{unique_id}@example.com",
            "nombre_emprendimiento": f"Test Emprendimiento {unique_id}",
            "password": "testpassword123"
        }
        
        response = requests.post(f"{BACKEND_URL}/register", json=user_data)
        
        if response.status_code == 200:
            user = response.json()
            success = (
                user.get("nombre") == user_data["nombre"] and
                user.get("apellido") == user_data["apellido"] and
                user.get("cedula") == user_data["cedula"] and
                user.get("email") == user_data["email"] and
                user.get("nombre_emprendimiento") == user_data["nombre_emprendimiento"] and
                user.get("points") == 0 and
                user.get("rank") == "emprendedor_novato" and
                user.get("role") == "emprendedor" and
                isinstance(user.get("id"), str) and
                len(user.get("id")) > 0
            )
            log_test_result("Register User", success, response)
            return user_data if success else None
        else:
            log_test_result("Register User", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Register User", False, error=str(e))
        return None

def test_login_user(cedula: str, password: str) -> Optional[Dict[str, Any]]:
    """Test user login with cedula/password"""
    try:
        login_data = {
            "cedula": cedula,
            "password": password
        }
        
        response = requests.post(f"{BACKEND_URL}/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "access_token" in data and
                "token_type" in data and
                "user" in data and
                data["token_type"] == "bearer" and
                isinstance(data["access_token"], str) and
                len(data["access_token"]) > 0
            )
            log_test_result("Login User", success, response)
            return data if success else None
        else:
            log_test_result("Login User", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Login User", False, error=str(e))
        return None

# 1. Achievement Eligibility System Test
def test_achievement_eligibility(token: str) -> bool:
    """Test the achievement eligibility endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/achievements/eligible", headers=headers)
        
        if response.status_code == 200:
            achievements = response.json()
            success = isinstance(achievements, list)
            
            # Check if each achievement has the required fields
            if success and achievements:
                for achievement in achievements:
                    if not all(key in achievement for key in ["id", "title", "description", "icon", "condition"]):
                        success = False
                        break
            
            log_test_result("Achievement Eligibility", success, response)
            return success
        else:
            log_test_result("Achievement Eligibility", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Achievement Eligibility", False, error=str(e))
        return False

# 2. Enhanced Reward System Test
def test_rewards_with_external_url() -> bool:
    """Test that rewards have external_url fields"""
    try:
        response = requests.get(f"{BACKEND_URL}/rewards")
        
        if response.status_code == 200:
            rewards = response.json()
            success = isinstance(rewards, list) and len(rewards) > 0
            
            # Check if rewards have external_url fields
            if success:
                for reward in rewards:
                    if "external_url" not in reward:
                        success = False
                        break
            
            log_test_result("Rewards with External URL", success, response)
            return success
        else:
            log_test_result("Rewards with External URL", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Rewards with External URL", False, error=str(e))
        return False

def test_admin_update_reward(admin_token: str, reward_id: str) -> bool:
    """Test admin updating a reward with external_url"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        update_data = {
            "title": f"Updated Reward {unique_id}",
            "description": "This reward was updated by the test script",
            "points_cost": 75,
            "external_url": f"https://example.com/updated-rewards/{unique_id}"
        }
        
        response = requests.put(f"{BACKEND_URL}/rewards/{reward_id}", headers=headers, json=update_data)
        
        if response.status_code == 200:
            reward = response.json()
            success = (
                reward.get("title") == update_data["title"] and
                reward.get("description") == update_data["description"] and
                reward.get("points_cost") == update_data["points_cost"] and
                reward.get("external_url") == update_data["external_url"] and
                reward.get("id") == reward_id
            )
            log_test_result("Admin Update Reward with External URL", success, response)
            return success
        else:
            log_test_result("Admin Update Reward with External URL", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update Reward with External URL", False, error=str(e))
        return False

# 3. Enhanced Event System Test
def test_events_with_registration_url() -> bool:
    """Test that events have registration_url fields"""
    try:
        response = requests.get(f"{BACKEND_URL}/events")
        
        if response.status_code == 200:
            events = response.json()
            success = isinstance(events, list) and len(events) > 0
            
            # Check if events have registration_url fields
            if success:
                for event in events:
                    if "registration_url" not in event:
                        success = False
                        break
            
            log_test_result("Events with Registration URL", success, response)
            return success
        else:
            log_test_result("Events with Registration URL", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Events with Registration URL", False, error=str(e))
        return False

def test_admin_update_event(admin_token: str, event_id: str) -> bool:
    """Test admin updating an event with registration_url"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        update_data = {
            "title": f"Updated Event {unique_id}",
            "description": "This event was updated by the test script",
            "location": "Updated Location",
            "capacity": 150,
            "registration_url": f"https://example.com/updated-events/{unique_id}/register"
        }
        
        response = requests.put(f"{BACKEND_URL}/events/{event_id}", headers=headers, json=update_data)
        
        if response.status_code == 200:
            event = response.json()
            success = (
                event.get("title") == update_data["title"] and
                event.get("description") == update_data["description"] and
                event.get("location") == update_data["location"] and
                event.get("capacity") == update_data["capacity"] and
                event.get("registration_url") == update_data["registration_url"] and
                event.get("id") == event_id
            )
            log_test_result("Admin Update Event with Registration URL", success, response)
            return success
        else:
            log_test_result("Admin Update Event with Registration URL", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update Event with Registration URL", False, error=str(e))
        return False

# 4. Enhanced User Management Test
def test_admin_delete_user(admin_token: str, user_id: str) -> bool:
    """Test admin deleting a user"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BACKEND_URL}/users/{user_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "User deleted successfully"
            log_test_result("Admin Delete User", success, response)
            return success
        else:
            log_test_result("Admin Delete User", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Delete User", False, error=str(e))
        return False

# 5. User Profile Data Test
def test_profile_picture_in_me_endpoint(token: str) -> bool:
    """Test that the /me endpoint returns profile_picture field"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/me", headers=headers)
        
        if response.status_code == 200:
            user = response.json()
            success = "profile_picture" in user
            log_test_result("Profile Picture in /me Endpoint", success, response)
            return success
        else:
            log_test_result("Profile Picture in /me Endpoint", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Profile Picture in /me Endpoint", False, error=str(e))
        return False

def test_update_profile_picture(token: str, user_id: str) -> bool:
    """Test updating a user's profile picture"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a simple base64 encoded image (a small red dot)
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
        
        profile_data = {
            "profile_picture": base64_image
        }
        
        response = requests.put(f"{BACKEND_URL}/users/{user_id}/profile-picture", headers=headers, json=profile_data)
        
        if response.status_code == 200:
            user = response.json()
            success = (
                user.get("profile_picture") == base64_image and
                user.get("id") == user_id
            )
            log_test_result("Update Profile Picture", success, response)
            return success
        else:
            log_test_result("Update Profile Picture", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Update Profile Picture", False, error=str(e))
        return False

def run_tests():
    """Run all tests for the new features"""
    print("\n🚀 Starting Impulsa Guayaquil New Features Backend API Tests\n")
    
    # Initialize sample data
    print("\n📊 Testing Data Initialization\n")
    if not test_initialize_data():
        print("❌ Data initialization failed, stopping tests")
        return
    
    # Test admin login
    print("\n🔐 Testing Admin Authentication\n")
    admin_login = test_admin_login()
    if not admin_login:
        print("❌ Admin login failed, stopping tests")
        return
    
    admin_token = admin_login["access_token"]
    admin_user = admin_login["user"]
    
    # Register test users
    print("\n👤 Creating Test Users\n")
    user1_data = test_register_user()
    if not user1_data:
        print("❌ User registration failed, stopping tests")
        return
    
    user1_login = test_login_user(user1_data["cedula"], user1_data["password"])
    if not user1_login:
        print("❌ User login failed, stopping tests")
        return
    
    user1_token = user1_login["access_token"]
    user1_info = user1_login["user"]
    
    # Register a second user for testing deletion
    user2_data = test_register_user()
    if not user2_data:
        print("❌ Second user registration failed, stopping tests")
        return
    
    user2_login = test_login_user(user2_data["cedula"], user2_data["password"])
    if not user2_login:
        print("❌ Second user login failed, stopping tests")
        return
    
    user2_token = user2_login["access_token"]
    user2_info = user2_login["user"]
    
    # 1. Test Achievement Eligibility System
    print("\n🏆 Testing Achievement Eligibility System\n")
    test_achievement_eligibility(user1_token)
    
    # 2. Test Enhanced Reward System
    print("\n🎁 Testing Enhanced Reward System\n")
    test_rewards_with_external_url()
    
    # Get a reward to update
    rewards_response = requests.get(f"{BACKEND_URL}/rewards")
    if rewards_response.status_code == 200:
        rewards = rewards_response.json()
        if rewards and len(rewards) > 0:
            test_admin_update_reward(admin_token, rewards[0]["id"])
    
    # 3. Test Enhanced Event System
    print("\n📅 Testing Enhanced Event System\n")
    test_events_with_registration_url()
    
    # Get an event to update
    events_response = requests.get(f"{BACKEND_URL}/events")
    if events_response.status_code == 200:
        events = events_response.json()
        if events and len(events) > 0:
            test_admin_update_event(admin_token, events[0]["id"])
    
    # 4. Test Enhanced User Management
    print("\n👥 Testing Enhanced User Management\n")
    test_admin_delete_user(admin_token, user2_info["id"])
    
    # 5. Test User Profile Data
    print("\n👤 Testing User Profile Data\n")
    test_profile_picture_in_me_endpoint(user1_token)
    test_update_profile_picture(user1_token, user1_info["id"])
    
    # Print summary
    print("\n📋 Test Summary\n")
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    print(f"Success Rate: {(test_results['passed'] / test_results['total']) * 100:.2f}%")
    
    if test_results['failed'] > 0:
        print("\n❌ Failed Tests:")
        for test in test_results['tests']:
            if not test['passed']:
                print(f"  - {test['test_name']}")
                if 'error' in test:
                    print(f"    Error: {test['error']}")

if __name__ == "__main__":
    run_tests()
#!/usr/bin/env python3
"""
Test script for new admin user credentials and functionality
Tests the transition from old admin (0000000000) to new admin (0944179175)
"""
import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Get the backend URL from the frontend/.env file
BACKEND_URL = "https://587e6717-b3b3-4d90-a071-afbf74c419f2.preview.emergentagent.com/api"

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

def test_initialize_data_creates_new_admin():
    """Test that initialize-data endpoint creates the new admin user"""
    try:
        response = requests.post(f"{BACKEND_URL}/initialize-data")
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Sample data initialized successfully"
            log_test_result("Initialize Data Creates New Admin", success, response)
            return success
        else:
            log_test_result("Initialize Data Creates New Admin", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Initialize Data Creates New Admin", False, error=str(e))
        return False

def test_old_admin_login_fails():
    """Test that old admin user (0000000000) cannot login"""
    try:
        login_data = {
            "cedula": "0000000000",
            "password": "admin"
        }
        
        response = requests.post(f"{BACKEND_URL}/login", json=login_data)
        
        # Should fail with 401 (unauthorized)
        success = response.status_code == 401
        log_test_result("Old Admin Login Fails", success, response)
        return success
    except Exception as e:
        log_test_result("Old Admin Login Fails", False, error=str(e))
        return False

def test_new_admin_login_succeeds():
    """Test that new admin user (0944179175) can login successfully"""
    try:
        login_data = {
            "cedula": "0944179175",
            "password": "Jamon123@"
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
            log_test_result("New Admin Login Succeeds", success, response)
            return data if success else None
        else:
            log_test_result("New Admin Login Succeeds", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("New Admin Login Succeeds", False, error=str(e))
        return None

def test_new_admin_has_correct_details(admin_token: str):
    """Test that new admin user has correct details"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BACKEND_URL}/me", headers=headers)
        
        if response.status_code == 200:
            user = response.json()
            success = (
                user.get("cedula") == "0944179175" and
                user.get("email") == "admin@impulsa.guayaquil.gob.ec" and
                user.get("nombre_emprendimiento") == "Impulsa Guayaquil" and
                user.get("role") == "admin" and
                user.get("nombre") == "Admin" and
                user.get("apellido") == "Sistema"
            )
            log_test_result("New Admin Has Correct Details", success, response)
            return success
        else:
            log_test_result("New Admin Has Correct Details", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("New Admin Has Correct Details", False, error=str(e))
        return False

def test_new_admin_can_access_admin_endpoints(admin_token: str):
    """Test that new admin can access admin-only endpoints"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test admin stats endpoint
        stats_response = requests.get(f"{BACKEND_URL}/admin/stats", headers=headers)
        stats_success = stats_response.status_code == 200
        
        # Test get all users endpoint
        users_response = requests.get(f"{BACKEND_URL}/users", headers=headers)
        users_success = users_response.status_code == 200
        
        success = stats_success and users_success
        log_test_result("New Admin Can Access Admin Endpoints", success)
        
        if stats_success:
            print("   ✓ Admin stats endpoint accessible")
        if users_success:
            print("   ✓ Users endpoint accessible")
            
        return success
    except Exception as e:
        log_test_result("New Admin Can Access Admin Endpoints", False, error=str(e))
        return False

def test_new_admin_can_manage_missions(admin_token: str):
    """Test that new admin can manage missions (CRUD operations)"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test creating a mission
        mission_data = {
            "title": "Test Admin Mission",
            "description": "Mission created by new admin for testing",
            "type": "mini_quiz",
            "points_reward": 25,
            "position": 999,
            "content": {
                "questions": [
                    {
                        "question": "Can the new admin create missions?",
                        "options": ["Yes", "No"],
                        "correct_answer": 0
                    }
                ]
            },
            "requirements": []
        }
        
        create_response = requests.post(f"{BACKEND_URL}/missions", headers=headers, json=mission_data)
        create_success = create_response.status_code == 200
        
        mission_id = None
        if create_success:
            mission = create_response.json()
            mission_id = mission.get("id")
        
        # Test updating the mission
        update_success = False
        if mission_id:
            update_data = {
                "title": "Updated Test Admin Mission",
                "points_reward": 30
            }
            update_response = requests.put(f"{BACKEND_URL}/missions/{mission_id}", headers=headers, json=update_data)
            update_success = update_response.status_code == 200
        
        # Test deleting the mission
        delete_success = False
        if mission_id:
            delete_response = requests.delete(f"{BACKEND_URL}/missions/{mission_id}", headers=headers)
            delete_success = delete_response.status_code == 200
        
        success = create_success and update_success and delete_success
        log_test_result("New Admin Can Manage Missions", success)
        
        if create_success:
            print("   ✓ Mission creation successful")
        if update_success:
            print("   ✓ Mission update successful")
        if delete_success:
            print("   ✓ Mission deletion successful")
            
        return success
    except Exception as e:
        log_test_result("New Admin Can Manage Missions", False, error=str(e))
        return False

def test_new_admin_can_manage_users(admin_token: str):
    """Test that new admin can manage users"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First, create a test user to manage
        user_data = {
            "nombre": "Test",
            "apellido": "User",
            "cedula": "1234567890",
            "email": "testuser@example.com",
            "nombre_emprendimiento": "Test Business",
            "password": "testpassword123"
        }
        
        register_response = requests.post(f"{BACKEND_URL}/register", json=user_data)
        if register_response.status_code != 200:
            log_test_result("New Admin Can Manage Users", False, error="Failed to create test user")
            return False
        
        test_user = register_response.json()
        user_id = test_user.get("id")
        
        # Test getting user details
        get_response = requests.get(f"{BACKEND_URL}/users/{user_id}", headers=headers)
        get_success = get_response.status_code == 200
        
        # Test updating user
        update_data = {
            "nombre": "Updated Test",
            "points": 100
        }
        update_response = requests.put(f"{BACKEND_URL}/users/{user_id}", headers=headers, json=update_data)
        update_success = update_response.status_code == 200
        
        # Test getting user stats
        stats_response = requests.get(f"{BACKEND_URL}/users/{user_id}/stats", headers=headers)
        stats_success = stats_response.status_code == 200
        
        # Test deleting user (cleanup)
        delete_response = requests.delete(f"{BACKEND_URL}/users/{user_id}", headers=headers)
        delete_success = delete_response.status_code == 200
        
        success = get_success and update_success and stats_success and delete_success
        log_test_result("New Admin Can Manage Users", success)
        
        if get_success:
            print("   ✓ User details retrieval successful")
        if update_success:
            print("   ✓ User update successful")
        if stats_success:
            print("   ✓ User stats retrieval successful")
        if delete_success:
            print("   ✓ User deletion successful")
            
        return success
    except Exception as e:
        log_test_result("New Admin Can Manage Users", False, error=str(e))
        return False

def test_new_admin_can_manage_achievements(admin_token: str):
    """Test that new admin can manage achievements"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test creating an achievement
        achievement_data = {
            "title": "Test Admin Achievement",
            "description": "Achievement created by new admin for testing",
            "icon": "🏆",
            "condition": "test_condition",
            "points_required": 50,
            "missions_required": 2
        }
        
        create_response = requests.post(f"{BACKEND_URL}/achievements", headers=headers, json=achievement_data)
        create_success = create_response.status_code == 200
        
        achievement_id = None
        if create_success:
            achievement = create_response.json()
            achievement_id = achievement.get("id")
        
        # Test updating the achievement
        update_success = False
        if achievement_id:
            update_data = {
                "title": "Updated Test Admin Achievement",
                "points_required": 75
            }
            update_response = requests.put(f"{BACKEND_URL}/achievements/{achievement_id}", headers=headers, json=update_data)
            update_success = update_response.status_code == 200
        
        # Test deleting the achievement
        delete_success = False
        if achievement_id:
            delete_response = requests.delete(f"{BACKEND_URL}/achievements/{achievement_id}", headers=headers)
            delete_success = delete_response.status_code == 200
        
        success = create_success and update_success and delete_success
        log_test_result("New Admin Can Manage Achievements", success)
        
        if create_success:
            print("   ✓ Achievement creation successful")
        if update_success:
            print("   ✓ Achievement update successful")
        if delete_success:
            print("   ✓ Achievement deletion successful")
            
        return success
    except Exception as e:
        log_test_result("New Admin Can Manage Achievements", False, error=str(e))
        return False

def test_new_admin_can_manage_rewards(admin_token: str):
    """Test that new admin can manage rewards"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test creating a reward
        reward_data = {
            "title": "Test Admin Reward",
            "description": "Reward created by new admin for testing",
            "type": "discount",
            "value": "10% off",
            "points_cost": 100,
            "external_url": "https://example.com/redeem"
        }
        
        create_response = requests.post(f"{BACKEND_URL}/rewards", headers=headers, json=reward_data)
        create_success = create_response.status_code == 200
        
        reward_id = None
        if create_success:
            reward = create_response.json()
            reward_id = reward.get("id")
        
        # Test updating the reward
        update_success = False
        if reward_id:
            update_data = {
                "title": "Updated Test Admin Reward",
                "points_cost": 150
            }
            update_response = requests.put(f"{BACKEND_URL}/rewards/{reward_id}", headers=headers, json=update_data)
            update_success = update_response.status_code == 200
        
        # Test deleting the reward
        delete_success = False
        if reward_id:
            delete_response = requests.delete(f"{BACKEND_URL}/rewards/{reward_id}", headers=headers)
            delete_success = delete_response.status_code == 200
        
        success = create_success and update_success and delete_success
        log_test_result("New Admin Can Manage Rewards", success)
        
        if create_success:
            print("   ✓ Reward creation successful")
        if update_success:
            print("   ✓ Reward update successful")
        if delete_success:
            print("   ✓ Reward deletion successful")
            
        return success
    except Exception as e:
        log_test_result("New Admin Can Manage Rewards", False, error=str(e))
        return False

def test_new_admin_can_manage_events(admin_token: str):
    """Test that new admin can manage events"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test creating an event
        event_data = {
            "title": "Test Admin Event",
            "description": "Event created by new admin for testing",
            "location": "Test Location",
            "date": "2025-02-01T10:00:00Z",
            "organizer": "Test Organizer",
            "capacity": 50,
            "registration_url": "https://example.com/register"
        }
        
        create_response = requests.post(f"{BACKEND_URL}/events", headers=headers, json=event_data)
        create_success = create_response.status_code == 200
        
        event_id = None
        if create_success:
            event = create_response.json()
            event_id = event.get("id")
        
        # Test updating the event
        update_success = False
        if event_id:
            update_data = {
                "title": "Updated Test Admin Event",
                "capacity": 75
            }
            update_response = requests.put(f"{BACKEND_URL}/events/{event_id}", headers=headers, json=update_data)
            update_success = update_response.status_code == 200
        
        # Test deleting the event
        delete_success = False
        if event_id:
            delete_response = requests.delete(f"{BACKEND_URL}/events/{event_id}", headers=headers)
            delete_success = delete_response.status_code == 200
        
        success = create_success and update_success and delete_success
        log_test_result("New Admin Can Manage Events", success)
        
        if create_success:
            print("   ✓ Event creation successful")
        if update_success:
            print("   ✓ Event update successful")
        if delete_success:
            print("   ✓ Event deletion successful")
            
        return success
    except Exception as e:
        log_test_result("New Admin Can Manage Events", False, error=str(e))
        return False

def run_admin_credentials_tests():
    """Run all admin credentials and functionality tests"""
    print("\n🔑 Testing New Admin User Credentials and Functionality\n")
    print("=" * 60)
    
    # Step 1: Initialize data to create new admin and remove old admin
    print("\n📊 Step 1: Initialize Data (Create New Admin, Remove Old Admin)")
    if not test_initialize_data_creates_new_admin():
        print("❌ Failed to initialize data, stopping tests")
        return False
    
    # Step 2: Verify old admin cannot login
    print("\n🚫 Step 2: Verify Old Admin Cannot Login")
    test_old_admin_login_fails()
    
    # Step 3: Test new admin login
    print("\n✅ Step 3: Test New Admin Login")
    admin_login = test_new_admin_login_succeeds()
    if not admin_login:
        print("❌ New admin login failed, stopping tests")
        return False
    
    admin_token = admin_login["access_token"]
    
    # Step 4: Verify new admin details
    print("\n📋 Step 4: Verify New Admin Details")
    if not test_new_admin_has_correct_details(admin_token):
        print("❌ New admin details verification failed")
        return False
    
    # Step 5: Test admin endpoint access
    print("\n🔐 Step 5: Test Admin Endpoint Access")
    if not test_new_admin_can_access_admin_endpoints(admin_token):
        print("❌ Admin endpoint access failed")
        return False
    
    # Step 6: Test admin functionalities
    print("\n⚙️ Step 6: Test Admin Functionalities")
    
    print("\n  🎯 Testing Mission Management")
    test_new_admin_can_manage_missions(admin_token)
    
    print("\n  👥 Testing User Management")
    test_new_admin_can_manage_users(admin_token)
    
    print("\n  🏆 Testing Achievement Management")
    test_new_admin_can_manage_achievements(admin_token)
    
    print("\n  🎁 Testing Reward Management")
    test_new_admin_can_manage_rewards(admin_token)
    
    print("\n  📅 Testing Event Management")
    test_new_admin_can_manage_events(admin_token)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
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
    else:
        print("\n🎉 All tests passed! New admin credentials and functionality working correctly.")
    
    return test_results['failed'] == 0

if __name__ == "__main__":
    success = run_admin_credentials_tests()
    sys.exit(0 if success else 1)
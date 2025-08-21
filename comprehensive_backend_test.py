#!/usr/bin/env python3
import requests
import json
import time
import sys
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

# Get the backend URL from the frontend/.env file
BACKEND_URL = "https://android-config.preview.emergentagent.com/api"

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

# 6. Enhanced Mission System Tests
def test_complete_mission_with_quiz(token: str, mission_id: str, correct_answers: bool = True) -> bool:
    """Test completing a mission with mini-quiz validation"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get the mission details to find the quiz questions
        mission_response = requests.get(f"{BACKEND_URL}/missions", headers=headers)
        if mission_response.status_code != 200:
            log_test_result("Complete Mission With Quiz - Get Mission", False, mission_response)
            return False
        
        missions = mission_response.json()
        target_mission = next((m for m in missions if m["id"] == mission_id), None)
        
        if not target_mission or target_mission["type"] != "mini_quiz":
            log_test_result("Complete Mission With Quiz", False, error=f"Mission {mission_id} is not a mini_quiz type")
            return False
        
        # Prepare quiz answers
        questions = target_mission.get("content", {}).get("questions", [])
        quiz_answers = {}
        
        for i, question in enumerate(questions):
            if correct_answers:
                # Use correct answer
                quiz_answers[str(i)] = question.get("correct_answer")
            else:
                # Use incorrect answer
                correct = question.get("correct_answer")
                options_count = len(question.get("options", []))
                if options_count > 1:
                    # Choose any answer except the correct one
                    quiz_answers[str(i)] = (correct + 1) % options_count
                else:
                    quiz_answers[str(i)] = 0  # Default if no options
        
        completion_data = {
            "mission_id": mission_id,
            "completion_data": {
                "quiz_answers": quiz_answers
            }
        }
        
        response = requests.post(f"{BACKEND_URL}/missions/complete", headers=headers, json=completion_data)
        
        if response.status_code == 200:
            result = response.json()
            if correct_answers:
                success = (
                    "message" in result and
                    "points_earned" in result and
                    result["message"] == "Mission completed successfully" and
                    result["points_earned"] > 0
                )
            else:
                # For incorrect answers, we expect the mission to fail
                success = (
                    "message" in result and
                    "points_earned" in result and
                    "Mission failed" in result["message"] and
                    result["points_earned"] == 0
                )
            
            log_test_result(f"Complete Mission With Quiz ({'Correct' if correct_answers else 'Incorrect'} Answers)", success, response)
            return success
        else:
            log_test_result(f"Complete Mission With Quiz ({'Correct' if correct_answers else 'Incorrect'} Answers)", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result(f"Complete Mission With Quiz ({'Correct' if correct_answers else 'Incorrect'} Answers)", False, error=str(e))
        return False

def test_check_mission_cooldown(token: str, mission_id: str) -> bool:
    """Test checking mission cooldown status"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/missions/{mission_id}/cooldown", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "can_attempt" in data and
                "message" in data and
                isinstance(data["can_attempt"], bool)
            )
            log_test_result("Check Mission Cooldown", success, response)
            return success
        else:
            log_test_result("Check Mission Cooldown", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Check Mission Cooldown", False, error=str(e))
        return False

def test_get_mission_attempts(token: str, mission_id: str) -> bool:
    """Test getting mission attempts"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/missions/{mission_id}/attempts", headers=headers)
        
        if response.status_code == 200:
            attempts = response.json()
            success = isinstance(attempts, list)
            log_test_result("Get Mission Attempts", success, response)
            return success
        else:
            log_test_result("Get Mission Attempts", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Mission Attempts", False, error=str(e))
        return False

# 7. Notification System Tests
def test_get_notifications(token: str) -> Optional[List[Dict[str, Any]]]:
    """Test getting user notifications"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/notifications", headers=headers)
        
        if response.status_code == 200:
            notifications = response.json()
            success = isinstance(notifications, list)
            log_test_result("Get Notifications", success, response)
            return notifications if success else None
        else:
            log_test_result("Get Notifications", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Notifications", False, error=str(e))
        return None

def test_mark_notification_read(token: str, notification_id: str) -> bool:
    """Test marking a notification as read"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.put(f"{BACKEND_URL}/notifications/{notification_id}/read", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Notification marked as read"
            log_test_result("Mark Notification Read", success, response)
            return success
        else:
            log_test_result("Mark Notification Read", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Mark Notification Read", False, error=str(e))
        return False

# 8. Leaderboard Tests
def test_get_leaderboard(token: str) -> bool:
    """Test getting user leaderboard"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/leaderboard", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "leaderboard" in data and
                isinstance(data["leaderboard"], list)
            )
            log_test_result("Get Leaderboard", success, response)
            return success
        else:
            log_test_result("Get Leaderboard", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Leaderboard", False, error=str(e))
        return False

# 9. Enhanced Admin Stats Tests
def test_enhanced_admin_stats(admin_token: str) -> bool:
    """Test getting enhanced admin statistics"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BACKEND_URL}/admin/stats", headers=headers)
        
        if response.status_code == 200:
            stats = response.json()
            success = (
                "total_users" in stats and
                "total_missions" in stats and
                "total_completed_missions" in stats and
                "total_points_awarded" in stats and
                "active_users_last_week" in stats and
                "most_popular_missions" in stats and
                isinstance(stats["most_popular_missions"], list)
            )
            log_test_result("Enhanced Admin Stats", success, response)
            return success
        else:
            log_test_result("Enhanced Admin Stats", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Enhanced Admin Stats", False, error=str(e))
        return False

def run_comprehensive_tests():
    """Run all tests for the backend API"""
    print("\n🚀 Starting Impulsa Guayaquil Comprehensive Backend API Tests\n")
    
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
    
    # 4. Test User Profile Data
    print("\n👤 Testing User Profile Data\n")
    test_profile_picture_in_me_endpoint(user1_token)
    test_update_profile_picture(user1_token, user1_info["id"])
    
    # 5. Test Enhanced Mission System
    print("\n🎯 Testing Enhanced Mission System\n")
    
    # Get available missions
    missions_response = requests.get(f"{BACKEND_URL}/missions", headers={"Authorization": f"Bearer {user1_token}"})
    if missions_response.status_code == 200:
        missions = missions_response.json()
        
        # Find a mini-quiz mission
        quiz_mission = next((m for m in missions if m["type"] == "mini_quiz"), None)
        
        if quiz_mission:
            # Test mission cooldown before attempting
            test_check_mission_cooldown(user1_token, quiz_mission["id"])
            
            # Test completing mission with correct answers
            test_complete_mission_with_quiz(user1_token, quiz_mission["id"], True)
            
            # Test getting mission attempts
            test_get_mission_attempts(user1_token, quiz_mission["id"])
            
            # Find another mini-quiz mission for testing failure
            another_quiz_mission = next((m for m in missions if m["type"] == "mini_quiz" and m["id"] != quiz_mission["id"]), None)
            
            if another_quiz_mission:
                # Test completing mission with incorrect answers
                test_complete_mission_with_quiz(user2_token, another_quiz_mission["id"], False)
                
                # Test cooldown after failing
                test_check_mission_cooldown(user2_token, another_quiz_mission["id"])
    
    # 6. Test Notification System
    print("\n🔔 Testing Notification System\n")
    notifications = test_get_notifications(user1_token)
    
    if notifications and len(notifications) > 0:
        # Test marking a notification as read
        test_mark_notification_read(user1_token, notifications[0]["id"])
    
    # 7. Test Leaderboard
    print("\n🏅 Testing Leaderboard\n")
    test_get_leaderboard(user1_token)
    
    # 8. Test Enhanced Admin Stats
    print("\n📊 Testing Enhanced Admin Stats\n")
    test_enhanced_admin_stats(admin_token)
    
    # 9. Test Enhanced User Management
    print("\n👥 Testing Enhanced User Management\n")
    test_admin_delete_user(admin_token, user2_info["id"])
    
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
    run_comprehensive_tests()
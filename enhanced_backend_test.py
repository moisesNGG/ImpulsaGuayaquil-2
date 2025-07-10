#!/usr/bin/env python3
import requests
import json
import time
import sys
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

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

# 1. User Management (Admin only) Tests
def test_admin_update_user(admin_token: str, user_id: str) -> bool:
    """Test admin updating a user"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        update_data = {
            "nombre": "Updated Name",
            "apellido": "Updated Lastname",
            "email": "updated.email@example.com",
            "nombre_emprendimiento": "Updated Business",
            "points": 100,
            "rank": "emprendedor_junior"
        }
        
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", headers=headers, json=update_data)
        
        if response.status_code == 200:
            user = response.json()
            success = (
                user.get("nombre") == update_data["nombre"] and
                user.get("apellido") == update_data["apellido"] and
                user.get("email") == update_data["email"] and
                user.get("nombre_emprendimiento") == update_data["nombre_emprendimiento"] and
                user.get("points") == update_data["points"] and
                user.get("rank") == update_data["rank"] and
                user.get("id") == user_id
            )
            log_test_result("Admin Update User", success, response)
            return success
        else:
            log_test_result("Admin Update User", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update User", False, error=str(e))
        return False

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

def test_get_user_stats(token: str, user_id: str) -> bool:
    """Test getting user statistics"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/users/{user_id}/stats", headers=headers)
        
        if response.status_code == 200:
            stats = response.json()
            success = (
                "user_id" in stats and
                "total_points" in stats and
                "total_missions_completed" in stats and
                "total_missions_attempted" in stats and
                "current_streak" in stats and
                "best_streak" in stats and
                "rank" in stats and
                "achievements_earned" in stats and
                "favorite_rewards_count" in stats and
                "completion_rate" in stats and
                "last_activity" in stats
            )
            log_test_result("Get User Stats", success, response)
            return success
        else:
            log_test_result("Get User Stats", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get User Stats", False, error=str(e))
        return False

def test_toggle_favorite_reward(token: str, user_id: str, reward_id: str) -> bool:
    """Test toggling a favorite reward for a user"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        reward_data = {
            "reward_id": reward_id
        }
        
        response = requests.post(f"{BACKEND_URL}/users/{user_id}/favorite-reward", headers=headers, json=reward_data)
        
        if response.status_code == 200:
            data = response.json()
            success = (
                "message" in data and
                "favorites" in data and
                isinstance(data["favorites"], list)
            )
            log_test_result("Toggle Favorite Reward", success, response)
            return success
        else:
            log_test_result("Toggle Favorite Reward", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Toggle Favorite Reward", False, error=str(e))
        return False

# 2. Enhanced Mission System Tests
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

# 3. Achievement System Tests
def test_get_eligible_achievements(token: str) -> bool:
    """Test getting eligible achievements for user"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/achievements/eligible", headers=headers)
        
        if response.status_code == 200:
            achievements = response.json()
            success = isinstance(achievements, list)
            log_test_result("Get Eligible Achievements", success, response)
            return success
        else:
            log_test_result("Get Eligible Achievements", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Eligible Achievements", False, error=str(e))
        return False

# 4. Reward System Tests
def test_admin_create_reward(admin_token: str) -> Optional[Dict[str, Any]]:
    """Test admin creating a new reward"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        reward_data = {
            "title": f"Test Reward {unique_id}",
            "description": "This is a test reward created by the test script",
            "type": "discount",
            "value": "10% off",
            "points_cost": 50,
            "external_url": f"https://example.com/rewards/{unique_id}"
        }
        
        response = requests.post(f"{BACKEND_URL}/rewards", headers=headers, json=reward_data)
        
        if response.status_code == 200:
            reward = response.json()
            success = (
                reward.get("title") == reward_data["title"] and
                reward.get("description") == reward_data["description"] and
                reward.get("type") == reward_data["type"] and
                reward.get("value") == reward_data["value"] and
                reward.get("points_cost") == reward_data["points_cost"] and
                reward.get("external_url") == reward_data["external_url"] and
                isinstance(reward.get("id"), str) and
                len(reward.get("id")) > 0
            )
            log_test_result("Admin Create Reward", success, response)
            return reward if success else None
        else:
            log_test_result("Admin Create Reward", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Admin Create Reward", False, error=str(e))
        return None

def test_admin_update_reward(admin_token: str, reward_id: str) -> bool:
    """Test admin updating a reward"""
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
            log_test_result("Admin Update Reward", success, response)
            return success
        else:
            log_test_result("Admin Update Reward", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update Reward", False, error=str(e))
        return False

def test_admin_delete_reward(admin_token: str, reward_id: str) -> bool:
    """Test admin deleting a reward"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BACKEND_URL}/rewards/{reward_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Reward deleted successfully"
            log_test_result("Admin Delete Reward", success, response)
            return success
        else:
            log_test_result("Admin Delete Reward", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Delete Reward", False, error=str(e))
        return False

# 5. Event System Tests
def test_admin_create_event(admin_token: str) -> Optional[Dict[str, Any]]:
    """Test admin creating a new event"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        event_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        event_data = {
            "title": f"Test Event {unique_id}",
            "description": "This is a test event created by the test script",
            "location": "Test Location",
            "date": event_date,
            "organizer": "Test Organizer",
            "capacity": 100,
            "registration_url": f"https://example.com/events/{unique_id}/register"
        }
        
        response = requests.post(f"{BACKEND_URL}/events", headers=headers, json=event_data)
        
        if response.status_code == 200:
            event = response.json()
            success = (
                event.get("title") == event_data["title"] and
                event.get("description") == event_data["description"] and
                event.get("location") == event_data["location"] and
                event.get("organizer") == event_data["organizer"] and
                event.get("capacity") == event_data["capacity"] and
                event.get("registration_url") == event_data["registration_url"] and
                isinstance(event.get("id"), str) and
                len(event.get("id")) > 0
            )
            log_test_result("Admin Create Event", success, response)
            return event if success else None
        else:
            log_test_result("Admin Create Event", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Admin Create Event", False, error=str(e))
        return None

def test_admin_update_event(admin_token: str, event_id: str) -> bool:
    """Test admin updating an event"""
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
            log_test_result("Admin Update Event", success, response)
            return success
        else:
            log_test_result("Admin Update Event", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update Event", False, error=str(e))
        return False

def test_admin_delete_event(admin_token: str, event_id: str) -> bool:
    """Test admin deleting an event"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BACKEND_URL}/events/{event_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Event deleted successfully"
            log_test_result("Admin Delete Event", success, response)
            return success
        else:
            log_test_result("Admin Delete Event", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Delete Event", False, error=str(e))
        return False

# 6. Notification System Tests
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

# 7. Leaderboard Tests
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

# 8. Enhanced Admin Stats Tests
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

def run_enhanced_tests():
    """Run all enhanced API tests in sequence"""
    print("\n🚀 Starting Impulsa Guayaquil Enhanced Backend API Tests\n")
    
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
    
    # Register a second user for testing
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
    
    # 1. Test User Management (Admin only)
    print("\n👑 Testing User Management (Admin only)\n")
    
    # Test updating user
    test_admin_update_user(admin_token, user1_info["id"])
    
    # Test getting user stats
    test_get_user_stats(admin_token, user1_info["id"])
    test_get_user_stats(user1_token, user1_info["id"])
    
    # 2. Test Enhanced Mission System
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
    
    # 3. Test Achievement System
    print("\n🏆 Testing Achievement System\n")
    test_get_eligible_achievements(user1_token)
    
    # 4. Test Reward System
    print("\n🎁 Testing Reward System\n")
    created_reward = test_admin_create_reward(admin_token)
    
    if created_reward:
        # Test updating reward
        test_admin_update_reward(admin_token, created_reward["id"])
        
        # Test toggling favorite reward
        test_toggle_favorite_reward(user1_token, user1_info["id"], created_reward["id"])
        
        # Test deleting reward (do this at the end)
        test_admin_delete_reward(admin_token, created_reward["id"])
    
    # 5. Test Event System
    print("\n📅 Testing Event System\n")
    created_event = test_admin_create_event(admin_token)
    
    if created_event:
        # Test updating event
        test_admin_update_event(admin_token, created_event["id"])
        
        # Test deleting event (do this at the end)
        test_admin_delete_event(admin_token, created_event["id"])
    
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
    
    # Test deleting a user (do this at the end)
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
    run_enhanced_tests()
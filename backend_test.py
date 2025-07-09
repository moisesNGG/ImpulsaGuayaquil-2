#!/usr/bin/env python3
import requests
import json
import time
import sys
import uuid
from typing import Dict, Any, List, Optional, Tuple

# Get the backend URL from the frontend/.env file
BACKEND_URL = "https://7e71a514-bc68-4012-b87a-90faac3ed29d.preview.emergentagent.com/api"

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

# Authentication Tests
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

def test_admin_login() -> Optional[Dict[str, Any]]:
    """Test admin login with default credentials"""
    return test_login_user("0000000000", "admin")

def test_get_current_user(token: str) -> Optional[Dict[str, Any]]:
    """Test getting current user info with JWT token"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/me", headers=headers)
        
        if response.status_code == 200:
            user = response.json()
            success = (
                "id" in user and
                "nombre" in user and
                "apellido" in user and
                "cedula" in user and
                "email" in user and
                "nombre_emprendimiento" in user and
                "role" in user
            )
            log_test_result("Get Current User", success, response)
            return user if success else None
        else:
            log_test_result("Get Current User", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Current User", False, error=str(e))
        return None

# Admin Tests
def test_admin_get_users(admin_token: str) -> bool:
    """Test admin getting all users"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BACKEND_URL}/users", headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            success = isinstance(users, list) and len(users) > 0
            log_test_result("Admin Get Users", success, response)
            return success
        else:
            log_test_result("Admin Get Users", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Get Users", False, error=str(e))
        return False

def test_admin_get_stats(admin_token: str) -> bool:
    """Test admin getting statistics"""
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
                "most_popular_missions" in stats
            )
            log_test_result("Admin Get Stats", success, response)
            return success
        else:
            log_test_result("Admin Get Stats", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Get Stats", False, error=str(e))
        return False

def test_admin_create_mission(admin_token: str) -> Optional[Dict[str, Any]]:
    """Test admin creating a new mission"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        mission_data = {
            "title": f"Test Mission {unique_id}",
            "description": "This is a test mission created by the test script",
            "type": "mini_quiz",
            "points_reward": 25,
            "position": 99,  # High position to avoid conflicts
            "content": {
                "questions": [
                    {
                        "question": "Is this a test?",
                        "options": ["Yes", "No", "Maybe", "I don't know"],
                        "correct_answer": 0
                    }
                ]
            },
            "requirements": []
        }
        
        response = requests.post(f"{BACKEND_URL}/missions", headers=headers, json=mission_data)
        
        if response.status_code == 200:
            mission = response.json()
            success = (
                mission.get("title") == mission_data["title"] and
                mission.get("description") == mission_data["description"] and
                mission.get("type") == mission_data["type"] and
                mission.get("points_reward") == mission_data["points_reward"] and
                mission.get("position") == mission_data["position"] and
                isinstance(mission.get("id"), str) and
                len(mission.get("id")) > 0
            )
            log_test_result("Admin Create Mission", success, response)
            return mission if success else None
        else:
            log_test_result("Admin Create Mission", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Admin Create Mission", False, error=str(e))
        return None

def test_admin_update_mission(admin_token: str, mission_id: str) -> bool:
    """Test admin updating a mission"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        update_data = {
            "title": f"Updated Mission {unique_id}",
            "description": "This mission was updated by the test script",
            "points_reward": 30
        }
        
        response = requests.put(f"{BACKEND_URL}/missions/{mission_id}", headers=headers, json=update_data)
        
        if response.status_code == 200:
            mission = response.json()
            success = (
                mission.get("title") == update_data["title"] and
                mission.get("description") == update_data["description"] and
                mission.get("points_reward") == update_data["points_reward"] and
                mission.get("id") == mission_id
            )
            log_test_result("Admin Update Mission", success, response)
            return success
        else:
            log_test_result("Admin Update Mission", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update Mission", False, error=str(e))
        return False

def test_admin_delete_mission(admin_token: str, mission_id: str) -> bool:
    """Test admin deleting a mission"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BACKEND_URL}/missions/{mission_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Mission deleted successfully"
            log_test_result("Admin Delete Mission", success, response)
            return success
        else:
            log_test_result("Admin Delete Mission", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Delete Mission", False, error=str(e))
        return False

# User Tests
def test_get_missions_with_token(token: str) -> Optional[List[Dict[str, Any]]]:
    """Test getting all missions with authentication"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/missions", headers=headers)
        
        if response.status_code == 200:
            missions = response.json()
            success = isinstance(missions, list) and len(missions) > 0
            log_test_result("Get Missions With Token", success, response)
            return missions if success else None
        else:
            log_test_result("Get Missions With Token", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Missions With Token", False, error=str(e))
        return None

def test_get_missions_with_status_token(token: str, user_id: str) -> Optional[List[Dict[str, Any]]]:
    """Test getting missions with status for a user with authentication"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/missions/{user_id}/with-status", headers=headers)
        
        if response.status_code == 200:
            missions = response.json()
            
            # Verify that we have missions and they have status
            success = (
                isinstance(missions, list) and
                len(missions) > 0 and
                all("status" in mission for mission in missions)
            )
            
            log_test_result("Get Missions With Status (Auth)", success, response)
            return missions if success else None
        else:
            log_test_result("Get Missions With Status (Auth)", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Missions With Status (Auth)", False, error=str(e))
        return None

def test_complete_mission_with_token(token: str, mission_id: str) -> bool:
    """Test completing a mission with authentication"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        completion_data = {
            "mission_id": mission_id,
            "completion_data": {
                "test_completion": True
            }
        }
        
        response = requests.post(f"{BACKEND_URL}/missions/complete", headers=headers, json=completion_data)
        
        if response.status_code == 200:
            result = response.json()
            success = (
                "message" in result and
                "points_earned" in result and
                result["message"] == "Mission completed successfully"
            )
            log_test_result("Complete Mission (Auth)", success, response)
            return success
        else:
            log_test_result("Complete Mission (Auth)", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Complete Mission (Auth)", False, error=str(e))
        return False

# Access Control Tests
def test_user_cannot_access_admin_endpoints(user_token: str) -> bool:
    """Test that regular users cannot access admin-only endpoints"""
    try:
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to access admin stats
        stats_response = requests.get(f"{BACKEND_URL}/admin/stats", headers=headers)
        stats_forbidden = stats_response.status_code == 403
        
        # Try to access all users
        users_response = requests.get(f"{BACKEND_URL}/users", headers=headers)
        users_forbidden = users_response.status_code == 403
        
        # Try to create a mission
        mission_data = {
            "title": "Unauthorized Mission",
            "description": "This should fail",
            "type": "mini_quiz",
            "points_reward": 10,
            "position": 100,
            "content": {},
            "requirements": []
        }
        create_response = requests.post(f"{BACKEND_URL}/missions", headers=headers, json=mission_data)
        create_forbidden = create_response.status_code == 403
        
        success = stats_forbidden and users_forbidden and create_forbidden
        
        log_test_result("User Cannot Access Admin Endpoints", success)
        return success
    except Exception as e:
        log_test_result("User Cannot Access Admin Endpoints", False, error=str(e))
        return False

def test_user_can_only_access_own_data(user_token: str, user_id: str, other_user_id: str) -> bool:
    """Test that users can only access their own data"""
    try:
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to access own user data (should succeed)
        own_response = requests.get(f"{BACKEND_URL}/users/{user_id}", headers=headers)
        own_success = own_response.status_code == 200
        
        # Try to access another user's data (should fail)
        other_response = requests.get(f"{BACKEND_URL}/users/{other_user_id}", headers=headers)
        other_forbidden = other_response.status_code == 403
        
        # Try to access own missions with status (should succeed)
        own_missions_response = requests.get(f"{BACKEND_URL}/missions/{user_id}/with-status", headers=headers)
        own_missions_success = own_missions_response.status_code == 200
        
        # Try to access another user's missions with status (should fail)
        other_missions_response = requests.get(f"{BACKEND_URL}/missions/{other_user_id}/with-status", headers=headers)
        other_missions_forbidden = other_missions_response.status_code == 403
        
        success = own_success and other_forbidden and own_missions_success and other_missions_forbidden
        
        log_test_result("User Can Only Access Own Data", success)
        return success
    except Exception as e:
        log_test_result("User Can Only Access Own Data", False, error=str(e))
        return False

def test_admin_can_access_all_user_data(admin_token: str, user_id: str) -> bool:
    """Test that admin can access all user data"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to access a specific user's data
        user_response = requests.get(f"{BACKEND_URL}/users/{user_id}", headers=headers)
        user_success = user_response.status_code == 200
        
        # Try to access a specific user's missions with status
        missions_response = requests.get(f"{BACKEND_URL}/missions/{user_id}/with-status", headers=headers)
        missions_success = missions_response.status_code == 200
        
        success = user_success and missions_success
        
        log_test_result("Admin Can Access All User Data", success)
        return success
    except Exception as e:
        log_test_result("Admin Can Access All User Data", False, error=str(e))
        return False

def test_unauthenticated_requests_fail() -> bool:
    """Test that unauthenticated requests to protected endpoints fail"""
    try:
        # Try to access current user info without token
        me_response = requests.get(f"{BACKEND_URL}/me")
        me_unauthorized = me_response.status_code in (401, 403)
        
        # Try to access admin stats without token
        admin_stats_response = requests.get(f"{BACKEND_URL}/admin/stats")
        admin_stats_unauthorized = admin_stats_response.status_code in (401, 403)
        
        # Try to complete a mission without token
        complete_data = {"mission_id": "some-id", "completion_data": {}}
        complete_response = requests.post(f"{BACKEND_URL}/missions/complete", json=complete_data)
        complete_unauthorized = complete_response.status_code in (401, 403)
        
        success = me_unauthorized and admin_stats_unauthorized and complete_unauthorized
        
        log_test_result("Unauthenticated Requests Fail", success)
        return success
    except Exception as e:
        log_test_result("Unauthenticated Requests Fail", False, error=str(e))
        return False

# Achievement Tests
def test_admin_create_achievement(admin_token: str) -> Optional[Dict[str, Any]]:
    """Test admin creating a new achievement"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        achievement_data = {
            "title": f"Test Achievement {unique_id}",
            "description": "This is a test achievement created by the test script",
            "icon": "🏆",
            "condition": "test_condition",
            "points_required": 50,
            "missions_required": 2
        }
        
        response = requests.post(f"{BACKEND_URL}/achievements", headers=headers, json=achievement_data)
        
        if response.status_code == 200:
            achievement = response.json()
            success = (
                achievement.get("title") == achievement_data["title"] and
                achievement.get("description") == achievement_data["description"] and
                achievement.get("icon") == achievement_data["icon"] and
                achievement.get("condition") == achievement_data["condition"] and
                achievement.get("points_required") == achievement_data["points_required"] and
                achievement.get("missions_required") == achievement_data["missions_required"] and
                isinstance(achievement.get("id"), str) and
                len(achievement.get("id")) > 0
            )
            log_test_result("Admin Create Achievement", success, response)
            return achievement if success else None
        else:
            log_test_result("Admin Create Achievement", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Admin Create Achievement", False, error=str(e))
        return None

def test_get_achievements() -> Optional[List[Dict[str, Any]]]:
    """Test getting all achievements (public endpoint)"""
    try:
        response = requests.get(f"{BACKEND_URL}/achievements")
        
        if response.status_code == 200:
            achievements = response.json()
            success = isinstance(achievements, list)
            log_test_result("Get Achievements", success, response)
            return achievements if success else None
        else:
            log_test_result("Get Achievements", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Achievements", False, error=str(e))
        return None

def test_admin_update_achievement(admin_token: str, achievement_id: str) -> bool:
    """Test admin updating an achievement"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        unique_id = str(uuid.uuid4())[:8]
        
        update_data = {
            "title": f"Updated Achievement {unique_id}",
            "description": "This achievement was updated by the test script",
            "points_required": 75
        }
        
        response = requests.put(f"{BACKEND_URL}/achievements/{achievement_id}", headers=headers, json=update_data)
        
        if response.status_code == 200:
            achievement = response.json()
            success = (
                achievement.get("title") == update_data["title"] and
                achievement.get("description") == update_data["description"] and
                achievement.get("points_required") == update_data["points_required"] and
                achievement.get("id") == achievement_id
            )
            log_test_result("Admin Update Achievement", success, response)
            return success
        else:
            log_test_result("Admin Update Achievement", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Update Achievement", False, error=str(e))
        return False

def test_admin_delete_achievement(admin_token: str, achievement_id: str) -> bool:
    """Test admin deleting an achievement"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.delete(f"{BACKEND_URL}/achievements/{achievement_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("message") == "Achievement deleted successfully"
            log_test_result("Admin Delete Achievement", success, response)
            return success
        else:
            log_test_result("Admin Delete Achievement", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Delete Achievement", False, error=str(e))
        return False

# Profile Picture Tests
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

def test_user_cannot_update_other_user_profile_picture(user_token: str, other_user_id: str) -> bool:
    """Test that a user cannot update another user's profile picture"""
    try:
        headers = {"Authorization": f"Bearer {user_token}"}
        
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
        
        profile_data = {
            "profile_picture": base64_image
        }
        
        response = requests.put(f"{BACKEND_URL}/users/{other_user_id}/profile-picture", headers=headers, json=profile_data)
        
        # Should be forbidden
        success = response.status_code == 403
        
        log_test_result("User Cannot Update Other User Profile Picture", success, response)
        return success
    except Exception as e:
        log_test_result("User Cannot Update Other User Profile Picture", False, error=str(e))
        return False

def test_admin_can_update_any_user_profile_picture(admin_token: str, user_id: str) -> bool:
    """Test that an admin can update any user's profile picture"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
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
            log_test_result("Admin Can Update Any User Profile Picture", success, response)
            return success
        else:
            log_test_result("Admin Can Update Any User Profile Picture", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Admin Can Update Any User Profile Picture", False, error=str(e))
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("\n🚀 Starting Impulsa Guayaquil Backend API Tests\n")
    
    # Initialize sample data
    print("\n📊 Testing Data Initialization\n")
    if not test_initialize_data():
        print("❌ Data initialization failed, stopping tests")
        return
    
    # Test authentication system
    print("\n🔐 Testing Authentication System\n")
    
    # Test admin login
    admin_login = test_admin_login()
    if not admin_login:
        print("❌ Admin login failed, stopping tests")
        return
    
    admin_token = admin_login["access_token"]
    admin_user = admin_login["user"]
    
    # Verify admin user info
    admin_user_info = test_get_current_user(admin_token)
    if not admin_user_info:
        print("❌ Failed to get admin user info, stopping tests")
        return
    
    # Verify admin role
    if admin_user_info["role"] != "admin":
        log_test_result("Admin Role Verification", False, error=f"Admin user has incorrect role: {admin_user_info['role']}")
        print("❌ Admin role verification failed, stopping tests")
        return
    else:
        log_test_result("Admin Role Verification", True)
    
    # Test user registration
    user_data = test_register_user()
    if not user_data:
        print("❌ User registration failed, stopping tests")
        return
    
    # Test user login
    user_login = test_login_user(user_data["cedula"], user_data["password"])
    if not user_login:
        print("❌ User login failed, stopping tests")
        return
    
    user_token = user_login["access_token"]
    user_info = user_login["user"]
    
    # Verify user info
    user_info_check = test_get_current_user(user_token)
    if not user_info_check:
        print("❌ Failed to get user info, stopping tests")
        return
    
    # Register a second user for testing access control
    second_user_data = test_register_user()
    if not second_user_data:
        print("❌ Second user registration failed, stopping tests")
        return
    
    second_user_login = test_login_user(second_user_data["cedula"], second_user_data["password"])
    if not second_user_login:
        print("❌ Second user login failed, stopping tests")
        return
    
    second_user_token = second_user_login["access_token"]
    second_user_info = second_user_login["user"]
    
    # Test admin-only endpoints
    print("\n👑 Testing Admin-Only Endpoints\n")
    test_admin_get_users(admin_token)
    test_admin_get_stats(admin_token)
    
    # Test mission management (admin)
    created_mission = test_admin_create_mission(admin_token)
    if created_mission:
        test_admin_update_mission(admin_token, created_mission["id"])
        
        # Don't delete the mission yet, we'll use it for user testing
    
    # Test protected endpoints for regular users
    print("\n🔒 Testing Protected Endpoints\n")
    missions = test_get_missions_with_token(user_token)
    
    if missions and user_info:
        missions_with_status = test_get_missions_with_status_token(user_token, user_info["id"])
        
        if missions_with_status:
            # Find an available mission
            available_missions = [m for m in missions_with_status if m["status"] == "available"]
            if available_missions:
                first_mission = min(available_missions, key=lambda m: m["position"])
                test_complete_mission_with_token(user_token, first_mission["id"])
    
    # Test access control
    print("\n🚫 Testing Access Control\n")
    test_user_cannot_access_admin_endpoints(user_token)
    
    if user_info and second_user_info:
        test_user_can_only_access_own_data(user_token, user_info["id"], second_user_info["id"])
    
    if admin_token and user_info:
        test_admin_can_access_all_user_data(admin_token, user_info["id"])
    
    test_unauthenticated_requests_fail()
    
    # Test achievement functionality
    print("\n🏆 Testing Achievement Functionality\n")
    
    # Test getting achievements (public endpoint)
    test_get_achievements()
    
    # Test achievement CRUD operations (admin only)
    created_achievement = test_admin_create_achievement(admin_token)
    if created_achievement:
        test_admin_update_achievement(admin_token, created_achievement["id"])
        test_admin_delete_achievement(admin_token, created_achievement["id"])
    
    # Test profile picture functionality
    print("\n🖼️ Testing Profile Picture Functionality\n")
    
    # Test user updating their own profile picture
    if user_info:
        test_update_profile_picture(user_token, user_info["id"])
    
    # Test user cannot update another user's profile picture
    if user_info and second_user_info:
        test_user_cannot_update_other_user_profile_picture(user_token, second_user_info["id"])
    
    # Test admin can update any user's profile picture
    if admin_token and user_info:
        test_admin_can_update_any_user_profile_picture(admin_token, user_info["id"])
    
    # Clean up - delete the test mission if it was created
    if created_mission:
        test_admin_delete_mission(admin_token, created_mission["id"])
    
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
    run_all_tests()
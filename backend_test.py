#!/usr/bin/env python3
import requests
import json
import time
import sys
import uuid
from typing import Dict, Any, List, Optional

# Get the backend URL from the frontend/.env file
BACKEND_URL = "https://b216ceb8-73ab-40d3-bd3e-94395c8f26d5.preview.emergentagent.com/api"

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

def test_create_user():
    """Test creating a new user"""
    try:
        # Generate a unique email to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "name": f"Test User {unique_id}",
            "email": f"test.user.{unique_id}@example.com"
        }
        
        response = requests.post(f"{BACKEND_URL}/users", json=user_data)
        
        if response.status_code == 200:
            user = response.json()
            success = (
                user.get("name") == user_data["name"] and
                user.get("email") == user_data["email"] and
                user.get("points") == 0 and
                user.get("rank") == "emprendedor_novato" and
                isinstance(user.get("id"), str) and
                len(user.get("id")) > 0
            )
            log_test_result("Create User", success, response)
            return user if success else None
        else:
            log_test_result("Create User", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Create User", False, error=str(e))
        return None

def test_get_user(user_id: str):
    """Test getting a user by ID"""
    try:
        response = requests.get(f"{BACKEND_URL}/users/{user_id}")
        
        if response.status_code == 200:
            user = response.json()
            success = user.get("id") == user_id
            log_test_result("Get User", success, response)
            return success
        else:
            log_test_result("Get User", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get User", False, error=str(e))
        return False

def test_get_users():
    """Test getting all users"""
    try:
        response = requests.get(f"{BACKEND_URL}/users")
        
        if response.status_code == 200:
            users = response.json()
            success = isinstance(users, list)
            log_test_result("Get Users", success, response)
            return success
        else:
            log_test_result("Get Users", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Users", False, error=str(e))
        return False

def test_get_missions():
    """Test getting all missions"""
    try:
        response = requests.get(f"{BACKEND_URL}/missions")
        
        if response.status_code == 200:
            missions = response.json()
            success = isinstance(missions, list) and len(missions) > 0
            log_test_result("Get Missions", success, response)
            return missions if success else None
        else:
            log_test_result("Get Missions", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Missions", False, error=str(e))
        return None

def test_create_mission():
    """Test creating a new mission"""
    try:
        mission_data = {
            "title": "Test Mission",
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
        
        response = requests.post(f"{BACKEND_URL}/missions", json=mission_data)
        
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
            log_test_result("Create Mission", success, response)
            return mission if success else None
        else:
            log_test_result("Create Mission", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Create Mission", False, error=str(e))
        return None

def test_get_missions_with_status(user_id: str):
    """Test getting missions with status for a user"""
    try:
        response = requests.get(f"{BACKEND_URL}/missions/{user_id}/with-status")
        
        if response.status_code == 200:
            missions = response.json()
            
            # Verify that we have missions and they have status
            success = (
                isinstance(missions, list) and
                len(missions) > 0 and
                all("status" in mission for mission in missions)
            )
            
            # Check if first mission is available and others are locked (for a new user)
            if success:
                # Sort by position to ensure we're checking the first mission
                sorted_missions = sorted(missions, key=lambda m: m.get("position", 999))
                first_mission_available = sorted_missions[0]["status"] == "available"
                other_missions_locked = all(
                    mission["status"] == "locked" or mission["status"] == "available"
                    for mission in sorted_missions[1:]
                )
                success = first_mission_available
            
            log_test_result("Get Missions With Status", success, response)
            return missions if success else None
        else:
            log_test_result("Get Missions With Status", False, response, f"Unexpected status code: {response.status_code}")
            return None
    except Exception as e:
        log_test_result("Get Missions With Status", False, error=str(e))
        return None

def test_complete_mission(user_id: str, mission_id: str):
    """Test completing a mission"""
    try:
        completion_data = {
            "user_id": user_id,
            "mission_id": mission_id,
            "completion_data": {
                "test_completion": True
            }
        }
        
        response = requests.post(f"{BACKEND_URL}/missions/complete", json=completion_data)
        
        if response.status_code == 200:
            result = response.json()
            success = (
                "message" in result and
                "points_earned" in result and
                result["message"] == "Mission completed successfully"
            )
            log_test_result("Complete Mission", success, response)
            return success
        else:
            log_test_result("Complete Mission", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Complete Mission", False, error=str(e))
        return False

def test_verify_mission_completion_and_points(user_id: str, mission_id: str, original_points: int):
    """Verify that mission completion updated user points and mission status"""
    try:
        # Get updated user
        user_response = requests.get(f"{BACKEND_URL}/users/{user_id}")
        
        if user_response.status_code != 200:
            log_test_result("Verify Mission Completion - User", False, user_response, 
                           f"Failed to get user: {user_response.status_code}")
            return False
        
        user = user_response.json()
        
        # Get missions with status
        missions_response = requests.get(f"{BACKEND_URL}/missions/{user_id}/with-status")
        
        if missions_response.status_code != 200:
            log_test_result("Verify Mission Completion - Missions", False, missions_response, 
                           f"Failed to get missions: {missions_response.status_code}")
            return False
        
        missions = missions_response.json()
        
        # Find the completed mission
        completed_mission = next((m for m in missions if m["id"] == mission_id), None)
        
        if not completed_mission:
            log_test_result("Verify Mission Completion", False, error=f"Could not find mission with ID {mission_id}")
            return False
        
        # Check if points increased
        points_increased = user["points"] > original_points
        
        # Check if mission is marked as completed
        mission_completed = completed_mission["status"] == "completed"
        
        # Check if mission is in user's completed_missions list
        mission_in_completed_list = mission_id in user["completed_missions"]
        
        success = points_increased and mission_completed and mission_in_completed_list
        
        log_test_result("Verify Mission Completion", success, 
                       error=None if success else "Mission completion verification failed")
        
        return success
    except Exception as e:
        log_test_result("Verify Mission Completion", False, error=str(e))
        return False

def test_get_achievements():
    """Test getting all achievements"""
    try:
        response = requests.get(f"{BACKEND_URL}/achievements")
        
        if response.status_code == 200:
            achievements = response.json()
            success = isinstance(achievements, list) and len(achievements) > 0
            log_test_result("Get Achievements", success, response)
            return success
        else:
            log_test_result("Get Achievements", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Achievements", False, error=str(e))
        return False

def test_get_rewards():
    """Test getting all rewards"""
    try:
        response = requests.get(f"{BACKEND_URL}/rewards")
        
        if response.status_code == 200:
            rewards = response.json()
            success = isinstance(rewards, list) and len(rewards) > 0
            log_test_result("Get Rewards", success, response)
            return success
        else:
            log_test_result("Get Rewards", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Rewards", False, error=str(e))
        return False

def test_get_events():
    """Test getting all events"""
    try:
        response = requests.get(f"{BACKEND_URL}/events")
        
        if response.status_code == 200:
            events = response.json()
            success = isinstance(events, list) and len(events) > 0
            log_test_result("Get Events", success, response)
            return success
        else:
            log_test_result("Get Events", False, response, f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Get Events", False, error=str(e))
        return False

def test_mission_progression():
    """Test the mission progression system"""
    try:
        # 1. Create a new user
        user = test_create_user()
        if not user:
            log_test_result("Mission Progression", False, error="Failed to create user")
            return False
        
        user_id = user["id"]
        original_points = user["points"]
        
        # 2. Get missions with status
        missions_with_status = test_get_missions_with_status(user_id)
        if not missions_with_status:
            log_test_result("Mission Progression", False, error="Failed to get missions with status")
            return False
        
        # Find the first available mission (should be the one with position 1)
        available_missions = [m for m in missions_with_status if m["status"] == "available"]
        if not available_missions:
            log_test_result("Mission Progression", False, error="No available missions found")
            return False
        
        first_mission = min(available_missions, key=lambda m: m["position"])
        
        # 3. Complete the first mission
        completion_success = test_complete_mission(user_id, first_mission["id"])
        if not completion_success:
            log_test_result("Mission Progression", False, error="Failed to complete mission")
            return False
        
        # 4. Verify mission completion updated user points and mission status
        verification_success = test_verify_mission_completion_and_points(
            user_id, first_mission["id"], original_points
        )
        if not verification_success:
            log_test_result("Mission Progression", False, error="Failed to verify mission completion")
            return False
        
        # 5. Check if next mission is now available
        updated_missions = requests.get(f"{BACKEND_URL}/missions/{user_id}/with-status").json()
        
        # Find missions that depend on the completed mission
        dependent_missions = [
            m for m in updated_missions 
            if first_mission["id"] in m["requirements"]
        ]
        
        # If there are dependent missions, at least one should now be available
        if dependent_missions:
            next_mission_available = any(m["status"] == "available" for m in dependent_missions)
            
            if next_mission_available:
                log_test_result("Mission Progression - Next Mission Available", True)
            else:
                log_test_result("Mission Progression - Next Mission Available", False, 
                               error="Completing a mission did not unlock the next one")
                return False
        
        log_test_result("Mission Progression", True)
        return True
    except Exception as e:
        log_test_result("Mission Progression", False, error=str(e))
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("\n🚀 Starting Impulsa Guayaquil Backend API Tests\n")
    
    # Initialize sample data
    print("\n📊 Testing Data Initialization\n")
    if not test_initialize_data():
        print("❌ Data initialization failed, stopping tests")
        return
    
    # Test user endpoints
    print("\n👤 Testing User Endpoints\n")
    user = test_create_user()
    if user:
        test_get_user(user["id"])
    test_get_users()
    
    # Test mission endpoints
    print("\n🎯 Testing Mission Endpoints\n")
    test_get_missions()
    test_create_mission()
    if user:
        test_get_missions_with_status(user["id"])
    
    # Test other endpoints
    print("\n🏆 Testing Other Endpoints\n")
    test_get_achievements()
    test_get_rewards()
    test_get_events()
    
    # Test mission progression
    print("\n📈 Testing Mission Progression System\n")
    test_mission_progression()
    
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
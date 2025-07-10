#!/usr/bin/env python3
import requests
import json
import time
import sys
from typing import Dict, Any, List, Optional

# Get the backend URL from the frontend/.env file
BACKEND_URL = "https://587e6717-b3b3-4d90-a071-afbf74c419f2.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test_result(test_name: str, passed: bool, response: Optional[requests.Response] = None, error: Optional[str] = None, details: Optional[str] = None):
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
    
    if details:
        result["details"] = details
    
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {test_name}")
        if details:
            print(f"   Details: {details}")
    else:
        test_results["failed"] += 1
        print(f"❌ FAIL: {test_name}")
        if error:
            print(f"   Error: {error}")
        if details:
            print(f"   Details: {details}")
        if response:
            print(f"   Status: {response.status_code}")
            try:
                print(f"   Response: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"   Response: {response.text[:200]}")
    
    test_results["tests"].append(result)

def get_admin_token() -> Optional[str]:
    """Get admin token for authenticated requests"""
    try:
        login_data = {
            "cedula": "0000000000",
            "password": "admin"
        }
        
        response = requests.post(f"{BACKEND_URL}/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Failed to get admin token: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting admin token: {str(e)}")
        return None

def test_initialize_sample_data() -> bool:
    """Test the /api/admin/initialize-sample-data endpoint"""
    try:
        # First, get admin token
        admin_token = get_admin_token()
        if not admin_token:
            log_test_result("Initialize Sample Data", False, error="Could not get admin token")
            return False
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test the initialize-data endpoint (note: it's /initialize-data not /admin/initialize-sample-data)
        response = requests.post(f"{BACKEND_URL}/initialize-data", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            success = "message" in data and "successfully" in data.get("message", "").lower()
            log_test_result("Initialize Sample Data", success, response, 
                          details=f"Response message: {data.get('message', 'No message')}")
            return success
        else:
            log_test_result("Initialize Sample Data", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Initialize Sample Data", False, error=str(e))
        return False

def test_missions_structure_and_count() -> bool:
    """Test that missions are created with proper structure and count"""
    try:
        response = requests.get(f"{BACKEND_URL}/missions")
        
        if response.status_code == 200:
            missions = response.json()
            
            # Check if we have missions
            if not isinstance(missions, list):
                log_test_result("Missions Structure and Count", False, response, 
                              "Response is not a list")
                return False
            
            # Check mission count (should be at least 5 from the demo missions)
            mission_count = len(missions)
            if mission_count < 5:
                log_test_result("Missions Structure and Count", False, response, 
                              f"Expected at least 5 missions, got {mission_count}")
                return False
            
            # Check mission structure
            required_fields = ["id", "title", "description", "type", "points_reward", "position", "content", "requirements"]
            structure_valid = True
            structure_errors = []
            
            for i, mission in enumerate(missions):
                for field in required_fields:
                    if field not in mission:
                        structure_valid = False
                        structure_errors.append(f"Mission {i} missing field: {field}")
                
                # Check if title contains emoji (as per requirement)
                if not any(ord(char) > 127 for char in mission.get("title", "")):
                    structure_errors.append(f"Mission {i} title lacks emoji: {mission.get('title', '')}")
                
                # Check position field is numeric
                if not isinstance(mission.get("position"), int):
                    structure_valid = False
                    structure_errors.append(f"Mission {i} position is not integer: {mission.get('position')}")
            
            # Check for proper progression (positions should be sequential)
            positions = [m.get("position", 0) for m in missions]
            positions.sort()
            progression_valid = all(positions[i] <= positions[i+1] for i in range(len(positions)-1))
            
            if not progression_valid:
                structure_errors.append("Mission positions are not in proper progression order")
            
            success = structure_valid and progression_valid and len(structure_errors) == 0
            
            details = f"Found {mission_count} missions. "
            if structure_errors:
                details += f"Errors: {'; '.join(structure_errors[:3])}"  # Show first 3 errors
            else:
                details += "All missions have proper structure and progression."
            
            log_test_result("Missions Structure and Count", success, response, 
                          error="; ".join(structure_errors) if structure_errors else None,
                          details=details)
            return success
        else:
            log_test_result("Missions Structure and Count", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Missions Structure and Count", False, error=str(e))
        return False

def test_achievements_structure_and_count() -> bool:
    """Test that achievements are created with proper structure and categories"""
    try:
        response = requests.get(f"{BACKEND_URL}/achievements")
        
        if response.status_code == 200:
            achievements = response.json()
            
            # Check if we have achievements
            if not isinstance(achievements, list):
                log_test_result("Achievements Structure and Count", False, response, 
                              "Response is not a list")
                return False
            
            achievement_count = len(achievements)
            
            # Check achievement structure
            required_fields = ["id", "title", "description", "icon", "condition"]
            structure_valid = True
            structure_errors = []
            categories_found = set()
            
            for i, achievement in enumerate(achievements):
                for field in required_fields:
                    if field not in achievement:
                        structure_valid = False
                        structure_errors.append(f"Achievement {i} missing field: {field}")
                
                # Check if icon contains emoji
                icon = achievement.get("icon", "")
                if not any(ord(char) > 127 for char in icon):
                    structure_errors.append(f"Achievement {i} icon lacks emoji: {icon}")
                
                # Check condition field has proper requirements
                condition = achievement.get("condition", "")
                if not condition or len(condition) < 3:
                    structure_errors.append(f"Achievement {i} has invalid condition: {condition}")
            
            success = structure_valid and len(structure_errors) == 0
            
            details = f"Found {achievement_count} achievements. "
            if structure_errors:
                details += f"Errors: {'; '.join(structure_errors[:3])}"
            else:
                details += "All achievements have proper structure and conditions."
            
            log_test_result("Achievements Structure and Count", success, response, 
                          error="; ".join(structure_errors) if structure_errors else None,
                          details=details)
            return success
        else:
            log_test_result("Achievements Structure and Count", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Achievements Structure and Count", False, error=str(e))
        return False

def test_rewards_structure_and_count() -> bool:
    """Test that rewards are created with proper structure and external URLs"""
    try:
        response = requests.get(f"{BACKEND_URL}/rewards")
        
        if response.status_code == 200:
            rewards = response.json()
            
            # Check if we have rewards
            if not isinstance(rewards, list):
                log_test_result("Rewards Structure and Count", False, response, 
                              "Response is not a list")
                return False
            
            reward_count = len(rewards)
            
            # Check reward structure
            required_fields = ["id", "title", "description", "type", "value", "points_cost"]
            structure_valid = True
            structure_errors = []
            external_url_count = 0
            
            for i, reward in enumerate(rewards):
                for field in required_fields:
                    if field not in reward:
                        structure_valid = False
                        structure_errors.append(f"Reward {i} missing field: {field}")
                
                # Check points_cost is numeric
                if not isinstance(reward.get("points_cost"), int):
                    structure_errors.append(f"Reward {i} points_cost is not integer: {reward.get('points_cost')}")
                
                # Check if external_url exists (should be present for redemption functionality)
                if "external_url" in reward and reward["external_url"]:
                    external_url_count += 1
                    # Validate URL format
                    url = reward["external_url"]
                    if not (url.startswith("http://") or url.startswith("https://")):
                        structure_errors.append(f"Reward {i} has invalid external_url format: {url}")
            
            success = structure_valid and len(structure_errors) == 0
            
            details = f"Found {reward_count} rewards, {external_url_count} with external URLs. "
            if structure_errors:
                details += f"Errors: {'; '.join(structure_errors[:3])}"
            else:
                details += "All rewards have proper structure and points_cost."
            
            log_test_result("Rewards Structure and Count", success, response, 
                          error="; ".join(structure_errors) if structure_errors else None,
                          details=details)
            return success
        else:
            log_test_result("Rewards Structure and Count", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Rewards Structure and Count", False, error=str(e))
        return False

def test_events_structure_and_count() -> bool:
    """Test that events are created with proper dates and registration URLs"""
    try:
        response = requests.get(f"{BACKEND_URL}/events")
        
        if response.status_code == 200:
            events = response.json()
            
            # Check if we have events
            if not isinstance(events, list):
                log_test_result("Events Structure and Count", False, response, 
                              "Response is not a list")
                return False
            
            event_count = len(events)
            
            # Check event structure
            required_fields = ["id", "title", "description", "location", "date", "organizer"]
            structure_valid = True
            structure_errors = []
            registration_url_count = 0
            
            for i, event in enumerate(events):
                for field in required_fields:
                    if field not in event:
                        structure_valid = False
                        structure_errors.append(f"Event {i} missing field: {field}")
                
                # Check date format (should be ISO format)
                date_str = event.get("date", "")
                if not date_str:
                    structure_errors.append(f"Event {i} has empty date")
                else:
                    try:
                        # Try to parse the date
                        from datetime import datetime
                        if 'T' in date_str:
                            datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        else:
                            datetime.fromisoformat(date_str)
                    except ValueError:
                        structure_errors.append(f"Event {i} has invalid date format: {date_str}")
                
                # Check if registration_url exists
                if "registration_url" in event and event["registration_url"]:
                    registration_url_count += 1
                    # Validate URL format
                    url = event["registration_url"]
                    if not (url.startswith("http://") or url.startswith("https://")):
                        structure_errors.append(f"Event {i} has invalid registration_url format: {url}")
            
            success = structure_valid and len(structure_errors) == 0
            
            details = f"Found {event_count} events, {registration_url_count} with registration URLs. "
            if structure_errors:
                details += f"Errors: {'; '.join(structure_errors[:3])}"
            else:
                details += "All events have proper structure and dates."
            
            log_test_result("Events Structure and Count", success, response, 
                          error="; ".join(structure_errors) if structure_errors else None,
                          details=details)
            return success
        else:
            log_test_result("Events Structure and Count", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Events Structure and Count", False, error=str(e))
        return False

def test_existing_functionality_not_broken() -> bool:
    """Test that sample data initialization doesn't break existing functionality"""
    try:
        # Test basic endpoints still work
        endpoints_to_test = [
            ("/missions", "missions"),
            ("/achievements", "achievements"),
            ("/rewards", "rewards"),
            ("/events", "events")
        ]
        
        all_working = True
        broken_endpoints = []
        
        for endpoint, name in endpoints_to_test:
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint}")
                if response.status_code != 200:
                    all_working = False
                    broken_endpoints.append(f"{name} ({response.status_code})")
            except Exception as e:
                all_working = False
                broken_endpoints.append(f"{name} (error: {str(e)})")
        
        # Test admin login still works
        try:
            admin_token = get_admin_token()
            if not admin_token:
                all_working = False
                broken_endpoints.append("admin login")
        except Exception as e:
            all_working = False
            broken_endpoints.append(f"admin login (error: {str(e)})")
        
        details = "All basic endpoints working" if all_working else f"Broken: {', '.join(broken_endpoints)}"
        
        log_test_result("Existing Functionality Not Broken", all_working, 
                      error=f"Broken endpoints: {', '.join(broken_endpoints)}" if broken_endpoints else None,
                      details=details)
        return all_working
    except Exception as e:
        log_test_result("Existing Functionality Not Broken", False, error=str(e))
        return False

def test_mission_progression_with_position() -> bool:
    """Test that missions show proper progression with position field"""
    try:
        response = requests.get(f"{BACKEND_URL}/missions")
        
        if response.status_code == 200:
            missions = response.json()
            
            if not missions:
                log_test_result("Mission Progression with Position", False, response, 
                              "No missions found")
                return False
            
            # Check that all missions have position field
            missions_with_position = [m for m in missions if "position" in m and isinstance(m["position"], int)]
            
            if len(missions_with_position) != len(missions):
                log_test_result("Mission Progression with Position", False, response, 
                              f"Not all missions have valid position field: {len(missions_with_position)}/{len(missions)}")
                return False
            
            # Sort by position and check progression
            sorted_missions = sorted(missions, key=lambda x: x["position"])
            
            # Check that positions start from 1 and are sequential or at least increasing
            positions = [m["position"] for m in sorted_missions]
            
            # Positions should be positive and increasing
            progression_valid = all(pos > 0 for pos in positions) and all(positions[i] <= positions[i+1] for i in range(len(positions)-1))
            
            # Check for reasonable position values (should start from 1 or low numbers)
            starts_reasonably = positions[0] <= 5  # First mission should have position <= 5
            
            success = progression_valid and starts_reasonably
            
            details = f"Missions have positions from {min(positions)} to {max(positions)}. "
            if not progression_valid:
                details += "Positions are not in proper order. "
            if not starts_reasonably:
                details += f"First position ({positions[0]}) seems too high. "
            if success:
                details += "Progression is valid."
            
            log_test_result("Mission Progression with Position", success, response, 
                          details=details)
            return success
        else:
            log_test_result("Mission Progression with Position", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Mission Progression with Position", False, error=str(e))
        return False

def test_achievement_conditions_and_requirements() -> bool:
    """Test that achievements have proper conditions and requirements"""
    try:
        response = requests.get(f"{BACKEND_URL}/achievements")
        
        if response.status_code == 200:
            achievements = response.json()
            
            if not achievements:
                log_test_result("Achievement Conditions and Requirements", False, response, 
                              "No achievements found")
                return False
            
            valid_conditions = []
            invalid_conditions = []
            
            # Common achievement condition patterns
            valid_condition_patterns = [
                "complete_", "earn_", "streak_", "reach_", "participate_", 
                "network_", "creative_", "speed_", "digital_", "social_"
            ]
            
            for achievement in achievements:
                condition = achievement.get("condition", "")
                
                if not condition:
                    invalid_conditions.append(f"Empty condition in '{achievement.get('title', 'Unknown')}'")
                    continue
                
                # Check if condition follows expected patterns
                has_valid_pattern = any(pattern in condition for pattern in valid_condition_patterns)
                
                if has_valid_pattern:
                    valid_conditions.append(condition)
                else:
                    invalid_conditions.append(f"Unusual condition '{condition}' in '{achievement.get('title', 'Unknown')}'")
            
            success = len(invalid_conditions) == 0
            
            details = f"Found {len(valid_conditions)} valid conditions. "
            if invalid_conditions:
                details += f"Issues: {'; '.join(invalid_conditions[:3])}"
            else:
                details += "All achievements have proper conditions."
            
            log_test_result("Achievement Conditions and Requirements", success, response, 
                          error="; ".join(invalid_conditions) if invalid_conditions else None,
                          details=details)
            return success
        else:
            log_test_result("Achievement Conditions and Requirements", False, response, 
                          f"Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        log_test_result("Achievement Conditions and Requirements", False, error=str(e))
        return False

def run_comprehensive_sample_data_tests():
    """Run all comprehensive sample data tests"""
    print("\n🚀 Starting Comprehensive Sample Data Tests for Impulsa Guayaquil\n")
    
    # Test 1: Initialize sample data endpoint
    print("📊 Testing Sample Data Initialization...")
    if not test_initialize_sample_data():
        print("❌ Sample data initialization failed, but continuing with other tests")
    
    # Test 2: Missions structure and count
    print("\n🎯 Testing Missions Structure and Count...")
    test_missions_structure_and_count()
    
    # Test 3: Achievements structure and count
    print("\n🏆 Testing Achievements Structure and Count...")
    test_achievements_structure_and_count()
    
    # Test 4: Rewards structure and count
    print("\n🎁 Testing Rewards Structure and Count...")
    test_rewards_structure_and_count()
    
    # Test 5: Events structure and count
    print("\n📅 Testing Events Structure and Count...")
    test_events_structure_and_count()
    
    # Test 6: Existing functionality not broken
    print("\n🔧 Testing Existing Functionality...")
    test_existing_functionality_not_broken()
    
    # Test 7: Mission progression with position
    print("\n📈 Testing Mission Progression...")
    test_mission_progression_with_position()
    
    # Test 8: Achievement conditions and requirements
    print("\n✅ Testing Achievement Conditions...")
    test_achievement_conditions_and_requirements()
    
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
                if 'details' in test:
                    print(f"    Details: {test['details']}")
    else:
        print("\n✅ All tests passed! Sample data functionality is working correctly.")

if __name__ == "__main__":
    run_comprehensive_sample_data_tests()
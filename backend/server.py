from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import jwt
from passlib.context import CryptContext
import hashlib
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = "impulsa-guayaquil-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Impulsa Guayaquil API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class MissionType(str, Enum):
    MICROVIDEO = "microvideo"
    DOWNLOADABLE_GUIDE = "downloadable_guide"
    MINI_QUIZ = "mini_quiz"
    PRACTICAL_TASK = "practical_task"
    EXPERT_ADVICE = "expert_advice"
    HIDDEN_REWARD = "hidden_reward"
    LOCAL_CALENDAR = "local_calendar"
    STAND_CHECKLIST = "stand_checklist"
    PITCH_SIMULATOR = "pitch_simulator"
    PROCESS_GUIDE = "process_guide"

class MissionStatus(str, Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"

class UserRank(str, Enum):
    EMPRENDEDOR_NOVATO = "emprendedor_novato"
    EMPRENDEDOR_JUNIOR = "emprendedor_junior"
    EMPRENDEDOR_SENIOR = "emprendedor_senior"
    EMPRENDEDOR_EXPERTO = "emprendedor_experto"
    EMPRENDEDOR_MASTER = "emprendedor_master"

class UserRole(str, Enum):
    ADMIN = "admin"
    EMPRENDEDOR = "emprendedor"

class NotificationType(str, Enum):
    NEW_ACHIEVEMENT = "new_achievement"
    MISSION_AVAILABLE = "mission_available"
    RANK_UP = "rank_up"
    STREAK_MILESTONE = "streak_milestone"
    STREAK_WARNING = "streak_warning"
    INACTIVITY_WARNING = "inactivity_warning"
    NEW_BADGE = "new_badge"
    LEVEL_UP = "level_up"
    MISSION_RECOMMENDATION = "mission_recommendation"

class MissionAttemptStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"

class BadgeCategory(str, Enum):
    ACHIEVEMENT = "achievement"
    STREAK = "streak"
    SOCIAL = "social"
    SKILL = "skill"
    MILESTONE = "milestone"
    SPECIAL = "special"

class BadgeRarity(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

class UserLevel(str, Enum):
    NOVATO = "novato"
    PRINCIPIANTE = "principiante"
    INTERMEDIO = "intermedio"
    AVANZADO = "avanzado"
    EXPERTO = "experto"
    MAESTRO = "maestro"
    LEYENDA = "leyenda"

# Security functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> "User":
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: "User" = Depends(get_current_user)) -> "User":
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cedula: str
    nombre: str
    apellido: str
    email: str
    nombre_emprendimiento: str
    hashed_password: str
    role: UserRole = UserRole.EMPRENDEDOR
    rank: UserRank = UserRank.EMPRENDEDOR_NOVATO
    points: int = 0
    level: UserLevel = UserLevel.NOVATO
    level_points: int = 0  # Points within current level
    completed_missions: List[str] = []
    failed_missions: Dict[str, datetime] = {}
    profile_picture: Optional[str] = None
    favorite_rewards: List[str] = []
    current_streak: int = 0
    best_streak: int = 0
    last_mission_date: Optional[datetime] = None
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    badges: List[str] = []  # List of badge IDs
    inactive_warning_sent: bool = False
    streak_warning_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    nombre: str
    apellido: str
    cedula: str
    email: str
    nombre_emprendimiento: str
    password: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    nombre_emprendimiento: Optional[str] = None
    role: Optional[UserRole] = None
    points: Optional[int] = None
    rank: Optional[UserRank] = None

class UserLogin(BaseModel):
    cedula: str
    password: str

class UserResponse(BaseModel):
    id: str
    nombre: str
    apellido: str
    cedula: str
    email: str
    nombre_emprendimiento: str
    role: UserRole
    points: int
    rank: UserRank
    completed_missions: List[str]
    profile_picture: Optional[str] = None
    current_streak: int = 0
    best_streak: int = 0
    last_mission_date: Optional[datetime] = None
    favorite_rewards: List[str] = []
    total_missions_attempted: int = 0
    total_missions_completed: int = 0
    created_at: datetime
    updated_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int

class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    type: MissionType
    points_reward: int
    position: int
    content: Dict[str, Any] = {}
    requirements: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""
    
class MissionCreate(BaseModel):
    title: str
    description: str
    type: MissionType
    points_reward: int
    position: int
    content: Dict[str, Any] = {}
    requirements: List[str] = []

class MissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[MissionType] = None
    points_reward: Optional[int] = None
    position: Optional[int] = None
    content: Optional[Dict[str, Any]] = None
    requirements: Optional[List[str]] = None

class MissionWithStatus(BaseModel):
    id: str
    title: str
    description: str
    type: MissionType
    points_reward: int
    position: int
    content: Dict[str, Any]
    requirements: List[str]
    status: MissionStatus
    created_at: datetime

async def initialize_demo_missions():
    """Initialize demo missions with intelligent progression"""
    # Check if missions already exist
    existing_missions = await db.missions.count_documents({})
    if existing_missions > 0:
        return
    
    demo_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '🎯 Misión 1: Bienvenida al Emprendimiento',
            'description': 'Descubre los conceptos básicos del emprendimiento y da tu primer paso hacia el éxito.',
            'type': 'microvideo',
            'points_reward': 10,
            'position': 1,
            'content': {'video_url': 'https://example.com/video1'},
            'requirements': [],  # Always available
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '🚀 Misión 2: Fundamentos del Negocio',
            'description': 'Explora los pilares fundamentales de cualquier negocio exitoso.',
            'type': 'mini_quiz',
            'points_reward': 15,
            'position': 2,
            'content': {
                'questions': [
                    {
                        'question': '¿Cuál es el elemento más importante para emprender?',
                        'options': ['Dinero', 'Conocimiento del mercado', 'Suerte', 'Contactos'],
                        'correct': 1
                    },
                    {
                        'question': '¿Qué significa MVP?',
                        'options': ['Most Valuable Player', 'Minimum Viable Product', 'Maximum Value Product', 'Market Value Product'],
                        'correct': 1
                    }
                ]
            },
            'requirements': [],  # Always available
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '💡 Misión 3: Ideación y Creatividad',
            'description': 'Aprende técnicas para generar ideas innovadoras y creativas.',
            'type': 'practical_task',
            'points_reward': 20,
            'position': 3,
            'content': {'task': 'Genera 5 ideas de negocio para tu comunidad'},
            'requirements': [],  # Always available
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📊 Misión 4: Análisis de Mercado',
            'description': 'Comprende cómo investigar y analizar tu mercado objetivo.',
            'type': 'downloadable_guide',
            'points_reward': 25,
            'position': 4,
            'content': {'guide_url': 'https://example.com/market-analysis.pdf'},
            'requirements': [],  # Sequential unlock after first mission
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '💰 Misión 5: Modelo de Negocio',
            'description': 'Diseña un modelo de negocio sólido y rentable.',
            'type': 'expert_advice',
            'points_reward': 30,
            'position': 5,
            'content': {'expert_tips': 'Consejos de expertos en modelos de negocio'},
            'requirements': [],  # Sequential unlock
            'created_at': datetime.utcnow()
        }
    ]
    
    await db.missions.insert_many(demo_missions)
    print(f"Initialized {len(demo_missions)} demo missions")

# Initialize demo missions on startup
async def startup_event():
    await initialize_demo_missions()

# Call startup event
import asyncio
asyncio.create_task(startup_event())
async def check_achievement_eligibility(user: User, achievement: "Achievement") -> bool:
    """Check if user is eligible for an achievement"""
    if achievement.condition == "complete_1_mission":
        return len(user.completed_missions) >= 1
    elif achievement.condition == "complete_5_missions":
        return len(user.completed_missions) >= 5
    elif achievement.condition == "complete_10_missions":
        return len(user.completed_missions) >= 10
    elif achievement.condition == "earn_100_points":
        return user.points >= 100
    elif achievement.condition == "earn_500_points":
        return user.points >= 500
    elif achievement.condition == "earn_1000_points":
        return user.points >= 1000
    elif achievement.condition == "streak_3_days":
        return user.current_streak >= 3
    elif achievement.condition == "streak_7_days":
        return user.current_streak >= 7
    elif achievement.condition == "streak_30_days":
        return user.current_streak >= 30

async def calculate_user_level(points: int) -> tuple[UserLevel, int]:
    """Calculate user level based on points and return (level, points_in_level)"""
    levels = [
        (UserLevel.NOVATO, 0),
        (UserLevel.PRINCIPIANTE, 100),
        (UserLevel.INTERMEDIO, 300),
        (UserLevel.AVANZADO, 600),
        (UserLevel.EXPERTO, 1000),
        (UserLevel.MAESTRO, 1500),
        (UserLevel.LEYENDA, 2500)
    ]
    
    current_level = UserLevel.NOVATO
    level_points = points
    
    for level, threshold in reversed(levels):
        if points >= threshold:
            current_level = level
            level_points = points - threshold
            break
    
    return current_level, level_points

async def check_badge_eligibility(user: User, badge: "Badge") -> bool:
    """Check if user is eligible for a badge"""
    condition = badge.condition
    
    # Achievement badges
    if condition == "complete_first_mission":
        return len(user.completed_missions) >= 1
    elif condition == "complete_5_missions":
        return len(user.completed_missions) >= 5
    elif condition == "complete_10_missions":
        return len(user.completed_missions) >= 10
    elif condition == "complete_25_missions":
        return len(user.completed_missions) >= 25
    
    # Streak badges
    elif condition == "streak_3_days":
        return user.current_streak >= 3
    elif condition == "streak_7_days":
        return user.current_streak >= 7
    elif condition == "streak_14_days":
        return user.current_streak >= 14
    elif condition == "streak_30_days":
        return user.current_streak >= 30
    
    # Skill badges (points)
    elif condition == "earn_100_points":
        return user.points >= 100
    elif condition == "earn_500_points":
        return user.points >= 500
    elif condition == "earn_1000_points":
        return user.points >= 1000
    elif condition == "earn_2500_points":
        return user.points >= 2500
    
    # Milestone badges (levels)
    elif condition == "reach_level_junior":
        return user.rank in ["emprendedor_junior", "emprendedor_senior", "emprendedor_experto", "emprendedor_master"]
    elif condition == "reach_level_senior":
        return user.rank in ["emprendedor_senior", "emprendedor_experto", "emprendedor_master"]
    elif condition == "reach_level_experto":
        return user.rank in ["emprendedor_experto", "emprendedor_master"]
    elif condition == "reach_level_master":
        return user.rank == "emprendedor_master"
    
    # Social badges (special conditions)
    elif condition == "participate_in_events":
        # Check if user has registered for events
        event_registrations = await db.event_registrations.count_documents({"user_id": user.id})
        return event_registrations > 0
    elif condition == "network_builder":
        # Check if user has connected with other users (placeholder)
        return user.points >= 750  # Temporary condition
    
    # Special badges (creative conditions)
    elif condition == "creative_innovator":
        # Check if user completed creative missions
        return len(user.completed_missions) >= 15 and user.points >= 300
    elif condition == "speed_champion":
        # Check if user completed missions quickly (placeholder)
        return len(user.completed_missions) >= 8 and user.current_streak >= 5
    elif condition == "digital_transformer":
        # Check if user engaged with digital tools
        return user.points >= 600 and len(user.completed_missions) >= 12
    elif condition == "social_impact":
        # Check if user achieved significant impact
        return user.points >= 1500 and len(user.completed_missions) >= 20
    
    return False

async def award_badges_to_user(user: User):
    """Check and award new badges to user"""
    badges_awarded = []
    
    # Get all badges
    all_badges = await db.badges.find().to_list(100)
    
    for badge_data in all_badges:
        badge = Badge(**badge_data)
        
        # Check if user already has this badge
        user_badge = await db.user_badges.find_one({"user_id": user.id, "badge_id": badge.id})
        if user_badge:
            continue
        
        # Check if user is eligible
        if await check_badge_eligibility(user, badge):
            # Award badge
            new_user_badge = UserBadge(
                user_id=user.id,
                badge_id=badge.id
            )
            await db.user_badges.insert_one(new_user_badge.dict())
            
            # Update user's badge list
            await db.users.update_one(
                {"id": user.id},
                {"$push": {"badges": badge.id}}
            )
            
            badges_awarded.append(badge)
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                type=NotificationType.NEW_BADGE,
                title=f"¡Nueva insignia desbloqueada!",
                message=f"Has obtenido la insignia '{badge.title}' - {badge.description}",
                data={"badge_id": badge.id, "badge_title": badge.title}
            )
            await db.notifications.insert_one(notification.dict())
    
    return badges_awarded

async def check_and_update_user_level(user: User):
    """Check and update user level, return True if level changed"""
    new_level, level_points = await calculate_user_level(user.points)
    
    if new_level != user.level:
        old_level = user.level
        
        # Update user level
        await db.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "level": new_level,
                    "level_points": level_points,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create notification
        notification = Notification(
            user_id=user.id,
            type=NotificationType.LEVEL_UP,
            title=f"¡Subiste de nivel!",
            message=f"Has alcanzado el nivel {new_level.value.title()}",
            data={"old_level": old_level, "new_level": new_level}
        )
        await db.notifications.insert_one(notification.dict())
        
        return True
    
    return False
    return False

async def update_user_streak(user_id: str):
    """Update user's mission streak"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    
    today = datetime.utcnow().date()
    last_mission_date = user.get("last_mission_date")
    
    if last_mission_date:
        last_date = last_mission_date.date() if isinstance(last_mission_date, datetime) else last_mission_date
        if last_date == today:
            # Same day, don't update streak
            return
        elif last_date == today - timedelta(days=1):
            # Consecutive day, increase streak
            new_streak = user.get("current_streak", 0) + 1
        else:
            # Streak broken, reset to 1
            new_streak = 1
    else:
        # First mission
        new_streak = 1
    
    # Update best streak if needed
    best_streak = max(user.get("best_streak", 0), new_streak)
    
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "current_streak": new_streak,
                "best_streak": best_streak,
                "last_mission_date": datetime.utcnow()
            }
        }
    )

async def create_notification(user_id: str, notification_type: NotificationType, title: str, message: str, data: Dict[str, Any] = {}):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        data=data
    )
    await db.notifications.insert_one(notification.dict())

async def check_mission_cooldown(user_id: str, mission_id: str) -> bool:
    """Check if user can attempt a mission or is in cooldown"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return True
    
    failed_missions = user.get("failed_missions", {})
    if mission_id in failed_missions:
        failed_date = failed_missions[mission_id]
        if isinstance(failed_date, str):
            failed_date = datetime.fromisoformat(failed_date)
        
        # Check if 7 days have passed
        if datetime.utcnow() < failed_date + timedelta(days=7):
            return False
    
    return True
    type: MissionType
    points_reward: int
    position: int
    content: Dict[str, Any]
    requirements: List[str]
    status: MissionStatus
    created_at: datetime

class MissionCompletion(BaseModel):
    mission_id: str
    completion_data: Dict[str, Any] = {}

class MissionAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mission_id: str
    status: MissionAttemptStatus
    score: Optional[float] = None
    answers: Dict[str, Any] = {}
    attempt_date: datetime = Field(default_factory=datetime.utcnow)
    can_retry_after: Optional[datetime] = None

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = {}
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    icon: str
    category: BadgeCategory
    rarity: BadgeRarity
    condition: str
    points_reward: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserBadge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    progress: float = 1.0  # 1.0 means fully earned

class UserSettings(BaseModel):
    user_id: str
    dark_mode: bool = False
    notifications_enabled: bool = True
    push_notifications: bool = True
    email_notifications: bool = True
    streak_warnings: bool = True
    inactivity_warnings: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserStats(BaseModel):
    user_id: str
    total_points: int
    total_missions_completed: int
    total_missions_attempted: int
    current_streak: int
    best_streak: int
    rank: UserRank
    achievements_earned: int
    favorite_rewards_count: int
    completion_rate: float
    last_activity: datetime

class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    icon: str
    condition: str
    points_required: int = 0
    missions_required: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Reward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    type: str
    value: str
    points_cost: int
    external_url: Optional[str] = None  # Nueva funcionalidad
    available_until: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RewardCreate(BaseModel):
    title: str
    description: str
    type: str
    value: str
    points_cost: int
    external_url: Optional[str] = None
    available_until: Optional[datetime] = None

class RewardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    value: Optional[str] = None
    points_cost: Optional[int] = None
    external_url: Optional[str] = None
    available_until: Optional[datetime] = None

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    date: datetime
    organizer: str
    capacity: Optional[int] = None
    registered_users: List[str] = []
    registration_url: Optional[str] = None  # Nueva funcionalidad
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: str
    location: str
    date: datetime
    organizer: str
    capacity: Optional[int] = None
    registration_url: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    date: Optional[datetime] = None
    organizer: Optional[str] = None
    capacity: Optional[int] = None
    registration_url: Optional[str] = None

class AdminStats(BaseModel):
    total_users: int
    total_missions: int
    total_completed_missions: int
    total_points_awarded: int
    active_users_last_week: int
    most_popular_missions: List[Dict[str, Any]]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Impulsa Guayaquil API - Empowering Entrepreneurs"}

# Authentication routes
@api_router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"cedula": user_data.cedula}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this cedula or email already exists"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        nombre=user_data.nombre,
        apellido=user_data.apellido,
        cedula=user_data.cedula,
        email=user_data.email,
        nombre_emprendimiento=user_data.nombre_emprendimiento,
        hashed_password=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    return UserResponse(**user.dict())

@api_router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"cedula": user_credentials.cedula})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect cedula or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# User routes
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_admin_user)):
    users = await db.users.find().to_list(100)
    result = []
    for user in users:
        # Skip the _id field
        if '_id' in user:
            del user['_id']
        
        # Skip users that don't have the required fields
        if not all(field in user for field in ['nombre', 'apellido', 'cedula', 'email', 'nombre_emprendimiento', 'role']):
            continue
            
        result.append(UserResponse(**user))
    return result

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    # Users can only see their own profile, unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserUpdate, current_user: User = Depends(get_admin_user)):
    """Update user data (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove None values
    update_data = {k: v for k, v in user_data.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id})
    return UserResponse(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_admin_user)):
    """Delete user (Admin only)"""
    # Don't allow admin to delete themselves
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clean up user data
    await db.notifications.delete_many({"user_id": user_id})
    await db.mission_attempts.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.put("/users/{user_id}/profile-picture")
async def update_profile_picture(user_id: str, profile_data: dict, current_user: User = Depends(get_current_user)):
    # Users can only update their own profile picture, unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    profile_picture = profile_data.get("profile_picture")
    if not profile_picture:
        raise HTTPException(status_code=400, detail="Profile picture is required")
    
    # Update user profile picture
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "profile_picture": profile_picture,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Return updated user
    updated_user = await db.users.find_one({"id": user_id})
    return UserResponse(**updated_user)

@api_router.post("/users/{user_id}/favorite-reward")
async def toggle_favorite_reward(user_id: str, reward_data: dict, current_user: User = Depends(get_current_user)):
    """Toggle favorite reward for user"""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    reward_id = reward_data.get("reward_id")
    if not reward_id:
        raise HTTPException(status_code=400, detail="Reward ID is required")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    favorites = user.get("favorite_rewards", [])
    
    if reward_id in favorites:
        # Remove from favorites
        favorites.remove(reward_id)
        action = "removed"
    else:
        # Add to favorites
        favorites.append(reward_id)
        action = "added"
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"favorite_rewards": favorites, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": f"Reward {action} to/from favorites", "favorites": favorites}

@api_router.get("/users/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user statistics"""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get achievements count
    achievements = await db.achievements.find().to_list(100)
    earned_achievements = 0
    for achievement in achievements:
        if await check_achievement_eligibility(User(**user), Achievement(**achievement)):
            earned_achievements += 1
    
    completion_rate = 0
    if user.get("total_missions_attempted", 0) > 0:
        completion_rate = (user.get("total_missions_completed", 0) / user.get("total_missions_attempted", 0)) * 100
    
    return UserStats(
        user_id=user_id,
        total_points=user.get("points", 0),
        total_missions_completed=user.get("total_missions_completed", 0),
        total_missions_attempted=user.get("total_missions_attempted", 0),
        current_streak=user.get("current_streak", 0),
        best_streak=user.get("best_streak", 0),
        rank=user.get("rank", UserRank.EMPRENDEDOR_NOVATO),
        achievements_earned=earned_achievements,
        favorite_rewards_count=len(user.get("favorite_rewards", [])),
        completion_rate=completion_rate,
        last_activity=user.get("updated_at", user.get("created_at"))
    )

# Mission routes
@api_router.post("/missions", response_model=Mission)
async def create_mission(mission_data: MissionCreate, current_user: User = Depends(get_admin_user)):
    mission = Mission(**mission_data.dict(), created_by=current_user.id)
    await db.missions.insert_one(mission.dict())
    return mission

@api_router.get("/missions", response_model=List[Mission])
async def get_missions():
    missions = await db.missions.find().sort("position", 1).to_list(100)
    return [Mission(**mission) for mission in missions]

@api_router.put("/missions/{mission_id}", response_model=Mission)
async def update_mission(mission_id: str, mission_data: MissionUpdate, current_user: User = Depends(get_admin_user)):
    mission = await db.missions.find_one({"id": mission_id})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    update_data = {k: v for k, v in mission_data.dict().items() if v is not None}
    if update_data:
        await db.missions.update_one({"id": mission_id}, {"$set": update_data})
    
    updated_mission = await db.missions.find_one({"id": mission_id})
    return Mission(**updated_mission)

@api_router.delete("/missions/{mission_id}")
async def delete_mission(mission_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.missions.delete_one({"id": mission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"message": "Mission deleted successfully"}

@api_router.get("/missions/{user_id}/with-status", response_model=List[MissionWithStatus])
async def get_missions_with_status(user_id: str, current_user: User = Depends(get_current_user)):
    # Users can only see their own missions, unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    missions = await db.missions.find().sort("position", 1).to_list(100)
    completed_missions = user.get("completed_missions", [])
    
    missions_with_status = []
    for mission in missions:
        mission_obj = Mission(**mission)
        
        # Determine status
        if mission_obj.id in completed_missions:
            status = MissionStatus.COMPLETED
        else:
            # New intelligent logic: Mission is available if:
            # 1. It has no requirements (always available)
            # 2. All its requirements are met
            # 3. OR if it's one of the first 3 missions (to prevent all missions being locked)
            
            if not mission_obj.requirements:
                # No requirements - always available
                status = MissionStatus.AVAILABLE
            elif mission_obj.position <= 3:
                # First 3 missions are always available to prevent total lockout
                status = MissionStatus.AVAILABLE
            else:
                # Check if requirements are met
                requirements_met = all(req_id in completed_missions for req_id in mission_obj.requirements)
                if requirements_met:
                    status = MissionStatus.AVAILABLE
                else:
                    status = MissionStatus.LOCKED
        
        missions_with_status.append(MissionWithStatus(
            id=mission_obj.id,
            title=mission_obj.title,
            description=mission_obj.description,
            type=mission_obj.type,
            points_reward=mission_obj.points_reward,
            position=mission_obj.position,
            content=mission_obj.content,
            requirements=mission_obj.requirements,
            status=status,
            created_at=mission_obj.created_at
        ))
    
    return missions_with_status

# Badge routes
@api_router.get("/badges", response_model=List[Badge])
async def get_all_badges():
    badges = await db.badges.find().to_list(100)
    return [Badge(**badge) for badge in badges]

@api_router.get("/badges/user/{user_id}", response_model=List[dict])
async def get_user_badges(user_id: str, current_user: User = Depends(get_current_user)):
    # Users can only see their own badges, unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get user's badges with badge details
    user_badges = await db.user_badges.find({"user_id": user_id}).to_list(100)
    
    result = []
    for user_badge in user_badges:
        badge = await db.badges.find_one({"id": user_badge["badge_id"]})
        if badge:
            result.append({
                "badge": Badge(**badge),
                "earned_at": user_badge["earned_at"],
                "progress": user_badge["progress"]
            })
    
    return result

@api_router.post("/badges", response_model=Badge)
async def create_badge(badge: Badge, current_user: User = Depends(get_admin_user)):
    await db.badges.insert_one(badge.dict())
    return badge

@api_router.put("/badges/{badge_id}", response_model=Badge)
async def update_badge(badge_id: str, badge_update: Badge, current_user: User = Depends(get_admin_user)):
    badge_update.id = badge_id
    result = await db.badges.update_one(
        {"id": badge_id},
        {"$set": badge_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    updated_badge = await db.badges.find_one({"id": badge_id})
    return Badge(**updated_badge)

@api_router.delete("/badges/{badge_id}")
async def delete_badge(badge_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.badges.delete_one({"id": badge_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Badge not found")
    return {"message": "Badge deleted successfully"}

# User Settings routes
@api_router.get("/settings", response_model=UserSettings)
async def get_user_settings(current_user: User = Depends(get_current_user)):
    settings = await db.user_settings.find_one({"user_id": current_user.id})
    if not settings:
        # Create default settings
        default_settings = UserSettings(user_id=current_user.id)
        await db.user_settings.insert_one(default_settings.dict())
        return default_settings
    return UserSettings(**settings)

@api_router.put("/settings", response_model=UserSettings)
async def update_user_settings(settings_update: UserSettings, current_user: User = Depends(get_current_user)):
    settings_update.user_id = current_user.id
    settings_update.updated_at = datetime.utcnow()
    
    result = await db.user_settings.update_one(
        {"user_id": current_user.id},
        {"$set": settings_update.dict()},
        upsert=True
    )
    
    updated_settings = await db.user_settings.find_one({"user_id": current_user.id})
    return UserSettings(**updated_settings)

# Level and progress routes
@api_router.get("/user/level")
async def get_user_level_info(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_level, level_points = await calculate_user_level(user["points"])
    
    # Calculate next level requirements
    levels = [
        (UserLevel.NOVATO, 0),
        (UserLevel.PRINCIPIANTE, 100),
        (UserLevel.INTERMEDIO, 300),
        (UserLevel.AVANZADO, 600),
        (UserLevel.EXPERTO, 1000),
        (UserLevel.MAESTRO, 1500),
        (UserLevel.LEYENDA, 2500)
    ]
    
    next_level = None
    points_to_next = None
    
    for i, (level, threshold) in enumerate(levels):
        if level == current_level and i < len(levels) - 1:
            next_level = levels[i + 1][0]
            points_to_next = levels[i + 1][1] - user["points"]
            break
    
    return {
        "current_level": current_level,
        "level_points": level_points,
        "total_points": user["points"],
        "next_level": next_level,
        "points_to_next": points_to_next,
        "progress_percentage": (level_points / (points_to_next + level_points)) * 100 if points_to_next else 100
    }

# Notification management with enhanced types
@api_router.post("/notifications/push-subscription")
async def save_push_subscription(subscription_data: dict, current_user: User = Depends(get_current_user)):
    """Save push notification subscription for user"""
    # Update user with push subscription info
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"push_subscription": subscription_data, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Push subscription saved successfully"}

@api_router.post("/notifications/send-test")
async def send_test_notification(current_user: User = Depends(get_current_user)):
    """Send test notification to user"""
    notification = Notification(
        user_id=current_user.id,
        type=NotificationType.MISSION_RECOMMENDATION,
        title="¡Notificación de prueba!",
        message="Esta es una notificación de prueba para verificar que el sistema funciona correctamente.",
        data={"test": True}
    )
    await db.notifications.insert_one(notification.dict())
    return {"message": "Test notification sent"}

# Mission recommendation system
@api_router.get("/missions/recommendations")
async def get_mission_recommendations(current_user: User = Depends(get_current_user)):
    """Get personalized mission recommendations for user"""
    user = await db.users.find_one({"id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get available missions
    missions = await db.missions.find().sort("position", 1).to_list(100)
    completed_missions = user.get("completed_missions", [])
    
    recommendations = []
    for mission in missions:
        mission_obj = Mission(**mission)
        
        # Skip completed missions
        if mission_obj.id in completed_missions:
            continue
        
        # Check if requirements are met
        requirements_met = all(req_id in completed_missions for req_id in mission_obj.requirements)
        if requirements_met:
            # Calculate recommendation score based on user profile
            score = 0
            
            # Prefer missions with higher points
            score += mission_obj.points_reward * 0.1
            
            # Prefer missions suitable for user's level
            if mission_obj.points_reward <= user["points"] * 0.5:
                score += 10
            
            # Prefer certain types based on user's history
            if len(completed_missions) < 3:
                if mission_obj.type in [MissionType.MICROVIDEO, MissionType.MINI_QUIZ]:
                    score += 15
            
            recommendations.append({
                "mission": mission_obj,
                "score": score,
                "reason": f"Recomendada para tu nivel {user.get('level', 'novato')}"
            })
    
    # Sort by score and return top 3
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:3]

@api_router.post("/missions/complete")
async def complete_mission(completion: MissionCompletion, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    mission = await db.missions.find_one({"id": completion.mission_id})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Check if already completed
    if completion.mission_id in user.get("completed_missions", []):
        raise HTTPException(status_code=400, detail="Mission already completed")
    
    # Check cooldown for mini-quiz missions
    if mission["type"] == "mini_quiz":
        if not await check_mission_cooldown(current_user.id, completion.mission_id):
            failed_missions = user.get("failed_missions", {})
            failed_date = failed_missions[completion.mission_id]
            if isinstance(failed_date, str):
                failed_date = datetime.fromisoformat(failed_date)
            
            retry_date = failed_date + timedelta(days=7)
            remaining_days = (retry_date - datetime.utcnow()).days
            
            raise HTTPException(
                status_code=400, 
                detail=f"Mission failed recently. You can retry in {remaining_days} days."
            )
    
    # Validate mission completion for mini-quiz
    success = True
    score = 100.0
    
    if mission["type"] == "mini_quiz":
        completion_data = completion.completion_data
        user_answers = completion_data.get("quiz_answers", {})
        questions = mission.get("content", {}).get("questions", [])
        
        if not questions:
            raise HTTPException(status_code=400, detail="Quiz has no questions")
        
        correct_answers = 0
        total_questions = len(questions)
        
        for i, question in enumerate(questions):
            user_answer = user_answers.get(str(i))
            correct_answer = question.get("correct_answer")
            
            if user_answer is not None and user_answer == correct_answer:
                correct_answers += 1
        
        score = (correct_answers / total_questions) * 100
        success = score >= 70  # 70% minimum to pass
    
    # Record mission attempt
    attempt = MissionAttempt(
        user_id=current_user.id,
        mission_id=completion.mission_id,
        status=MissionAttemptStatus.SUCCESS if success else MissionAttemptStatus.FAILED,
        score=score,
        answers=completion.completion_data.get("quiz_answers", {}),
        can_retry_after=datetime.utcnow() + timedelta(days=7) if not success and mission["type"] == "mini_quiz" else None
    )
    
    await db.mission_attempts.insert_one(attempt.dict())
    
    # Update user stats
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"total_missions_attempted": 1}}
    )
    
    if success:
        # Mission completed successfully
        new_points = user.get("points", 0) + mission["points_reward"]
        new_completed_missions = user.get("completed_missions", []) + [completion.mission_id]
        
        # Update rank based on points
        rank = UserRank.EMPRENDEDOR_NOVATO
        if new_points >= 1000:
            rank = UserRank.EMPRENDEDOR_MASTER
        elif new_points >= 500:
            rank = UserRank.EMPRENDEDOR_EXPERTO
        elif new_points >= 250:
            rank = UserRank.EMPRENDEDOR_SENIOR
        elif new_points >= 100:
            rank = UserRank.EMPRENDEDOR_JUNIOR
        
        # Check for rank up
        old_rank = user.get("rank", UserRank.EMPRENDEDOR_NOVATO)
        rank_up = rank != old_rank
        
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "points": new_points,
                    "rank": rank,
                    "completed_missions": new_completed_missions,
                    "updated_at": datetime.utcnow()
                },
                "$inc": {"total_missions_completed": 1}
            }
        )
        
        # Update user streak
        await update_user_streak(current_user.id)
        
        # Create notifications
        if rank_up:
            await create_notification(
                current_user.id,
                NotificationType.RANK_UP,
                "¡Nuevo Rango!",
                f"¡Felicitaciones! Has alcanzado el rango {rank.replace('_', ' ').title()}",
                {"new_rank": rank, "old_rank": old_rank}
            )
        
        # Check for new achievements
        achievements = await db.achievements.find().to_list(100)
        updated_user = await db.users.find_one({"id": current_user.id})
        
        for achievement in achievements:
            if await check_achievement_eligibility(User(**updated_user), Achievement(**achievement)):
                await create_notification(
                    current_user.id,
                    NotificationType.NEW_ACHIEVEMENT,
                    "¡Nuevo Logro Desbloqueado!",
                    f"Has desbloqueado: {achievement['title']}",
                    {"achievement_id": achievement["id"]}
                )
        
        return {
            "message": "Mission completed successfully", 
            "points_earned": mission["points_reward"],
            "total_points": new_points,
            "new_rank": rank,
            "rank_up": rank_up,
            "score": score
        }
    else:
        # Mission failed
        failed_missions = user.get("failed_missions", {})
        failed_missions[completion.mission_id] = datetime.utcnow()
        
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "failed_missions": failed_missions,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": "Mission failed. You can retry in 7 days.",
            "points_earned": 0,
            "score": score,
            "retry_after": datetime.utcnow() + timedelta(days=7)
        }

# Achievement routes
@api_router.post("/achievements", response_model=Achievement)
async def create_achievement(achievement: Achievement, current_user: User = Depends(get_admin_user)):
    await db.achievements.insert_one(achievement.dict())
    return achievement

@api_router.get("/achievements", response_model=List[Achievement])
async def get_achievements():
    achievements = await db.achievements.find().to_list(100)
    return [Achievement(**achievement) for achievement in achievements]

@api_router.get("/achievements/eligible", response_model=List[Achievement])
async def get_eligible_achievements(current_user: User = Depends(get_current_user)):
    """Get achievements that user is eligible for"""
    user = await db.users.find_one({"id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    achievements = await db.achievements.find().to_list(100)
    eligible_achievements = []
    
    for achievement in achievements:
        if await check_achievement_eligibility(User(**user), Achievement(**achievement)):
            eligible_achievements.append(Achievement(**achievement))
    
    return eligible_achievements

@api_router.put("/achievements/{achievement_id}", response_model=Achievement)
async def update_achievement(achievement_id: str, achievement_data: dict, current_user: User = Depends(get_admin_user)):
    achievement = await db.achievements.find_one({"id": achievement_id})
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    # Remove None values
    update_data = {k: v for k, v in achievement_data.items() if v is not None}
    if update_data:
        await db.achievements.update_one({"id": achievement_id}, {"$set": update_data})
    
    updated_achievement = await db.achievements.find_one({"id": achievement_id})
    return Achievement(**updated_achievement)

@api_router.delete("/achievements/{achievement_id}")
async def delete_achievement(achievement_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.achievements.delete_one({"id": achievement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return {"message": "Achievement deleted successfully"}

# Reward routes
@api_router.post("/rewards", response_model=Reward)
async def create_reward(reward: RewardCreate, current_user: User = Depends(get_admin_user)):
    new_reward = Reward(**reward.dict())
    await db.rewards.insert_one(new_reward.dict())
    return new_reward

@api_router.get("/rewards", response_model=List[Reward])
async def get_rewards():
    rewards = await db.rewards.find().to_list(100)
    return [Reward(**reward) for reward in rewards]

@api_router.put("/rewards/{reward_id}", response_model=Reward)
async def update_reward(reward_id: str, reward_data: RewardUpdate, current_user: User = Depends(get_admin_user)):
    reward = await db.rewards.find_one({"id": reward_id})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Remove None values
    update_data = {k: v for k, v in reward_data.dict().items() if v is not None}
    if update_data:
        await db.rewards.update_one({"id": reward_id}, {"$set": update_data})
    
    updated_reward = await db.rewards.find_one({"id": reward_id})
    return Reward(**updated_reward)

@api_router.delete("/rewards/{reward_id}")
async def delete_reward(reward_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.rewards.delete_one({"id": reward_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"message": "Reward deleted successfully"}

# Event routes
@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate, current_user: User = Depends(get_admin_user)):
    new_event = Event(**event.dict())
    await db.events.insert_one(new_event.dict())
    return new_event

@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find().sort("date", 1).to_list(100)
    return [Event(**event) for event in events]

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventUpdate, current_user: User = Depends(get_admin_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Remove None values
    update_data = {k: v for k, v in event_data.dict().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    updated_event = await db.events.find_one({"id": event_id})
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Notification routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user.id}).sort("created_at", -1).to_list(50)
    return [Notification(**notification) for notification in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    notification = await db.notifications.find_one({"id": notification_id, "user_id": current_user.id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: User = Depends(get_current_user)):
    result = await db.notifications.delete_one({"id": notification_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}

# Mission attempt routes
@api_router.get("/missions/{mission_id}/attempts", response_model=List[MissionAttempt])
async def get_mission_attempts(mission_id: str, current_user: User = Depends(get_current_user)):
    attempts = await db.mission_attempts.find({"user_id": current_user.id, "mission_id": mission_id}).sort("attempt_date", -1).to_list(10)
    return [MissionAttempt(**attempt) for attempt in attempts]

@api_router.get("/missions/{mission_id}/cooldown")
async def check_mission_cooldown_status(mission_id: str, current_user: User = Depends(get_current_user)):
    can_attempt = await check_mission_cooldown(current_user.id, mission_id)
    
    if can_attempt:
        return {"can_attempt": True, "message": "Mission available"}
    else:
        user = await db.users.find_one({"id": current_user.id})
        failed_missions = user.get("failed_missions", {})
        failed_date = failed_missions[mission_id]
        if isinstance(failed_date, str):
            failed_date = datetime.fromisoformat(failed_date)
        
        retry_date = failed_date + timedelta(days=7)
        remaining_hours = (retry_date - datetime.utcnow()).total_seconds() / 3600
        
        return {
            "can_attempt": False,
            "message": f"Mission in cooldown. Retry in {int(remaining_hours)} hours.",
            "retry_after": retry_date
        }

# Ranking routes
@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10, current_user: User = Depends(get_current_user)):
    """Get user leaderboard"""
    users = await db.users.find({"role": "emprendedor"}).sort("points", -1).limit(limit).to_list(limit)
    
    leaderboard = []
    for i, user in enumerate(users):
        leaderboard.append({
            "rank": i + 1,
            "name": f"{user.get('nombre', '')} {user.get('apellido', '')}",
            "points": user.get("points", 0),
            "rank_title": user.get("rank", UserRank.EMPRENDEDOR_NOVATO),
            "current_streak": user.get("current_streak", 0),
            "completed_missions": len(user.get("completed_missions", [])),
            "is_current_user": user.get("id") == current_user.id
        })
    
    return {"leaderboard": leaderboard}

# Admin routes
@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: User = Depends(get_admin_user)):
    # Calculate stats
    total_users = await db.users.count_documents({})
    total_missions = await db.missions.count_documents({})
    
    # Get all users to calculate completed missions and points
    users = await db.users.find().to_list(1000)
    total_completed_missions = sum(len(user.get("completed_missions", [])) for user in users)
    total_points_awarded = sum(user.get("points", 0) for user in users)
    
    # Active users last week (users with recent activity)
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_users_last_week = await db.users.count_documents({"updated_at": {"$gte": week_ago}})
    
    # Most popular missions (by completion count)
    missions = await db.missions.find().to_list(1000)
    mission_completions = {}
    
    for user in users:
        for mission_id in user.get("completed_missions", []):
            mission_completions[mission_id] = mission_completions.get(mission_id, 0) + 1
    
    # Sort missions by completion count
    sorted_missions = sorted(missions, key=lambda m: mission_completions.get(m["id"], 0), reverse=True)[:5]
    
    most_popular_missions = [
        {
            "id": mission["id"],
            "title": mission["title"],
            "completions": mission_completions.get(mission["id"], 0)
        }
        for mission in sorted_missions
    ]
    
    return AdminStats(
        total_users=total_users,
        total_missions=total_missions,
        total_completed_missions=total_completed_missions,
        total_points_awarded=total_points_awarded,
        active_users_last_week=active_users_last_week,
        most_popular_missions=most_popular_missions
    )

# Initialize sample data
@api_router.post("/initialize-data")
async def initialize_sample_data():
    # Create admin user if it doesn't exist
    admin_user = await db.users.find_one({"cedula": "0000000000"})
    if not admin_user:
        admin = User(
            nombre="Admin",
            apellido="Sistema",
            cedula="0000000000",
            email="admin@impulsa.guayaquil.ec",
            nombre_emprendimiento="Sistema Impulsa Guayaquil",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN,
            points=9999,
            rank=UserRank.EMPRENDEDOR_MASTER
        )
        await db.users.insert_one(admin.dict())
    
    # Clear existing data
    await db.missions.delete_many({})
    await db.achievements.delete_many({})
    await db.rewards.delete_many({})
    await db.events.delete_many({})
    
    # Create comprehensive sample missions
    sample_missions = [
        # Beginner Level Missions (1-10)
        {
            "title": "🎬 Microvideo: Tu Historia Emprendedora",
            "description": "Graba un video de 60 segundos contando tu historia como emprendedor en Guayaquil",
            "type": "microvideo",
            "points_reward": 50,
            "position": 1,
            "content": {
                "instructions": "Graba un video corto presentándote y explicando tu emprendimiento",
                "max_duration": 60,
                "topics": ["Tu nombre", "Tu emprendimiento", "Tu motivación", "Tu visión para Guayaquil"]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📝 Mini-Quiz: Fundamentos del Emprendimiento",
            "description": "Responde preguntas básicas sobre emprendimiento en Ecuador",
            "type": "mini_quiz",
            "points_reward": 30,
            "position": 2,
            "content": {
                "questions": [
                    {
                        "question": "¿Cuál es el primer paso para crear una empresa en Ecuador?",
                        "options": ["Registrar la marca", "Obtener el RUC", "Abrir una cuenta bancaria", "Contratar empleados"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Qué significa MVP en emprendimiento?",
                        "options": ["Most Valuable Player", "Minimum Viable Product", "Maximum Value Proposition", "Marketing Viral Plan"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Cuál es la capital económica de Ecuador?",
                        "options": ["Quito", "Cuenca", "Guayaquil", "Ambato"],
                        "correct_answer": 2
                    }
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📋 Guía Descargable: Trámites Legales",
            "description": "Descarga y revisa la guía completa de trámites para emprendedores en Ecuador",
            "type": "downloadable_guide",
            "points_reward": 40,
            "position": 3,
            "content": {
                "guide_url": "https://example.com/guia-tramites-ecuador.pdf",
                "topics": ["RUC", "IESS", "Permisos municipales", "Patentes"],
                "completion_requirement": "Confirmar lectura y responder pregunta final"
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📈 Tarea Práctica: Plan de Negocio Básico",
            "description": "Crea un plan de negocio básico para tu emprendimiento siguiendo nuestra plantilla",
            "type": "practical_task",
            "points_reward": 80,
            "position": 4,
            "content": {
                "template_sections": [
                    "Resumen ejecutivo",
                    "Descripción del producto/servicio",
                    "Análisis de mercado",
                    "Estrategia de marketing",
                    "Proyección financiera básica"
                ],
                "deadline_hours": 48
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "💡 Consejo Experto: Networking en Guayaquil",
            "description": "Aprende estrategias de networking específicas para el ecosistema emprendedor de Guayaquil",
            "type": "expert_advice",
            "points_reward": 35,
            "position": 5,
            "content": {
                "expert_name": "Carlos Mendoza",
                "expert_title": "Mentor de Emprendimiento - Cámara de Comercio de Guayaquil",
                "video_url": "https://example.com/video-networking.mp4",
                "key_points": [
                    "Eventos clave en Guayaquil",
                    "Plataformas digitales locales",
                    "Cómo preparar tu elevator pitch",
                    "Seguimiento efectivo de contactos"
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "💰 Mini-Quiz: Finanzas para Emprendedores",
            "description": "Aprende conceptos básicos de finanzas y gestión de dinero para tu negocio",
            "type": "mini_quiz",
            "points_reward": 45,
            "position": 6,
            "content": {
                "questions": [
                    {
                        "question": "¿Qué es el flujo de caja?",
                        "options": ["Dinero total de la empresa", "Dinero que entra y sale", "Ganancias del mes", "Inversión inicial"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Cuál es la diferencia entre ingreso y ganancia?",
                        "options": ["Son lo mismo", "Ganancia = Ingreso - Gastos", "Ingreso = Ganancia + Gastos", "No hay diferencia"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Qué es un presupuesto?",
                        "options": ["Dinero disponible", "Plan de gastos e ingresos", "Dinero guardado", "Inversión total"],
                        "correct_answer": 1
                    }
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎯 Tarea Práctica: Define tu Cliente Ideal",
            "description": "Identifica y describe detalladamente tu cliente ideal (buyer persona)",
            "type": "practical_task",
            "points_reward": 60,
            "position": 7,
            "content": {
                "template_sections": [
                    "Datos demográficos",
                    "Comportamiento de compra",
                    "Problemas y necesidades",
                    "Dónde encuentra información",
                    "Qué lo motiva a comprar"
                ],
                "deadline_hours": 24
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📱 Microvideo: Presenta tu Producto",
            "description": "Graba un video de 90 segundos mostrando tu producto o servicio",
            "type": "microvideo",
            "points_reward": 70,
            "position": 8,
            "content": {
                "instructions": "Muestra tu producto/servicio de manera atractiva y explica sus beneficios",
                "max_duration": 90,
                "topics": ["Qué es tu producto", "Beneficios clave", "Cómo funciona", "Por qué es único"]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🏆 Consejo Experto: Estrategias de Ventas",
            "description": "Aprende técnicas de ventas efectivas para emprendedores principiantes",
            "type": "expert_advice",
            "points_reward": 55,
            "position": 9,
            "content": {
                "expert_name": "María González",
                "expert_title": "Consultora en Ventas - Guayaquil Chamber",
                "video_url": "https://example.com/video-ventas.mp4",
                "key_points": [
                    "Técnicas de cierre de ventas",
                    "Manejo de objeciones",
                    "Construir relaciones a largo plazo",
                    "Estrategias de seguimiento"
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📊 Tarea Práctica: Análisis de Competencia",
            "description": "Investiga y analiza a tu competencia directa e indirecta",
            "type": "practical_task",
            "points_reward": 65,
            "position": 10,
            "content": {
                "template_sections": [
                    "Competidores directos",
                    "Competidores indirectos",
                    "Precios de la competencia",
                    "Fortalezas y debilidades",
                    "Oportunidades identificadas"
                ],
                "deadline_hours": 36
            },
            "requirements": [],
            "created_by": "system"
        },
        
        # Intermediate Level Missions (11-20)
        {
            "title": "🌐 Guía Descargable: Marketing Digital",
            "description": "Descarga la guía completa de marketing digital para pequeños negocios",
            "type": "downloadable_guide",
            "points_reward": 50,
            "position": 11,
            "content": {
                "guide_url": "https://example.com/guia-marketing-digital.pdf",
                "topics": ["Redes sociales", "SEO básico", "Email marketing", "Publicidad online"],
                "completion_requirement": "Implementar una estrategia de la guía"
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📞 Tarea Práctica: Crear Elevator Pitch",
            "description": "Desarrolla tu elevator pitch perfecto en 30 segundos",
            "type": "practical_task",
            "points_reward": 55,
            "position": 12,
            "content": {
                "template_sections": [
                    "Gancho inicial",
                    "Problema que resuelves",
                    "Tu solución",
                    "Beneficio clave",
                    "Llamada a la acción"
                ],
                "deadline_hours": 12
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "💡 Mini-Quiz: Innovación y Creatividad",
            "description": "Desarrolla tu mentalidad innovadora y creativa",
            "type": "mini_quiz",
            "points_reward": 40,
            "position": 13,
            "content": {
                "questions": [
                    {
                        "question": "¿Qué es la innovación disruptiva?",
                        "options": ["Cambio pequeño", "Cambio radical", "Mejora continua", "Copia de ideas"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Cuál es la mejor fuente de ideas innovadoras?",
                        "options": ["Internet", "Problemas no resueltos", "Competencia", "Libros"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Qué significa 'pensar fuera de la caja'?",
                        "options": ["Ser ordenado", "Ser creativo", "Ser metódico", "Ser cauteloso"],
                        "correct_answer": 1
                    }
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎨 Microvideo: Storytelling de Marca",
            "description": "Cuenta la historia de tu marca de manera emotiva y memorable",
            "type": "microvideo",
            "points_reward": 85,
            "position": 14,
            "content": {
                "instructions": "Crea una historia que conecte emocionalmente con tu audiencia",
                "max_duration": 120,
                "topics": ["Origen de tu idea", "Desafíos superados", "Impacto en clientes", "Visión futura"]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎯 Consejo Experto: Gestión del Tiempo",
            "description": "Aprende a maximizar tu productividad como emprendedor",
            "type": "expert_advice",
            "points_reward": 45,
            "position": 15,
            "content": {
                "expert_name": "Roberto Silva",
                "expert_title": "Coach de Productividad - Guayaquil Business Center",
                "video_url": "https://example.com/video-productividad.mp4",
                "key_points": [
                    "Técnica Pomodoro",
                    "Matriz de Eisenhower",
                    "Automatización de tareas",
                    "Delegación efectiva"
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📈 Tarea Práctica: Proyección Financiera",
            "description": "Crea proyecciones financieras realistas para tu negocio",
            "type": "practical_task",
            "points_reward": 90,
            "position": 16,
            "content": {
                "template_sections": [
                    "Ingresos proyectados",
                    "Gastos operativos",
                    "Punto de equilibrio",
                    "Flujo de caja mensual",
                    "Análisis de rentabilidad"
                ],
                "deadline_hours": 72
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🤝 Microvideo: Testimonios de Clientes",
            "description": "Graba testimonios reales de tus clientes satisfechos",
            "type": "microvideo",
            "points_reward": 100,
            "position": 17,
            "content": {
                "instructions": "Presenta testimonios auténticos que generen confianza",
                "max_duration": 150,
                "topics": ["Problema del cliente", "Solución proporcionada", "Resultados obtenidos", "Recomendación"]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🏪 Guía Descargable: Retail y Punto de Venta",
            "description": "Optimiza tu punto de venta físico o virtual",
            "type": "downloadable_guide",
            "points_reward": 60,
            "position": 18,
            "content": {
                "guide_url": "https://example.com/guia-retail.pdf",
                "topics": ["Merchandising", "Experiencia del cliente", "Sistemas de pago", "Gestión de inventario"],
                "completion_requirement": "Implementar 3 mejoras en tu punto de venta"
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎪 Tarea Práctica: Evento de Lanzamiento",
            "description": "Planifica y ejecuta un evento de lanzamiento para tu producto",
            "type": "practical_task",
            "points_reward": 120,
            "position": 19,
            "content": {
                "template_sections": [
                    "Objetivos del evento",
                    "Público objetivo",
                    "Presupuesto y logística",
                    "Plan de promoción",
                    "Métricas de éxito"
                ],
                "deadline_hours": 96
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "💎 Mini-Quiz: Liderazgo Emprendedor",
            "description": "Desarrolla habilidades de liderazgo para tu equipo",
            "type": "mini_quiz",
            "points_reward": 50,
            "position": 20,
            "content": {
                "questions": [
                    {
                        "question": "¿Cuál es la principal cualidad de un líder emprendedor?",
                        "options": ["Autoridad", "Inspiración", "Control", "Experiencia"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Cómo se motiva mejor a un equipo?",
                        "options": ["Con dinero", "Con reconocimiento", "Con propósito", "Con presión"],
                        "correct_answer": 2
                    },
                    {
                        "question": "¿Qué es delegación efectiva?",
                        "options": ["Dar órdenes", "Asignar tareas con objetivos claros", "Hacer todo uno mismo", "Controlar cada detalle"],
                        "correct_answer": 1
                    }
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        
        # Advanced Level Missions (21-30)
        {
            "title": "🌟 Consejo Experto: Scaling Your Business",
            "description": "Aprende estrategias para escalar tu negocio exitosamente",
            "type": "expert_advice",
            "points_reward": 80,
            "position": 21,
            "content": {
                "expert_name": "Ana Delgado",
                "expert_title": "CEO - Guayaquil Ventures",
                "video_url": "https://example.com/video-scaling.mp4",
                "key_points": [
                    "Sistemas escalables",
                    "Automatización de procesos",
                    "Construcción de equipos",
                    "Búsqueda de inversión"
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎬 Microvideo: Presentación de Inversión",
            "description": "Graba tu pitch deck perfecto para inversores",
            "type": "microvideo",
            "points_reward": 150,
            "position": 22,
            "content": {
                "instructions": "Presenta tu negocio como una oportunidad de inversión atractiva",
                "max_duration": 180,
                "topics": ["Problema y solución", "Tamaño del mercado", "Modelo de negocio", "Proyecciones financieras"]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🏅 Tarea Práctica: Plan de Expansión",
            "description": "Desarrolla un plan detallado para expandir tu negocio",
            "type": "practical_task",
            "points_reward": 140,
            "position": 23,
            "content": {
                "template_sections": [
                    "Análisis de mercado objetivo",
                    "Estrategia de entrada",
                    "Recursos necesarios",
                    "Timeline de implementación",
                    "Análisis de riesgos"
                ],
                "deadline_hours": 120
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "💻 Guía Descargable: Transformación Digital",
            "description": "Digitaliza tu negocio con herramientas modernas",
            "type": "downloadable_guide",
            "points_reward": 70,
            "position": 24,
            "content": {
                "guide_url": "https://example.com/guia-digital.pdf",
                "topics": ["E-commerce", "CRM", "Automatización", "Analytics"],
                "completion_requirement": "Implementar 2 herramientas digitales"
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎯 Mini-Quiz: Estrategia Competitiva",
            "description": "Domina las estrategias para competir en tu mercado",
            "type": "mini_quiz",
            "points_reward": 60,
            "position": 25,
            "content": {
                "questions": [
                    {
                        "question": "¿Qué es ventaja competitiva?",
                        "options": ["Ser el más barato", "Ser único y valioso", "Ser el primero", "Ser el más grande"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Cuál es la mejor estrategia para un mercado maduro?",
                        "options": ["Competir en precio", "Diferenciación", "Copiar líderes", "Abandonar el mercado"],
                        "correct_answer": 1
                    },
                    {
                        "question": "¿Qué es un océano azul?",
                        "options": ["Mercado saturado", "Nuevo mercado sin competencia", "Mercado en declive", "Mercado internacional"],
                        "correct_answer": 1
                    }
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🚀 Tarea Práctica: Innovación de Producto",
            "description": "Desarrolla una innovación significativa para tu producto/servicio",
            "type": "practical_task",
            "points_reward": 130,
            "position": 26,
            "content": {
                "template_sections": [
                    "Identificación de oportunidades",
                    "Concepto de innovación",
                    "Validación con usuarios",
                    "Plan de desarrollo",
                    "Estrategia de lanzamiento"
                ],
                "deadline_hours": 96
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🎖️ Consejo Experto: Sostenibilidad Empresarial",
            "description": "Construye un negocio sostenible y responsable",
            "type": "expert_advice",
            "points_reward": 75,
            "position": 27,
            "content": {
                "expert_name": "Patricia Morales",
                "expert_title": "Especialista en Sostenibilidad - EcoGuayaquil",
                "video_url": "https://example.com/video-sostenibilidad.mp4",
                "key_points": [
                    "Responsabilidad social",
                    "Impacto ambiental",
                    "Economía circular",
                    "Certificaciones verdes"
                ]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "📺 Microvideo: Caso de Éxito",
            "description": "Documenta un caso de éxito real de tu emprendimiento",
            "type": "microvideo",
            "points_reward": 160,
            "position": 28,
            "content": {
                "instructions": "Presenta un caso de éxito detallado que inspire a otros emprendedores",
                "max_duration": 200,
                "topics": ["Desafío enfrentado", "Estrategia implementada", "Resultados obtenidos", "Lecciones aprendidas"]
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "🏆 Tarea Práctica: Mentoría a Otro Emprendedor",
            "description": "Comparte tu experiencia mentoreando a otro emprendedor",
            "type": "practical_task",
            "points_reward": 200,
            "position": 29,
            "content": {
                "template_sections": [
                    "Perfil del mentoreado",
                    "Objetivos de mentoría",
                    "Plan de sesiones",
                    "Herramientas compartidas",
                    "Resultados alcanzados"
                ],
                "deadline_hours": 168
            },
            "requirements": [],
            "created_by": "system"
        },
        {
            "title": "👑 Consejo Experto: Legado Emprendedor",
            "description": "Construye un legado duradero con tu emprendimiento",
            "type": "expert_advice",
            "points_reward": 100,
            "position": 30,
            "content": {
                "expert_name": "Diego Zambrano",
                "expert_title": "Fundador - Legacy Builders Guayaquil",
                "video_url": "https://example.com/video-legado.mp4",
                "key_points": [
                    "Visión a largo plazo",
                    "Impacto social",
                    "Sucesión empresarial",
                    "Inspiración para futuras generaciones"
                ]
            },
            "requirements": [],
            "created_by": "system"
        }
    ]
    
    for mission_data in sample_missions:
        mission = Mission(**mission_data)
        await db.missions.insert_one(mission.dict())
    
    # Create sample rewards
    sample_rewards = [
        {
            "title": "Certificado de Emprendedor Novato",
            "description": "Certificado digital que acredita tu participación en el programa",
            "type": "certificate",
            "value": "PDF Certificate",
            "points_cost": 50,
            "external_url": "https://impulsa.guayaquil.gob.ec/certificado-novato"
        },
        {
            "title": "Descuento en Consultoría",
            "description": "20% de descuento en servicios de consultoría empresarial",
            "type": "discount",
            "value": "20% off",
            "points_cost": 150,
            "external_url": "https://impulsa.guayaquil.gob.ec/consultoria-descuento"
        },
        {
            "title": "Entrada VIP a Evento",
            "description": "Entrada prioritaria al próximo evento de emprendimiento en Guayaquil",
            "type": "event_access",
            "value": "VIP Access",
            "points_cost": 200,
            "external_url": "https://impulsa.guayaquil.gob.ec/evento-vip"
        },
        {
            "title": "Mentoría Personalizada",
            "description": "Sesión de mentoría 1:1 con experto en emprendimiento",
            "type": "mentorship",
            "value": "1 hour session",
            "points_cost": 300,
            "external_url": "https://impulsa.guayaquil.gob.ec/mentoria-personalizada"
        }
    ]
    
    for reward_data in sample_rewards:
        reward = Reward(**reward_data)
        await db.rewards.insert_one(reward.dict())
    
    # Create sample events
    sample_events = [
        {
            "title": "Feria de Emprendimiento Guayaquil 2025",
            "description": "Evento anual donde los emprendedores pueden mostrar sus proyectos",
            "location": "Centro de Convenciones de Guayaquil",
            "date": datetime(2025, 8, 15, 9, 0),
            "organizer": "Cámara de Comercio de Guayaquil",
            "capacity": 500,
            "registration_url": "https://impulsa.guayaquil.gob.ec/feria-emprendimiento-2025"
        },
        {
            "title": "Workshop: Marketing Digital para Emprendedores",
            "description": "Taller intensivo sobre estrategias de marketing digital",
            "location": "ESPOL - Guayaquil",
            "date": datetime(2025, 8, 5, 14, 0),
            "organizer": "ESPOL Entrepreneurship Center",
            "capacity": 50,
            "registration_url": "https://impulsa.guayaquil.gob.ec/workshop-marketing-digital"
        },
        {
            "title": "Networking: Conecta con Inversores",
            "description": "Evento de networking exclusivo para emprendedores y inversores",
            "location": "Hotel Hilton Colon Guayaquil",
            "date": datetime(2025, 8, 20, 18, 0),
            "organizer": "Angel Investors Guayaquil",
            "capacity": 100,
            "registration_url": "https://impulsa.guayaquil.gob.ec/networking-inversores"
        }
    ]
    
    for event_data in sample_events:
        event = Event(**event_data)
        await db.events.insert_one(event.dict())
    
    # Create enhanced achievements
    sample_achievements = [
        {
            "title": "Primer Paso",
            "description": "Completaste tu primera misión",
            "icon": "🚀",
            "condition": "complete_1_mission",
            "missions_required": 1
        },
        {
            "title": "Emprendedor Activo",
            "description": "Completaste 5 misiones",
            "icon": "⭐",
            "condition": "complete_5_missions",
            "missions_required": 5
        },
        {
            "title": "Guayaquileño Comprometido",
            "description": "Alcanzaste 100 puntos",
            "icon": "🏆",
            "condition": "reach_100_points",
            "points_required": 100
        },
        {
            "title": "Emprendedor Experimentado",
            "description": "Alcanzaste 500 puntos",
            "icon": "💎",
            "condition": "reach_500_points",
            "points_required": 500
        },
        {
            "title": "Maestro Emprendedor",
            "description": "Alcanzaste 1000 puntos",
            "icon": "👑",
            "condition": "reach_1000_points",
            "points_required": 1000
        },
        {
            "title": "Racha de Fuego",
            "description": "Mantén una racha de 5 días completando misiones",
            "icon": "🔥",
            "condition": "streak_5_days",
            "missions_required": 5
        },
        {
            "title": "Imparable",
            "description": "Mantén una racha de 10 días completando misiones",
            "icon": "⚡",
            "condition": "streak_10_days",
            "missions_required": 10
        }
    ]
    
    for achievement_data in sample_achievements:
        achievement = Achievement(**achievement_data)
        await db.achievements.insert_one(achievement.dict())
    
    return {"message": "Sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Impulsa Guayaquil API", version="1.0.0")

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

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    points: int = 0
    rank: UserRank = UserRank.EMPRENDEDOR_NOVATO
    completed_missions: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str

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
    position: int  # Position in the path (1, 2, 3, etc.)
    content: Dict[str, Any] = {}  # Flexible content based on mission type
    requirements: List[str] = []  # Mission IDs that must be completed first
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class MissionCreate(BaseModel):
    title: str
    description: str
    type: MissionType
    points_reward: int
    position: int
    content: Dict[str, Any] = {}
    requirements: List[str] = []

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

class MissionCompletion(BaseModel):
    mission_id: str
    user_id: str
    completion_data: Dict[str, Any] = {}

class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    icon: str
    condition: str  # e.g., "complete_5_missions", "reach_100_points"
    points_required: int = 0
    missions_required: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Reward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    type: str  # "badge", "discount", "certificate", etc.
    value: str
    points_cost: int
    available_until: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    date: datetime
    organizer: str
    capacity: Optional[int] = None
    registered_users: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Impulsa Guayaquil API - Empowering Entrepreneurs"}

# User routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(100)
    return [User(**user) for user in users]

# Mission routes
@api_router.post("/missions", response_model=Mission)
async def create_mission(mission_data: MissionCreate):
    mission = Mission(**mission_data.dict())
    await db.missions.insert_one(mission.dict())
    return mission

@api_router.get("/missions", response_model=List[Mission])
async def get_missions():
    missions = await db.missions.find().sort("position", 1).to_list(100)
    return [Mission(**mission) for mission in missions]

@api_router.get("/missions/{user_id}/with-status", response_model=List[MissionWithStatus])
async def get_missions_with_status(user_id: str):
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

@api_router.post("/missions/complete")
async def complete_mission(completion: MissionCompletion):
    user = await db.users.find_one({"id": completion.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    mission = await db.missions.find_one({"id": completion.mission_id})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Check if already completed
    if completion.mission_id in user.get("completed_missions", []):
        raise HTTPException(status_code=400, detail="Mission already completed")
    
    # Update user
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
    
    await db.users.update_one(
        {"id": completion.user_id},
        {
            "$set": {
                "points": new_points,
                "rank": rank,
                "completed_missions": new_completed_missions,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Mission completed successfully", "points_earned": mission["points_reward"]}

# Achievement routes
@api_router.post("/achievements", response_model=Achievement)
async def create_achievement(achievement: Achievement):
    await db.achievements.insert_one(achievement.dict())
    return achievement

@api_router.get("/achievements", response_model=List[Achievement])
async def get_achievements():
    achievements = await db.achievements.find().to_list(100)
    return [Achievement(**achievement) for achievement in achievements]

# Reward routes
@api_router.post("/rewards", response_model=Reward)
async def create_reward(reward: Reward):
    await db.rewards.insert_one(reward.dict())
    return reward

@api_router.get("/rewards", response_model=List[Reward])
async def get_rewards():
    rewards = await db.rewards.find().to_list(100)
    return [Reward(**reward) for reward in rewards]

# Event routes
@api_router.post("/events", response_model=Event)
async def create_event(event: Event):
    await db.events.insert_one(event.dict())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find().sort("date", 1).to_list(100)
    return [Event(**event) for event in events]

# Initialize sample data
@api_router.post("/initialize-data")
async def initialize_sample_data():
    # Clear existing data
    await db.missions.delete_many({})
    await db.achievements.delete_many({})
    await db.rewards.delete_many({})
    await db.events.delete_many({})
    
    # Create sample missions
    sample_missions = [
        {
            "title": "Microvideo: Tu Historia Emprendedora",
            "description": "Graba un video de 60 segundos contando tu historia como emprendedor en Guayaquil",
            "type": "microvideo",
            "points_reward": 50,
            "position": 1,
            "content": {
                "instructions": "Graba un video corto presentándote y explicando tu emprendimiento",
                "max_duration": 60,
                "topics": ["Tu nombre", "Tu emprendimiento", "Tu motivación", "Tu visión para Guayaquil"]
            },
            "requirements": []
        },
        {
            "title": "Mini-Quiz: Fundamentos del Emprendimiento",
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
            "requirements": ["1"]
        },
        {
            "title": "Guía Descargable: Trámites Legales",
            "description": "Descarga y revisa la guía completa de trámites para emprendedores en Ecuador",
            "type": "downloadable_guide",
            "points_reward": 40,
            "position": 3,
            "content": {
                "guide_url": "https://example.com/guia-tramites-ecuador.pdf",
                "topics": ["RUC", "IESS", "Permisos municipales", "Patentes"],
                "completion_requirement": "Confirmar lectura y responder pregunta final"
            },
            "requirements": ["2"]
        },
        {
            "title": "Tarea Práctica: Plan de Negocio Básico",
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
            "requirements": ["3"]
        },
        {
            "title": "Consejo Experto: Networking en Guayaquil",
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
            "requirements": ["4"]
        }
    ]
    
    for mission_data in sample_missions:
        mission = Mission(**mission_data)
        await db.missions.insert_one(mission.dict())
    
    # Create sample achievements
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
        }
    ]
    
    for achievement_data in sample_achievements:
        achievement = Achievement(**achievement_data)
        await db.achievements.insert_one(achievement.dict())
    
    # Create sample rewards
    sample_rewards = [
        {
            "title": "Certificado de Emprendedor Novato",
            "description": "Certificado digital que acredita tu participación en el programa",
            "type": "certificate",
            "value": "PDF Certificate",
            "points_cost": 50
        },
        {
            "title": "Descuento en Consultoría",
            "description": "20% de descuento en servicios de consultoría empresarial",
            "type": "discount",
            "value": "20% off",
            "points_cost": 150
        },
        {
            "title": "Entrada VIP a Evento",
            "description": "Entrada prioritaria al próximo evento de emprendimiento en Guayaquil",
            "type": "event_access",
            "value": "VIP Access",
            "points_cost": 200
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
            "capacity": 500
        },
        {
            "title": "Workshop: Marketing Digital para Emprendedores",
            "description": "Taller intensivo sobre estrategias de marketing digital",
            "location": "ESPOL - Guayaquil",
            "date": datetime(2025, 8, 5, 14, 0),
            "organizer": "ESPOL Entrepreneurship Center",
            "capacity": 50
        }
    ]
    
    for event_data in sample_events:
        event = Event(**event_data)
        await db.events.insert_one(event.dict())
    
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
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timedelta
from enum import Enum
import jwt
from passlib.context import CryptContext
import hashlib
import asyncio
import json
import base64
import qrcode
from io import BytesIO
import secrets
import re

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
    DOCUMENT_UPLOAD = "document_upload"
    NETWORKING_TASK = "networking_task"
    MARKET_RESEARCH = "market_research"
    BUSINESS_PLAN = "business_plan"

class MissionStatus(str, Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"
    IN_REVIEW = "in_review"

class UserRank(str, Enum):
    EMPRENDEDOR_NOVATO = "emprendedor_novato"
    EMPRENDEDOR_JUNIOR = "emprendedor_junior"
    EMPRENDEDOR_SENIOR = "emprendedor_senior"
    EMPRENDEDOR_EXPERTO = "emprendedor_experto"
    EMPRENDEDOR_MASTER = "emprendedor_master"

class UserRole(str, Enum):
    ADMIN = "admin"
    EMPRENDEDOR = "emprendedor"
    REVISOR = "revisor"
    CURADOR_CONTENIDOS = "curador_contenidos"
    ALIADO = "aliado"

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
    EVIDENCE_APPROVED = "evidence_approved"
    EVIDENCE_REJECTED = "evidence_rejected"
    EVENT_ELIGIBLE = "event_eligible"
    REWARD_AVAILABLE = "reward_available"

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

class DocumentType(str, Enum):
    RUC = "ruc"
    PITCH_VIDEO = "pitch_video"
    BUSINESS_PLAN = "business_plan"
    FINANCIAL_PROJECTION = "financial_projection"
    LEGAL_DOCUMENTS = "legal_documents"
    MARKET_RESEARCH = "market_research"
    PROTOTYPE = "prototype"
    REFERENCES = "references"

class DocumentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVISION_REQUIRED = "revision_required"

class EligibilityStatus(str, Enum):
    ELIGIBLE = "eligible"
    PARTIAL = "partial"
    NOT_ELIGIBLE = "not_eligible"

class EventType(str, Enum):
    FERIA = "feria"
    RUEDA_NEGOCIOS = "rueda_negocios"
    CAPACITACION = "capacitacion"
    NETWORKING = "networking"
    PITCH_COMPETITION = "pitch_competition"

class RewardType(str, Enum):
    DISCOUNT = "discount"
    TRAINING = "training"
    MENTORSHIP = "mentorship"
    NETWORKING = "networking"
    RESOURCES = "resources"
    CERTIFICATION = "certification"
    CONSULTATION = "consultation"
    EQUIPMENT = "equipment"
    CASH_PRIZE = "cash_prize"

class RewardStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    REDEEMED = "redeemed"
    EXPIRED = "expired"

class LeagueType(str, Enum):
    BRONCE = "bronce"
    PLATA = "plata"
    ORO = "oro"
    DIAMANTE = "diamante"

class CompetenceArea(str, Enum):
    LEGAL = "legal"
    VENTAS = "ventas"
    PITCH = "pitch"
    OPERACIONES = "operaciones"
    FINANZAS = "finanzas"
    HABILIDADES_BLANDAS = "habilidades_blandas"
    MARKETING = "marketing"
    INNOVACION = "innovacion"

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
    if current_user.role not in [UserRole.ADMIN, UserRole.CURADOR_CONTENIDOS]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_reviewer_user(current_user: "User" = Depends(get_current_user)) -> "User":
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR]:
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
    coins: int = 0  # Nueva moneda virtual para canjes
    level: UserLevel = UserLevel.NOVATO
    level_points: int = 0
    completed_missions: List[str] = []
    failed_missions: Dict[str, datetime] = {}
    profile_picture: Optional[str] = None
    favorite_rewards: List[str] = []
    current_streak: int = 0
    best_streak: int = 0
    last_mission_date: Optional[datetime] = None
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    badges: List[str] = []
    inactive_warning_sent: bool = False
    streak_warning_sent: bool = False
    ciudad: str = "Guayaquil"  # Para sistema de ligas
    cohorte: Optional[str] = None  # Para agrupaciones
    weekly_xp: int = 0  # XP semanal para ligas
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    nombre: str
    apellido: str
    cedula: str
    email: str
    nombre_emprendimiento: str
    password: str
    ciudad: str = "Guayaquil"
    cohorte: Optional[str] = None

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    nombre_emprendimiento: Optional[str] = None
    role: Optional[UserRole] = None
    points: Optional[int] = None
    coins: Optional[int] = None
    rank: Optional[UserRank] = None
    ciudad: Optional[str] = None
    cohorte: Optional[str] = None

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
    coins: int
    rank: UserRank
    level: UserLevel
    completed_missions: List[str]
    profile_picture: Optional[str] = None
    current_streak: int = 0
    best_streak: int = 0
    last_mission_date: Optional[datetime] = None
    favorite_rewards: List[str] = []
    total_missions_attempted: int = 0
    total_missions_completed: int = 0
    ciudad: str
    cohorte: Optional[str] = None
    weekly_xp: int = 0
    created_at: datetime
    updated_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    type: MissionType
    competence_area: CompetenceArea
    points_reward: int
    coins_reward: int = 0
    position: int
    content: Dict[str, Any] = {}
    requirements: List[str] = []
    prerequisite_missions: List[str] = []
    required_for_events: List[str] = []  # Lista de IDs de eventos que requieren esta misión
    evidence_required: bool = False
    auto_approve: bool = True  # Si la evidencia se aprueba automáticamente
    difficulty_level: int = 1  # 1-5
    estimated_time: int = 30  # minutos
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = ""
    
class MissionCreate(BaseModel):
    title: str
    description: str
    type: MissionType
    competence_area: CompetenceArea
    points_reward: int
    coins_reward: int = 0
    position: int
    content: Dict[str, Any] = {}
    requirements: List[str] = []
    prerequisite_missions: List[str] = []
    required_for_events: List[str] = []
    evidence_required: bool = False
    auto_approve: bool = True
    difficulty_level: int = 1
    estimated_time: int = 30

class MissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[MissionType] = None
    competence_area: Optional[CompetenceArea] = None
    points_reward: Optional[int] = None
    coins_reward: Optional[int] = None
    position: Optional[int] = None
    content: Optional[Dict[str, Any]] = None
    requirements: Optional[List[str]] = None
    prerequisite_missions: Optional[List[str]] = None
    required_for_events: Optional[List[str]] = None
    evidence_required: Optional[bool] = None
    auto_approve: Optional[bool] = None
    difficulty_level: Optional[int] = None
    estimated_time: Optional[int] = None

class MissionWithStatus(BaseModel):
    id: str
    title: str
    description: str
    type: MissionType
    competence_area: CompetenceArea
    points_reward: int
    coins_reward: int
    position: int
    content: Dict[str, Any]
    requirements: List[str]
    status: MissionStatus
    difficulty_level: int
    estimated_time: int
    progress_percentage: float = 0.0
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

class Evidence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mission_id: str
    document_type: Optional[DocumentType] = None
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    description: str = ""
    status: DocumentStatus = DocumentStatus.PENDING
    reviewed_by: Optional[str] = None
    review_notes: str = ""
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None

class EvidenceCreate(BaseModel):
    mission_id: str
    document_type: Optional[DocumentType] = None
    description: str = ""

class EvidenceReview(BaseModel):
    status: DocumentStatus
    review_notes: str = ""

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: DocumentType
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    status: DocumentStatus = DocumentStatus.PENDING
    reviewed_by: Optional[str] = None
    review_notes: str = ""
    expiry_date: Optional[datetime] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None

class DocumentUpload(BaseModel):
    document_type: DocumentType
    expiry_date: Optional[datetime] = None

class EligibilityRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    rule_name: str
    condition: str  # JSON DSL simple, ej: {"and": [{"missions": ["id1", "id2"]}, {"documents": ["ruc"]}, {"points": {"min": 500}}]}
    weight: float = 1.0  # Peso de esta regla (0-1)
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EligibilityRuleCreate(BaseModel):
    rule_name: str
    condition: str
    weight: float = 1.0
    description: str = ""

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    event_type: EventType
    location: str
    date: datetime
    end_date: Optional[datetime] = None
    organizer: str
    capacity: Optional[int] = None
    registered_users: List[str] = []
    eligibility_rules: List[str] = []  # IDs de reglas de elegibilidad
    registration_url: Optional[str] = None
    qr_check_in_enabled: bool = True
    ciudad: str = "Guayaquil"
    cupos_disponibles: Optional[int] = None
    precio: float = 0.0
    imagen_url: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: str
    event_type: EventType
    location: str
    date: datetime
    end_date: Optional[datetime] = None
    organizer: str
    capacity: Optional[int] = None
    registration_url: Optional[str] = None
    qr_check_in_enabled: bool = True
    ciudad: str = "Guayaquil"
    cupos_disponibles: Optional[int] = None
    precio: float = 0.0
    imagen_url: Optional[str] = None
    tags: List[str] = []

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    location: Optional[str] = None
    date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    organizer: Optional[str] = None
    capacity: Optional[int] = None
    registration_url: Optional[str] = None
    qr_check_in_enabled: Optional[bool] = None
    ciudad: Optional[str] = None
    cupos_disponibles: Optional[int] = None
    precio: Optional[float] = None
    imagen_url: Optional[str] = None
    tags: Optional[List[str]] = None

class EventEligibility(BaseModel):
    event_id: str
    user_id: str
    status: EligibilityStatus
    eligibility_percentage: float
    missing_requirements: List[Dict[str, Any]] = []
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

class QRToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: Optional[str] = None
    token: str
    status: EligibilityStatus
    user_info: Dict[str, Any]
    expires_at: datetime
    used: bool = False
    used_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Reward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    reward_type: RewardType
    value: str
    coins_cost: int  # Cambio de points_cost a coins_cost
    stock: int = -1  # -1 significa stock ilimitado
    stock_consumed: int = 0
    external_url: Optional[str] = None
    qr_code: Optional[str] = None  # Para canjes físicos
    available_until: Optional[datetime] = None
    ciudad: str = "Guayaquil"
    partner_company: Optional[str] = None
    terms_conditions: str = ""
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RewardCreate(BaseModel):
    title: str
    description: str
    reward_type: RewardType
    value: str
    coins_cost: int
    stock: int = -1
    external_url: Optional[str] = None
    qr_code: Optional[str] = None
    available_until: Optional[datetime] = None
    ciudad: str = "Guayaquil"
    partner_company: Optional[str] = None
    terms_conditions: str = ""
    image_url: Optional[str] = None

class RewardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reward_type: Optional[RewardType] = None
    value: Optional[str] = None
    coins_cost: Optional[int] = None
    stock: Optional[int] = None
    external_url: Optional[str] = None
    qr_code: Optional[str] = None
    available_until: Optional[datetime] = None
    ciudad: Optional[str] = None
    partner_company: Optional[str] = None
    terms_conditions: Optional[str] = None
    image_url: Optional[str] = None

class RewardRedemption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    reward_id: str
    redemption_code: str
    status: RewardStatus = RewardStatus.RESERVED
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)
    used_at: Optional[datetime] = None
    qr_code_data: Optional[str] = None

class League(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    league_type: LeagueType
    ciudad: str
    cohorte: Optional[str] = None
    start_date: datetime
    end_date: datetime
    participants: List[str] = []  # user_ids
    winners: List[Dict[str, Any]] = []  # Top participantes con sus puntos
    is_active: bool = True
    rewards: List[str] = []  # reward_ids para ganadores
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LeagueCreate(BaseModel):
    name: str
    league_type: LeagueType
    ciudad: str
    cohorte: Optional[str] = None
    start_date: datetime
    end_date: datetime
    rewards: List[str] = []

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
    coins_reward: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserBadge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    progress: float = 1.0

class AdminStats(BaseModel):
    total_users: int
    total_missions: int
    total_completed_missions: int
    total_points_awarded: int
    total_coins_awarded: int
    active_users_last_week: int
    active_users_last_month: int
    most_popular_missions: List[Dict[str, Any]]
    completion_rate_by_competence: Dict[str, float]
    user_distribution_by_city: Dict[str, int]
    weekly_engagement_trend: List[Dict[str, Any]]
    top_performers: List[Dict[str, Any]]
    event_attendance_stats: Dict[str, Any]
    reward_redemption_stats: Dict[str, Any]

class ImpactMetrics(BaseModel):
    period: str  # "weekly", "monthly", "quarterly"
    date_range: Dict[str, datetime]
    total_entrepreneurs: int
    active_entrepreneurs: int
    missions_completed: int
    events_attended: int
    business_plans_completed: int
    ruc_registrations: int
    pitch_videos_submitted: int
    networking_connections: int
    mentorship_sessions: int
    funding_applications: int
    jobs_created: int
    revenue_generated: float
    participant_satisfaction: float
    knowledge_improvement: float
    business_survival_rate: float

# Initialize demo content
async def initialize_demo_content():
    """Initialize comprehensive demo content"""
    # Clean up old missions that don't have competence_area
    await db.missions.delete_many({"competence_area": {"$exists": False}})
    
    # Check if content already exists
    existing_missions = await db.missions.count_documents({})
    if existing_missions > 0:
        return
    
    # Comprehensive Mission Set organized by competence areas
    demo_missions = []
    
    # LEGAL Competence Area
    legal_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '⚖️ Fundamentos Legales del Emprendimiento',
            'description': 'Aprende los aspectos legales básicos que todo emprendedor debe conocer.',
            'type': 'downloadable_guide',
            'competence_area': 'legal',
            'points_reward': 50,
            'coins_reward': 25,
            'position': 1,
            'content': {
                'guide_url': 'https://example.com/legal-guide.pdf',
                'topics': ['Tipos de empresa', 'Constitución legal', 'Obligaciones tributarias', 'Contratos básicos'],
                'completion_requirement': 'Lee la guía completa y completa el quiz de comprensión.'
            },
            'evidence_required': False,
            'auto_approve': True,
            'difficulty_level': 2,
            'estimated_time': 45,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📋 Registro de RUC - Paso a Paso',
            'description': 'Guía completa para registrar tu RUC y formalizar tu emprendimiento.',
            'type': 'document_upload',
            'competence_area': 'legal',
            'points_reward': 100,
            'coins_reward': 50,
            'position': 2,
            'content': {
                'steps': ['Reunir documentos', 'Completar formulario', 'Presentar en ventanilla', 'Obtener RUC'],
                'required_documents': ['Cédula', 'Certificado de votación', 'Comprobante de domicilio'],
                'deadline_hours': 168  # 1 semana
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 3,
            'estimated_time': 120,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📜 Contratos y Acuerdos Empresariales',
            'description': 'Aprende a redactar y negociar contratos básicos para tu negocio.',
            'type': 'practical_task',
            'competence_area': 'legal',
            'points_reward': 75,
            'coins_reward': 35,
            'position': 3,
            'content': {
                'task': 'Redacta un contrato de servicios básico para tu emprendimiento',
                'template_sections': ['Partes', 'Objeto', 'Obligaciones', 'Pagos', 'Resolución'],
                'deadline_hours': 48
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 90,
            'created_at': datetime.utcnow()
        }
    ]
    
    # VENTAS Competence Area
    sales_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '🎯 Identifica tu Cliente Ideal',
            'description': 'Define y caracteriza a tu cliente objetivo para mejorar tus ventas.',
            'type': 'practical_task',
            'competence_area': 'ventas',
            'points_reward': 60,
            'coins_reward': 30,
            'position': 4,
            'content': {
                'task': 'Crea el perfil completo de tu cliente ideal (buyer persona)',
                'template_sections': ['Demografía', 'Comportamiento', 'Necesidades', 'Canales preferidos'],
                'deadline_hours': 24
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 2,
            'estimated_time': 60,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '💬 Técnicas de Venta Consultiva',
            'description': 'Domina las técnicas modernas de venta basadas en consultoría.',
            'type': 'expert_advice',
            'competence_area': 'ventas',
            'points_reward': 80,
            'coins_reward': 40,
            'position': 5,
            'content': {
                'expert_name': 'Carlos Mendoza',
                'expert_title': 'Director de Ventas - TechCorp',
                'key_points': [
                    'Escucha activa y preguntas poderosas',
                    'Identificación de dolor vs. necesidad',
                    'Presentación de valor personalizada',
                    'Manejo de objeciones',
                    'Cierre natural'
                ],
                'video_url': 'https://youtube.com/watch?v=sales-techniques'
            },
            'evidence_required': False,
            'auto_approve': True,
            'difficulty_level': 3,
            'estimated_time': 75,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📊 Simulador de Ventas Prácticas',
            'description': 'Practica técnicas de venta en escenarios realistas.',
            'type': 'pitch_simulator',
            'competence_area': 'ventas',
            'points_reward': 120,
            'coins_reward': 60,
            'position': 6,
            'content': {
                'scenarios': [
                    'Cliente indeciso que necesita más información',
                    'Cliente precio-sensible que busca descuentos',
                    'Cliente técnico que requiere especificaciones',
                    'Cliente ejecutivo con poco tiempo'
                ],
                'evaluation_criteria': ['Rapport', 'Identificación de necesidades', 'Presentación', 'Cierre']
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 90,
            'created_at': datetime.utcnow()
        }
    ]
    
    # PITCH Competence Area  
    pitch_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '🎤 Tu Primer Elevator Pitch',
            'description': 'Crea un pitch de 60 segundos que capture la esencia de tu negocio.',
            'type': 'microvideo',
            'competence_area': 'pitch',
            'points_reward': 100,
            'coins_reward': 50,
            'position': 7,
            'content': {
                'max_duration': 60,
                'topics': ['Problema que resuelves', 'Tu solución única', 'Mercado objetivo', 'Call to action'],
                'tips': [
                    'Sé claro y conciso',
                    'Cuenta una historia',
                    'Practica hasta que fluya naturalmente',
                    'Incluye números impactantes'
                ]
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 3,
            'estimated_time': 120,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📈 Pitch de Inversión Completo',
            'description': 'Desarrolla una presentación completa para inversionistas.',
            'type': 'practical_task',
            'competence_area': 'pitch',
            'points_reward': 200,
            'coins_reward': 100,
            'position': 8,
            'content': {
                'task': 'Crea una presentación de 10 slides para inversionistas',
                'template_sections': [
                    'Problema', 'Solución', 'Mercado', 'Modelo de negocio',
                    'Tracción', 'Competencia', 'Equipo', 'Financieros', 'Inversión', 'Uso de fondos'
                ],
                'deadline_hours': 72
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 5,
            'estimated_time': 180,
            'created_at': datetime.utcnow()
        }
    ]
    
    # OPERACIONES Competence Area
    operations_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '⚙️ Procesos Operativos Básicos',
            'description': 'Diseña los procesos clave de tu operación empresarial.',
            'type': 'process_guide',
            'competence_area': 'operaciones',
            'points_reward': 90,
            'coins_reward': 45,
            'position': 9,
            'content': {
                'processes': ['Producción/Servicio', 'Control de calidad', 'Inventarios', 'Logística'],
                'tools': ['Diagramas de flujo', 'Checklist', 'Indicadores', 'Mejora continua']
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 100,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📦 Gestión de Inventarios',
            'description': 'Aprende a optimizar tu inventario y reducir costos.',
            'type': 'practical_task',
            'competence_area': 'operaciones',
            'points_reward': 70,
            'coins_reward': 35,
            'position': 10,
            'content': {
                'task': 'Diseña un sistema de gestión de inventarios para tu negocio',
                'template_sections': ['Categorización', 'Rotación', 'Punto de reorden', 'Proveedores'],
                'deadline_hours': 48
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 3,
            'estimated_time': 80,
            'created_at': datetime.utcnow()
        }
    ]
    
    # FINANZAS Competence Area
    finance_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '💰 Fundamentos Financieros',
            'description': 'Domina los conceptos financieros esenciales para emprendedores.',
            'type': 'mini_quiz',
            'competence_area': 'finanzas',
            'points_reward': 80,
            'coins_reward': 40,
            'position': 11,
            'content': {
                'questions': [
                    {
                        'question': '¿Qué es el flujo de caja?',
                        'options': [
                            'El dinero total de la empresa',
                            'La entrada y salida de efectivo en un período',
                            'Las ganancias anuales',
                            'El capital inicial'
                        ],
                        'correct': 1
                    },
                    {
                        'question': '¿Cuál es la diferencia entre ingresos y utilidad?',
                        'options': [
                            'No hay diferencia',
                            'Ingresos es dinero que entra, utilidad es lo que queda después de gastos',
                            'Utilidad es dinero que entra, ingresos es lo que queda',
                            'Ambos significan lo mismo'
                        ],
                        'correct': 1
                    },
                    {
                        'question': '¿Qué es el punto de equilibrio?',
                        'options': [
                            'Cuando ganas mucho dinero',
                            'Cuando no tienes gastos',
                            'Cuando ingresos igualan a gastos totales',
                            'Cuando tienes el doble de ingresos que gastos'
                        ],
                        'correct': 2
                    },
                    {
                        'question': '¿Para qué sirve un presupuesto?',
                        'options': [
                            'Para planificar ingresos y gastos futuros',
                            'Solo para empresas grandes',
                            'Para calcular impuestos',
                            'No es necesario en emprendimientos'
                        ],
                        'correct': 0
                    }
                ]
            },
            'evidence_required': False,
            'auto_approve': True,
            'difficulty_level': 2,
            'estimated_time': 30,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📊 Plan Financiero Básico',
            'description': 'Crea un plan financiero simple para tu emprendimiento.',
            'type': 'business_plan',
            'competence_area': 'finanzas',
            'points_reward': 150,
            'coins_reward': 75,
            'position': 12,
            'content': {
                'sections': [
                    'Proyección de ingresos (12 meses)',
                    'Presupuesto de gastos operativos',
                    'Inversión inicial requerida',
                    'Punto de equilibrio',
                    'Flujo de caja proyectado'
                ],
                'template_url': 'https://example.com/financial-template.xlsx',
                'deadline_hours': 96
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 150,
            'created_at': datetime.utcnow()
        }
    ]
    
    # HABILIDADES BLANDAS Competence Area
    soft_skills_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '🧠 Liderazgo Emprendedor',
            'description': 'Desarrolla las habilidades de liderazgo esenciales para emprendedores.',
            'type': 'expert_advice',
            'competence_area': 'habilidades_blandas',
            'points_reward': 85,
            'coins_reward': 42,
            'position': 13,
            'content': {
                'expert_name': 'María González',
                'expert_title': 'Coach Ejecutiva Certificada',
                'key_points': [
                    'Autoconocimiento y inteligencia emocional',
                    'Comunicación efectiva y escucha activa',
                    'Toma de decisiones bajo presión',
                    'Motivación y gestión de equipos',
                    'Adaptabilidad y resiliencia'
                ],
                'video_url': 'https://youtube.com/watch?v=leadership-skills'
            },
            'evidence_required': False,
            'auto_approve': True,
            'difficulty_level': 3,
            'estimated_time': 60,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '🤝 Networking Estratégico',
            'description': 'Aprende a construir una red de contactos valiosa para tu negocio.',
            'type': 'networking_task',
            'competence_area': 'habilidades_blandas',
            'points_reward': 100,
            'coins_reward': 50,
            'position': 14,
            'content': {
                'task': 'Conecta con 5 emprendedores o profesionales de tu industria',
                'platforms': ['LinkedIn', 'Eventos presenciales', 'Grupos de WhatsApp', 'Cámaras de comercio'],
                'objectives': [
                    'Intercambiar experiencias',
                    'Identificar oportunidades de colaboración',
                    'Aprender de sus experiencias',
                    'Construir relaciones a largo plazo'
                ],
                'deadline_hours': 168
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 3,
            'estimated_time': 200,
            'created_at': datetime.utcnow()
        }
    ]
    
    # MARKETING Competence Area
    marketing_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '📱 Estrategia de Marketing Digital',
            'description': 'Diseña una estrategia de marketing digital efectiva y económica.',
            'type': 'practical_task',
            'competence_area': 'marketing',
            'points_reward': 110,
            'coins_reward': 55,
            'position': 15,
            'content': {
                'task': 'Crea un plan de marketing digital de 3 meses',
                'template_sections': [
                    'Análisis de audiencia target',
                    'Objetivos SMART',
                    'Canales digitales a usar',
                    'Calendario de contenidos',
                    'Presupuesto y métricas'
                ],
                'deadline_hours': 72
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 120,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📊 Investigación de Mercado DIY',
            'description': 'Realiza una investigación de mercado básica con herramientas gratuitas.',
            'type': 'market_research',
            'competence_area': 'marketing',
            'points_reward': 130,
            'coins_reward': 65,
            'position': 16,
            'content': {
                'research_areas': [
                    'Tamaño y crecimiento del mercado',
                    'Análisis de competencia directa e indirecta',
                    'Comportamiento del consumidor',
                    'Tendencias y oportunidades',
                    'Pricing y posicionamiento'
                ],
                'tools': ['Google Trends', 'Encuestas online', 'Redes sociales', 'Estudios públicos'],
                'deadline_hours': 120
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 180,
            'created_at': datetime.utcnow()
        }
    ]
    
    # INNOVACION Competence Area
    innovation_missions = [
        {
            'id': str(uuid.uuid4()),
            'title': '💡 Pensamiento Innovador',
            'description': 'Desarrolla técnicas de pensamiento creativo e innovador.',
            'type': 'practical_task',
            'competence_area': 'innovacion',
            'points_reward': 95,
            'coins_reward': 47,
            'position': 17,
            'content': {
                'task': 'Aplica 3 técnicas de innovación a tu emprendimiento',
                'techniques': [
                    'Design Thinking',
                    'Brainstorming estructurado',
                    'Método SCAMPER',
                    'Mapas mentales',
                    'Prototipado rápido'
                ],
                'deliverables': ['Problema redefinido', 'Ideas generadas', 'Solución prototipada'],
                'deadline_hours': 48
            },
            'evidence_required': True,
            'auto_approve': False,
            'difficulty_level': 4,
            'estimated_time': 100,
            'created_at': datetime.utcnow()
        }
    ]
    
    # Combine all missions
    demo_missions.extend(legal_missions)
    demo_missions.extend(sales_missions)
    demo_missions.extend(pitch_missions)
    demo_missions.extend(operations_missions)
    demo_missions.extend(finance_missions)
    demo_missions.extend(soft_skills_missions)
    demo_missions.extend(marketing_missions)
    demo_missions.extend(innovation_missions)
    
    await db.missions.insert_many(demo_missions)
    print(f"Initialized {len(demo_missions)} comprehensive missions")
    
    # Initialize demo rewards
    demo_rewards = [
        {
            'id': str(uuid.uuid4()),
            'title': '☕ Café Gratis en Startup Café',
            'description': 'Disfruta de un café premium gratis en nuestro espacio de coworking.',
            'reward_type': 'discount',
            'value': '1 café gratis',
            'coins_cost': 50,
            'stock': 100,
            'stock_consumed': 0,
            'partner_company': 'Startup Café Guayaquil',
            'terms_conditions': 'Válido de lunes a viernes. No acumulable.',
            'image_url': 'https://example.com/coffee-reward.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📚 Masterclass de Marketing Digital',
            'description': 'Acceso completo a masterclass exclusiva de marketing digital.',
            'reward_type': 'training',
            'value': 'Curso completo de 8 horas',
            'coins_cost': 200,
            'stock': 50,
            'stock_consumed': 0,
            'external_url': 'https://academy.emprendeguayaquil.com/marketing',
            'partner_company': 'Academia Emprende',
            'terms_conditions': 'Acceso por 6 meses. Incluye certificado.',
            'image_url': 'https://example.com/marketing-course.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '👨‍💼 Sesión de Mentoría 1:1',
            'description': '1 hora de mentoría personalizada con experto en negocios.',
            'reward_type': 'mentorship',
            'value': '1 hora de mentoría',
            'coins_cost': 300,
            'stock': 20,
            'stock_consumed': 0,
            'partner_company': 'Red de Mentores GYE',
            'terms_conditions': 'Coordinar cita con 48h de anticipación.',
            'image_url': 'https://example.com/mentorship.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '🤝 Acceso a Evento de Networking',
            'description': 'Entrada gratuita al próximo evento de networking empresarial.',
            'reward_type': 'networking',
            'value': 'Entrada + Networking dinner',
            'coins_cost': 150,
            'stock': 75,
            'stock_consumed': 0,
            'partner_company': 'Cámara de Comercio GYE',
            'terms_conditions': 'Válido para próximos 3 eventos. Confirmar asistencia.',
            'image_url': 'https://example.com/networking-event.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📜 Consultoría Legal Básica',
            'description': 'Consulta legal de 1 hora sobre constitución de empresa.',
            'reward_type': 'consultation',
            'value': '1 hora consultoría legal',
            'coins_cost': 400,
            'stock': 15,
            'stock_consumed': 0,
            'partner_company': 'Estudio Jurídico Innovar',
            'terms_conditions': 'Solo temas de constitución empresarial.',
            'image_url': 'https://example.com/legal-consultation.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '💻 Acceso a Coworking por 1 Mes',
            'description': 'Mes completo de acceso a espacio de coworking equipado.',
            'reward_type': 'resources',
            'value': '1 mes de coworking',
            'coins_cost': 500,
            'stock': 10,
            'stock_consumed': 0,
            'partner_company': 'Innovation Hub GYE',
            'terms_conditions': 'Incluye internet, café y salas de reunión.',
            'image_url': 'https://example.com/coworking.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '🏆 Premio en Efectivo - Emprendedor del Mes',
            'description': 'Premio en efectivo de $500 para el emprendedor destacado.',
            'reward_type': 'cash_prize',
            'value': '$500 USD',
            'coins_cost': 1000,
            'stock': 1,
            'stock_consumed': 0,
            'partner_company': 'Impulsa Guayaquil',
            'terms_conditions': 'Evaluación mensual. Solo un ganador por mes.',
            'image_url': 'https://example.com/cash-prize.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': '📱 Kit de Marketing Digital',
            'description': 'Herramientas digitales premium por 3 meses (Canva Pro, Hootsuite, etc.)',
            'reward_type': 'resources',
            'value': 'Suite de herramientas digitales',
            'coins_cost': 250,
            'stock': 30,
            'stock_consumed': 0,
            'partner_company': 'Digital Tools Alliance',
            'terms_conditions': 'Acceso por 3 meses. Renovación a precio especial.',
            'image_url': 'https://example.com/digital-tools.jpg',
            'ciudad': 'Guayaquil',
            'created_at': datetime.utcnow()
        }
    ]
    
    await db.rewards.insert_many(demo_rewards)
    print(f"Initialized {len(demo_rewards)} demo rewards")
    
    # Initialize demo badges
    demo_badges = [
        {
            'id': str(uuid.uuid4()),
            'title': 'Primer Paso',
            'description': 'Completaste tu primera misión',
            'icon': '🌟',
            'category': 'achievement',
            'rarity': 'common',
            'condition': 'complete_first_mission',
            'coins_reward': 10,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Emprendedor Dedicado',
            'description': 'Completaste 5 misiones',
            'icon': '🚀',
            'category': 'achievement',
            'rarity': 'uncommon',
            'condition': 'complete_5_missions',
            'coins_reward': 25,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Racha de Fuego',
            'description': 'Mantuviste una racha de 7 días',
            'icon': '🔥',
            'category': 'streak',
            'rarity': 'rare',
            'condition': 'streak_7_days',
            'coins_reward': 50,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Experto Legal',
            'description': 'Completaste todas las misiones del área legal',
            'icon': '⚖️',
            'category': 'skill',
            'rarity': 'epic',
            'condition': 'complete_legal_area',
            'coins_reward': 100,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Maestro de Ventas',
            'description': 'Completaste todas las misiones del área de ventas',
            'icon': '💰',
            'category': 'skill',
            'rarity': 'epic',
            'condition': 'complete_sales_area',
            'coins_reward': 100,
            'created_at': datetime.utcnow()
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Networking Pro',
            'description': 'Conectaste con más de 10 emprendedores',
            'icon': '🤝',
            'category': 'social',
            'rarity': 'rare',
            'condition': 'network_builder',
            'coins_reward': 75,
            'created_at': datetime.utcnow()
        }
    ]
    
    await db.badges.insert_many(demo_badges)
    print(f"Initialized {len(demo_badges)} demo badges")
    
    # Initialize demo admin user
    existing_admin = await db.users.find_one({"cedula": "0000000000"})
    if not existing_admin:
        admin_user = User(
            nombre="Admin",
            apellido="Sistema",
            cedula="0000000000",
            email="admin@impulsaguayaquil.com",
            nombre_emprendimiento="Sistema Administrativo",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN,
            rank=UserRank.EMPRENDEDOR_MASTER,
            points=10000,
            coins=5000,
            ciudad="Guayaquil"
        )
        await db.users.insert_one(admin_user.dict())
        print("Initialized demo admin user: 0000000000 / admin")

# Initialize demo content on startup
async def startup_event():
    await initialize_demo_content()

# Call startup event
asyncio.create_task(startup_event())

# Eligibility Engine Functions
async def evaluate_eligibility_rule(user: User, rule_condition: str) -> tuple[bool, float]:
    """Evaluate a single eligibility rule for a user"""
    try:
        condition = json.loads(rule_condition)
        return await evaluate_condition(user, condition)
    except json.JSONDecodeError:
        return False, 0.0

async def evaluate_condition(user: User, condition: dict) -> tuple[bool, float]:
    """Recursively evaluate conditions"""
    if "and" in condition:
        results = []
        for sub_condition in condition["and"]:
            result, score = await evaluate_condition(user, sub_condition)
            results.append((result, score))
        
        # All conditions must be true
        all_true = all(result for result, _ in results)
        avg_score = sum(score for _, score in results) / len(results) if results else 0
        return all_true, avg_score
    
    elif "or" in condition:
        results = []
        for sub_condition in condition["or"]:
            result, score = await evaluate_condition(user, sub_condition)
            results.append((result, score))
        
        # Any condition can be true
        any_true = any(result for result, _ in results)
        max_score = max(score for _, score in results) if results else 0
        return any_true, max_score
    
    elif "missions" in condition:
        required_missions = condition["missions"]
        completed_count = len([m for m in required_missions if m in user.completed_missions])
        score = completed_count / len(required_missions) if required_missions else 0
        return score == 1.0, score
    
    elif "documents" in condition:
        required_docs = condition["documents"]
        user_docs = await db.documents.find({"user_id": user.id, "status": "approved"}).to_list(100)
        approved_doc_types = [doc["document_type"] for doc in user_docs]
        
        approved_count = len([doc for doc in required_docs if doc in approved_doc_types])
        score = approved_count / len(required_docs) if required_docs else 0
        return score == 1.0, score
    
    elif "points" in condition:
        points_req = condition["points"]
        if "min" in points_req:
            return user.points >= points_req["min"], min(1.0, user.points / points_req["min"])
        return False, 0.0
    
    elif "xp" in condition:
        xp_req = condition["xp"]
        if "min" in xp_req:
            return user.points >= xp_req["min"], min(1.0, user.points / xp_req["min"])
        return False, 0.0
    
    elif "streak" in condition:
        streak_req = condition["streak"]
        if "min" in streak_req:
            return user.current_streak >= streak_req["min"], min(1.0, user.current_streak / streak_req["min"])
        return False, 0.0
    
    elif "competence_area" in condition:
        area = condition["competence_area"]
        min_missions = condition.get("min_missions", 1)
        
        # Count completed missions in this competence area
        area_missions = await db.missions.find({"competence_area": area}).to_list(100)
        completed_in_area = len([m for m in area_missions if m["id"] in user.completed_missions])
        
        score = min(1.0, completed_in_area / min_missions) if min_missions > 0 else 0
        return completed_in_area >= min_missions, score
    
    return False, 0.0

async def calculate_event_eligibility(user_id: str, event_id: str) -> EventEligibility:
    """Calculate eligibility for a specific event"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_obj = User(**user)
    
    # Get event eligibility rules
    rules = await db.eligibility_rules.find({"event_id": event_id}).to_list(100)
    
    if not rules:
        # No rules defined, user is eligible
        return EventEligibility(
            event_id=event_id,
            user_id=user_id,
            status=EligibilityStatus.ELIGIBLE,
            eligibility_percentage=100.0,
            missing_requirements=[]
        )
    
    total_score = 0.0
    total_weight = 0.0
    missing_requirements = []
    
    for rule in rules:
        rule_obj = EligibilityRule(**rule)
        is_met, score = await evaluate_eligibility_rule(user_obj, rule_obj.condition)
        
        weighted_score = score * rule_obj.weight
        total_score += weighted_score
        total_weight += rule_obj.weight
        
        if not is_met:
            missing_requirements.append({
                "rule_name": rule_obj.rule_name,
                "description": rule_obj.description,
                "completion_percentage": score * 100,
                "condition": rule_obj.condition
            })
    
    final_percentage = (total_score / total_weight * 100) if total_weight > 0 else 0
    
    # Determine status based on percentage
    if final_percentage >= 100:
        status = EligibilityStatus.ELIGIBLE
    elif final_percentage >= 50:
        status = EligibilityStatus.PARTIAL
    else:
        status = EligibilityStatus.NOT_ELIGIBLE
    
    return EventEligibility(
        event_id=event_id,
        user_id=user_id,
        status=status,
        eligibility_percentage=final_percentage,
        missing_requirements=missing_requirements
    )

async def generate_qr_token(user_id: str, event_id: Optional[str] = None) -> QRToken:
    """Generate QR token for user eligibility status"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate eligibility if event specified
    eligibility_status = EligibilityStatus.ELIGIBLE
    if event_id:
        eligibility = await calculate_event_eligibility(user_id, event_id)
        eligibility_status = eligibility.status
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    
    # Create QR token
    qr_token = QRToken(
        user_id=user_id,
        event_id=event_id,
        token=token,
        status=eligibility_status,
        user_info={
            "name": f"{user['nombre']} {user['apellido']}",
            "cedula": user['cedula'],
            "emprendimiento": user['nombre_emprendimiento'],
            "points": user['points'],
            "rank": user['rank']
        },
        expires_at=datetime.utcnow() + timedelta(minutes=5)  # 5 minute expiry
    )
    
    await db.qr_tokens.insert_one(qr_token.dict())
    return qr_token

async def generate_suggestions_for_event(user_id: str, event_id: str) -> List[Dict[str, Any]]:
    """Generate smart suggestions for what user needs to be eligible for event"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return []
    
    eligibility = await calculate_event_eligibility(user_id, event_id)
    suggestions = []
    
    for missing in eligibility.missing_requirements:
        try:
            condition = json.loads(missing["condition"])
            
            if "missions" in condition:
                required_missions = condition["missions"]
                incomplete_missions = [m for m in required_missions if m not in user["completed_missions"]]
                
                for mission_id in incomplete_missions:
                    mission = await db.missions.find_one({"id": mission_id})
                    if mission:
                        suggestions.append({
                            "type": "mission",
                            "id": mission_id,
                            "title": mission["title"],
                            "description": f"Completa esta misión para cumplir: {missing['rule_name']}",
                            "competence_area": mission["competence_area"],
                            "points_reward": mission["points_reward"],
                            "estimated_time": mission["estimated_time"],
                            "priority": "high" if missing["completion_percentage"] < 25 else "medium"
                        })
            
            elif "documents" in condition:
                required_docs = condition["documents"]
                user_docs = await db.documents.find({"user_id": user_id, "status": "approved"}).to_list(100)
                approved_doc_types = [doc["document_type"] for doc in user_docs]
                
                missing_docs = [doc for doc in required_docs if doc not in approved_doc_types]
                
                for doc_type in missing_docs:
                    suggestions.append({
                        "type": "document",
                        "document_type": doc_type,
                        "title": f"Sube tu {doc_type.replace('_', ' ').title()}",
                        "description": f"Documento requerido para: {missing['rule_name']}",
                        "priority": "high"
                    })
            
            elif "points" in condition:
                points_needed = condition["points"]["min"] - user["points"]
                if points_needed > 0:
                    suggestions.append({
                        "type": "points",
                        "points_needed": points_needed,
                        "title": f"Gana {points_needed} puntos más",
                        "description": f"Completa más misiones para obtener los puntos necesarios",
                        "priority": "medium"
                    })
                    
        except json.JSONDecodeError:
            continue
    
    return suggestions

# Enhanced utility functions
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

async def check_badge_eligibility(user: User, badge: Badge) -> bool:
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
    
    # Competence area badges
    elif condition == "complete_legal_area":
        legal_missions = await db.missions.find({"competence_area": "legal"}).to_list(100)
        legal_mission_ids = [m["id"] for m in legal_missions]
        completed_legal = len([m for m in legal_mission_ids if m in user.completed_missions])
        return completed_legal == len(legal_mission_ids)
    
    elif condition == "complete_sales_area":
        sales_missions = await db.missions.find({"competence_area": "ventas"}).to_list(100)
        sales_mission_ids = [m["id"] for m in sales_missions]
        completed_sales = len([m for m in sales_mission_ids if m in user.completed_missions])
        return completed_sales == len(sales_mission_ids)
    
    # Social badges
    elif condition == "network_builder":
        # Check networking missions completed
        networking_missions = await db.missions.find({"type": "networking_task"}).to_list(100)
        networking_completed = len([m for m in networking_missions if m["id"] in user.completed_missions])
        return networking_completed >= 2
    
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
            
            # Update user's badge list and award coins
            await db.users.update_one(
                {"id": user.id},
                {
                    "$push": {"badges": badge.id},
                    "$inc": {"coins": badge.coins_reward}
                }
            )
            
            badges_awarded.append(badge)
            
            # Create notification
            notification = Notification(
                user_id=user.id,
                type=NotificationType.NEW_BADGE,
                title=f"¡Nueva insignia desbloqueada!",
                message=f"Has obtenido la insignia '{badge.title}' y ganado {badge.coins_reward} monedas!",
                data={"badge_id": badge.id, "badge_title": badge.title, "coins_awarded": badge.coins_reward}
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Impulsa Guayaquil API - Empowering Entrepreneurs v2.0"}

@api_router.post("/init-admin")
async def init_admin():
    """Initialize admin user for demo purposes"""
    existing_admin = await db.users.find_one({"cedula": "0000000000"})
    if existing_admin:
        return {"message": "Admin user already exists"}
    
    admin_user = User(
        nombre="Admin",
        apellido="Sistema",
        cedula="0000000000",
        email="admin@impulsaguayaquil.com",
        nombre_emprendimiento="Sistema Administrativo",
        hashed_password=get_password_hash("admin"),
        role=UserRole.ADMIN,
        rank=UserRank.EMPRENDEDOR_MASTER,
        points=10000,
        coins=5000,
        ciudad="Guayaquil"
    )
    await db.users.insert_one(admin_user.dict())
    return {"message": "Admin user created successfully", "cedula": "0000000000", "password": "admin"}

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
        hashed_password=hashed_password,
        ciudad=user_data.ciudad,
        cohorte=user_data.cohorte
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
    
    # Update last activity
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_activity": datetime.utcnow()}}
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

# Enhanced User routes
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    ciudad: Optional[str] = None,
    cohorte: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    query = {}
    if ciudad:
        query["ciudad"] = ciudad
    if cohorte:
        query["cohorte"] = cohorte
    
    users = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
    result = []
    for user in users:
        if '_id' in user:
            del user['_id']
        
        if not all(field in user for field in ['nombre', 'apellido', 'cedula', 'email', 'nombre_emprendimiento', 'role']):
            continue
            
        result.append(UserResponse(**user))
    return result

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    # Users can only see their own profile, unless they're admin
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
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
    await db.documents.delete_many({"user_id": user_id})
    await db.evidences.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

# Mission routes (Enhanced)
@api_router.post("/missions", response_model=Mission)
async def create_mission(mission_data: MissionCreate, current_user: User = Depends(get_admin_user)):
    mission = Mission(**mission_data.dict(), created_by=current_user.id)
    await db.missions.insert_one(mission.dict())
    return mission

@api_router.get("/missions", response_model=List[Mission])
async def get_missions(
    competence_area: Optional[CompetenceArea] = None,
    difficulty_level: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if competence_area:
        query["competence_area"] = competence_area
    if difficulty_level:
        query["difficulty_level"] = difficulty_level
    
    missions = await db.missions.find(query).sort("position", 1).skip(skip).limit(limit).to_list(limit)
    return [Mission(**mission) for mission in missions]

@api_router.get("/missions/by-competence")
async def get_missions_by_competence():
    """Get missions grouped by competence area"""
    pipeline = [
        {
            "$group": {
                "_id": "$competence_area",
                "missions": {"$push": "$$ROOT"},
                "total": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    result = await db.missions.aggregate(pipeline).to_list(100)
    
    grouped_missions = {}
    for group in result:
        competence = group["_id"]
        missions = [Mission(**mission) for mission in group["missions"]]
        grouped_missions[competence] = {
            "missions": missions,
            "total": group["total"]
        }
    
    return grouped_missions

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
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
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
        elif await check_mission_cooldown(user_id, mission_obj.id):
            # Check prerequisites
            prereq_met = all(prereq in completed_missions for prereq in mission_obj.prerequisite_missions)
            status = MissionStatus.AVAILABLE if prereq_met else MissionStatus.LOCKED
        else:
            status = MissionStatus.LOCKED
        
        # Calculate progress percentage for partial completion
        progress_percentage = 0.0
        if status == MissionStatus.COMPLETED:
            progress_percentage = 100.0
        elif mission_obj.evidence_required:
            # Check if evidence is pending review
            evidence = await db.evidences.find_one({"user_id": user_id, "mission_id": mission_obj.id})
            if evidence and evidence["status"] == "pending":
                status = MissionStatus.IN_REVIEW
                progress_percentage = 50.0
        
        missions_with_status.append(MissionWithStatus(
            **mission_obj.dict(),
            status=status,
            progress_percentage=progress_percentage
        ))
    
    return missions_with_status

@api_router.get("/missions/{mission_id}/cooldown/{user_id}")
async def check_mission_cooldown_status(mission_id: str, user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    can_attempt = await check_mission_cooldown(user_id, mission_id)
    
    if not can_attempt:
        user = await db.users.find_one({"id": user_id})
        failed_missions = user.get("failed_missions", {})
        failed_date = failed_missions.get(mission_id)
        
        if failed_date:
            if isinstance(failed_date, str):
                failed_date = datetime.fromisoformat(failed_date)
            
            retry_after = failed_date + timedelta(days=7)
            
            return {
                "can_attempt": False,
                "message": "Debes esperar 7 días antes de intentar esta misión nuevamente",
                "retry_after": retry_after.isoformat(),
                "days_remaining": (retry_after - datetime.utcnow()).days
            }
    
    return {"can_attempt": True}

@api_router.post("/missions/{mission_id}/complete")
async def complete_mission(
    mission_id: str, 
    completion: MissionCompletion, 
    current_user: User = Depends(get_current_user)
):
    mission = await db.missions.find_one({"id": mission_id})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission_obj = Mission(**mission)
    user = current_user
    
    # Check if mission is already completed
    if mission_id in user.completed_missions:
        raise HTTPException(status_code=400, detail="Mission already completed")
    
    # Check cooldown
    if not await check_mission_cooldown(user.id, mission_id):
        raise HTTPException(status_code=400, detail="Mission is in cooldown period")
    
    # Check prerequisites
    prereq_met = all(prereq in user.completed_missions for prereq in mission_obj.prerequisite_missions)
    if not prereq_met:
        raise HTTPException(status_code=400, detail="Prerequisites not met")
    
    success = False
    score = 100.0
    
    # Handle different mission types
    if mission_obj.type == MissionType.MINI_QUIZ:
        questions = mission_obj.content.get("questions", [])
        answers = completion.completion_data.get("answers", {})
        
        if not answers:
            raise HTTPException(status_code=400, detail="No answers provided")
        
        correct_answers = 0
        for i, question in enumerate(questions):
            user_answer = answers.get(str(i))
            if user_answer is not None and user_answer == question.get("correct", -1):
                correct_answers += 1
        
        score = (correct_answers / len(questions)) * 100 if questions else 0
        success = score >= 70  # 70% minimum to pass
        
        # Record attempt
        attempt = MissionAttempt(
            user_id=user.id,
            mission_id=mission_id,
            status=MissionAttemptStatus.SUCCESS if success else MissionAttemptStatus.FAILED,
            score=score,
            answers=answers
        )
        await db.mission_attempts.insert_one(attempt.dict())
        
        if not success:
            # Add to failed missions with cooldown
            await db.users.update_one(
                {"id": user.id},
                {
                    "$set": {
                        f"failed_missions.{mission_id}": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {
                "success": False,
                "score": score,
                "message": f"Necesitas al menos 70% para completar la misión. Obtuviste {score:.1f}%. Podrás intentar nuevamente en 7 días.",
                "retry_after": (datetime.utcnow() + timedelta(days=7)).isoformat()
            }
    
    elif mission_obj.type in [MissionType.DOCUMENT_UPLOAD, MissionType.PRACTICAL_TASK, MissionType.MICROVIDEO]:
        if mission_obj.evidence_required and not mission_obj.auto_approve:
            # Mark as pending review
            return {
                "success": False,
                "message": "Evidencia enviada. Está pendiente de revisión por parte del equipo.",
                "status": "pending_review"
            }
        else:
            success = True
    
    else:
        # Other mission types auto-complete
        success = True
    
    if success:
        # Award points and coins
        points_awarded = mission_obj.points_reward
        coins_awarded = mission_obj.coins_reward
        
        # Update user
        await db.users.update_one(
            {"id": user.id},
            {
                "$push": {"completed_missions": mission_id},
                "$inc": {
                    "points": points_awarded,
                    "coins": coins_awarded,
                    "weekly_xp": points_awarded
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Update streak
        await update_user_streak(user.id)
        
        # Check for level up
        updated_user = await db.users.find_one({"id": user.id})
        updated_user_obj = User(**updated_user)
        level_changed = await check_and_update_user_level(updated_user_obj)
        
        # Award badges
        badges_awarded = await award_badges_to_user(updated_user_obj)
        
        # Create success notification
        notification = Notification(
            user_id=user.id,
            type=NotificationType.MISSION_AVAILABLE,
            title="¡Misión Completada!",
            message=f"Has completado '{mission_obj.title}' y ganado {points_awarded} puntos y {coins_awarded} monedas.",
            data={
                "mission_id": mission_id,
                "points_awarded": points_awarded,
                "coins_awarded": coins_awarded,
                "level_changed": level_changed,
                "badges_awarded": len(badges_awarded)
            }
        )
        await db.notifications.insert_one(notification.dict())
        
        return {
            "success": True,
            "score": score,
            "points_awarded": points_awarded,
            "coins_awarded": coins_awarded,
            "level_changed": level_changed,
            "badges_awarded": [badge.title for badge in badges_awarded],
            "message": f"¡Excelente! Has completado la misión y ganado {points_awarded} puntos y {coins_awarded} monedas."
        }

# Enhanced Event routes with eligibility
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_admin_user)):
    event = Event(**event_data.dict())
    await db.events.insert_one(event.dict())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events(
    event_type: Optional[EventType] = None,
    ciudad: Optional[str] = None,
    upcoming_only: bool = True,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if event_type:
        query["event_type"] = event_type
    if ciudad:
        query["ciudad"] = ciudad
    if upcoming_only:
        query["date"] = {"$gte": datetime.utcnow()}
    
    events = await db.events.find(query).sort("date", 1).skip(skip).limit(limit).to_list(limit)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventUpdate, current_user: User = Depends(get_admin_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
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
    
    # Clean up related data
    await db.eligibility_rules.delete_many({"event_id": event_id})
    await db.qr_tokens.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted successfully"}

# Event Eligibility routes
@api_router.post("/events/{event_id}/eligibility-rules", response_model=EligibilityRule)
async def create_eligibility_rule(
    event_id: str, 
    rule_data: EligibilityRuleCreate, 
    current_user: User = Depends(get_admin_user)
):
    # Validate that event exists
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Validate JSON condition
    try:
        json.loads(rule_data.condition)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON condition")
    
    rule = EligibilityRule(event_id=event_id, **rule_data.dict())
    await db.eligibility_rules.insert_one(rule.dict())
    
    return rule

@api_router.get("/events/{event_id}/eligibility-rules", response_model=List[EligibilityRule])
async def get_event_eligibility_rules(event_id: str, current_user: User = Depends(get_current_user)):
    rules = await db.eligibility_rules.find({"event_id": event_id}).to_list(100)
    return [EligibilityRule(**rule) for rule in rules]

@api_router.get("/events/{event_id}/eligibility/{user_id}", response_model=EventEligibility)
async def get_event_eligibility(
    event_id: str, 
    user_id: str, 
    current_user: User = Depends(get_current_user)
):
    # Users can only check their own eligibility unless admin
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    eligibility = await calculate_event_eligibility(user_id, event_id)
    
    # Store eligibility calculation in database
    await db.event_eligibilities.replace_one(
        {"event_id": event_id, "user_id": user_id},
        eligibility.dict(),
        upsert=True
    )
    
    return eligibility

@api_router.get("/events/{event_id}/suggestions/{user_id}")
async def get_event_suggestions(
    event_id: str, 
    user_id: str, 
    current_user: User = Depends(get_current_user)
):
    """Get smart suggestions for what user needs to be eligible for event"""
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    suggestions = await generate_suggestions_for_event(user_id, event_id)
    return {"suggestions": suggestions}

# QR Token routes
@api_router.post("/qr-token/generate")
async def generate_user_qr_token(
    event_id: Optional[str] = None, 
    current_user: User = Depends(get_current_user)
):
    """Generate QR token for current user"""
    qr_token = await generate_qr_token(current_user.id, event_id)
    
    # Generate QR code image data
    qr_data = {
        "token": qr_token.token,
        "user_id": qr_token.user_id,
        "event_id": qr_token.event_id,
        "status": qr_token.status.value,
        "expires_at": qr_token.expires_at.isoformat()
    }
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(json.dumps(qr_data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return {
        "qr_token": qr_token,
        "qr_image": f"data:image/png;base64,{img_str}",
        "expires_in_minutes": 5
    }

@api_router.post("/qr-token/verify")
async def verify_qr_token(token_data: dict, current_user: User = Depends(get_current_user)):
    """Verify QR token (for staff check-in)"""
    token = token_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    qr_token = await db.qr_tokens.find_one({"token": token})
    if not qr_token:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    qr_token_obj = QRToken(**qr_token)
    
    # Check if token is expired
    if datetime.utcnow() > qr_token_obj.expires_at:
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Check if token is already used
    if qr_token_obj.used:
        raise HTTPException(status_code=400, detail="Token already used")
    
    # Mark token as used
    await db.qr_tokens.update_one(
        {"id": qr_token_obj.id},
        {
            "$set": {
                "used": True,
                "used_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "valid": True,
        "user_info": qr_token_obj.user_info,
        "status": qr_token_obj.status,
        "event_id": qr_token_obj.event_id,
        "verification_time": datetime.utcnow().isoformat()
    }

# Document and Evidence routes
@api_router.post("/documents/upload")
async def upload_document(
    document_type: DocumentType = Form(...),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload user document"""
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "video/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Only PDF, JPG, PNG, and MP4 files are allowed"
        )
    
    # Create file path (in production, use cloud storage)
    file_path = f"documents/{current_user.id}/{file.filename}"
    
    # Parse expiry date
    expiry_datetime = None
    if expiry_date:
        try:
            expiry_datetime = datetime.fromisoformat(expiry_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format")
    
    document = Document(
        user_id=current_user.id,
        document_type=document_type,
        file_path=file_path,
        file_name=file.filename,
        file_size=0,  # In production, get actual file size
        mime_type=file.content_type,
        expiry_date=expiry_datetime
    )
    
    await db.documents.insert_one(document.dict())
    
    return {
        "success": True,
        "document_id": document.id,
        "message": "Document uploaded successfully. It will be reviewed by our team."
    }

@api_router.get("/documents/user/{user_id}")
async def get_user_documents(
    user_id: str, 
    document_type: Optional[DocumentType] = None,
    current_user: User = Depends(get_current_user)
):
    """Get user documents"""
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    query = {"user_id": user_id}
    if document_type:
        query["document_type"] = document_type
    
    documents = await db.documents.find(query).to_list(100)
    return [Document(**doc) for doc in documents]

@api_router.post("/evidences/upload")
async def upload_evidence(
    mission_id: str = Form(...),
    document_type: Optional[DocumentType] = Form(None),
    description: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload mission evidence"""
    # Validate mission exists
    mission = await db.missions.find_one({"id": mission_id})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "video/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Only PDF, JPG, PNG, and MP4 files are allowed"
        )
    
    # Create file path
    file_path = f"evidences/{current_user.id}/{mission_id}/{file.filename}"
    
    evidence = Evidence(
        user_id=current_user.id,
        mission_id=mission_id,
        document_type=document_type,
        file_path=file_path,
        file_name=file.filename,
        file_size=0,  # In production, get actual file size
        mime_type=file.content_type,
        description=description
    )
    
    await db.evidences.insert_one(evidence.dict())
    
    return {
        "success": True,
        "evidence_id": evidence.id,
        "message": "Evidence uploaded successfully. It will be reviewed by our team."
    }

@api_router.get("/evidences/pending")
async def get_pending_evidences(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_reviewer_user)
):
    """Get pending evidences for review"""
    evidences = await db.evidences.find(
        {"status": DocumentStatus.PENDING}
    ).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user and mission data
    enriched_evidences = []
    for evidence in evidences:
        evidence_obj = Evidence(**evidence)
        
        # Get user info
        user = await db.users.find_one({"id": evidence_obj.user_id})
        mission = await db.missions.find_one({"id": evidence_obj.mission_id})
        
        enriched_evidences.append({
            "evidence": evidence_obj,
            "user": {
                "nombre": user["nombre"] if user else "Unknown",
                "apellido": user["apellido"] if user else "User",
                "emprendimiento": user["nombre_emprendimiento"] if user else ""
            },
            "mission": {
                "title": mission["title"] if mission else "Unknown Mission",
                "competence_area": mission["competence_area"] if mission else ""
            }
        })
    
    return enriched_evidences

@api_router.post("/evidences/{evidence_id}/review")
async def review_evidence(
    evidence_id: str,
    review_data: EvidenceReview,
    current_user: User = Depends(get_reviewer_user)
):
    """Review evidence submission"""
    evidence = await db.evidences.find_one({"id": evidence_id})
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Update evidence status
    await db.evidences.update_one(
        {"id": evidence_id},
        {
            "$set": {
                "status": review_data.status,
                "reviewed_by": current_user.id,
                "review_notes": review_data.review_notes,
                "reviewed_at": datetime.utcnow()
            }
        }
    )
    
    # If approved, complete the mission
    if review_data.status == DocumentStatus.APPROVED:
        mission_id = evidence["mission_id"]
        user_id = evidence["user_id"]
        
        # Check if mission is already completed
        user = await db.users.find_one({"id": user_id})
        if mission_id not in user["completed_missions"]:
            mission = await db.missions.find_one({"id": mission_id})
            mission_obj = Mission(**mission)
            
            # Award points and coins
            await db.users.update_one(
                {"id": user_id},
                {
                    "$push": {"completed_missions": mission_id},
                    "$inc": {
                        "points": mission_obj.points_reward,
                        "coins": mission_obj.coins_reward
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            # Update streak and check level up
            await update_user_streak(user_id)
            updated_user = await db.users.find_one({"id": user_id})
            await check_and_update_user_level(User(**updated_user))
    
    # Create notification
    notification_type = NotificationType.EVIDENCE_APPROVED if review_data.status == DocumentStatus.APPROVED else NotificationType.EVIDENCE_REJECTED
    notification = Notification(
        user_id=evidence["user_id"],
        type=notification_type,
        title="Evidencia Revisada",
        message=f"Tu evidencia ha sido {'aprobada' if review_data.status == DocumentStatus.APPROVED else 'rechazada'}. {review_data.review_notes}",
        data={
            "evidence_id": evidence_id,
            "status": review_data.status,
            "review_notes": review_data.review_notes
        }
    )
    await db.notifications.insert_one(notification.dict())
    
    return {
        "success": True,
        "message": f"Evidence {'approved' if review_data.status == DocumentStatus.APPROVED else 'rejected'} successfully"
    }

# Enhanced Reward routes with redemption system
@api_router.post("/rewards", response_model=Reward)
async def create_reward(reward_data: RewardCreate, current_user: User = Depends(get_admin_user)):
    reward = Reward(**reward_data.dict())
    await db.rewards.insert_one(reward.dict())
    return reward

@api_router.get("/rewards", response_model=List[Reward])
async def get_rewards(
    reward_type: Optional[RewardType] = None,
    ciudad: Optional[str] = None,
    available_only: bool = True,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if reward_type:
        query["reward_type"] = reward_type
    if ciudad:
        query["ciudad"] = ciudad
    if available_only:
        query["$or"] = [
            {"available_until": None},
            {"available_until": {"$gte": datetime.utcnow()}}
        ]
        # Also check stock
        query["$where"] = "this.stock == -1 || this.stock > this.stock_consumed"
    
    rewards = await db.rewards.find(query).skip(skip).limit(limit).to_list(limit)
    return [Reward(**reward) for reward in rewards]

@api_router.get("/rewards/{reward_id}", response_model=Reward)
async def get_reward(reward_id: str):
    reward = await db.rewards.find_one({"id": reward_id})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    return Reward(**reward)

@api_router.put("/rewards/{reward_id}", response_model=Reward)
async def update_reward(reward_id: str, reward_data: RewardUpdate, current_user: User = Depends(get_admin_user)):
    reward = await db.rewards.find_one({"id": reward_id})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
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

@api_router.post("/rewards/{reward_id}/redeem")
async def redeem_reward(reward_id: str, current_user: User = Depends(get_current_user)):
    """Redeem a reward with coins"""
    reward = await db.rewards.find_one({"id": reward_id})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    reward_obj = Reward(**reward)
    
    # Check if reward is available
    if reward_obj.available_until and datetime.utcnow() > reward_obj.available_until:
        raise HTTPException(status_code=400, detail="Reward has expired")
    
    # Check stock
    if reward_obj.stock != -1 and reward_obj.stock_consumed >= reward_obj.stock:
        raise HTTPException(status_code=400, detail="Reward is out of stock")
    
    # Check user has enough coins
    if current_user.coins < reward_obj.coins_cost:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient coins. You need {reward_obj.coins_cost} coins but have {current_user.coins}"
        )
    
    # Generate redemption code
    redemption_code = secrets.token_hex(8).upper()
    
    # Create redemption record
    redemption = RewardRedemption(
        user_id=current_user.id,
        reward_id=reward_id,
        redemption_code=redemption_code
    )
    
    # Generate QR code for physical redemption if needed
    if reward_obj.reward_type in [RewardType.DISCOUNT, RewardType.CONSULTATION, RewardType.EQUIPMENT]:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(redemption_code)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        redemption.qr_code_data = img_str
    
    await db.reward_redemptions.insert_one(redemption.dict())
    
    # Update user coins and reward stock
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"coins": -reward_obj.coins_cost}}
    )
    
    await db.rewards.update_one(
        {"id": reward_id},
        {"$inc": {"stock_consumed": 1}}
    )
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        type=NotificationType.REWARD_AVAILABLE,
        title="¡Recompensa Canjeada!",
        message=f"Has canjeado '{reward_obj.title}'. Tu código es: {redemption_code}",
        data={
            "reward_id": reward_id,
            "redemption_code": redemption_code,
            "reward_title": reward_obj.title
        }
    )
    await db.notifications.insert_one(notification.dict())
    
    return {
        "success": True,
        "redemption_code": redemption_code,
        "qr_code": f"data:image/png;base64,{redemption.qr_code_data}" if redemption.qr_code_data else None,
        "message": f"¡Recompensa canjeada exitosamente! Tu código es: {redemption_code}",
        "instructions": reward_obj.terms_conditions,
        "external_url": reward_obj.external_url
    }

@api_router.get("/rewards/my-redemptions")
async def get_my_redemptions(current_user: User = Depends(get_current_user)):
    """Get current user's reward redemptions"""
    redemptions = await db.reward_redemptions.find({"user_id": current_user.id}).to_list(100)
    
    # Enrich with reward data
    enriched_redemptions = []
    for redemption in redemptions:
        reward = await db.rewards.find_one({"id": redemption["reward_id"]})
        enriched_redemptions.append({
            "redemption": RewardRedemption(**redemption),
            "reward": Reward(**reward) if reward else None
        })
    
    return enriched_redemptions

# League System routes
@api_router.post("/leagues", response_model=League)
async def create_league(league_data: LeagueCreate, current_user: User = Depends(get_admin_user)):
    """Create a new league"""
    league = League(**league_data.dict())
    await db.leagues.insert_one(league.dict())
    return league

@api_router.get("/leagues/current")
async def get_current_leagues(
    ciudad: Optional[str] = None,
    cohorte: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get currently active leagues"""
    now = datetime.utcnow()
    query = {
        "is_active": True,
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }
    
    if ciudad:
        query["ciudad"] = ciudad
    if cohorte:
        query["cohorte"] = cohorte
    
    leagues = await db.leagues.find(query).to_list(100)
    return [League(**league) for league in leagues]

@api_router.get("/leagues/{league_id}/leaderboard")
async def get_league_leaderboard(league_id: str, current_user: User = Depends(get_current_user)):
    """Get league leaderboard"""
    league = await db.leagues.find_one({"id": league_id})
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    league_obj = League(**league)
    
    # Get participants with their weekly XP
    participants = await db.users.find(
        {"id": {"$in": league_obj.participants}}
    ).to_list(1000)
    
    # Sort by weekly XP
    sorted_participants = sorted(
        participants, 
        key=lambda x: x.get("weekly_xp", 0), 
        reverse=True
    )
    
    leaderboard = []
    for i, participant in enumerate(sorted_participants[:100]):  # Top 100
        leaderboard.append({
            "position": i + 1,
            "user": {
                "id": participant["id"],
                "nombre": participant["nombre"],
                "apellido": participant["apellido"],
                "emprendimiento": participant["nombre_emprendimiento"]
            },
            "weekly_xp": participant.get("weekly_xp", 0),
            "total_points": participant.get("points", 0),
            "current_streak": participant.get("current_streak", 0)
        })
    
    return {
        "league": league_obj,
        "leaderboard": leaderboard,
        "total_participants": len(league_obj.participants)
    }

@api_router.post("/leagues/{league_id}/join")
async def join_league(league_id: str, current_user: User = Depends(get_current_user)):
    """Join a league"""
    league = await db.leagues.find_one({"id": league_id})
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    league_obj = League(**league)
    
    # Check if user can join (same city/cohorte)
    if league_obj.ciudad != current_user.ciudad:
        raise HTTPException(status_code=400, detail="You can only join leagues in your city")
    
    if league_obj.cohorte and league_obj.cohorte != current_user.cohorte:
        raise HTTPException(status_code=400, detail="You can only join leagues in your cohorte")
    
    # Check if already joined
    if current_user.id in league_obj.participants:
        raise HTTPException(status_code=400, detail="Already joined this league")
    
    # Add user to league
    await db.leagues.update_one(
        {"id": league_id},
        {"$push": {"participants": current_user.id}}
    )
    
    return {"success": True, "message": "Successfully joined league"}

# Badge and Achievement routes
@api_router.post("/badges", response_model=Badge)
async def create_badge(badge_data: Badge, current_user: User = Depends(get_admin_user)):
    """Create a new badge"""
    await db.badges.insert_one(badge_data.dict())
    return badge_data

@api_router.get("/badges", response_model=List[Badge])
async def get_badges(
    category: Optional[BadgeCategory] = None,
    rarity: Optional[BadgeRarity] = None
):
    """Get all badges"""
    query = {}
    if category:
        query["category"] = category
    if rarity:
        query["rarity"] = rarity
    
    badges = await db.badges.find(query).to_list(100)
    return [Badge(**badge) for badge in badges]

@api_router.get("/badges/user/{user_id}")
async def get_user_badges(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user's earned badges"""
    if current_user.role not in [UserRole.ADMIN, UserRole.REVISOR] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user_badges = await db.user_badges.find({"user_id": user_id}).to_list(100)
    
    # Enrich with badge data
    enriched_badges = []
    for user_badge in user_badges:
        badge = await db.badges.find_one({"id": user_badge["badge_id"]})
        if badge:
            enriched_badges.append({
                "user_badge": UserBadge(**user_badge),
                "badge": Badge(**badge)
            })
    
    return enriched_badges

# Notification routes
@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get user notifications"""
    query = {"user_id": current_user.id}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Notification(**notification) for notification in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}

@api_router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"success": True}

# Admin and Analytics routes
@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: User = Depends(get_admin_user)):
    """Get comprehensive admin statistics"""
    # Basic counts
    total_users = await db.users.count_documents({})
    total_missions = await db.missions.count_documents({})
    
    # Calculate total completed missions
    users = await db.users.find({}).to_list(10000)
    total_completed_missions = sum(len(user.get("completed_missions", [])) for user in users)
    
    # Calculate total points and coins awarded
    total_points_awarded = sum(user.get("points", 0) for user in users)
    total_coins_awarded = sum(user.get("coins", 0) for user in users)
    
    # Active users (last week and month)
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)
    
    active_users_last_week = await db.users.count_documents({
        "last_activity": {"$gte": week_ago}
    })
    
    active_users_last_month = await db.users.count_documents({
        "last_activity": {"$gte": month_ago}
    })
    
    # Most popular missions
    mission_completion_counts = {}
    for user in users:
        completed_missions = user.get("completed_missions", [])
        for mission_id in completed_missions:
            mission_completion_counts[mission_id] = mission_completion_counts.get(mission_id, 0) + 1
    
    # Get mission details for top missions
    most_popular_missions = []
    for mission_id, count in sorted(mission_completion_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        mission = await db.missions.find_one({"id": mission_id})
        if mission:
            most_popular_missions.append({
                "mission": Mission(**mission),
                "completion_count": count
            })
    
    # Completion rate by competence area
    competence_stats = {}
    for competence in CompetenceArea:
        area_missions = await db.missions.find({"competence_area": competence.value}).to_list(1000)
        total_area_missions = len(area_missions)
        
        if total_area_missions > 0:
            area_mission_ids = [m["id"] for m in area_missions]
            completed_in_area = sum(
                len([m for m in user.get("completed_missions", []) if m in area_mission_ids])
                for user in users
            )
            
            # Calculate completion rate
            possible_completions = total_users * total_area_missions
            completion_rate = (completed_in_area / possible_completions * 100) if possible_completions > 0 else 0
            competence_stats[competence.value] = completion_rate
    
    # User distribution by city
    user_distribution_by_city = {}
    for user in users:
        city = user.get("ciudad", "Unknown")
        user_distribution_by_city[city] = user_distribution_by_city.get(city, 0) + 1
    
    # Weekly engagement trend (simplified)
    weekly_engagement_trend = []
    for i in range(8):  # Last 8 weeks
        week_start = datetime.utcnow() - timedelta(weeks=i+1)
        week_end = datetime.utcnow() - timedelta(weeks=i)
        
        active_users_week = await db.users.count_documents({
            "last_activity": {"$gte": week_start, "$lt": week_end}
        })
        
        weekly_engagement_trend.append({
            "week": f"Week -{i}",
            "active_users": active_users_week,
            "date_range": {
                "start": week_start.isoformat(),
                "end": week_end.isoformat()
            }
        })
    
    # Top performers
    top_performers = sorted(users, key=lambda x: x.get("points", 0), reverse=True)[:10]
    top_performers_data = []
    for user in top_performers:
        top_performers_data.append({
            "user": {
                "id": user["id"],
                "nombre": user["nombre"],
                "apellido": user["apellido"],
                "emprendimiento": user["nombre_emprendimiento"]
            },
            "points": user.get("points", 0),
            "completed_missions": len(user.get("completed_missions", [])),
            "current_streak": user.get("current_streak", 0)
        })
    
    # Event attendance stats (placeholder)
    event_attendance_stats = {
        "total_events": await db.events.count_documents({}),
        "upcoming_events": await db.events.count_documents({"date": {"$gte": datetime.utcnow()}}),
        "average_registration_rate": 0.75  # This would need more complex calculation
    }
    
    # Reward redemption stats
    reward_redemptions = await db.reward_redemptions.find({}).to_list(10000)
    reward_redemption_stats = {
        "total_redemptions": len(reward_redemptions),
        "total_coins_spent": sum(
            reward["coins_cost"] for redemption in reward_redemptions
            for reward in [await db.rewards.find_one({"id": redemption["reward_id"]})]
            if reward
        ),
        "most_popular_rewards": {}  # Would need aggregation
    }
    
    return AdminStats(
        total_users=total_users,
        total_missions=total_missions,
        total_completed_missions=total_completed_missions,
        total_points_awarded=total_points_awarded,
        total_coins_awarded=total_coins_awarded,
        active_users_last_week=active_users_last_week,
        active_users_last_month=active_users_last_month,
        most_popular_missions=most_popular_missions,
        completion_rate_by_competence=competence_stats,
        user_distribution_by_city=user_distribution_by_city,
        weekly_engagement_trend=weekly_engagement_trend,
        top_performers=top_performers_data,
        event_attendance_stats=event_attendance_stats,
        reward_redemption_stats=reward_redemption_stats
    )

@api_router.get("/admin/impact-metrics")
async def get_impact_metrics(
    period: str = "monthly",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    """Get impact metrics for reporting"""
    # Parse dates
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
    else:
        if period == "weekly":
            start_dt = datetime.utcnow() - timedelta(weeks=1)
        elif period == "monthly":
            start_dt = datetime.utcnow() - timedelta(days=30)
        elif period == "quarterly":
            start_dt = datetime.utcnow() - timedelta(days=90)
        else:
            start_dt = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
    else:
        end_dt = datetime.utcnow()
    
    # Get users in date range
    users = await db.users.find({
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }).to_list(10000)
    
    total_entrepreneurs = len(users)
    active_entrepreneurs = len([u for u in users if u.get("last_activity", start_dt) >= start_dt])
    
    # Count specific achievements
    missions_completed = sum(len(user.get("completed_missions", [])) for user in users)
    
    # Count document submissions (proxies for business formalization)
    ruc_registrations = await db.documents.count_documents({
        "document_type": "ruc",
        "status": "approved",
        "uploaded_at": {"$gte": start_dt, "$lte": end_dt}
    })
    
    pitch_videos_submitted = await db.evidences.count_documents({
        "document_type": "pitch_video",
        "uploaded_at": {"$gte": start_dt, "$lte": end_dt}
    })
    
    business_plans_completed = await db.evidences.count_documents({
        "document_type": "business_plan",
        "status": "approved",
        "uploaded_at": {"$gte": start_dt, "$lte": end_dt}
    })
    
    # Event attendance (would need event registration tracking)
    events_attended = await db.events.count_documents({
        "date": {"$gte": start_dt, "$lte": end_dt}
    }) * 0.7  # Assume 70% attendance rate
    
    # Networking connections (from networking missions)
    networking_connections = await db.evidences.count_documents({
        "mission_id": {"$in": await get_networking_mission_ids()},
        "status": "approved",
        "uploaded_at": {"$gte": start_dt, "$lte": end_dt}
    }) * 5  # Assume 5 connections per networking mission
    
    return ImpactMetrics(
        period=period,
        date_range={"start": start_dt, "end": end_dt},
        total_entrepreneurs=total_entrepreneurs,
        active_entrepreneurs=active_entrepreneurs,
        missions_completed=missions_completed,
        events_attended=int(events_attended),
        business_plans_completed=business_plans_completed,
        ruc_registrations=ruc_registrations,
        pitch_videos_submitted=pitch_videos_submitted,
        networking_connections=networking_connections,
        mentorship_sessions=0,  # Would need mentorship tracking
        funding_applications=0,  # Would need integration with funding platforms
        jobs_created=0,  # Would need manual reporting
        revenue_generated=0.0,  # Would need manual reporting
        participant_satisfaction=4.2,  # Would need surveys
        knowledge_improvement=0.85,  # Would need pre/post assessments
        business_survival_rate=0.73  # Would need long-term tracking
    )

async def get_networking_mission_ids():
    """Helper function to get networking mission IDs"""
    missions = await db.missions.find({"type": "networking_task"}).to_list(100)
    return [mission["id"] for mission in missions]

@api_router.get("/admin/export/users")
async def export_users(
    format: str = "csv",
    ciudad: Optional[str] = None,
    cohorte: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    """Export users data"""
    query = {}
    if ciudad:
        query["ciudad"] = ciudad
    if cohorte:
        query["cohorte"] = cohorte
    
    users = await db.users.find(query).to_list(10000)
    
    if format.lower() == "csv":
        # Create CSV data
        csv_data = "ID,Nombre,Apellido,Cedula,Email,Emprendimiento,Ciudad,Cohorte,Puntos,Monedas,Misiones Completadas,Racha Actual,Fecha Registro\n"
        
        for user in users:
            csv_data += f"{user['id']},{user['nombre']},{user['apellido']},{user['cedula']},{user['email']},{user['nombre_emprendimiento']},{user.get('ciudad', '')},{user.get('cohorte', '')},{user.get('points', 0)},{user.get('coins', 0)},{len(user.get('completed_missions', []))},{user.get('current_streak', 0)},{user.get('created_at', '').isoformat() if user.get('created_at') else ''}\n"
        
        return JSONResponse(
            content={"csv_data": csv_data},
            headers={"Content-Type": "application/json"}
        )
    
    return {"users": users}

@api_router.get("/admin/export/missions-progress")
async def export_missions_progress(
    format: str = "csv",
    competence_area: Optional[CompetenceArea] = None,
    current_user: User = Depends(get_admin_user)
):
    """Export mission progress data"""
    query = {}
    if competence_area:
        query["competence_area"] = competence_area
    
    missions = await db.missions.find(query).to_list(1000)
    users = await db.users.find({}).to_list(10000)
    
    if format.lower() == "csv":
        csv_data = "Mission ID,Mission Title,Competence Area,Total Completions,Completion Rate,Avg Score\n"
        
        for mission in missions:
            completions = sum(1 for user in users if mission["id"] in user.get("completed_missions", []))
            completion_rate = (completions / len(users) * 100) if users else 0
            
            # Get average score for quiz missions
            attempts = await db.mission_attempts.find({"mission_id": mission["id"], "status": "success"}).to_list(1000)
            avg_score = sum(attempt.get("score", 0) for attempt in attempts) / len(attempts) if attempts else 0
            
            csv_data += f"{mission['id']},{mission['title']},{mission['competence_area']},{completions},{completion_rate:.1f},{avg_score:.1f}\n"
        
        return JSONResponse(
            content={"csv_data": csv_data},
            headers={"Content-Type": "application/json"}
        )
    
    return {"missions": missions}

# Weekly league reset (would be called by cron job)
@api_router.post("/admin/reset-weekly-leagues")
async def reset_weekly_leagues(current_user: User = Depends(get_admin_user)):
    """Reset weekly XP for all users and create new leagues"""
    # Reset weekly XP for all users
    await db.users.update_many({}, {"$set": {"weekly_xp": 0}})
    
    # End current leagues
    await db.leagues.update_many(
        {"is_active": True, "end_date": {"$lte": datetime.utcnow()}},
        {"$set": {"is_active": False}}
    )
    
    return {"success": True, "message": "Weekly leagues reset successfully"}

# Mount the API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
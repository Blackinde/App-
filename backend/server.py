from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import bcrypt
import jwt
from bson import ObjectId
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tramitly_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'tramitly_secret_key_2024_mx_saas')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Create the main app
app = FastAPI(title="Tramitly API", version="2.0.0", description="Plataforma SaaS de Trámites Digitales")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS & CONSTANTS ====================

ORDER_STATUSES = ["pending", "paid", "processing", "completed", "failed", "refunded"]
USER_ROLES = ["user", "admin"]
TRANSACTION_TYPES = ["deposit", "withdrawal", "payment", "refund"]
TRANSACTION_STATUSES = ["pending", "approved", "rejected"]

SERVICE_CATEGORIES = [
    {"id": "seguridad-social", "name": "Seguridad Social", "icon": "shield-checkmark"},
    {"id": "identidad", "name": "Identidad", "icon": "person-circle"},
    {"id": "fiscal", "name": "Fiscal", "icon": "document-text"},
    {"id": "creditos", "name": "Créditos", "icon": "cash"},
]

# ==================== MODELS ====================

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    balance: float
    created_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

# Service Models
class ServiceBase(BaseModel):
    name: str
    slug: str
    category: str
    description: str
    short_description: str
    price: float
    estimated_time: str
    requirements: List[str]
    required_fields: List[str]
    is_active: bool = True

class ServiceResponse(ServiceBase):
    id: str
    created_at: datetime

# Order Models
class OrderCreate(BaseModel):
    service_id: str
    input_data: Dict[str, Any]

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    service_id: str
    service_name: Optional[str] = None
    status: str
    amount: float
    input_data: Dict[str, Any]
    result_data: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class OrderStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None

# Transaction Models
class TransactionCreate(BaseModel):
    type: str
    amount: float
    reference: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: str
    amount: float
    reference: Optional[str] = None
    status: str
    description: Optional[str] = None
    created_at: datetime

# Settings Model
class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    id: str
    key: str
    value: str
    updated_at: datetime

# Dashboard Models
class UserDashboardStats(BaseModel):
    balance: float
    total_orders: int
    completed_orders: int
    pending_orders: int
    processing_orders: int
    recent_activity: List[Dict[str, Any]]

class AdminDashboardStats(BaseModel):
    total_users: int
    total_orders: int
    total_revenue: float
    active_services: int
    orders_by_status: Dict[str, int]
    recent_orders: List[OrderResponse]
    recent_users: List[UserResponse]

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="No autenticado")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return await db.users.find_one({"_id": ObjectId(payload["user_id"])})
    except:
        return None

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso de administrador requerido")
    return user

def generate_order_number() -> str:
    prefix = "TRM"
    date_part = datetime.now().strftime('%y%m%d')
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{date_part}-{random_part}"

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        balance=user.get("balance", 0.0),
        created_at=user["created_at"]
    )

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "role": "user",
        "balance": 0.0,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    token = create_token(user_id, "user")
    
    # Log API activity
    await db.api_logs.insert_one({
        "endpoint": "/auth/register",
        "user_id": user_id,
        "request_summary": f"Nuevo usuario: {user.email}",
        "status_code": 200,
        "created_at": datetime.utcnow()
    })
    
    return {
        "token": token,
        "user": user_to_response({**user_dict, "_id": result.inserted_id})
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(str(user["_id"]), user["role"])
    
    return {
        "token": token,
        "user": user_to_response(user)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return user_to_response(user)

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"_id": user["_id"]})
    return user_to_response(updated)

# ==================== SERVICES ROUTES ====================

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(category: Optional[str] = None, active_only: bool = True):
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["category"] = category
    
    services = await db.services.find(query).sort("name", 1).to_list(100)
    return [ServiceResponse(id=str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}) for s in services]

@api_router.get("/services/categories")
async def get_categories():
    return SERVICE_CATEGORIES

@api_router.get("/services/{slug_or_id}", response_model=ServiceResponse)
async def get_service(slug_or_id: str):
    # Try by ObjectId first, then by slug
    service = None
    try:
        service = await db.services.find_one({"_id": ObjectId(slug_or_id)})
    except:
        service = await db.services.find_one({"slug": slug_or_id})
    
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    return ServiceResponse(id=str(service["_id"]), **{k: v for k, v in service.items() if k != "_id"})

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceBase, admin: dict = Depends(require_admin)):
    service_dict = service.dict()
    service_dict["created_at"] = datetime.utcnow()
    result = await db.services.insert_one(service_dict)
    return ServiceResponse(id=str(result.inserted_id), **service_dict)

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service: ServiceBase, admin: dict = Depends(require_admin)):
    await db.services.update_one({"_id": ObjectId(service_id)}, {"$set": service.dict()})
    updated = await db.services.find_one({"_id": ObjectId(service_id)})
    return ServiceResponse(id=str(updated["_id"]), **{k: v for k, v in updated.items() if k != "_id"})

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(require_admin)):
    result = await db.services.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"message": "Servicio eliminado"}

# ==================== ORDERS ROUTES ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, user: dict = Depends(get_current_user)):
    service = await db.services.find_one({"_id": ObjectId(order.service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Check user balance
    if user.get("balance", 0) < service["price"]:
        raise HTTPException(status_code=400, detail="Saldo insuficiente. Recarga tu cuenta para continuar.")
    
    order_dict = {
        "order_number": generate_order_number(),
        "user_id": str(user["_id"]),
        "service_id": order.service_id,
        "status": "paid",  # Auto-paid from balance
        "amount": service["price"],
        "input_data": order.input_data,
        "result_data": None,
        "pdf_url": None,
        "admin_notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Deduct from balance
    new_balance = user.get("balance", 0) - service["price"]
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"balance": new_balance}})
    
    # Create transaction record
    await db.transactions.insert_one({
        "user_id": str(user["_id"]),
        "type": "payment",
        "amount": -service["price"],
        "reference": order_dict["order_number"],
        "status": "approved",
        "description": f"Pago por {service['name']}",
        "created_at": datetime.utcnow()
    })
    
    result = await db.orders.insert_one(order_dict)
    
    # Log API activity
    await db.api_logs.insert_one({
        "order_id": str(result.inserted_id),
        "endpoint": "/orders",
        "request_summary": f"Nueva orden: {order_dict['order_number']}",
        "status_code": 200,
        "created_at": datetime.utcnow()
    })
    
    return OrderResponse(id=str(result.inserted_id), service_name=service["name"], **order_dict)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    query = {"user_id": str(user["_id"])}
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for o in orders:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        service_name = service["name"] if service else "Servicio no disponible"
        result.append(OrderResponse(
            id=str(o["_id"]),
            service_name=service_name,
            **{k: v for k, v in o.items() if k != "_id"}
        ))
    return result

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except:
        order = await db.orders.find_one({"order_number": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    # Check access
    if user.get("role") != "admin" and order.get("user_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    service = await db.services.find_one({"_id": ObjectId(order["service_id"])})
    service_name = service["name"] if service else "Servicio no disponible"
    
    return OrderResponse(id=str(order["_id"]), service_name=service_name, **{k: v for k, v in order.items() if k != "_id"})

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate, admin: dict = Depends(require_admin)):
    if update.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {ORDER_STATUSES}")
    
    update_data = {"status": update.status, "updated_at": datetime.utcnow()}
    if update.admin_notes:
        update_data["admin_notes"] = update.admin_notes
    if update.result_data:
        update_data["result_data"] = update.result_data
    
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": update_data})
    
    # If refunded, return money to user
    if update.status == "refunded":
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if order:
            await db.users.update_one(
                {"_id": ObjectId(order["user_id"])},
                {"$inc": {"balance": order["amount"]}}
            )
            await db.transactions.insert_one({
                "user_id": order["user_id"],
                "type": "refund",
                "amount": order["amount"],
                "reference": order["order_number"],
                "status": "approved",
                "description": "Reembolso de orden",
                "created_at": datetime.utcnow()
            })
    
    return {"message": "Estado actualizado correctamente"}

# ==================== TRANSACTIONS ROUTES ====================

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(100)
    return [TransactionResponse(id=str(t["_id"]), **{k: v for k, v in t.items() if k != "_id"}) for t in transactions]

@api_router.post("/transactions/deposit")
async def create_deposit(transaction: TransactionCreate, user: dict = Depends(get_current_user)):
    """Simulated deposit - in production this would be connected to payment gateway"""
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser positivo")
    
    # For demo purposes, auto-approve deposits
    tx_dict = {
        "user_id": str(user["_id"]),
        "type": "deposit",
        "amount": transaction.amount,
        "reference": transaction.reference or f"DEP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "status": "approved",  # Auto-approved for demo
        "description": "Recarga de saldo",
        "created_at": datetime.utcnow()
    }
    
    await db.transactions.insert_one(tx_dict)
    
    # Update user balance
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$inc": {"balance": transaction.amount}}
    )
    
    updated_user = await db.users.find_one({"_id": user["_id"]})
    
    return {
        "message": "Depósito realizado exitosamente",
        "new_balance": updated_user.get("balance", 0)
    }

# ==================== USER DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=UserDashboardStats)
async def get_user_dashboard(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    
    # Get order counts
    total_orders = await db.orders.count_documents({"user_id": user_id})
    completed_orders = await db.orders.count_documents({"user_id": user_id, "status": "completed"})
    pending_orders = await db.orders.count_documents({"user_id": user_id, "status": {"$in": ["pending", "paid"]}})
    processing_orders = await db.orders.count_documents({"user_id": user_id, "status": "processing"})
    
    # Get recent activity (orders + transactions)
    recent_orders = await db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(5).to_list(5)
    recent_transactions = await db.transactions.find({"user_id": user_id}).sort("created_at", -1).limit(5).to_list(5)
    
    activity = []
    for o in recent_orders:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        activity.append({
            "type": "order",
            "title": service["name"] if service else "Servicio",
            "description": f"Orden {o['order_number']}",
            "status": o["status"],
            "amount": o["amount"],
            "created_at": o["created_at"].isoformat()
        })
    
    for t in recent_transactions:
        activity.append({
            "type": "transaction",
            "title": t.get("description", t["type"]),
            "description": t.get("reference", ""),
            "status": t["status"],
            "amount": t["amount"],
            "created_at": t["created_at"].isoformat()
        })
    
    # Sort by date
    activity.sort(key=lambda x: x["created_at"], reverse=True)
    
    return UserDashboardStats(
        balance=user.get("balance", 0),
        total_orders=total_orders,
        completed_orders=completed_orders,
        pending_orders=pending_orders,
        processing_orders=processing_orders,
        recent_activity=activity[:10]
    )

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({"role": "user"})
    total_orders = await db.orders.count_documents({})
    active_services = await db.services.count_documents({"is_active": True})
    
    # Calculate revenue
    pipeline = [
        {"$match": {"status": {"$in": ["paid", "processing", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Orders by status
    orders_by_status = {}
    for status in ORDER_STATUSES:
        count = await db.orders.count_documents({"status": status})
        orders_by_status[status] = count
    
    # Recent orders
    recent_orders_raw = await db.orders.find().sort("created_at", -1).limit(10).to_list(10)
    recent_orders = []
    for o in recent_orders_raw:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        recent_orders.append(OrderResponse(
            id=str(o["_id"]),
            service_name=service["name"] if service else "N/A",
            **{k: v for k, v in o.items() if k != "_id"}
        ))
    
    # Recent users
    recent_users_raw = await db.users.find({"role": "user"}).sort("created_at", -1).limit(5).to_list(5)
    recent_users = [user_to_response(u) for u in recent_users_raw]
    
    return AdminDashboardStats(
        total_users=total_users,
        total_orders=total_orders,
        total_revenue=total_revenue,
        active_services=active_services,
        orders_by_status=orders_by_status,
        recent_orders=recent_orders,
        recent_users=recent_users
    )

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find().sort("created_at", -1).to_list(1000)
    return [user_to_response(u) for u in users]

@api_router.get("/admin/orders")
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    admin: dict = Depends(require_admin)
):
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    result = []
    
    for o in orders:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        user = await db.users.find_one({"_id": ObjectId(o["user_id"])})
        
        result.append({
            "id": str(o["_id"]),
            "service_name": service["name"] if service else "N/A",
            "user_name": user["name"] if user else "N/A",
            "user_email": user["email"] if user else "N/A",
            **{k: v for k, v in o.items() if k != "_id"}
        })
    
    return result

@api_router.get("/admin/api-logs")
async def get_api_logs(limit: int = Query(default=50, le=100), admin: dict = Depends(require_admin)):
    logs = await db.api_logs.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [{
        "id": str(log["_id"]),
        **{k: v for k, v in log.items() if k != "_id"}
    } for log in logs]

# ==================== SETTINGS ROUTES ====================

@api_router.get("/admin/settings")
async def get_settings(admin: dict = Depends(require_admin)):
    settings = await db.settings.find().to_list(100)
    return [{
        "id": str(s["_id"]),
        **{k: v for k, v in s.items() if k != "_id"}
    } for s in settings]

@api_router.put("/admin/settings/{key}")
async def update_setting(key: str, update: SettingUpdate, admin: dict = Depends(require_admin)):
    result = await db.settings.update_one(
        {"key": key},
        {"$set": {"value": update.value, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Configuración actualizada"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    if await db.services.count_documents({}) > 0:
        return {"message": "Datos ya inicializados", "seeded": False}
    
    # Services
    services = [
        {
            "name": "Historial Laboral IMSS",
            "slug": "historial-laboral-imss",
            "category": "seguridad-social",
            "description": "Obtén tu historial laboral completo del IMSS con todas tus empresas, periodos de cotización, salarios base y semanas cotizadas. Este documento es fundamental para trámites de pensión, créditos hipotecarios INFONAVIT y verificación de historial laboral. Incluye información detallada de cada empleador registrado.",
            "short_description": "Consulta tu historial laboral completo del IMSS con todos tus empleadores y periodos de cotización.",
            "price": 349.00,
            "estimated_time": "24-48 horas",
            "requirements": ["CURP válido de 18 caracteres", "NSS (Número de Seguro Social) de 11 dígitos", "Correo electrónico activo"],
            "required_fields": ["name", "curp", "nss", "email", "phone"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Semanas Cotizadas IMSS",
            "slug": "semanas-cotizadas-imss",
            "category": "seguridad-social",
            "description": "Conoce el número exacto de semanas que has cotizado ante el IMSS y cuántas te faltan para pensionarte. Este documento es esencial para planificar tu retiro y conocer tu elegibilidad para diferentes modalidades de pensión. Incluye desglose por empleador y periodos exactos.",
            "short_description": "Consulta tu número exacto de semanas cotizadas ante el IMSS para planificar tu pensión.",
            "price": 299.00,
            "estimated_time": "24-48 horas",
            "requirements": ["CURP válido", "NSS de 11 dígitos"],
            "required_fields": ["name", "curp", "nss", "email"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Verificación CURP",
            "slug": "verificacion-curp",
            "category": "identidad",
            "description": "Verifica y obtén tu CURP actualizado directamente del RENAPO. Confirma que tu Clave Única de Registro de Población está correctamente registrada con todos tus datos personales oficiales: nombre completo, fecha de nacimiento, sexo, entidad de nacimiento y datos del acta.",
            "short_description": "Verifica tu CURP y obtén tus datos oficiales del RENAPO actualizados.",
            "price": 199.00,
            "estimated_time": "1-2 horas",
            "requirements": ["CURP de 18 caracteres"],
            "required_fields": ["name", "curp", "email"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Constancia de Situación Fiscal",
            "slug": "constancia-situacion-fiscal",
            "category": "fiscal",
            "description": "Obtén tu Constancia de Situación Fiscal del SAT con todos tus datos fiscales actualizados: RFC, régimen fiscal, domicilio fiscal, actividades económicas y obligaciones fiscales. Documento indispensable para facturación, trámites bancarios y contratos laborales.",
            "short_description": "Descarga tu Constancia de Situación Fiscal del SAT con datos actualizados.",
            "price": 399.00,
            "estimated_time": "24-48 horas",
            "requirements": ["RFC válido", "CURP válido"],
            "required_fields": ["name", "rfc", "curp", "email", "phone"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "RFC con Homoclave",
            "slug": "rfc-con-homoclave",
            "category": "fiscal",
            "description": "Obtén tu RFC con homoclave a partir de tu CURP. Si nunca te has registrado ante el SAT, te ayudamos a obtener tu RFC con homoclave de manera rápida y segura. Incluye verificación de datos y documento oficial.",
            "short_description": "Obtén tu RFC con homoclave usando tu CURP de forma rápida y segura.",
            "price": 349.00,
            "estimated_time": "24-72 horas",
            "requirements": ["CURP válido", "Comprobante de domicilio reciente"],
            "required_fields": ["name", "curp", "email", "phone", "address"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "NSS por CURP",
            "slug": "nss-por-curp",
            "category": "seguridad-social",
            "description": "Recupera tu Número de Seguro Social (NSS) usando únicamente tu CURP. Ideal si perdiste tu número o nunca lo conociste. Verificamos directamente en las bases del IMSS para obtener tu NSS correcto y vigente.",
            "short_description": "Recupera tu Número de Seguro Social usando solo tu CURP.",
            "price": 249.00,
            "estimated_time": "2-4 horas",
            "requirements": ["CURP válido de 18 caracteres"],
            "required_fields": ["name", "curp", "email"],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.services.insert_many(services)
    
    # Create admin user
    admin_user = {
        "name": "Administrador Tramitly",
        "email": "admin@tramitly.mx",
        "password_hash": hash_password("Admin123!"),
        "role": "admin",
        "balance": 0.0,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(admin_user)
    
    # Create demo user with balance
    demo_user = {
        "name": "Usuario Demo",
        "email": "demo@tramitly.mx",
        "password_hash": hash_password("Demo123!"),
        "role": "user",
        "balance": 1500.00,
        "created_at": datetime.utcnow()
    }
    demo_result = await db.users.insert_one(demo_user)
    demo_user_id = str(demo_result.inserted_id)
    
    # Create demo transactions
    await db.transactions.insert_many([
        {
            "user_id": demo_user_id,
            "type": "deposit",
            "amount": 2000.00,
            "reference": "DEP-20240301-001",
            "status": "approved",
            "description": "Recarga inicial",
            "created_at": datetime.utcnow() - timedelta(days=7)
        },
        {
            "user_id": demo_user_id,
            "type": "payment",
            "amount": -349.00,
            "reference": "TRM-240305-X1Y2",
            "status": "approved",
            "description": "Pago por Historial Laboral IMSS",
            "created_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "user_id": demo_user_id,
            "type": "payment",
            "amount": -199.00,
            "reference": "TRM-240306-A3B4",
            "status": "approved",
            "description": "Pago por Verificación CURP",
            "created_at": datetime.utcnow() - timedelta(days=3)
        }
    ])
    
    # Get service IDs for demo orders
    services_list = await db.services.find().to_list(10)
    
    # Create demo orders
    demo_orders = [
        {
            "order_number": "TRM-240305-X1Y2",
            "user_id": demo_user_id,
            "service_id": str(services_list[0]["_id"]),
            "status": "completed",
            "amount": 349.00,
            "input_data": {"name": "Usuario Demo", "curp": "DEMO850101HDFRRL09", "nss": "12345678901", "email": "demo@tramitly.mx", "phone": "5512345678"},
            "result_data": {"semanas_cotizadas": 520, "ultimo_patron": "Empresa Demo S.A."},
            "pdf_url": None,
            "admin_notes": "Procesado exitosamente",
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=4)
        },
        {
            "order_number": "TRM-240306-A3B4",
            "user_id": demo_user_id,
            "service_id": str(services_list[2]["_id"]),
            "status": "completed",
            "amount": 199.00,
            "input_data": {"name": "Usuario Demo", "curp": "DEMO850101HDFRRL09", "email": "demo@tramitly.mx"},
            "result_data": {"curp_valido": True, "nombre": "USUARIO DEMO"},
            "pdf_url": None,
            "admin_notes": None,
            "created_at": datetime.utcnow() - timedelta(days=3),
            "updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "order_number": "TRM-240307-C5D6",
            "user_id": demo_user_id,
            "service_id": str(services_list[1]["_id"]),
            "status": "processing",
            "amount": 299.00,
            "input_data": {"name": "Usuario Demo", "curp": "DEMO850101HDFRRL09", "nss": "12345678901", "email": "demo@tramitly.mx"},
            "result_data": None,
            "pdf_url": None,
            "admin_notes": "En proceso de verificación",
            "created_at": datetime.utcnow() - timedelta(days=1),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.orders.insert_many(demo_orders)
    
    # Create default settings
    await db.settings.insert_many([
        {"key": "company_name", "value": "Tramitly", "updated_at": datetime.utcnow()},
        {"key": "support_email", "value": "soporte@tramitly.mx", "updated_at": datetime.utcnow()},
        {"key": "support_phone", "value": "+52 55 1234 5678", "updated_at": datetime.utcnow()},
        {"key": "min_deposit", "value": "100", "updated_at": datetime.utcnow()},
        {"key": "max_deposit", "value": "50000", "updated_at": datetime.utcnow()},
    ])
    
    return {
        "message": "Datos inicializados correctamente",
        "seeded": True,
        "services_count": len(services),
        "admin_email": "admin@tramitly.mx",
        "demo_email": "demo@tramitly.mx"
    }

# Root endpoint
@api_router.get("/")
async def root():
    return {
        "name": "Tramitly API",
        "version": "2.0.0",
        "description": "Plataforma SaaS de Trámites Digitales",
        "status": "operational"
    }

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

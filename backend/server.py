from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
import base64
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'procedimientos_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'procedimientos_secret_key_2024_mx')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Procedimientos MX API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class ServiceBase(BaseModel):
    name: str
    slug: str
    category: str
    short_description: str
    full_description: str
    price: float
    delivery_time: str
    required_fields: List[str]
    requirements: Optional[List[str]] = []
    notes: Optional[List[str]] = []
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str
    created_at: datetime

class OrderBase(BaseModel):
    service_id: str
    submitted_data: Dict[str, Any]

class OrderCreate(OrderBase):
    pass

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: Optional[str]
    service_id: str
    service_name: Optional[str] = None
    status: str
    payment_status: str
    payment_method: Optional[str] = None
    total_amount: float
    submitted_data: Dict[str, Any]
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    estimated_delivery: Optional[datetime] = None

class OrderStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class PaymentCreate(BaseModel):
    order_id: str
    method: str
    reference: str
    receipt_data: Optional[str] = None  # Base64 encoded image

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    method: str
    amount: float
    reference: str
    receipt_data: Optional[str] = None
    status: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None

class DocumentUpload(BaseModel):
    order_id: str
    file_name: str
    file_data: str  # Base64 encoded file

class DocumentResponse(BaseModel):
    id: str
    order_id: str
    file_name: str
    file_data: Optional[str] = None
    uploaded_at: datetime

class DashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    total_revenue: float
    total_clients: int
    recent_orders: List[OrderResponse]

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
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
        return user
    except:
        return None

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_order_number() -> str:
    import random
    return f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.dict()
    user_dict["password_hash"] = hash_password(user_dict.pop("password"))
    user_dict["role"] = "client"
    user_dict["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    token = create_token(user_id, "client")
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "full_name": user_dict["full_name"],
            "email": user_dict["email"],
            "phone": user_dict.get("phone"),
            "role": "client",
            "created_at": user_dict["created_at"]
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(str(user["_id"]), user["role"])
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "phone": user.get("phone"),
            "role": user["role"],
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
        "created_at": user["created_at"]
    }

@api_router.put("/auth/profile")
async def update_profile(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if update_data:
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"_id": user["_id"]})
    return {
        "id": str(updated["_id"]),
        "full_name": updated["full_name"],
        "email": updated["email"],
        "phone": updated.get("phone"),
        "role": updated["role"],
        "created_at": updated["created_at"]
    }

# ==================== SERVICES ROUTES ====================

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(category: Optional[str] = None, active_only: bool = True):
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["category"] = category
    
    services = await db.services.find(query).to_list(100)
    return [ServiceResponse(id=str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}) for s in services]

@api_router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: str):
    try:
        service = await db.services.find_one({"_id": ObjectId(service_id)})
    except:
        service = await db.services.find_one({"slug": service_id})
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return ServiceResponse(id=str(service["_id"]), **{k: v for k, v in service.items() if k != "_id"})

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, admin: dict = Depends(require_admin)):
    service_dict = service.dict()
    service_dict["created_at"] = datetime.utcnow()
    result = await db.services.insert_one(service_dict)
    return ServiceResponse(id=str(result.inserted_id), **service_dict)

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service: ServiceCreate, admin: dict = Depends(require_admin)):
    await db.services.update_one({"_id": ObjectId(service_id)}, {"$set": service.dict()})
    updated = await db.services.find_one({"_id": ObjectId(service_id)})
    return ServiceResponse(id=str(updated["_id"]), **{k: v for k, v in updated.items() if k != "_id"})

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(require_admin)):
    result = await db.services.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

@api_router.get("/categories")
async def get_categories():
    categories = await db.services.distinct("category")
    return categories

# ==================== ORDERS ROUTES ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, user: dict = Depends(get_optional_user)):
    service = await db.services.find_one({"_id": ObjectId(order.service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    order_dict = {
        "order_number": generate_order_number(),
        "user_id": str(user["_id"]) if user else None,
        "service_id": order.service_id,
        "status": "pending_payment",
        "payment_status": "pending",
        "payment_method": None,
        "total_amount": service["price"],
        "submitted_data": order.submitted_data,
        "admin_notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "estimated_delivery": datetime.utcnow() + timedelta(days=int(service["delivery_time"].split()[0]) if service["delivery_time"].split()[0].isdigit() else 3)
    }
    
    result = await db.orders.insert_one(order_dict)
    return OrderResponse(id=str(result.inserted_id), service_name=service["name"], **order_dict)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    query = {"user_id": str(user["_id"])} if user.get("role") != "admin" else {}
    orders = await db.orders.find(query).sort("created_at", -1).to_list(100)
    
    result = []
    for o in orders:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        service_name = service["name"] if service else "Unknown Service"
        result.append(OrderResponse(
            id=str(o["_id"]),
            service_name=service_name,
            **{k: v for k, v in o.items() if k != "_id"}
        ))
    return result

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_optional_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except:
        order = await db.orders.find_one({"order_number": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access (allow guest access for their orders by order_number)
    if user and user.get("role") != "admin" and order.get("user_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    service = await db.services.find_one({"_id": ObjectId(order["service_id"])})
    service_name = service["name"] if service else "Unknown Service"
    
    return OrderResponse(id=str(order["_id"]), service_name=service_name, **{k: v for k, v in order.items() if k != "_id"})

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate, admin: dict = Depends(require_admin)):
    update_data = {"status": update.status, "updated_at": datetime.utcnow()}
    if update.admin_notes:
        update_data["admin_notes"] = update.admin_notes
    
    # Auto-update payment status based on order status
    if update.status == "paid":
        update_data["payment_status"] = "confirmed"
    elif update.status == "completed":
        update_data["payment_status"] = "confirmed"
    
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": update_data})
    return {"message": "Order status updated"}

# ==================== PAYMENTS ROUTES ====================

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, user: dict = Depends(get_optional_user)):
    order = await db.orders.find_one({"_id": ObjectId(payment.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    payment_dict = {
        "order_id": payment.order_id,
        "method": payment.method,
        "amount": order["total_amount"],
        "reference": payment.reference,
        "receipt_data": payment.receipt_data,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "confirmed_at": None
    }
    
    result = await db.payments.insert_one(payment_dict)
    
    # Update order payment status
    await db.orders.update_one(
        {"_id": ObjectId(payment.order_id)},
        {"$set": {"payment_status": "pending_confirmation", "payment_method": payment.method, "updated_at": datetime.utcnow()}}
    )
    
    return PaymentResponse(id=str(result.inserted_id), **payment_dict)

@api_router.get("/payments/{order_id}")
async def get_payment(order_id: str, user: dict = Depends(get_optional_user)):
    payment = await db.payments.find_one({"order_id": order_id})
    if not payment:
        return None
    return PaymentResponse(id=str(payment["_id"]), **{k: v for k, v in payment.items() if k != "_id"})

@api_router.put("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, admin: dict = Depends(require_admin)):
    payment = await db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {"status": "confirmed", "confirmed_at": datetime.utcnow()}}
    )
    
    await db.orders.update_one(
        {"_id": ObjectId(payment["order_id"])},
        {"$set": {"payment_status": "confirmed", "status": "processing", "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Payment confirmed"}

# ==================== DOCUMENTS ROUTES ====================

@api_router.post("/documents", response_model=DocumentResponse)
async def upload_document(doc: DocumentUpload, admin: dict = Depends(require_admin)):
    order = await db.orders.find_one({"_id": ObjectId(doc.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    doc_dict = {
        "order_id": doc.order_id,
        "file_name": doc.file_name,
        "file_data": doc.file_data,
        "uploaded_at": datetime.utcnow()
    }
    
    result = await db.documents.insert_one(doc_dict)
    return DocumentResponse(id=str(result.inserted_id), **doc_dict)

@api_router.get("/documents/{order_id}", response_model=List[DocumentResponse])
async def get_documents(order_id: str, user: dict = Depends(get_optional_user)):
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access
    if user and user.get("role") != "admin" and order.get("user_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    documents = await db.documents.find({"order_id": order_id}).to_list(100)
    return [DocumentResponse(id=str(d["_id"]), **{k: v for k, v in d.items() if k != "_id"}) for d in documents]

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard(admin: dict = Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending_payment", "under_review", "processing"]}})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Calculate total revenue from confirmed payments
    pipeline = [
        {"$match": {"payment_status": "confirmed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    total_clients = await db.users.count_documents({"role": "client"})
    
    recent_orders = await db.orders.find().sort("created_at", -1).limit(10).to_list(10)
    orders_response = []
    for o in recent_orders:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        service_name = service["name"] if service else "Unknown Service"
        orders_response.append(OrderResponse(
            id=str(o["_id"]),
            service_name=service_name,
            **{k: v for k, v in o.items() if k != "_id"}
        ))
    
    return DashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        total_revenue=total_revenue,
        total_clients=total_clients,
        recent_orders=orders_response
    )

@api_router.get("/admin/clients")
async def get_clients(admin: dict = Depends(require_admin)):
    clients = await db.users.find({"role": "client"}).to_list(1000)
    return [{
        "id": str(c["_id"]),
        "full_name": c["full_name"],
        "email": c["email"],
        "phone": c.get("phone"),
        "created_at": c["created_at"]
    } for c in clients]

@api_router.get("/admin/orders")
async def get_all_orders(status: Optional[str] = None, admin: dict = Depends(require_admin)):
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(1000)
    result = []
    for o in orders:
        service = await db.services.find_one({"_id": ObjectId(o["service_id"])})
        service_name = service["name"] if service else "Unknown Service"
        
        # Get user info if exists
        user_info = None
        if o.get("user_id"):
            try:
                user = await db.users.find_one({"_id": ObjectId(o["user_id"])})
                if user:
                    user_info = {"full_name": user["full_name"], "email": user["email"]}
            except:
                pass
        
        result.append({
            "id": str(o["_id"]),
            "service_name": service_name,
            "user_info": user_info,
            **{k: v for k, v in o.items() if k != "_id"}
        })
    return result

@api_router.get("/admin/payments")
async def get_all_payments(status: Optional[str] = None, admin: dict = Depends(require_admin)):
    query = {}
    if status:
        query["status"] = status
    
    payments = await db.payments.find(query).sort("created_at", -1).to_list(1000)
    return [{
        "id": str(p["_id"]),
        **{k: v for k, v in p.items() if k != "_id"}
    } for p in payments]

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    if await db.services.count_documents({}) > 0:
        return {"message": "Data already seeded"}
    
    services = [
        {
            "name": "Historial Laboral IMSS",
            "slug": "historial-laboral-imss",
            "category": "Seguridad Social",
            "short_description": "Obtén tu historial laboral completo del IMSS con todas tus empresas y periodos de cotización.",
            "full_description": "El Historial Laboral del IMSS es un documento oficial que muestra todos los empleos en los que has estado dado de alta en el Instituto Mexicano del Seguro Social. Incluye información sobre las empresas donde has trabajado, periodos de cotización, salarios base de cotización y semanas cotizadas. Este documento es fundamental para trámites de pensión, créditos hipotecarios y verificación de historial laboral.",
            "price": 349.00,
            "delivery_time": "24-48 horas",
            "required_fields": ["full_name", "curp", "nss", "email", "phone"],
            "requirements": ["CURP válido", "NSS (Número de Seguro Social)", "Correo electrónico activo"],
            "notes": ["El documento se entrega en formato PDF oficial", "Incluye todos los periodos de cotización registrados"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Semanas Cotizadas IMSS",
            "slug": "semanas-cotizadas-imss",
            "category": "Seguridad Social",
            "short_description": "Consulta el número exacto de semanas cotizadas ante el IMSS para tu pensión.",
            "full_description": "Las Semanas Cotizadas ante el IMSS son el registro oficial del tiempo que has trabajado formalmente y que cuenta para tu pensión. Este documento es esencial para conocer cuántas semanas llevas acumuladas y cuántas te faltan para poder pensionarte. El documento incluye el desglose por empleador y los periodos exactos de cotización.",
            "price": 299.00,
            "delivery_time": "24-48 horas",
            "required_fields": ["full_name", "curp", "nss", "email", "phone"],
            "requirements": ["CURP válido", "NSS (Número de Seguro Social)"],
            "notes": ["Documento oficial del IMSS", "Útil para trámites de pensión"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Verificación CURP",
            "slug": "verificacion-curp",
            "category": "Identidad",
            "short_description": "Verifica y obtén tu CURP actualizado con datos del RENAPO.",
            "full_description": "La Verificación de CURP te permite confirmar que tu Clave Única de Registro de Población está correctamente registrada en el Registro Nacional de Población (RENAPO). Obtendrás un documento con tus datos personales oficiales, incluyendo nombre completo, fecha de nacimiento, sexo, entidad de nacimiento y datos de tu acta de nacimiento. Ideal para trámites que requieren CURP validado.",
            "price": 199.00,
            "delivery_time": "1-2 horas",
            "required_fields": ["full_name", "curp", "email"],
            "requirements": ["CURP de 18 caracteres"],
            "notes": ["Verificación directa con RENAPO", "Incluye datos del acta de nacimiento"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Verificación NSS",
            "slug": "verificacion-nss",
            "category": "Seguridad Social",
            "short_description": "Verifica tu Número de Seguro Social y estado actual en el IMSS.",
            "full_description": "La Verificación del NSS te permite confirmar que tu Número de Seguro Social está correctamente registrado y conocer tu estatus actual ante el IMSS. El documento incluye información sobre si estás vigente, tu último empleador registrado y datos generales de tu registro. Es útil para verificar que tus datos estén correctos antes de realizar otros trámites.",
            "price": 249.00,
            "delivery_time": "2-4 horas",
            "required_fields": ["full_name", "curp", "nss", "email", "phone"],
            "requirements": ["CURP válido", "NSS de 11 dígitos"],
            "notes": ["Incluye estatus de vigencia", "Muestra último empleador registrado"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Constancia de Situación Fiscal",
            "slug": "constancia-situacion-fiscal",
            "category": "Fiscal",
            "short_description": "Obtén tu Constancia de Situación Fiscal del SAT con datos actualizados.",
            "full_description": "La Constancia de Situación Fiscal es un documento emitido por el SAT que contiene tus datos fiscales actualizados, incluyendo tu RFC, nombre o razón social, régimen fiscal, domicilio fiscal, y actividades económicas registradas. Es un documento requerido para facturación, trámites bancarios, contratos laborales y muchos otros procedimientos oficiales.",
            "price": 399.00,
            "delivery_time": "24-48 horas",
            "required_fields": ["full_name", "rfc", "curp", "email", "phone"],
            "requirements": ["RFC válido", "CURP válido", "Contraseña SAT o e.firma (opcional)"],
            "notes": ["Documento oficial del SAT", "Incluye todos los regímenes fiscales activos"],
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Consulta Elegibilidad Crédito INFONAVIT",
            "slug": "elegibilidad-credito-infonavit",
            "category": "Créditos",
            "short_description": "Conoce si eres elegible para un crédito INFONAVIT y tu puntuación actual.",
            "full_description": "La Consulta de Elegibilidad de Crédito INFONAVIT te permite conocer si cumples con los requisitos para obtener un crédito hipotecario del Instituto. El reporte incluye tu puntuación actual, el monto aproximado de crédito al que podrías acceder, tus aportaciones acumuladas en la subcuenta de vivienda, y recomendaciones para mejorar tu elegibilidad si aún no cumples los requisitos.",
            "price": 449.00,
            "delivery_time": "24-72 horas",
            "required_fields": ["full_name", "curp", "nss", "rfc", "email", "phone"],
            "requirements": ["NSS activo", "CURP válido", "RFC válido"],
            "notes": ["Incluye puntuación INFONAVIT", "Muestra monto pre-aprobado estimado", "Incluye saldo de subcuenta de vivienda"],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.services.insert_many(services)
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@procedimientos.mx"})
    if not admin_exists:
        admin_user = {
            "full_name": "Administrador",
            "email": "admin@procedimientos.mx",
            "phone": "+52 55 1234 5678",
            "password_hash": hash_password("Admin123!"),
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
    
    return {"message": "Data seeded successfully", "services_count": len(services)}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Procedimientos MX API", "version": "1.0.0"}

# Include the router
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

from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import re
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

# Models
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    passout_year: int
    current_location: str
    current_company: str
    domain: str
    phone: str
    profile_picture: Optional[str] = None
    
    @field_validator('phone')
    def validate_phone(cls, v):
        pattern = r'^\(\d{3}\) \d{3}-\d{4}$'
        if not re.match(pattern, v):
            raise ValueError('Phone must be in format (XXX) XXX-XXXX')
        return v
    
    @field_validator('passout_year')
    def validate_year(cls, v):
        if v < 1990 or v > 2025:
            raise ValueError('Passout year must be between 1990 and 2025')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    full_name: str
    email: str
    passout_year: int
    current_location: str
    current_company: str
    domain: str
    phone: str
    profile_picture: Optional[str] = None
    created_at: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    current_location: Optional[str] = None
    current_company: Optional[str] = None
    domain: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    
    @field_validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            pattern = r'^\(\d{3}\) \d{3}-\d{4}$'
            if not re.match(pattern, v):
                raise ValueError('Phone must be in format (XXX) XXX-XXXX')
        return v

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    date: str
    location: str
    image: str
    description: str
    has_registration: bool

class EventRegistration(BaseModel):
    name: str
    email: EmailStr
    phone: str
    attend_dinner: bool
    
    @field_validator('phone')
    def validate_phone(cls, v):
        pattern = r'^\(\d{3}\) \d{3}-\d{4}$'
        if not re.match(pattern, v):
            raise ValueError('Phone must be in format (XXX) XXX-XXXX')
        return v

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sender_id: str
    receiver_id: str
    message: str
    timestamp: str
    read: bool = False

class MessageCreate(BaseModel):
    receiver_id: str
    message: str

class Donation(BaseModel):
    name: str
    email: EmailStr
    phone: str
    amount: float
    purpose: str
    message: Optional[str] = None
    
    @field_validator('phone')
    def validate_phone(cls, v):
        pattern = r'^\(\d{3}\) \d{3}-\d{4}$'
        if not re.match(pattern, v):
            raise ValueError('Phone must be in format (XXX) XXX-XXXX')
        return v
    
    @field_validator('amount')
    def validate_amount(cls, v):
        if v < 10 or v > 10000:
            raise ValueError('Amount must be between $10 and $10,000')
        return v

class Feedback(BaseModel):
    message: str
    
    @field_validator('message')
    def validate_message(cls, v):
        words = len(v.split())
        if words > 200:
            raise ValueError('Feedback must not exceed 200 words')
        return v

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')
        
        user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# Initialize events
async def init_events():
    count = await db.events.count_documents({})
    if count == 0:
        events = [
            {
                'id': str(uuid.uuid4()),
                'title': 'Annual Alumni Reunion 2026',
                'date': '2026-03-15',
                'location': 'Main Campus Auditorium, San Francisco',
                'image': 'https://images.unsplash.com/photo-1590650046871-92c887180603',
                'description': 'Join us for the grand annual reunion celebrating 50 years of Global Horizon University excellence. Reconnect with old friends, network with fellow alumni, and celebrate our shared journey. The event includes keynote speeches from distinguished alumni, campus tours, and a special gala dinner.',
                'has_registration': True
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Tech Innovation Summit',
                'date': '2026-04-20',
                'location': 'Innovation Hub, Building 7',
                'image': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
                'description': 'Explore cutting-edge technologies and innovations in AI, blockchain, and quantum computing. This summit brings together alumni entrepreneurs, researchers, and industry leaders to discuss the future of technology. Features panel discussions, startup showcases, and networking opportunities with venture capitalists.',
                'has_registration': True
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Career Mentorship Workshop',
                'date': '2026-05-10',
                'location': 'Student Center, Room 301',
                'image': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
                'description': 'Senior alumni share career insights and mentor recent graduates in this interactive workshop. Learn about career transitions, leadership development, and work-life balance from those who have walked the path. Includes one-on-one mentoring sessions and resume review opportunities.',
                'has_registration': False
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Global Horizon Golf Classic',
                'date': '2026-06-05',
                'location': 'Pebble Beach Golf Links',
                'image': 'https://images.pexels.com/photos/159490/yale-university-landscape-universities-schools-159490.jpeg',
                'description': 'Annual charity golf tournament supporting the Global Horizon Scholarship Fund. Enjoy a day of golf, networking, and giving back to the community. All proceeds benefit deserving students from underprivileged backgrounds. Includes breakfast, lunch, and awards ceremony.',
                'has_registration': True
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Healthcare Innovation Forum',
                'date': '2026-07-12',
                'location': 'Medical Sciences Building',
                'image': 'https://images.unsplash.com/photo-1614934273187-c83f8780fad9',
                'description': 'Alumni from healthcare and biotech industries discuss emerging trends in personalized medicine, telemedicine, and healthcare AI. Features presentations from leading medical researchers and healthcare entrepreneurs. Great opportunity for collaboration and knowledge sharing.',
                'has_registration': False
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Entrepreneurship Bootcamp',
                'date': '2026-08-18',
                'location': 'Startup Incubator, Campus West',
                'image': 'https://images.unsplash.com/photo-1758520144420-3e5b22e9b9a4',
                'description': 'Three-day intensive bootcamp for aspiring entrepreneurs. Learn from successful alumni founders about fundraising, product development, team building, and scaling startups. Includes pitch practice sessions, investor meetings, and networking dinners with angel investors.',
                'has_registration': True
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Homecoming Weekend Celebration',
                'date': '2026-09-25',
                'location': 'Throughout Campus',
                'image': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
                'description': 'Welcome home for the ultimate alumni experience! Three days of festivities including football game, concerts, food festivals, and class reunions. Special celebrations for milestone reunion classes. Bring your family and show them where your journey began.',
                'has_registration': False
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Women in Leadership Conference',
                'date': '2026-10-08',
                'location': 'Conference Center, Building 12',
                'image': 'https://images.unsplash.com/photo-1758599543132-ba9b306d715e',
                'description': 'Empowering women alumni through leadership development, networking, and mentorship. Features keynote speeches from distinguished women leaders, breakout sessions on negotiation and executive presence, and networking luncheon. Open to all who support women in leadership.',
                'has_registration': False
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Global Alumni Connect - Virtual',
                'date': '2026-11-15',
                'location': 'Online Virtual Event',
                'image': 'https://images.unsplash.com/photo-1590579491624-f98f36d4c763',
                'description': 'Connect with alumni worldwide in this virtual networking event. Features breakout rooms by industry, location, and interests. Includes virtual campus tour, president address, and online games. Perfect for international alumni who cannot travel to campus.',
                'has_registration': False
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Holiday Gala and Fundraiser',
                'date': '2026-12-12',
                'location': 'Grand Ballroom, Hilton San Francisco',
                'image': 'https://images.pexels.com/photos/34504392/pexels-photo-34504392.jpeg',
                'description': 'Celebrate the season at our elegant holiday gala supporting student scholarships and campus improvements. Enjoy fine dining, live music, dancing, and silent auction. Black-tie optional. Recognition ceremony for major donors and distinguished alumni. Make this holiday season memorable while giving back.',
                'has_registration': False
            }
        ]
        await db.events.insert_many(events)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Global Horizon University Alumni Network API"}

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id,
        'full_name': user_data.full_name,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'passout_year': user_data.passout_year,
        'current_location': user_data.current_location,
        'current_company': user_data.current_company,
        'domain': user_data.domain,
        'phone': user_data.phone,
        'profile_picture': user_data.profile_picture or 'https://images.unsplash.com/photo-1623461487986-9400110de28e',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    
    return {
        'message': 'Welcome to Global Horizon Alumni Network!',
        'token': token,
        'user': {
            'id': user_id,
            'full_name': user_data.full_name,
            'email': user_data.email,
            'passout_year': user_data.passout_year
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    
    token = create_token(user['id'])
    
    return {
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user['id'],
            'full_name': user['full_name'],
            'email': user['email'],
            'passout_year': user['passout_year']
        }
    }

@api_router.get("/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    # Get registered events
    registrations = await db.event_registrations.find(
        {'user_id': current_user['id']},
        {'_id': 0}
    ).to_list(100)
    
    event_ids = [r['event_id'] for r in registrations]
    events = await db.events.find(
        {'id': {'$in': event_ids}},
        {'_id': 0}
    ).to_list(100)
    
    # Get donations
    donations = await db.donations.find(
        {'user_id': current_user['id']},
        {'_id': 0}
    ).to_list(100)
    
    # Get message count
    msg_count = await db.messages.count_documents({
        '$or': [
            {'sender_id': current_user['id']},
            {'receiver_id': current_user['id']}
        ]
    })
    
    return {
        'user': current_user,
        'registered_events': events,
        'donations': donations,
        'message_count': msg_count
    }

@api_router.put("/user/profile")
async def update_profile(updates: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {'id': current_user['id']},
            {'$set': update_data}
        )
    
    updated_user = await db.users.find_one({'id': current_user['id']}, {'_id': 0, 'password': 0})
    return {'message': 'Profile updated successfully', 'user': updated_user}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_alumni = await db.users.count_documents({})
    upcoming_events = await db.events.count_documents({})
    total_donations = await db.donations.count_documents({})
    
    return {
        'total_alumni': total_alumni,
        'upcoming_events': upcoming_events,
        'recent_donations': total_donations
    }

@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find({}, {'_id': 0}).to_list(100)
    return events

@api_router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, registration: EventRegistration, current_user: dict = Depends(get_current_user)):
    # Check if event exists
    event = await db.events.find_one({'id': event_id})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found')
    
    if not event.get('has_registration'):
        raise HTTPException(status_code=400, detail='This event does not have registration')
    
    # Check if already registered
    existing = await db.event_registrations.find_one({
        'user_id': current_user['id'],
        'event_id': event_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail='Already registered for this event')
    
    # Create registration
    reg_doc = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'event_id': event_id,
        'name': registration.name,
        'email': registration.email,
        'phone': registration.phone,
        'attend_dinner': registration.attend_dinner,
        'registered_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.event_registrations.insert_one(reg_doc)
    
    return {'message': 'Registration Successful!'}

@api_router.get("/users/search")
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    if len(q) < 2:
        return []
    
    users = await db.users.find(
        {
            'id': {'$ne': current_user['id']},
            '$or': [
                {'full_name': {'$regex': q, '$options': 'i'}},
                {'current_company': {'$regex': q, '$options': 'i'}}
            ]
        },
        {'_id': 0, 'password': 0}
    ).limit(10).to_list(10)
    
    return users

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {
            '$or': [
                {'sender_id': current_user['id'], 'receiver_id': other_user_id},
                {'sender_id': other_user_id, 'receiver_id': current_user['id']}
            ]
        },
        {'_id': 0}
    ).sort('timestamp', 1).to_list(1000)
    
    # Mark as read
    await db.messages.update_many(
        {'sender_id': other_user_id, 'receiver_id': current_user['id'], 'read': False},
        {'$set': {'read': True}}
    )
    
    return messages

@api_router.post("/messages")
async def send_message(msg_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    message = {
        'id': str(uuid.uuid4()),
        'sender_id': current_user['id'],
        'receiver_id': msg_data.receiver_id,
        'message': msg_data.message,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'read': False
    }
    
    await db.messages.insert_one(message)
    
    # Send via websocket if receiver is online
    await manager.send_message(msg_data.receiver_id, {
        'type': 'new_message',
        'message': message
    })
    
    return message

@api_router.post("/donations")
async def create_donation(donation: Donation, current_user: dict = Depends(get_current_user)):
    donation_doc = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'name': donation.name,
        'email': donation.email,
        'phone': donation.phone,
        'amount': donation.amount,
        'purpose': donation.purpose,
        'message': donation.message,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.donations.insert_one(donation_doc)
    
    return {'message': 'Payment Successful! Thank you for your contribution!'}

@api_router.post("/feedback")
async def submit_feedback(feedback: Feedback):
    feedback_doc = {
        'id': str(uuid.uuid4()),
        'message': feedback.message,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedback.insert_one(feedback_doc)
    
    return {'message': 'Feedback submitted successfully!'}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle different message types if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_events()
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import re
import sqlite3
from contextlib import contextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite connection
DB_PATH = ROOT_DIR / 'alumni.db'

@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# Initialize database
def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                passout_year INTEGER NOT NULL,
                current_location TEXT NOT NULL,
                current_company TEXT NOT NULL,
                domain TEXT NOT NULL,
                phone TEXT NOT NULL,
                profile_picture TEXT,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                location TEXT NOT NULL,
                image TEXT NOT NULL,
                description TEXT NOT NULL,
                has_registration INTEGER NOT NULL
            )
        ''')
        
        # Event registrations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS event_registrations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                attend_dinner INTEGER NOT NULL,
                registered_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        ''')
        
        # Messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                receiver_id TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                FOREIGN KEY (sender_id) REFERENCES users(id),
                FOREIGN KEY (receiver_id) REFERENCES users(id)
            )
        ''')
        
        # Donations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS donations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                amount REAL NOT NULL,
                purpose TEXT NOT NULL,
                message TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Feedback table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Check if events exist
        cursor.execute('SELECT COUNT(*) as count FROM events')
        if cursor.fetchone()['count'] == 0:
            events_data = [
                (str(uuid.uuid4()), 'Annual Alumni Reunion 2026', '2026-03-15', 'Main Campus Auditorium, San Francisco', 
                 'https://images.unsplash.com/photo-1590650046871-92c887180603',
                 'Join us for the grand annual reunion celebrating 50 years of Global Horizon University excellence. Reconnect with old friends, network with fellow alumni, and celebrate our shared journey. The event includes keynote speeches from distinguished alumni, campus tours, and a special gala dinner.', 1),
                (str(uuid.uuid4()), 'Tech Innovation Summit', '2026-04-20', 'Innovation Hub, Building 7',
                 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
                 'Explore cutting-edge technologies and innovations in AI, blockchain, and quantum computing. This summit brings together alumni entrepreneurs, researchers, and industry leaders to discuss the future of technology. Features panel discussions, startup showcases, and networking opportunities with venture capitalists.', 1),
                (str(uuid.uuid4()), 'Career Mentorship Workshop', '2026-05-10', 'Student Center, Room 301',
                 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
                 'Senior alumni share career insights and mentor recent graduates in this interactive workshop. Learn about career transitions, leadership development, and work-life balance from those who have walked the path. Includes one-on-one mentoring sessions and resume review opportunities.', 0),
                (str(uuid.uuid4()), 'Global Horizon Golf Classic', '2026-06-05', 'Pebble Beach Golf Links',
                 'https://images.pexels.com/photos/159490/yale-university-landscape-universities-schools-159490.jpeg',
                 'Annual charity golf tournament supporting the Global Horizon Scholarship Fund. Enjoy a day of golf, networking, and giving back to the community. All proceeds benefit deserving students from underprivileged backgrounds. Includes breakfast, lunch, and awards ceremony.', 1),
                (str(uuid.uuid4()), 'Healthcare Innovation Forum', '2026-07-12', 'Medical Sciences Building',
                 'https://images.unsplash.com/photo-1614934273187-c83f8780fad9',
                 'Alumni from healthcare and biotech industries discuss emerging trends in personalized medicine, telemedicine, and healthcare AI. Features presentations from leading medical researchers and healthcare entrepreneurs. Great opportunity for collaboration and knowledge sharing.', 0),
                (str(uuid.uuid4()), 'Entrepreneurship Bootcamp', '2026-08-18', 'Startup Incubator, Campus West',
                 'https://images.unsplash.com/photo-1758520144420-3e5b22e9b9a4',
                 'Three-day intensive bootcamp for aspiring entrepreneurs. Learn from successful alumni founders about fundraising, product development, team building, and scaling startups. Includes pitch practice sessions, investor meetings, and networking dinners with angel investors.', 1),
                (str(uuid.uuid4()), 'Homecoming Weekend Celebration', '2026-09-25', 'Throughout Campus',
                 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
                 'Welcome home for the ultimate alumni experience! Three days of festivities including football game, concerts, food festivals, and class reunions. Special celebrations for milestone reunion classes. Bring your family and show them where your journey began.', 0),
                (str(uuid.uuid4()), 'Women in Leadership Conference', '2026-10-08', 'Conference Center, Building 12',
                 'https://images.unsplash.com/photo-1758599543132-ba9b306d715e',
                 'Empowering women alumni through leadership development, networking, and mentorship. Features keynote speeches from distinguished women leaders, breakout sessions on negotiation and executive presence, and networking luncheon. Open to all who support women in leadership.', 0),
                (str(uuid.uuid4()), 'Global Alumni Connect - Virtual', '2026-11-15', 'Online Virtual Event',
                 'https://images.unsplash.com/photo-1590579491624-f98f36d4c763',
                 'Connect with alumni worldwide in this virtual networking event. Features breakout rooms by industry, location, and interests. Includes virtual campus tour, president address, and online games. Perfect for international alumni who cannot travel to campus.', 0),
                (str(uuid.uuid4()), 'Holiday Gala and Fundraiser', '2026-12-12', 'Grand Ballroom, Hilton San Francisco',
                 'https://images.pexels.com/photos/34504392/pexels-photo-34504392.jpeg',
                 'Celebrate the season at our elegant holiday gala supporting student scholarships and campus improvements. Enjoy fine dining, live music, dancing, and silent auction. Black-tie optional. Recognition ceremony for major donors and distinguished alumni. Make this holiday season memorable while giving back.', 0)
            ]
            cursor.executemany('INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?)', events_data)

# Create the main app
app = FastAPI()
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
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail='User not found')
            return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# Routes
@api_router.get("/")
async def root():
    return {"message": "Global Horizon University Alumni Network API"}

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail='Email already registered')
        
        # Create user
        user_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, user_data.full_name, user_data.email,
            hash_password(user_data.password), user_data.passout_year,
            user_data.current_location, user_data.current_company,
            user_data.domain, user_data.phone,
            user_data.profile_picture or 'https://images.unsplash.com/photo-1623461487986-9400110de28e',
            datetime.now(timezone.utc).isoformat()
        ))
        
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
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (credentials.email,))
        user = cursor.fetchone()
        
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
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get registered events
        cursor.execute('''
            SELECT e.* FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            WHERE er.user_id = ?
        ''', (current_user['id'],))
        events = [dict(row) for row in cursor.fetchall()]
        
        # Get donations
        cursor.execute('SELECT * FROM donations WHERE user_id = ?', (current_user['id'],))
        donations = [dict(row) for row in cursor.fetchall()]
        
        # Get message count
        cursor.execute('''
            SELECT COUNT(*) as count FROM messages
            WHERE sender_id = ? OR receiver_id = ?
        ''', (current_user['id'], current_user['id']))
        msg_count = cursor.fetchone()['count']
        
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
        with get_db() as conn:
            cursor = conn.cursor()
            set_clause = ', '.join([f'{k} = ?' for k in update_data.keys()])
            values = list(update_data.values()) + [current_user['id']]
            cursor.execute(f'UPDATE users SET {set_clause} WHERE id = ?', values)
            
            cursor.execute('SELECT * FROM users WHERE id = ?', (current_user['id'],))
            updated_user = dict(cursor.fetchone())
            del updated_user['password']
            
            return {'message': 'Profile updated successfully', 'user': updated_user}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM users')
        total_alumni = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM events')
        upcoming_events = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM donations')
        recent_donations = cursor.fetchone()['count']
        
        return {
            'total_alumni': total_alumni,
            'upcoming_events': upcoming_events,
            'recent_donations': recent_donations
        }

@api_router.get("/events")
async def get_events():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM events')
        return [dict(row) for row in cursor.fetchall()]

@api_router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, registration: EventRegistration, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        if not event:
            raise HTTPException(status_code=404, detail='Event not found')
        
        if not event['has_registration']:
            raise HTTPException(status_code=400, detail='This event does not have registration')
        
        cursor.execute('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?',
                      (current_user['id'], event_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail='Already registered for this event')
        
        cursor.execute('''
            INSERT INTO event_registrations VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(uuid.uuid4()), current_user['id'], event_id,
            registration.name, registration.email, registration.phone,
            1 if registration.attend_dinner else 0,
            datetime.now(timezone.utc).isoformat()
        ))
        
        return {'message': 'Registration Successful!'}

@api_router.get("/users/search")
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    if len(q) < 2:
        return []
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, full_name, email, passout_year, current_location, 
                   current_company, domain, phone, profile_picture
            FROM users
            WHERE id != ? AND (full_name LIKE ? OR current_company LIKE ?)
            LIMIT 10
        ''', (current_user['id'], f'%{q}%', f'%{q}%'))
        return [dict(row) for row in cursor.fetchall()]

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM messages
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY timestamp ASC
        ''', (current_user['id'], other_user_id, other_user_id, current_user['id']))
        
        messages = [dict(row) for row in cursor.fetchall()]
        
        # Mark as read
        cursor.execute('''
            UPDATE messages SET read = 1
            WHERE sender_id = ? AND receiver_id = ? AND read = 0
        ''', (other_user_id, current_user['id']))
        
        return messages

@api_router.post("/messages")
async def send_message(msg_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        
        message_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        
        cursor.execute('''
            INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)
        ''', (message_id, current_user['id'], msg_data.receiver_id,
              msg_data.message, timestamp, 0))
        
        message = {
            'id': message_id,
            'sender_id': current_user['id'],
            'receiver_id': msg_data.receiver_id,
            'message': msg_data.message,
            'timestamp': timestamp,
            'read': False
        }
        
        # Send via websocket if receiver is online
        await manager.send_message(msg_data.receiver_id, {
            'type': 'new_message',
            'message': message
        })
        
        return message

@api_router.post("/donations")
async def create_donation(donation: Donation, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO donations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(uuid.uuid4()), current_user['id'], donation.name,
            donation.email, donation.phone, donation.amount,
            donation.purpose, donation.message,
            datetime.now(timezone.utc).isoformat()
        ))
        
        return {'message': 'Payment Successful! Thank you for your contribution!'}

@api_router.post("/feedback")
async def submit_feedback(feedback: Feedback):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO feedback VALUES (?, ?, ?)
        ''', (str(uuid.uuid4()), feedback.message, datetime.now(timezone.utc).isoformat()))
        
        return {'message': 'Feedback submitted successfully!'}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_json()
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
    init_db()
    logger.info("Application started with SQLite database")

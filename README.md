# L2pControl

PC management system for internet cafes / gaming centers.

## Project Structure

```
L2pControl/
├── backend/          # FastAPI server
├── frontend/         # React dashboard
├── client/           # Windows PC client
└── Master-Doc.md     # Requirements document
```

## Quick Start

### 1. Backend (API Server)

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`

### 2. Frontend (Dashboard)

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Dashboard will be available at `http://localhost:5173`

### 3. Client (on each PC)

```bash
cd client

# Install dependencies
pip install -r requirements.txt

# Test mode (run directly)
python client.py

# Install as Windows Service (requires admin)
python service.py install
python service.py start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Receive client events (start/heartbeat/stop) |
| GET | `/api/pcs` | List all PCs with status and active session |
| GET | `/api/sessions` | List sessions with filters |
| PATCH | `/api/sessions/:id` | Update session (user, payment) |
| POST | `/api/sessions/:id/close` | Manually close a session |

## Configuration

### Client Config

Edit `client/config.py`:

```python
API_URL = "http://YOUR_SERVER_IP:8000/api/events"
HEARTBEAT_INTERVAL = 60  # seconds
```

### Backend CORS

Edit `backend/app/main.py` to add your frontend URL to `allow_origins`.

## Features

- Real-time PC status (online/offline)
- Session tracking with live timer
- Automatic session close after 5 min without heartbeat
- User assignment per session
- Payment tracking (paid/unpaid)
- Session history with filters

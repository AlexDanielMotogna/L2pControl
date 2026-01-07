1. Architecture (simple and solid)

1) Client (each PC)

Python service/daemon

Runs at OS startup (Windows service / systemd)

Sends events to backend:

start (boot)

heartbeat (every 60–120 seconds)

stop (if possible)

PC identification:

pcId (hostname)

clientUuid (generated once and stored locally)

2. Backend (API)

FastAPI (Python)

Database:

MVP: SQLite

Production: PostgreSQL

Responsibilities:

Manage PCs and sessions

Track heartbeat and online/offline status

Calculate session duration

Manage payments

3. Frontend (Web UI)

React + Vite

Tailwind CSS

React Query

Dashboard features:

PCs online/offline

Active session per PC (user + start time)

Session history

Assign user name

Mark PAID / UNPAID

Filters (date, PC, user, payment status)

2. Data Model
   PC

id

pcId

clientUuid

lastSeenAt

status (ONLINE / OFFLINE)

Session

id

pcId

userName (nullable)

startAt

endAt (nullable)

durationSeconds (calculated on close)

paidStatus (UNPAID / PAID)

amountDue (optional)

amountPaid (optional)

notes (optional)

3. API Endpoints
   Client events

POST /api/events

{
"pcId": "PC-01",
"clientUuid": "xxxx-xxxx",
"type": "start | heartbeat | stop",
"timestamp": "2026-01-07T12:00:00Z"
}

Dashboard

GET /api/pcs

Returns PC list with:

status

lastSeenAt

activeSession (if exists)

GET /api/sessions

Filters:

status

date range

pcId

user

PATCH /api/sessions/:id

{
"userName": "Juan",
"paidStatus": "PAID",
"amountPaid": 10
}

4. React Screens
   A) Dashboard (PCs)

Table columns:

PC

Status (ONLINE / OFFLINE)

Last Seen

Current User

Session Time (live counter)

Actions:

Assign user

Mark paid

Close session

B) Sessions History

Table with filters:

Date

PC

User

Duration

Amount

Payment status

Actions:

Edit user

Mark paid / unpaid

Export CSV (future)

5. Stack

Backend: FastAPI + SQLAlchemy

Frontend: React + Vite + Tailwind + React Query

Auth: Optional JWT

Deploy: Docker

6. Assumptions

PCs are Windows

Session closes automatically if no heartbeat for 5 minutes

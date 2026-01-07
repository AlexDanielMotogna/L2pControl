# L2pControl - Production Deployment Guide

## Overview

This guide will walk you through deploying L2pControl to production using:
- **Railway** for backend API + PostgreSQL database
- **Vercel** for frontend dashboard
- **Windows Service** for client on each PC

## Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Git installed locally

---

## Part 1: Push Code to GitHub

### 1.1 Initialize Git Repository

```bash
cd "c:\Users\Lian Li\L2pControl"
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Push to GitHub

```bash
git remote add origin https://github.com/AlexDanielMotogna/L2pControl.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select the `L2pControl` repository

### 2.2 Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

### 2.3 Configure Backend Service

1. Click on your backend service in Railway
2. Go to "Settings" → "General"
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.4 Add Environment Variables

Go to the backend service → "Variables" and add:

- `CORS_ORIGINS` = `https://your-vercel-app.vercel.app` (we'll get this URL after deploying to Vercel)

**Note**: `DATABASE_URL` is automatically provided by Railway when you add PostgreSQL.

### 2.5 Deploy

Click "Deploy" or push a new commit to GitHub to trigger deployment.

### 2.6 Get Your Backend URL

Once deployed, Railway will give you a URL like:
`https://l2pcontrol-production.up.railway.app`

Save this URL - you'll need it for the frontend and client configuration.

---

## Part 3: Deploy Frontend to Vercel

### 3.1 Import Project to Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository `L2pControl`
4. Select the repository

### 3.2 Configure Build Settings

Vercel should auto-detect your framework, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3.3 Add Environment Variable

Before deploying, add:

- **Variable Name**: `VITE_API_URL`
- **Value**: `https://your-railway-backend.railway.app` (your Railway backend URL from step 2.6)

### 3.4 Deploy

Click "Deploy"

### 3.5 Get Your Frontend URL

Once deployed, Vercel will give you a URL like:
`https://l2pcontrol.vercel.app`

### 3.6 Update Backend CORS

Go back to Railway → Backend Service → Variables

Update `CORS_ORIGINS` to include your Vercel URL:
```
https://l2pcontrol.vercel.app,http://localhost:5173
```

---

## Part 4: Configure Frontend API URL

### 4.1 Update Frontend Config

The frontend needs to know your Railway backend URL. There are two options:

**Option A: Environment Variable (Recommended)**

Already done in step 3.3 if you set `VITE_API_URL`.

**Option B: Update Code Directly**

Edit `frontend/src/api/client.js` and change the API_BASE_URL:

```javascript
const API_BASE_URL = 'https://your-railway-backend.railway.app'
```

Then commit and push to trigger a new deployment.

---

## Part 5: Install Client on PCs

### 5.1 Download Client Files

On each PC, download the `client` folder from your repository.

### 5.2 Create Configuration File

Create `client_config.json` in the client folder:

```json
{
  "apiUrl": "https://your-railway-backend.railway.app/api/events",
  "heartbeatInterval": 60
}
```

Replace `your-railway-backend.railway.app` with your actual Railway URL.

### 5.3 Install Python Dependencies

Open Command Prompt as Administrator:

```bash
cd path\to\client
pip install -r requirements.txt
```

### 5.4 Test the Client

```bash
python client.py
```

You should see heartbeats being sent successfully.

### 5.5 Install as Windows Service

```bash
python service.py install
python service.py start
```

### 5.6 Verify in Dashboard

Open your Vercel dashboard URL. You should see the PC appear as "ONLINE" within 1-2 minutes.

---

## Part 6: Verification Checklist

- [ ] Backend is deployed on Railway and accessible
- [ ] PostgreSQL database is connected
- [ ] Frontend is deployed on Vercel
- [ ] Frontend can communicate with backend
- [ ] At least one client PC is sending heartbeats
- [ ] Dashboard shows PC as online
- [ ] Sessions are being created and tracked

---

## Common Issues

### Backend deployment fails

- Check Railway logs for errors
- Ensure `requirements.txt` includes all dependencies
- Verify `DATABASE_URL` environment variable is set

### Frontend can't connect to backend

- Check CORS settings in backend
- Verify `VITE_API_URL` is set correctly in Vercel
- Check browser console for CORS errors

### Client can't connect to backend

- Verify `apiUrl` in `client_config.json`
- Test the URL in browser: `https://your-backend.railway.app/health`
- Check Windows firewall settings

### PC doesn't appear as online

- Check client is running (Windows Services)
- Verify heartbeats are being sent (check client logs)
- Check backend logs in Railway

---

## Environment Variables Summary

### Railway (Backend)

| Variable | Value | Auto-set |
|----------|-------|----------|
| `DATABASE_URL` | postgresql://... | ✓ (by PostgreSQL addon) |
| `CORS_ORIGINS` | https://your-vercel-app.vercel.app | Manual |
| `PORT` | 8000 | ✓ (by Railway) |

### Vercel (Frontend)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | https://your-railway-backend.railway.app |

### Client (Windows Service)

Edit `client_config.json`:
```json
{
  "apiUrl": "https://your-railway-backend.railway.app/api/events",
  "heartbeatInterval": 60
}
```

---

## Updating the Application

### Backend Updates

1. Push changes to GitHub
2. Railway will automatically redeploy

### Frontend Updates

1. Push changes to GitHub
2. Vercel will automatically redeploy

### Client Updates

1. Stop the service: `python service.py stop`
2. Update client files
3. Start the service: `python service.py start`

---

## Support

For issues or questions, create an issue on GitHub:
https://github.com/AlexDanielMotogna/L2pControl/issues

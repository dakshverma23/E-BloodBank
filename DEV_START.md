# E-BloodBank - Development Startup

## Quick Start (Recommended)

**Terminal 1 - Backend:**
```powershell
cd backend
python manage.py runserver
```
Backend runs at: http://127.0.0.1:8000

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173 (or next available port)

## Important: Order of Operations

1. **Start the backend first** - The frontend proxy connects to the backend. If the backend isn't running when you start the frontend, you'll see "Backend not reachable" on Login/Signup.

2. **Restart frontend after backend** - If you start the frontend before the backend, refresh the page after the backend is running. The connection status will update.

## Connection Fixes Applied

- **Vite proxy**: `/api` requests are proxied to `http://127.0.0.1:8000` (avoids CORS and IPv6 issues on Node 17+)
- **IPv4 fix**: `dns.setDefaultResultOrder('ipv4first')` ensures the proxy connects to Django's IPv4 listener
- **CSRF trusted origins**: Added for all localhost ports so Django accepts proxied requests

## Verify Connection

On Login or Signup page, you should see:
- ✅ **Backend connected** (green) = ready to use
- ❌ **Backend not reachable** (red) = start the backend and restart the frontend

## Troubleshooting

1. **"Cannot connect to server" / "Backend not reachable"**
   - Ensure backend is running: `python manage.py runserver` in `backend/`
   - Restart the frontend so the proxy connects (stop with Ctrl+C, then `npm run dev`)
   - Use the URL from the frontend terminal (e.g. http://localhost:5173)
   - If you have `VITE_API_BASE_URL` in `frontend/.env`, remove or comment it out - in dev we use the proxy

2. **Port already in use**
   - Backend: Use `python manage.py runserver 8001` for a different port (then set `VITE_API_BASE_URL=http://127.0.0.1:8001` in frontend `.env`)
   - Frontend: Vite will automatically try 5174, 5175, etc.

3. **Multiple Vite instances**
   - Close all terminals running `npm run dev`
   - Start fresh from one terminal

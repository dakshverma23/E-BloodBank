# Render Deployment Instructions

## Important: Update Start Command in Render Dashboard

Even though we have `Procfile` and `start.sh`, you **MUST** manually set the Start Command in Render dashboard:

### Steps:
1. Go to Render Dashboard → Your Web Service → Settings
2. Find **"Start Command"** field
3. Set it to exactly:
   ```
   bash start.sh
   ```
   OR
   ```
   cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
   ```
4. Click **"Save Changes"**
5. Render will auto-redeploy

### Build Command:
```
cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
```

### Environment Variables Required:
- DATABASE_NAME
- DATABASE_USER
- DATABASE_PASSWORD
- DATABASE_HOST
- DATABASE_PORT
- SECRET_KEY
- DEBUG=False
- ALLOWED_HOSTS=your-app.onrender.com

## Files Created:
- `start.sh` - Startup script that runs gunicorn with correct WSGI path
- `Procfile` - Points to start.sh
- `render.yaml` - Render configuration (if using Blueprint)


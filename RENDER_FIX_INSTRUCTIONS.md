# 🚨 CRITICAL: Fix Render Start Command

## The Problem
Render is using the default `gunicorn your_application.wsgi` command instead of your correct command.

## The Solution (YOU MUST DO THIS IN RENDER DASHBOARD)

### Step 1: Open Render Dashboard
1. Go to: https://dashboard.render.com
2. Log in to your account

### Step 2: Find Your Web Service
1. Click on your web service (the one that's failing)

### Step 3: Go to Settings
1. Click **"Settings"** in the left sidebar
2. Scroll down to find **"Start Command"** section

### Step 4: Update Start Command
1. **DELETE** the current command: `gunicorn your_application.wsgi`
2. **TYPE** this exact command:
   ```
   cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
   ```
3. Click **"Save Changes"** button at the bottom

### Step 5: Verify Build Command
While you're in Settings, also check **"Build Command"**:
```
cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
```

### Step 6: Check Environment Variables
Go to **"Environment"** tab and make sure you have:
- DATABASE_NAME=ebloodbank_db
- DATABASE_USER=ebloodbank_db_user
- DATABASE_PASSWORD=sa9EKoFY7gWi2kDwdf7ODHvDFuTV9DqX
- DATABASE_HOST=dpg-d4dfr43ipnbc73a1p0ug-a
- DATABASE_PORT=5432
- SECRET_KEY=(your secret key)
- DEBUG=False
- ALLOWED_HOSTS=your-app-name.onrender.com

### Step 7: Redeploy
1. After saving, Render will auto-redeploy
2. OR go to **"Manual Deploy"** → **"Deploy latest commit"**

## Visual Guide

```
Render Dashboard
  └─ Your Web Service
      └─ Settings (Left Sidebar)
          └─ Scroll to "Start Command"
              └─ Replace with: cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
```

## What Should Happen After Fix

**Before (WRONG):**
```
==> Running 'gunicorn your_application.wsgi'
```

**After (CORRECT):**
```
==> Running 'cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT'
```

## If It Still Doesn't Work

1. **Check Logs**: Go to "Logs" tab to see what command is actually running
2. **Verify Save**: Make sure you clicked "Save Changes" - the page should reload
3. **Clear Cache**: Try manually triggering a new deploy
4. **Check Root Directory**: In Settings, make sure "Root Directory" is empty or set to `.` (not `backend`)

## Alternative: If You Can't Find Start Command

Some Render services might have it under:
- **Settings** → **Advanced** → **Start Command**
- Or it might be in the service creation/editing page

## Contact Render Support

If you absolutely cannot find the Start Command field, contact Render support:
- Email: support@render.com
- Or use their chat support in the dashboard

---

**REMEMBER**: The Procfile and scripts are correct in the code. The issue is that Render dashboard has a hardcoded Start Command that MUST be manually updated.


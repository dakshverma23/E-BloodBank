# EXACT STEPS TO FIX RENDER ERROR

## The Error
```
==> Running 'gunicorn your_application.wsgi'
ModuleNotFoundError: No module named 'your_application'
```

## What This Means
Render is using a **default placeholder command** instead of your correct command.

## Why It's Happening
When you created the service in Render, it set a default Start Command: `gunicorn your_application.wsgi`

This command is stored in **Render's dashboard**, NOT in your code.

## The Fix (DO THIS NOW)

### Step 1: Login to Render
- Go to: https://dashboard.render.com
- Login with your account

### Step 2: Find Your Service
- You should see a list of services
- Click on the one that's failing (probably named something like "ebloodbank" or "web-service")

### Step 3: Open Settings
- Look at the LEFT SIDEBAR
- Click on **"Settings"** (it's usually near the bottom of the sidebar)

### Step 4: Find Start Command
- Scroll down in the Settings page
- Look for a field labeled **"Start Command"** or **"Start Command"**
- It might be under a section called "Commands" or "Deploy"

### Step 5: Update the Command
- You will see: `gunicorn your_application.wsgi` (THIS IS WRONG)
- **DELETE** that entire line
- **TYPE** this exactly:
  ```
  cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
  ```

### Step 6: Save
- Scroll to bottom of Settings page
- Click **"Save Changes"** button
- The page should reload/refresh

### Step 7: Wait for Deploy
- Render will automatically start a new deployment
- Watch the "Events" or "Logs" tab
- You should now see: `==> Running 'cd backend && gunicorn ebloodbank.wsgi:application...'`

## If You Still Can't Find It

### Option 1: Check Service Type
- Make sure it's a **Web Service** (not Background Worker)
- Web Services have Start Command, Background Workers don't

### Option 2: Recreate Service
1. **Before deleting**: Copy ALL Environment Variables (Settings → Environment)
2. **Delete** the current service
3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repo: `dakshverma23/E-BloodBank`
   - **Root Directory**: Leave EMPTY (or type `.`)
   - **Build Command**: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT` ← **CRITICAL**
   - **Environment**: Python 3
   - **Plan**: Free
4. **Add Environment Variables** (from step 1)
5. **Click "Create Web Service"**

## Visual Guide

```
Render Dashboard
│
├─ Your Services List
│  └─ [Click] Your failing service
│     │
│     ├─ Overview (default tab)
│     ├─ Logs
│     ├─ Metrics
│     ├─ **Settings** ← CLICK HERE
│     │  │
│     │  └─ Scroll down to find:
│     │     │
│     │     └─ **Start Command** field
│     │        │
│     │        └─ Current: `gunicorn your_application.wsgi` ← DELETE THIS
│     │        └─ Replace with: `cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT`
│     │
│     └─ Environment
```

## Why Code Can't Fix This

- ✅ Procfile exists and is correct
- ✅ render.yaml exists and is correct
- ✅ All scripts are correct
- ✅ Everything is pushed to GitHub
- ❌ **BUT**: Render dashboard setting **OVERRIDES** all of this

Render's design: **Dashboard settings > Code files**

## After Fixing

You should see in logs:
```
==> Running 'cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT'
```

And the app should start successfully!

---

**THIS IS THE ONLY WAY TO FIX IT. YOU MUST UPDATE THE DASHBOARD.**


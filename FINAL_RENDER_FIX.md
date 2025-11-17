# 🚨 FINAL FIX - Render Start Command Issue

## The Problem
Render is using `gunicorn your_application.wsgi` instead of your correct command. This is because Render dashboard has a **hardcoded Start Command** that overrides the Procfile.

## ✅ SOLUTION - You MUST Do This:

### Option 1: Update Start Command in Dashboard (RECOMMENDED)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click your web service** (the one failing)
3. **Click "Settings"** in left sidebar
4. **Scroll down to "Start Command"** section
5. **You will see**: `gunicorn your_application.wsgi` (THIS IS WRONG)
6. **DELETE that entire line**
7. **TYPE exactly this**:
   ```
   cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
   ```
8. **Click "Save Changes"** button
9. **Wait for auto-redeploy**

### Option 2: Delete and Recreate Service

If you can't find the Start Command field:

1. **Note down all your Environment Variables** (copy them somewhere)
2. **Delete the current service** in Render
3. **Create a NEW Web Service**:
   - Connect to your GitHub repo: `dakshverma23/E-BloodBank`
   - **Root Directory**: Leave EMPTY (or set to `.`)
   - **Build Command**: 
     ```
     cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**: 
     ```
     cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Environment**: Python 3
   - **Plan**: Free
4. **Add all Environment Variables** from step 1
5. **Click "Create Web Service"**

## Why This Happens

Render dashboard has a **Start Command** field that takes priority over:
- Procfile
- render.yaml
- Any other configuration

This is a Render design - the dashboard setting ALWAYS wins.

## Verification

After fixing, you should see in logs:
```
==> Running 'cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT'
```

NOT:
```
==> Running 'gunicorn your_application.wsgi'
```

## If Still Not Working

1. Check **Settings → Root Directory** - should be empty or `.`
2. Check **Settings → Build Command** - should include `cd backend`
3. Check **Logs tab** - see what command is actually running
4. Contact Render support: support@render.com

---

**REMEMBER**: The code is 100% correct. This is purely a Render dashboard configuration issue.


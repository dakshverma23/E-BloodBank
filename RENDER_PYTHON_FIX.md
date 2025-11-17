# URGENT: Fix Python Version in Render Dashboard

## The Problem
Render is using Python 3.13, but `psycopg2-binary` 2.9.9 is not compatible with Python 3.13. This causes the error:
```
ImportError: undefined symbol: _PyInterpreterState_Get
```

## The Solution
You **MUST** manually set Python 3.11.9 in the Render dashboard.

## Steps to Fix:

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your **ebloodbank-backend** service
3. Go to **Settings** tab
4. Scroll down to **Environment** section
5. Find **Python Version** setting
6. Set it to: **3.11.9**
7. Click **Save Changes**
8. Render will automatically redeploy

## Alternative: If Python Version Setting Doesn't Exist

If you don't see a Python Version setting, you need to:

1. Go to **Settings** tab
2. Scroll to **Build & Deploy** section
3. In **Build Command**, ensure it's:
   ```
   cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
   ```
4. In **Start Command**, ensure it's:
   ```
   cd backend && gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
   ```
5. Add an **Environment Variable**:
   - Key: `PYTHON_VERSION`
   - Value: `3.11.9`
6. Click **Save Changes**

## Why This Is Necessary

- `psycopg2-binary` 2.9.9 was compiled for Python 3.11 and earlier
- Python 3.13 has internal changes that break the binary
- We have `runtime.txt` with `python-3.11.9`, but Render is ignoring it
- The only way to force Python 3.11 is to set it in the dashboard

## After Fixing

Once you set Python 3.11.9 in the dashboard, Render will:
1. Use Python 3.11.9 for the build
2. Install `psycopg2-binary` which is compatible with Python 3.11
3. Successfully start the Django application

The deployment should work after this change!


# URGENT: Database Migrations Not Running

## The Problem
Your login is failing because database tables don't exist. The error shows:
```
relation "accounts_user" does not exist
```

## What This Means
- OPTIONS request works (CORS is fine) ✅
- POST request fails (database tables missing) ❌
- Migrations are not running successfully

## Solution: Manual Migration Check

### Step 1: Check Render Logs
1. Go to your Render dashboard
2. Click on your service
3. Go to **Logs** tab
4. Look for lines that say:
   ```
   ==========================================
   Running database migrations...
   ==========================================
   ```

### Step 2: If You DON'T See Migration Output
The startup script isn't running migrations. You need to manually run them:

1. Go to Render dashboard → Your service → **Shell** tab (or use SSH)
2. Run these commands:
   ```bash
   cd backend
   python manage.py migrate
   ```

### Step 3: If Migrations Fail
Check the error message. Common issues:
- Database connection problems
- Missing migration files
- Permission issues

### Step 4: Verify Tables Were Created
After running migrations, verify:
```bash
python manage.py showmigrations
```

All migrations should show `[X]` (applied).

## Quick Fix
If you can't access the shell, you can also:
1. Go to Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Watch the logs carefully for migration output
4. If migrations fail, you'll see the error

## After Migrations Run
Once migrations complete successfully:
1. Try logging in again
2. If you don't have a user account, create one via signup
3. Or create a superuser: `python manage.py createsuperuser`


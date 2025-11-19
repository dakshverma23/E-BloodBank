# Setting Up Email on Render

## The Problem
Your email credentials are configured locally in `.env` but NOT on Render. Render uses environment variables, not `.env` files.

## ✅ Solution: Add Environment Variables on Render

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Click on your **backend/web service** (the one that's failing)

### Step 2: Navigate to Environment Variables
1. Click **"Environment"** in the left sidebar
2. You'll see a list of existing environment variables

### Step 3: Add Email Configuration Variables
Click **"Add Environment Variable"** and add these **ONE BY ONE**:

#### Variable 1:
- **Key**: `EMAIL_BACKEND`
- **Value**: `django.core.mail.backends.smtp.EmailBackend`
- Click **"Save"**

#### Variable 2:
- **Key**: `EMAIL_HOST`
- **Value**: `smtp.gmail.com`
- Click **"Save"**

#### Variable 3:
- **Key**: `EMAIL_PORT`
- **Value**: `587`
- Click **"Save"`

#### Variable 4:
- **Key**: `EMAIL_USE_TLS`
- **Value**: `True`
- Click **"Save"`

#### Variable 5:
- **Key**: `EMAIL_HOST_USER`
- **Value**: `daksh.verma.22cse@bmu.edu.in` (or your Gmail address)
- Click **"Save"**

#### Variable 6:
- **Key**: `EMAIL_HOST_PASSWORD`
- **Value**: `emsqvydsnwmciwqf` (your Gmail App Password - 16 characters)
- Click **"Save"**

#### Variable 7:
- **Key**: `DEFAULT_FROM_EMAIL`
- **Value**: `daksh.verma.22cse@bmu.edu.in` (same as EMAIL_HOST_USER)
- Click **"Save"**

### Step 4: Verify All Variables Are Added
You should see all 7 variables in the list:
- ✅ EMAIL_BACKEND
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_USE_TLS
- ✅ EMAIL_HOST_USER
- ✅ EMAIL_HOST_PASSWORD
- ✅ DEFAULT_FROM_EMAIL

### Step 5: Redeploy
1. After adding all variables, Render will **automatically redeploy**
2. Wait for the deployment to complete
3. Check the logs to ensure no errors

### Step 6: Test
Try sending an OTP again - it should now work!

## Important Notes

### Gmail App Password
- Make sure you're using a **Gmail App Password**, not your regular password
- App passwords are 16 characters long
- To generate one: https://myaccount.google.com/apppasswords
- You need **2-Step Verification** enabled first

### Security
- **Never commit** your `.env` file to Git
- Environment variables on Render are encrypted
- If your app password changes, update it in Render dashboard

## ⚠️ IMPORTANT: Render Free Tier SMTP Blocking

**If you see this error:**
```
OSError: [Errno 101] Network is unreachable
```

**This means Render's free tier is blocking outbound SMTP connections.**

### Solution 1: Try Port 465 with SSL (Quick Fix)

Update your Render environment variables:

1. Change `EMAIL_PORT` from `587` to `465`
2. Change `EMAIL_USE_TLS` from `True` to `False`
3. Add new variable `EMAIL_USE_SSL` = `True`

**Updated variables:**
- `EMAIL_PORT` = `465`
- `EMAIL_USE_TLS` = `False`
- `EMAIL_USE_SSL` = `True` (NEW - add this)

This sometimes works better on Render's network.

### Solution 2: Use SendGrid (Recommended for Production)

SendGrid works better on Render because it uses API instead of SMTP.

#### Step 1: Sign up for SendGrid
1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free)
3. Verify your email address

#### Step 2: Create API Key
1. Go to SendGrid Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Name it "E-BloodBank"
4. Give it "Mail Send" permissions
5. **Copy the API key** (you'll only see it once!)

#### Step 3: Update Render Environment Variables
Replace your Gmail variables with:

- `EMAIL_BACKEND` = `django.core.mail.backends.smtp.EmailBackend`
- `EMAIL_HOST` = `smtp.sendgrid.net`
- `EMAIL_PORT` = `587`
- `EMAIL_USE_TLS` = `True`
- `EMAIL_USE_SSL` = `False` (or remove it)
- `EMAIL_HOST_USER` = `apikey` (literally the word "apikey")
- `EMAIL_HOST_PASSWORD` = `[your-sendgrid-api-key]` (paste the API key you copied)
- `DEFAULT_FROM_EMAIL` = `noreply@yourdomain.com` (or your verified email)

#### Step 4: Verify Sender in SendGrid
1. Go to SendGrid → Settings → Sender Authentication
2. Verify a single sender (your email address)
3. Or verify your domain (if you have one)

### Solution 3: Upgrade Render Plan
Render's paid plans ($7/month+) allow SMTP connections. But SendGrid is free and better for email.

## Troubleshooting

### If Email Still Fails After Adding Variables:
1. **Check the logs** - Look for specific SMTP errors
2. **Verify app password** - Make sure it's still valid
3. **Check Gmail account** - Ensure 2-Step Verification is enabled
4. **Test locally** - Make sure email works with your `.env` file

### Common Errors:
- **"Authentication failed"** → Wrong app password or it expired
- **"Connection refused"** → Firewall/network issue
- **"[Errno 101] Network is unreachable"** → **Render free tier blocking SMTP** → Use SendGrid or port 465
- **"Rate limit exceeded"** → Too many emails sent, wait a bit

## Quick Reference

Your current email config (from `.env`):
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=daksh.verma.22cse@bmu.edu.in
EMAIL_HOST_PASSWORD=emsqvydsnwmciwqf
DEFAULT_FROM_EMAIL=daksh.verma.22cse@bmu.edu.in
```

Copy these exact values to Render environment variables!


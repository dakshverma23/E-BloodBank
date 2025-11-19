# 🚨 URGENT: Fix "Network is unreachable" Error on Render

## The Problem
```
OSError: [Errno 101] Network is unreachable
```

**Render's free tier blocks outbound SMTP connections to Gmail.**

## ✅ Quick Fix: Use SendGrid (Recommended)

SendGrid works on Render's free tier because it uses API, not SMTP.

### Step 1: Sign Up for SendGrid (Free)
1. Go to: https://sendgrid.com/
2. Click "Start for free"
3. Sign up with your email
4. Verify your email address

### Step 2: Create API Key
1. In SendGrid dashboard, go to: **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name: `E-BloodBank`
4. Permissions: Select **"Mail Send"** (Full Access)
5. Click **"Create & View"**
6. **COPY THE API KEY** (you'll only see it once!)

### Step 3: Update Render Environment Variables
Go to Render Dashboard → Your Service → Environment

**Delete these old Gmail variables:**
- ❌ EMAIL_HOST (old value)
- ❌ EMAIL_PORT (old value)  
- ❌ EMAIL_USE_TLS (old value)

**Add/Update these variables:**

| Key | Value |
|-----|-------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | `smtp.sendgrid.net` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_USE_SSL` | `False` (or remove if exists) |
| `EMAIL_HOST_USER` | `apikey` (literally the word "apikey") |
| `EMAIL_HOST_PASSWORD` | `[paste your SendGrid API key here]` |
| `DEFAULT_FROM_EMAIL` | `noreply@ebloodbank.com` (or your email) |

### Step 4: Verify Sender in SendGrid
1. Go to SendGrid Dashboard → **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Enter your email address
4. Fill in the form
5. Check your email and click the verification link

### Step 5: Redeploy
Render will auto-redeploy. Wait for it to complete.

### Step 6: Test
Try sending an OTP - it should work now! ✅

## Alternative: Try Port 465 with SSL

If you want to stick with Gmail, try this first:

**Update Render environment variables:**
- `EMAIL_PORT` = `465` (change from 587)
- `EMAIL_USE_TLS` = `False` (change from True)
- `EMAIL_USE_SSL` = `True` (add new variable)

Sometimes port 465 works when 587 doesn't on Render.

## Why SendGrid is Better

✅ Works on Render free tier  
✅ 100 emails/day free  
✅ More reliable  
✅ Better deliverability  
✅ Professional email service  
✅ API-based (not SMTP)  

## SendGrid Free Tier Limits

- 100 emails per day
- Unlimited contacts
- Email API access
- Perfect for development and small projects

If you need more, upgrade to paid plan ($15/month for 50k emails).


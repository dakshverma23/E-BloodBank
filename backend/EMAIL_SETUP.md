# Email Configuration Guide for E-BloodBank

## Overview
E-BloodBank uses Django's email backend to send OTP verification codes via email. This guide will help you configure email sending.

## Option 1: Gmail SMTP (Recommended for Development)

### Step 1: Enable Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down to **App passwords**
5. Click **Select app** → Choose "Mail"
6. Click **Select device** → Choose "Other (Custom name)"
7. Enter "E-BloodBank" and click **Generate**
8. **Copy the 16-character password** (you'll need this)

### Step 2: Configure Environment Variables

#### For Local Development (.env file)

Create or edit `.env` file in the `backend/` directory:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Important:** 
- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-16-char-app-password` with the app password you generated
- Use the **16-character app password**, NOT your regular Gmail password

#### For Production (Render)

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add these environment variables:

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

5. Save and redeploy your service

## Option 2: Other Email Providers

### Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
```

### Yahoo Mail

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@yahoo.com
EMAIL_HOST_PASSWORD=your-app-password
```

### SendGrid (Production Recommended)

1. Sign up at https://sendgrid.com/
2. Get API key from SendGrid dashboard
3. Configure:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

## Option 3: Console Backend (Development Only)

For local development without actual email sending:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

This will print emails to the console instead of sending them.

## Testing Email Configuration

### Test via Django Shell

```bash
cd backend
python manage.py shell
```

Then run:
```python
from django.core.mail import send_mail

send_mail(
    'Test Email',
    'This is a test email from E-BloodBank.',
    'from@example.com',
    ['your-email@gmail.com'],
    fail_silently=False,
)
```

If email is configured correctly, you should receive the email.

### Test via API

Send a request to:
```
POST /api/accounts/otp/send/
{
  "email": "your-email@gmail.com",
  "otp_type": "email"
}
```

## Troubleshooting

### Error: "SMTPAuthenticationError"
- **Solution:** Make sure you're using an App Password for Gmail, not your regular password
- Enable 2-Step Verification first

### Error: "Connection refused" or "Cannot connect to SMTP server"
- **Solution:** Check firewall settings
- Try different port (465 with SSL or 587 with TLS)

### Error: "Timeout"
- **Solution:** Increase `EMAIL_TIMEOUT` in settings.py
- Check internet connection

### Emails going to spam
- **Solution:** 
  - Use a professional email service like SendGrid
  - Configure SPF/DKIM records for your domain
  - Use a proper `DEFAULT_FROM_EMAIL`

## Security Notes

1. **Never commit email credentials to Git**
2. Use environment variables for all sensitive data
3. Use App Passwords instead of regular passwords
4. For production, consider using professional email services (SendGrid, AWS SES, Mailgun)

## Current Status

- ✅ Email backend configured
- ✅ OTP email sending implemented
- ⚠️ Email credentials need to be set in environment variables
- 📝 See above instructions to configure


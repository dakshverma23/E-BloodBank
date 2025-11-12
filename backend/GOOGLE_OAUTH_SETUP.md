# Google OAuth Setup Instructions

This guide will help you set up Google OAuth for email verification in the E-BloodBank application.

## Quick Setup (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google Sign-In API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sign-In API" or "Identity Toolkit API"
   - Click "Enable"
4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (for testing) or "Internal" (for Google Workspace)
   - Fill in: App name, User support email, Developer contact email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue
5. Create OAuth 2.0 Client ID:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "E-BloodBank Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - `http://localhost:3000` (if using different port)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for local development)
     - `http://localhost:3000` (if using different port)
   - Click "Create"
   - Copy the **Client ID** (you'll need this)

### Step 2: Configure Backend

1. Add Google OAuth Client ID to your `.env` file in the `backend` directory:

```env
# Google OAuth Configuration
GOOGLE_OAUTH2_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=your-client-secret-here
```

**Note:** The Client Secret is optional for this implementation since we're using the tokeninfo endpoint.

2. Restart your Django server:

```bash
cd backend
python manage.py runserver
```

### Step 3: Configure Frontend

1. Create a `.env` file in the `frontend` directory (if it doesn't exist):

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

2. Restart your frontend development server:

```bash
cd frontend
npm run dev
```

### Step 4: Test

1. Go to the signup page
2. You should see a "Sign in with Google" button
3. Click it and sign in with your Google account
4. Your email should be verified automatically
5. Fill in the rest of the form and submit

## How It Works

1. **User clicks "Sign in with Google"** → Google OAuth popup appears
2. **User signs in with Google** → Google returns an ID token
3. **Frontend sends token to backend** → Backend verifies token with Google
4. **Backend verifies email** → Stores verification status in cache
5. **User fills form and submits** → Backend checks verification status
6. **Account created** → User is automatically logged in

## Phone Verification

Phone verification is **simplified** - users just need to enter their phone number (no OTP required). The system only checks if the phone number is unique.

## Troubleshooting

### Error: "GOOGLE_OAUTH2_CLIENT_ID not configured"
- Make sure you've added `GOOGLE_OAUTH2_CLIENT_ID` to your backend `.env` file
- Restart your Django server after adding the environment variable

### Error: "Invalid or expired Google token"
- Make sure your Google OAuth credentials are correct
- Check that the authorized JavaScript origins include your frontend URL (`http://localhost:5173`)
- Verify that Google Sign-In API is enabled in Google Cloud Console

### Error: "Google Sign-In is not loaded"
- Check browser console for errors
- Verify that `VITE_GOOGLE_CLIENT_ID` is set in your frontend `.env` file
- Make sure your frontend URL is in the authorized JavaScript origins
- Try refreshing the page

### Error: "Email is not verified by Google"
- Make sure the Google account you're using has a verified email address
- Try using a different Google account

### Google Sign-In button not showing
- Check browser console for errors
- Verify that `VITE_GOOGLE_CLIENT_ID` is set correctly
- Make sure the Google Sign-In script is loaded (check Network tab)
- Try clearing browser cache

## Security Notes

1. **Never commit your `.env` file to version control**
2. **Keep your Client ID public** - it's safe to expose in frontend code
3. **Client Secret is optional** - we're using the tokeninfo endpoint which doesn't require it
4. **Use different OAuth credentials for development and production**
5. **Monitor your OAuth usage in Google Cloud Console**

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sign-In API](https://developers.google.com/identity/gsi/web/guides/overview)

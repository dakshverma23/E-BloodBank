# Google OAuth Setup for Frontend

## Quick Setup (5 minutes)

### Step 1: Get Google OAuth Client ID

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
     - `http://localhost:5173` (for Vite default port)
     - `http://localhost:3000` (if using different port)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for Vite default port)
     - `http://localhost:3000` (if using different port)
   - Click "Create"
   - Copy the **Client ID** (it looks like: `123456789-abc.apps.googleusercontent.com`)

### Step 2: Configure Frontend

1. Create a `.env` file in the `frontend` directory (copy from `.env.example`):

```bash
cd frontend
cp .env.example .env
```

2. Open the `.env` file and add your Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

**Important:** Replace `your-google-client-id-here.apps.googleusercontent.com` with your actual Google Client ID.

3. Restart your frontend development server:

```bash
npm run dev
```

### Step 3: Test

1. Go to the signup page
2. You should see a "Sign in with Google" button (no warning message)
3. Click it and sign in with your Google account
4. Your email should be verified automatically
5. Fill in the rest of the form and submit

## Troubleshooting

### Warning: "Google Client ID is not configured"
- Make sure you've created a `.env` file in the `frontend` directory
- Check that `VITE_GOOGLE_CLIENT_ID` is set correctly in the `.env` file
- Restart your frontend development server after adding the environment variable
- Make sure the `.env` file is in the `frontend` directory (not in `frontend/src`)

### Error: "Invalid or expired Google token"
- Make sure your Google OAuth credentials are correct
- Check that the authorized JavaScript origins include your frontend URL (`http://localhost:5173`)
- Verify that Google Sign-In API is enabled in Google Cloud Console

### Google Sign-In button not showing
- Check browser console for errors
- Verify that `VITE_GOOGLE_CLIENT_ID` is set correctly
- Make sure the Google Sign-In script is loaded (check Network tab)
- Try clearing browser cache

### Port mismatch
- If your frontend runs on a different port (not 5173), make sure to:
  1. Update the authorized JavaScript origins in Google Cloud Console
  2. Update the authorized redirect URIs in Google Cloud Console
  3. Restart your frontend server

## Important Notes

1. **Never commit your `.env` file to version control** - it's already in `.gitignore`
2. **The Client ID is safe to expose** - it's meant to be used in frontend code
3. **Use different OAuth credentials for development and production**
4. **The Client ID should start with a number and end with `.apps.googleusercontent.com`**

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)


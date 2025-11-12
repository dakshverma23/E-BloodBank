# Quick Setup Guide - Google OAuth

## ⚡ Quick Steps (5 minutes)

### 1. Get Google OAuth Client ID

**Go to:** https://console.cloud.google.com/apis/credentials

1. **Create a project** (or select existing)
2. **Enable API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Identity Toolkit API"
   - Click "Enable"
3. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External"
   - Fill in: App name, User support email, Developer contact email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue
4. **Create OAuth Client ID:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: "E-BloodBank Web Client"
   - **Authorized JavaScript origins:**
     - `http://localhost:5173`
   - **Authorized redirect URIs:**
     - `http://localhost:5173`
   - Click "Create"
   - **Copy the Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### 2. Add to Frontend `.env` file

Open `frontend/.env` and replace the placeholder:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Replace `123456789-abc.apps.googleusercontent.com` with your actual Client ID**

### 3. Add to Backend `.env` file

Open `backend/.env` and add:

```env
GOOGLE_OAUTH2_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Replace `123456789-abc.apps.googleusercontent.com` with your actual Client ID**

### 4. Restart Servers

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
python manage.py runserver
```

### 5. Test

1. Go to the signup page
2. You should see a "Sign in with Google" button (no warning)
3. Click it and sign in with your Google account
4. Your email will be verified automatically
5. Fill in the form and submit

## ✅ Done!

If you see the warning message, make sure:
- ✅ The `.env` file exists in the `frontend` directory
- ✅ `VITE_GOOGLE_CLIENT_ID` is set correctly
- ✅ You've restarted the frontend server
- ✅ The Client ID is correct (no typos)

## 🔗 Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Detailed Setup Guide](./GOOGLE_OAUTH_SETUP.md)


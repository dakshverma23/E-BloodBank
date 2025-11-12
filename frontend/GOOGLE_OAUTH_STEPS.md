# Google OAuth Setup - Step by Step

## Website: https://console.cloud.google.com/

### Step 1: Create/Select Project
1. Go to: **https://console.cloud.google.com/**
2. Click **"Select a project"** dropdown at the top
3. Click **"New Project"**
4. Enter project name: **"E-BloodBank"**
5. Click **"Create"**
6. Wait for project to be created (takes a few seconds)
7. Select the project from the dropdown

### Step 2: Enable Identity Toolkit API
1. In the left sidebar, click **"APIs & Services"** > **"Library"**
2. In the search box, type: **"Identity Toolkit API"**
3. Click on **"Identity Toolkit API"**
4. Click the blue **"Enable"** button
5. Wait for it to enable (takes a few seconds)

### Step 3: Configure OAuth Consent Screen
1. In the left sidebar, click **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** (for testing)
3. Click **"Create"**
4. Fill in the form:
   - **App name:** `E-BloodBank`
   - **User support email:** Select your email from dropdown
   - **Developer contact information:** Enter your email
5. Click **"Save and Continue"**
6. On the "Scopes" page, click **"Save and Continue"** (no need to add scopes)
7. On the "Test users" page, click **"Save and Continue"** (no need to add test users)
8. On the "Summary" page, click **"Back to Dashboard"**

### Step 4: Create OAuth Client ID
1. In the left sidebar, click **"APIs & Services"** > **"Credentials"**
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"OAuth client ID"**
4. If prompted, select **"Web application"** as the application type
5. Fill in the form:
   - **Name:** `E-BloodBank Web Client`
   - **Authorized JavaScript origins:** Click **"+ ADD URI"** and enter: `http://localhost:5173`
   - **Authorized redirect URIs:** Click **"+ ADD URI"** and enter: `http://localhost:5173`
6. Click **"Create"**
7. **IMPORTANT:** A popup will appear with your **Client ID** and **Client Secret**
8. **Copy the Client ID** (it looks like: `123456789-abcxyz.apps.googleusercontent.com`)
9. Click **"OK"**

### Step 5: Add Client ID to Frontend `.env` file
1. Open the file: `frontend/.env`
2. Find the line: `VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com`
3. Replace `your-google-client-id-here.apps.googleusercontent.com` with your actual Client ID
4. Example:
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
   ```
5. Save the file

### Step 6: Add Client ID to Backend `.env` file
1. Open the file: `backend/.env`
2. Add this line (if it doesn't exist):
   ```
   GOOGLE_OAUTH2_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
   ```
3. Replace `123456789-abcxyz.apps.googleusercontent.com` with your actual Client ID (same as frontend)
4. Save the file

### Step 7: Restart Your Servers

**Frontend:**
1. Stop your frontend server (Ctrl+C)
2. Start it again:
   ```bash
   cd frontend
   npm run dev
   ```

**Backend:**
1. Stop your backend server (Ctrl+C)
2. Start it again:
   ```bash
   cd backend
   python manage.py runserver
   ```

### Step 8: Test
1. Go to your signup page: `http://localhost:5173/signup`
2. You should see a **"Sign in with Google"** button (no warning message)
3. Click the button
4. Sign in with your Google account
5. Your email should be verified automatically
6. Fill in the form and submit

## ✅ Done!

If you see any errors, check:
- ✅ Client ID is correct (no typos)
- ✅ Both `.env` files have the same Client ID
- ✅ You've restarted both servers
- ✅ Authorized JavaScript origins includes `http://localhost:5173`
- ✅ Authorized redirect URIs includes `http://localhost:5173`

## 🔗 Direct Links

- **Google Cloud Console:** https://console.cloud.google.com/
- **APIs & Services Library:** https://console.cloud.google.com/apis/library
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Credentials:** https://console.cloud.google.com/apis/credentials


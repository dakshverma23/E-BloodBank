# Firebase Configuration Credentials

## Frontend Environment Variables (.env file in frontend/)

Create `frontend/.env` with:

```env
VITE_FIREBASE_API_KEY=AIzaSyAODGbFMjD7g_1qi39hGANfCWAVcusPCDc
VITE_FIREBASE_AUTH_DOMAIN=e-bloodbank-85621.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=e-bloodbank-85621
VITE_FIREBASE_STORAGE_BUCKET=e-bloodbank-85621.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=733072595519
VITE_FIREBASE_APP_ID=1:733072595519:web:e42d3839f1e94f6941368a
VITE_FIREBASE_MEASUREMENT_ID=G-B98REE6S69
```

## Backend Environment Variables (.env file in backend/)

Create `backend/.env` with:

```env
FIREBASE_PROJECT_ID=e-bloodbank-85621
FIREBASE_WEB_API_KEY=AIzaSyAODGbFMjD7g_1qi39hGANfCWAVcusPCDc
```

## Firebase Project Details

- **Project Name:** E-BloodBank
- **Project ID:** e-bloodbank-85621
- **App ID:** 1:733072595519:web:e42d3839f1e94f6941368a

## Setup Instructions

1. Copy the environment variables above to your `.env` files
2. Make sure `.env` files are in `.gitignore` (they are)
3. Install dependencies:
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && pip install -r requirements.txt`
4. Start the servers and test Firebase authentication


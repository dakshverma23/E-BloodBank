# Password Requirements & Google Authentication Setup

## ✅ Changes Implemented

### 1. Password Requirements
Password validation has been updated to match Firebase requirements:

- ✅ **Require uppercase character** - At least one uppercase letter (A-Z)
- ✅ **Require lowercase character** - At least one lowercase letter (a-z)
- ✅ **Require numeric character** - At least one number (0-9)
- ✅ **Require special character** - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>/?)
- ✅ **Minimum length: 6 characters**
- ✅ **Maximum length: 4096 characters**

### 2. Google Authentication
Google sign-in/sign-up has been added to both Login and Signup pages.

## Backend Changes

### Password Validators (`backend/accounts/password_validators.py`)
- Created custom validators for:
  - `UppercaseValidator`
  - `LowercaseValidator`
  - `NumericValidator`
  - `SpecialCharacterValidator`
  - `MaximumLengthValidator`

### Settings (`backend/ebloodbank/settings.py`)
- Updated `AUTH_PASSWORD_VALIDATORS` to include:
  - Minimum length: 6
  - Maximum length: 4096
  - Uppercase requirement
  - Lowercase requirement
  - Numeric requirement
  - Special character requirement

### Serializers (`backend/accounts/serializers.py`)
- Added password validation in `UserSerializer.validate_password()`:
  - Validates all requirements before creating user
  - Returns clear error messages for each missing requirement

### Authentication (`backend/accounts/auth.py`)
- Updated `EmailOrUsernameTokenObtainPairSerializer` to support Firebase token authentication
- If `firebase_token` is provided, verifies it and authenticates the user

## Frontend Changes

### Firebase Config (`frontend/src/firebase/config.js`)
- Added `GoogleAuthProvider` import
- Exported `googleProvider` with custom parameters

### Signup Page (`frontend/src/pages/Signup.jsx`)
- Added Google sign-in button at the top of the form
- Added `handleGoogleAuth()` function that:
  - Signs in with Google via Firebase
  - Creates account or logs in with backend
  - Handles errors gracefully

### Login Page (`frontend/src/pages/Login.jsx`)
- Added Google sign-in button at the top of the form
- Added `handleGoogleAuth()` function that:
  - Signs in with Google via Firebase
  - Authenticates with backend
  - Navigates to appropriate dashboard

## Firebase Console Setup

To enable Google authentication in Firebase:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**
3. **Go to Authentication** → **Sign-in method**
4. **Enable Google**:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Enter your project support email
   - Click "Save"

5. **Configure Authorized Domains** (if needed):
   - Add your production domain (e.g., `e-blood-bank-pi.vercel.app`)
   - Add `localhost` for development

## Testing

### Test Password Requirements
1. Try creating a password without uppercase → Should show error
2. Try creating a password without lowercase → Should show error
3. Try creating a password without number → Should show error
4. Try creating a password without special character → Should show error
5. Try creating a password less than 6 characters → Should show error
6. Try creating a valid password → Should work

### Test Google Authentication
1. **On Signup Page**:
   - Click "Continue with Google"
   - Sign in with Google account
   - Should create account and redirect to home

2. **On Login Page**:
   - Click "Continue with Google"
   - Sign in with Google account
   - Should login and redirect to dashboard

## Environment Variables

Make sure these are set in your environment:

**Frontend (Vercel)**:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Backend (Render)**:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_WEB_API_KEY`

## Notes

- Google authentication requires Firebase to be properly configured
- If Firebase is not configured, Google buttons won't appear
- Password requirements are enforced on both frontend and backend
- Google sign-in creates accounts automatically if they don't exist
- Users can still use traditional email/password signup

## Troubleshooting

### Google Sign-in Not Working
1. Check Firebase Console → Authentication → Sign-in method → Google is enabled
2. Verify Firebase environment variables are set correctly
3. Check browser console for errors
4. Ensure authorized domains are configured in Firebase

### Password Validation Errors
1. Check backend logs for specific validation errors
2. Frontend shows all missing requirements
3. Backend enforces all requirements server-side


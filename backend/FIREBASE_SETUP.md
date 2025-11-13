# Firebase Authentication Setup for E-BloodBank

This guide will help you set up Firebase Authentication for email and phone verification in the E-BloodBank application.

## Compatibility

✅ **Works with Render (Backend)** - Firebase REST API works perfectly with Render's serverless environment  
✅ **Works with Vercel (Frontend)** - Firebase SDK is fully compatible with Vercel hosting

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name (e.g., "e-bloodbank")
   - Enable Google Analytics (optional)
   - Create the project

## Step 2: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
3. Enable **Phone**:
   - Click on "Phone"
   - Toggle "Enable" to ON
   - For production, add your domain to authorized domains
   - Click "Save"

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "E-BloodBank Web")
5. Copy the Firebase configuration object

## Step 4: Configure Backend (Render)

1. In your Render dashboard, go to your backend service
2. Navigate to **Environment** tab
3. Add the following environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_WEB_API_KEY=your-web-api-key
```

**Where to find these:**
- `FIREBASE_PROJECT_ID`: Found in Firebase Console → Project Settings → General → Project ID
- `FIREBASE_WEB_API_KEY`: Found in Firebase Console → Project Settings → General → Your apps → Web API Key

## Step 5: Configure Frontend (Vercel)

1. In your Vercel dashboard, go to your frontend project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Where to find these:**
- All values are in the Firebase configuration object from Step 3
- Example:
  ```javascript
  {
    apiKey: "AIza...",  // VITE_FIREBASE_API_KEY
    authDomain: "project-id.firebaseapp.com",  // VITE_FIREBASE_AUTH_DOMAIN
    projectId: "project-id",  // VITE_FIREBASE_PROJECT_ID
    storageBucket: "project-id.appspot.com",  // VITE_FIREBASE_STORAGE_BUCKET
    messagingSenderId: "123456789",  // VITE_FIREBASE_MESSAGING_SENDER_ID
    appId: "1:123456789:web:abc123"  // VITE_FIREBASE_APP_ID
  }
  ```

## Step 6: Configure Authorized Domains (Production)

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Add your production domains:
   - Your Vercel domain (e.g., `your-app.vercel.app`)
   - Your custom domain (if any)
3. Click "Add domain"

## Step 7: Install Dependencies

### Backend (Render)
The dependencies are already in `requirements.txt`:
- `firebase-admin>=6.0.0`
- `pyjwt>=2.8.0`
- `cryptography>=41.0.0`

Render will automatically install these during deployment.

### Frontend (Vercel)
The dependency is already in `package.json`:
- `firebase: ^10.7.1`

Vercel will automatically install this during deployment.

## Step 8: Test the Setup

1. **Email Verification:**
   - Go to signup page
   - Enter email address
   - Click "Verify Email"
   - Check your email inbox for verification link
   - Click the link to verify

2. **Phone Verification:**
   - Enter phone number
   - Click "Send OTP"
   - Enter the OTP code received via SMS
   - Click "Verify"

## Troubleshooting

### Error: "Firebase token verification failed"
- Make sure `FIREBASE_PROJECT_ID` and `FIREBASE_WEB_API_KEY` are set in Render environment variables
- Verify the values are correct (no extra spaces)

### Error: "reCAPTCHA not initialized"
- Make sure Firebase Phone Authentication is enabled
- Check browser console for reCAPTCHA errors
- Try refreshing the page

### Error: "OTP not received"
- Check if phone number is in correct format (+91XXXXXXXXXX for India)
- Verify Firebase Phone Authentication is enabled
- Check Firebase Console → Authentication → Users for verification status

### Email verification link not working
- Make sure authorized domains are configured in Firebase Console
- Check spam folder
- Verify email address is correct

## Security Notes

1. **Never commit Firebase credentials to Git**
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Production Settings:**
   - Enable email verification requirement
   - Set up proper authorized domains
   - Use Firebase Security Rules for additional protection

3. **Rate Limiting:**
   - Firebase has built-in rate limiting for phone authentication
   - Consider implementing additional rate limiting in your backend

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Email Authentication](https://firebase.google.com/docs/auth/web/start)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)


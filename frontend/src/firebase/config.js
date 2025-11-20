// Firebase configuration
// Works with Vercel hosting
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, RecaptchaVerifier, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
                              firebaseConfig.authDomain && 
                              firebaseConfig.projectId

// Initialize Firebase only if configured
let app = null
let auth = null

try {
  if (isFirebaseConfigured) {
    // Check if app already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    auth = getAuth(app)
  } else {
    console.warn('Firebase configuration is incomplete. Firebase features will be disabled.')
  }
} catch (error) {
  console.error('Error initializing Firebase:', error)
  console.warn('Firebase features will be disabled.')
}

// Initialize reCAPTCHA verifier for phone authentication
export const initializeRecaptcha = (elementId) => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please configure Firebase environment variables.')
  }
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved, allow phone number sign-in
    },
    'expired-callback': () => {
      // Response expired, ask user to solve reCAPTCHA again
      console.error('reCAPTCHA expired')
    }
  })
}

// Initialize Google Auth Provider (only if Firebase is configured)
let googleProvider = null
if (auth) {
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })
}

export { auth, googleProvider }
export default app


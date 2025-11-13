// Firebase configuration
// Works with Vercel hosting
import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize reCAPTCHA verifier for phone authentication
export const initializeRecaptcha = (elementId) => {
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

export default app


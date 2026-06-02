import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC49KnNoA4MFhhokUa6RcAjkLaco2JxyV0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grindmaster-pwa-coffeelike.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grindmaster-pwa-coffeelike",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grindmaster-pwa-coffeelike.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "698704067439",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:698704067439:web:2fd853ef9ec92249c2469a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth,
  initializeAuth, 
  indexedDBLocalPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyAPsjXna5ImDznfcOyqtC6h_GT09qNSxbU",
  authDomain: "nuerorhythm-app.firebaseapp.com",
  projectId: "nuerorhythm-app",
  storageBucket: "nuerorhythm-app.firebasestorage.app",
  messagingSenderId: "28101636727",
  appId: "1:28101636727:web:98e063a2e040981fc08c72",
  measurementId: "G-XXYVEBPFY7"
};
// 1. Initialize App (Check if already initialized to prevent double-init)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth with conditional persistence
let authInstance;

if (getApps().length > 0) {
  try {
    authInstance = getAuth(app);
  } catch (e) {
    // If getAuth fails because it wasn't initialized yet, we initialize it
    authInstance = initializeAuth(app, {
      persistence: Capacitor.isNativePlatform() 
        ? indexedDBLocalPersistence 
        : browserLocalPersistence,
    });
  }
} else {
  authInstance = initializeAuth(app, {
    persistence: Capacitor.isNativePlatform() 
      ? indexedDBLocalPersistence 
      : browserLocalPersistence,
  });
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
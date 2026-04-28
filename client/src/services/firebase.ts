import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

export const isFirebaseConfigured = () => hasFirebaseConfig;

export const firebaseApp: FirebaseApp | null = hasFirebaseConfig
  ? initializeApp(firebaseConfig)
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export const googleAuthProvider = new GoogleAuthProvider();

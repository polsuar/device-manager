import { initializeApp, FirebaseApp, deleteApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const prodConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const uatConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_UAT_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_UAT_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_UAT_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_UAT_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_UAT_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_UAT_APP_ID,
};

const fallcareConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_FALLCARE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_FALLCARE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_FALLCARE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_FALLCARE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_FALLCARE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_FALLCARE_APP_ID,
};

const apps: Record<string, FirebaseApp> = {};
const dbs: Record<string, Firestore> = {};
const auths: Record<string, Auth> = {};

export const initializeFirebase = async (environment: "UAT" | "PROD" | "FALLCARE") => {
  try {
    const config = environment === "PROD" ? prodConfig : environment === "UAT" ? uatConfig : fallcareConfig;
    const appName = `firebase-${environment.toLowerCase()}`;

    // Cleanup previous instance if exists
    if (apps[appName]) {
      await deleteApp(apps[appName]);
    }

    // Initialize with the correct config
    apps[appName] = initializeApp(config, appName);
    dbs[appName] = getFirestore(apps[appName]);
    auths[appName] = getAuth(apps[appName]);

    return { app: apps[appName], db: dbs[appName], auth: auths[appName] };
  } catch (error) {
    console.error(`Error initializing Firebase for ${environment}:`, error);
    throw error;
  }
};

export const getFirebaseInstance = (environment: "UAT" | "PROD" | "FALLCARE" = "PROD") => {
  const appName = `firebase-${environment.toLowerCase()}`;
  if (!apps[appName] || !dbs[appName] || !auths[appName]) {
    throw new Error(`Firebase instance for ${environment} not initialized`);
  }
  return { app: apps[appName], db: dbs[appName], auth: auths[appName] };
};

// Initialize with PROD by default
initializeFirebase("PROD").catch((error) => {
  console.error("Error initializing default Firebase instance:", error);
});

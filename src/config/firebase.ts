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

let currentApp: FirebaseApp | null = null;
let currentDb: Firestore | null = null;
let currentAuth: Auth | null = null;

export const initializeFirebase = async (environment: "UAT" | "PROD") => {
  try {
    // Cleanup previous instance if exists
    if (currentApp) {
      await deleteApp(currentApp);
    }

    // Initialize with the correct config
    currentApp = initializeApp(environment === "PROD" ? prodConfig : uatConfig);
    currentDb = getFirestore(currentApp);
    currentAuth = getAuth(currentApp);

    return { app: currentApp, db: currentDb, auth: currentAuth };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
};

export const getFirebaseInstance = () => {
  if (!currentDb || !currentAuth) {
    throw new Error("Firebase not initialized");
  }
  return { db: currentDb, auth: currentAuth };
};

// Initialize with PROD by default
initializeFirebase("PROD").catch((error) => {
  console.error("Error initializing default Firebase instance:", error);
});

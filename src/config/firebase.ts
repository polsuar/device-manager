import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCNXaxt4VM4QGsNx30TQtsBGI9DQ6Zl5Hk",
  authDomain: "ellie-care-wear-uat.firebaseapp.com",
  projectId: "ellie-care-wear-uat",
  storageBucket: "ellie-care-wear-uat.appspot.com",
  messagingSenderId: "341547687998",
  appId: "1:341547687998:android:1babca39cc5dd868d3316f",
};

console.log("Inicializando Firebase con configuración:", firebaseConfig);

const app = initializeApp(firebaseConfig);
console.log("Firebase app inicializada:", app);

export const db = getFirestore(app);
console.log("Firestore inicializado:", db);

export const auth = getAuth(app);
console.log("Auth inicializado:", auth);

export const analytics = getAnalytics(app);
console.log("Analytics inicializado:", analytics);

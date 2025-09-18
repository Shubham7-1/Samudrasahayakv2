
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if all required env variables are present
const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID
} = import.meta.env;

console.log("Firebase API Key:", VITE_FIREBASE_API_KEY ? "Present" : "Missing");

if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_AUTH_DOMAIN || !VITE_FIREBASE_PROJECT_ID) {
  console.error("⚠️ Firebase config is missing! Check your .env.local file.");
  throw new Error("Firebase configuration is incomplete");
}

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY || "",
  authDomain: VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Enable offline support
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log("Multiple tabs open: offline persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.log("Offline persistence is not available in this browser.");
    }
  });
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Export services
export { auth, db, storage };

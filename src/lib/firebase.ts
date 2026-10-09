import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVQqD0o8uoEBNXbvHuxMUoOL3i3XWvXYg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mycdc-7035a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mycdc-7035a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mycdc-7035a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "238383865464",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:238383865464:web:0603949bb63e39ae59d78d"
};

export const PRIMARY_ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "oSR3DIuFx7hmW3OvVmgN6uPYzzr1";
export const ADMIN_EMAILS = ["kabarinaja.info@gmail.com"];

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Defensive test connection
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Koneksi Firestore offline atau jaringan terputus:", error.message);
    }
  }
})();

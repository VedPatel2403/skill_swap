import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Web app's Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyBPgOR9Eze5jcy-KiwBg6NRt1FeeA_WKhI",
  authDomain: "skill-swap-f29e2.firebaseapp.com",
  projectId: "skill-swap-f29e2",
  storageBucket: "skill-swap-f29e2.firebasestorage.app",
  messagingSenderId: "591514907062",
  appId: "1:591514907062:web:ed2f6da2beb3d797715117",
  measurementId: "G-GTT3PE0D4T"
};

// Initialize Firebase safely without duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics (safely initialized in supported environments)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Authentication Helpers
export const loginWithGooglePopup = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const loginWithFirebaseEmail = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const registerWithFirebaseEmail = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};

export default app;

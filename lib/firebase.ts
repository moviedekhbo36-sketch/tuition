import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnpBRWLSAUt-r6Nx_ib0xAe6B-ptPEe1k",
  authDomain: "tuition-1dcde.firebaseapp.com",
  projectId: "tuition-1dcde",
  storageBucket: "tuition-1dcde.firebasestorage.app",
  messagingSenderId: "275971401742",
  appId: "1:275971401742:web:3c3663e8f01d87c956745f",
  measurementId: "G-46R6M2RCEK"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };

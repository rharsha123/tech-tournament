import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEznB9sHoIal2KO0x2Gi2Zguv5cjv_MAw",
  authDomain: "tech-tournaments.firebaseapp.com",
  projectId: "tech-tournaments",
  storageBucket: "tech-tournaments.firebasestorage.app",
  messagingSenderId: "953154836110",
  appId: "1:953154836110:web:1dff39487852bf032ddbdf",
  measurementId: "G-2P0G511P1P"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

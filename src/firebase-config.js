import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCmPJyCnU60NQSX22icwxmyMabrI6y6FW8",
  authDomain: "vietcommunity-199d6.firebaseapp.com",
  projectId: "vietcommunity-199d6",
  storageBucket: "vietcommunity-199d6.firebasestorage.app",
  messagingSenderId: "31789592036",
  appId: "1:31789592036:web:e88a9e8b26188bd14f6bf1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

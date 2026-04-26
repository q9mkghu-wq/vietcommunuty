import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyDWG4CwIzQe0LheL2pMXE_XINo4pw0s4oQ",
  authDomain: "vietcommunity.firebaseapp.com",
  projectId: "vietcommunity",
  storageBucket: "vietcommunity.firebasestorage.app",
  messagingSenderId: "751701113900",
  appId: "1:751701113900:web:bfb100999e27f84d67e589"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

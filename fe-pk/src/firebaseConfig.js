import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyD6L0U7jVC0MDIicBxrzKH6QcV2Litq2ls",
  authDomain: "project-kesehatan-56b4b.firebaseapp.com",
  projectId: "project-kesehatan-56b4b",
  storageBucket: "project-kesehatan-56b4b.firebasestorage.app",
  messagingSenderId: "107330040063",
  appId: "1:107330040063:web:9a8c47489ca5e93bf39cca",
  measurementId: "G-EG3V7C4VDR"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
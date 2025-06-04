import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADU5rOfyAWy9LKZJaVJr8d2XpQvwmppN8",
  authDomain: "doctorkays-a4794.firebaseapp.com",
  projectId: "doctorkays-a4794",
  storageBucket: "doctorkays-a4794.firebasestorage.app",
  messagingSenderId: "202206021343",
  appId: "1:202206021343:web:e97430d335babd3e8c8b6a",
  measurementId: "G-S5LJLE4C68",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };

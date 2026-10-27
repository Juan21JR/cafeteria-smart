
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";


import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvusk38AItcYcmGreQ-nv-ePqflpSGxAo",
  authDomain: "cafeteria-cecytem-smart.firebaseapp.com",
  projectId: "cafeteria-cecytem-smart",
  storageBucket: "cafeteria-cecytem-smart.firebasestorage.app",
  messagingSenderId: "194310173944",
  appId: "1:194310173944:web:4b3d3da542ddd60b5df70d",
  measurementId: "G-BQCJBWLSJL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


export {
  app,
  db,
  auth,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc
};

import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCxZAUoO1TU4zdXENB5PbuIApwOY8Cq2z0",
  authDomain: "playable-case-study.firebaseapp.com",
  projectId: "playable-case-study",
  storageBucket: "playable-case-study.firebasestorage.app",
  messagingSenderId: "283203565785",
  appId: "1:283203565785:web:589d13f15b32463b26a6c8",
  measurementId: "G-3HP9RT6MFL",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.setPersistence(browserLocalPersistence)

export const provider = new GoogleAuthProvider();

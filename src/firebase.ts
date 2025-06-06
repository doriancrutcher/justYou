import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase config for JustYou (app name updated for clarity)
const firebaseConfig = {
  apiKey: "AIzaSyBeQ160cMuSIyO4TvPzWWlh40gwU_MJTFw",
  authDomain: "justdorian-abed0.firebaseapp.com",
  projectId: "justdorian-abed0",
  storageBucket: "justdorian-abed0.firebasestorage.app",
  messagingSenderId: "966633500208",
  appId: "1:966633500208:web:d790a415194c0e43df07f5",
  measurementId: "G-27N4EY0QMR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 
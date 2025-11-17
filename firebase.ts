import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZn0ibOBsCMBnbhiDYakhq8QdN13L1phQ",
  authDomain: "samuray-kontent.firebaseapp.com",
  projectId: "samuray-kontent",
  storageBucket: "samuray-kontent.appspot.com",
  messagingSenderId: "156911316228",
  appId: "1:156911316228:web:15b25b1070ec5f9fcf3451",
  measurementId: "G-WLVS38Z1WG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

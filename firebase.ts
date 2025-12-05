import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firestore with settings to ignore undefined properties
// This prevents errors when optional fields (like rubricId) are passed as undefined
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
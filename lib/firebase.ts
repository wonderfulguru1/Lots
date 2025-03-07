import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

/* const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
 */
const firebaseConfig = {
  apiKey: "AIzaSyCIDKJqKNDA9EnEaSpXu5_nFT5q3DznccM",
  authDomain: "plenti-africa.firebaseapp.com",
  databaseURL: "https://plenti-africa-default-rtdb.firebaseio.com",
  projectId: "plenti-africa",
  storageBucket: "plenti-africa.appspot.com",
  messagingSenderId: "478149965527",
  appId: "1:478149965527:web:0be655b1fe33db7fd12292",
  measurementId: "G-M4PPQQ7YLT"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }


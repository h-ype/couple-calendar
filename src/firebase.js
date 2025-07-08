// src/firebase.js
import { initializeApp } from 'firebase/app' 
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// 🔐 이 부분은 Firebase 콘솔에서 복사한 값으로 대체
const firebaseConfig = {
  apiKey: "AIzaSyCE4SlxwJH835v4qEjUNHuikqfwUPQHZLE",
  authDomain: "couple-calendar-base.firebaseapp.com",
  projectId: "couple-calendar-base",
  storageBucket: "couple-calendar-base.firebasestorage.app",
  messagingSenderId: "835782581017",
  appId: "1:835782581017:web:5d31a1693efd25d2f18388",
  measurementId: "G-FJ0QFKESNE"
};


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

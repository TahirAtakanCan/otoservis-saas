// apps/web/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBrUqfs30NEu2omqiasX8yRr1_6UJc62sU",
  authDomain: "otoservis-saas.firebaseapp.com",
  projectId: "otoservis-saas",
  storageBucket: "otoservis-saas.firebasestorage.app",
  messagingSenderId: "741569204068",
  appId: "1:741569204068:web:3a87e529cca79896473471",
  measurementId: "G-7GK4FL3RT6"
};

// Next.js (Web) tarafında sayfa her yenilendiğinde Firebase'in baştan
// başlatılmasını (hata vermesini) önlemek için bu kontrolü yapıyoruz:
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
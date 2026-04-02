import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function initFirebaseClient(): FirebaseApp {
  const firebaseConfig = {
    apiKey: "AIzaSyAa7Lqp4oC0GBffhOTiPNcg6KH2xrcBZaM",
    authDomain: "p-crm-5f24c.firebaseapp.com",
    projectId: "p-crm-5f24c",
    storageBucket: "p-crm-5f24c.firebasestorage.app",
    messagingSenderId: "1072484398343",
    appId: "1:1072484398343:web:7720546ad489b8d52381a2"
  };

  if (process.env.NODE_ENV !== "production") {
    // Safe debug info (no tokens, no private keys). API key is public but we still redact most of it.
    const apiKey = firebaseConfig.apiKey;
    const apiKeyRedacted =
      typeof apiKey === "string" && apiKey.length > 10 ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}` : "missing";
    console.info("[firebase] client config", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      apiKey: apiKeyRedacted,
    });
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return app;
}

export const firebaseApp: FirebaseApp = initFirebaseClient();
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firebaseDb: Firestore = getFirestore(firebaseApp);
export const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);


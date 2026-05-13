import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

export function getFirebaseClientApp(): FirebaseApp {
  if (!config.apiKey || !config.authDomain || !config.projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* env vars for client auth.");
  }
  if (getApps().length) return getApps()[0]!;
  return initializeApp(config);
}

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

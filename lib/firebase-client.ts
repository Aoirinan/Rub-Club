import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

let appCheckInitialized = false;

function initAppCheckIfConfigured(app: FirebaseApp): void {
  if (appCheckInitialized || typeof window === "undefined") return;

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?.trim();
  if (!siteKey) return;

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN ?? true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  appCheckInitialized = true;
}

export function getFirebaseClientApp(): FirebaseApp {
  if (!config.apiKey || !config.authDomain || !config.projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* env vars for client auth.");
  }
  if (getApps().length) {
    const existing = getApps()[0]!;
    initAppCheckIfConfigured(existing);
    return existing;
  }
  const app = initializeApp(config);
  initAppCheckIfConfigured(app);
  return app;
}

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

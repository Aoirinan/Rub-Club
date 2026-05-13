import admin from "firebase-admin";

function normalizeServiceAccountJson(raw: string): string {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === "'" && b === "'") || (a === "\"" && b === "\"")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

function initAdmin(): void {
  if (admin.apps.length) return;

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson) {
    const creds = JSON.parse(normalizeServiceAccountJson(rawJson)) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    return;
  }

  throw new Error(
    "Missing Firebase Admin credentials: set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) on the host, or GOOGLE_APPLICATION_CREDENTIALS for local file-based auth.",
  );
}

export function getAdminApp(): admin.app.App {
  initAdmin();
  return admin.app();
}

export function getFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

export function getAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

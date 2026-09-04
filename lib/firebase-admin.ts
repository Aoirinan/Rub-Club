import admin from "firebase-admin";

/**
 * Resolves the GCS bucket used by Firebase Admin Storage.
 *
 * Order: explicit server env → same value from web SDK config (`storageBucket` in Firebase console)
 * → inferred default for the project.
 *
 * Firebase default buckets created after Sept 2024 use `{projectId}.firebasestorage.app`.
 * Older projects often use `{projectId}.appspot.com` — set `FIREBASE_STORAGE_BUCKET` (or paste
 * `storageBucket` into `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`) if uploads say the bucket does not exist.
 */
function resolveStorageBucket(): string | undefined {
  const explicit =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (explicit) return explicit;
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson) {
    try {
      const creds = JSON.parse(normalizeServiceAccountJson(rawJson)) as { project_id?: string };
      if (creds.project_id) return defaultFirebaseStorageBucketForProject(creds.project_id);
    } catch {
      /* ignore */
    }
  }
  const pub = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (pub) return defaultFirebaseStorageBucketForProject(pub);
  return undefined;
}

function defaultFirebaseStorageBucketForProject(projectId: string): string {
  return `${projectId}.firebasestorage.app`;
}

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
    const storageBucket = resolveStorageBucket();
    admin.initializeApp({
      credential: admin.credential.cert(creds),
      ...(storageBucket ? { storageBucket } : {}),
    });
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const storageBucket = resolveStorageBucket();
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(storageBucket ? { storageBucket } : {}),
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

export function getStorageBucket(): ReturnType<admin.storage.Storage["bucket"]> {
  const app = getAdminApp();
  const name = resolveStorageBucket();
  if (name) return admin.storage(app).bucket(name);
  return admin.storage(app).bucket();
}

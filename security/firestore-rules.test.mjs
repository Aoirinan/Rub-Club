/**
 * Security regression test for firestore.rules and storage.rules.
 *
 * These rules are the PHI backstop: every read and write is meant to go through
 * the Next.js API routes using the Admin SDK (which bypasses rules), and NO
 * client — signed in or not — may touch Firestore or Storage directly. This
 * test proves that, so a future edit that accidentally opens a collection to
 * clients fails CI instead of shipping.
 *
 * Run: npm run test:rules   (starts the emulator, runs this, shuts it down)
 */
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { ref, getBytes, uploadBytes } from "firebase/storage";

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, promise) {
  try {
    await promise;
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${err?.message ?? err}`);
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: "demo-rules-test",
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
  storage: { rules: readFileSync("storage.rules", "utf8") },
});

// Collections that hold PHI or otherwise must never be client-reachable.
const SENSITIVE = [
  "bookings",
  "patients",
  "intake_submissions",
  "intake_forms_config",
  "staff",
  "rate_limits",
  "site_content",
  "arbitrary_future_collection",
];

console.log("\nFirestore rules — unauthenticated client:");
{
  const db = testEnv.unauthenticatedContext().firestore();
  for (const c of SENSITIVE) {
    await check(`deny read  ${c}/doc1`, assertFails(getDoc(doc(db, c, "doc1"))));
    await check(`deny write ${c}/doc1`, assertFails(setDoc(doc(db, c, "doc1"), { x: 1 })));
    await check(`deny list  ${c}`, assertFails(getDocs(collection(db, c))));
  }
}

console.log("\nFirestore rules — SIGNED-IN client (fake staff uid):");
{
  // A real Firebase user token must still be denied direct access: auth alone
  // is not authorization here. This is the case a misconfigured rule would open.
  const db = testEnv.authenticatedContext("staff-uid-123").firestore();
  for (const c of SENSITIVE) {
    await check(`deny read  ${c}/doc1`, assertFails(getDoc(doc(db, c, "doc1"))));
    await check(`deny write ${c}/doc1`, assertFails(setDoc(doc(db, c, "doc1"), { x: 1 })));
  }
}

console.log("\nStorage rules:");
{
  const anon = testEnv.unauthenticatedContext().storage();
  const bytes = new Uint8Array([1, 2, 3]);
  // public_site is intentionally world-readable (marketing portraits) but never client-writable.
  await check(
    "allow read  public_site/portrait.jpg",
    assertSucceeds(getBytes(ref(anon, "public_site/portrait.jpg"))).catch((e) => {
      // object-not-found means the READ was permitted (rule passed) but no file exists — that is a pass.
      if (String(e?.code ?? e).includes("not-found") || String(e).includes("404")) return;
      throw e;
    }),
  );
  await check("deny write  public_site/portrait.jpg", assertFails(uploadBytes(ref(anon, "public_site/portrait.jpg"), bytes)));
  await check("deny read   patient-uploads/x.pdf", assertFails(getBytes(ref(anon, "patient-uploads/x.pdf"))));
  await check("deny write  patient-uploads/x.pdf", assertFails(uploadBytes(ref(anon, "patient-uploads/x.pdf"), bytes)));
}

await testEnv.cleanup();

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("Failing checks:\n  - " + failures.join("\n  - "));
  process.exit(1);
}

#!/usr/bin/env node
import nextEnv from '@next/env';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
nextEnv.loadEnvConfig(process.cwd());
function norm(raw){let s=raw.trim();if(s.charCodeAt(0)===0xfeff)s=s.slice(1).trim();if(s.length>=2&&((s[0]==="'"&&s.at(-1)==="'")||(s[0]==='"'&&s.at(-1)==='"')))s=s.slice(1,-1).trim();return s;}
initializeApp({ credential: cert(JSON.parse(norm(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))) });
const db = getFirestore();

// Only the Paris nav height had a stored override (95). Bump it ~50% to match
// the new default. Others have no stored doc and pick up the new code defaults.
const id = 'header_paris_logo_nav_height_px';
await db.collection('site_content').doc(id).set({
  id,
  pageLabel: 'Footer',
  sectionLabel: 'Header',
  fieldLabel: 'Paris logo nav height (px)',
  type: 'text',
  value: '144',
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: 'legacy-migration-script',
}, { merge: true });
console.log(`set ${id} = 144`);

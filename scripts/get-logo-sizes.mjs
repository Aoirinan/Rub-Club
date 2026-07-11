#!/usr/bin/env node
import nextEnv from '@next/env';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
nextEnv.loadEnvConfig(process.cwd());
function norm(raw){let s=raw.trim();if(s.charCodeAt(0)===0xfeff)s=s.slice(1).trim();if(s.length>=2&&((s[0]==="'"&&s.at(-1)==="'")||(s[0]==='"'&&s.at(-1)==='"')))s=s.slice(1,-1).trim();return s;}
initializeApp({ credential: cert(JSON.parse(norm(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))) });
const db = getFirestore();
const ids = [
  'header_paris_logo_nav_height_px',
  'header_paris_logo_mobile_height_px',
  'header_ss_logo_nav_height_px',
  'header_ss_logo_mobile_height_px',
];
const out = {};
for (const id of ids) {
  const s = await db.collection('site_content').doc(id).get();
  out[id] = s.exists ? (s.data()?.value ?? '(no value)') : '(no doc — uses code default)';
}
console.log(JSON.stringify(out, null, 2));

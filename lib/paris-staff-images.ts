/**
 * Default staff portraits from chiropracticparistexas.com/staff (Baystone CDN).
 * Superadmins can replace via Site content → Paris staff → Photo fields.
 */

export const PARIS_STAFF_IMAGES = {
  brandiBoren:
    "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/64415168a80ed_Brandi.webp?2da61b33eec483b193df9e654b834a4a",
  sarahBrown:
    "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/sedona/sarah.webp?063dba69995f266776ec043011697d24",
  shaunaClark:
    "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/667da401c4fc8_ShaunaClark.jpg.webp?5b900f40d9a2ff0118b390d0a00952d1",
  shelbieGuthrie:
    "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/shelbie-2_20251120_2115.png.webp?7f935098ccbbcf441a399c19e077443a",
  ashlieJenkins:
    "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/sedona/Ashlie-fd8e2220-2880w.webp?cdc5cab1a87c66c94bd9929247447797",
  channetyWooten:
    "https://cdcssl.ibsrv.net/ibimg/smb/650x250_80/webmgr/1x/5/c/CHANN_20250220_1843.png.webp?ba181c242dc69fe0d7ca86fd954f35ae",
} as const;

export type ParisStaffImageKey = keyof typeof PARIS_STAFF_IMAGES;

const env = process.env;

const key =
  env.SENDGRID_API_KEY?.trim() ??
  env.SEND_GRID?.trim() ??
  env.send_grid?.trim() ??
  "";
const from =
  env.SENDGRID_FROM_EMAIL?.trim() ??
  env.sendgridfromemail?.trim() ??
  env.SENDGRIDFROMEMAIL?.trim() ??
  "";

const emailRe = /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/;
const keyLooksSg = key.startsWith("SG.");
const fromNorm = from.split(/\r?\n/)[0].replace(/^["']|["']$/g, "").trim();
const fromLooksEmail = emailRe.test(fromNorm);
const fromLooksSg = from.trim().startsWith("SG.");
const keyLooksEmail = emailRe.test(key.trim());

console.log(
  JSON.stringify(
    {
      hasSendgridApiKey: Boolean(env.SENDGRID_API_KEY),
      hasSendGrid: Boolean(env.SEND_GRID),
      hasSend_grid: Boolean(env.send_grid),
      hasSendgridFromEmail: Boolean(env.SENDGRID_FROM_EMAIL),
      hasSendgridfromemail: Boolean(env.sendgridfromemail),
      resolvedKeyPresent: Boolean(key),
      resolvedFromPresent: Boolean(from),
      keyLooksSg,
      fromLooksEmail,
      likelySwapped: fromLooksSg && keyLooksEmail,
      fromEnvInvalidFormat: Boolean(from) && !fromLooksEmail,
    },
    null,
    2,
  ),
);

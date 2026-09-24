"use client";

import { useEffect } from "react";

const FRAGMENT = /^#confirm=([^&#]+)$/;

/**
 * Finishes a "confirm my appointment" link from the reminder email/SMS.
 *
 * GET /api/confirm changes nothing and sends the browser here with the token in
 * the fragment (`/book#confirm=…`), so link-preview fetchers that open the link
 * without running scripts can't confirm a visit. The patient's browser runs
 * this and confirms with a POST — still one tap. Renders nothing: the page
 * looks exactly as it did when the link confirmed on its own, and the address
 * ends on the same `/book?confirm=thanks` / `?confirm=invalid` as before.
 */
export function ConfirmFromLink() {
  useEffect(() => {
    const match = FRAGMENT.exec(window.location.hash);
    if (!match) return;
    let token = "";
    try {
      token = decodeURIComponent(match[1] ?? "").trim();
    } catch {
      token = "";
    }
    // Take the token out of the address bar and history before anything else.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    const finish = (result: "thanks" | "invalid") => {
      window.history.replaceState(null, "", `/book?confirm=${result}`);
    };
    if (!token) {
      finish("invalid");
      return;
    }
    fetch("/api/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        finish(res.ok && data?.ok === true ? "thanks" : "invalid");
      })
      .catch(() => finish("invalid"));
  }, []);

  return null;
}

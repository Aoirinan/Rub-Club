"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GIFT_CARD_ORDER_URL } from "@/lib/constants";

export const DEFAULT_GIFT_CARD_STICKY_LABEL =
  "Give the Gift of Wellness — Buy a Gift Card";

export type GiftCardStickyBannerProps = {
  href?: string;
  label?: string;
  enabled?: boolean;
  /** Changes when admin edits label/url so dismiss resets intentionally. */
  dismissKey?: string;
};

/** Fired on `window` when the banner is dismissed so padding hooks update at once. */
const DISMISS_EVENT = "rub-gift-sticky-dismissed";

function readDismissed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function GiftCardStickyBanner({
  href = GIFT_CARD_ORDER_URL,
  label = DEFAULT_GIFT_CARD_STICKY_LABEL,
  enabled = true,
  dismissKey = "default",
  /** Lift the banner above the mobile call bar (56px) when both are on screen. */
  aboveMobileCallBar = false,
}: GiftCardStickyBannerProps & { aboveMobileCallBar?: boolean }) {
  const storageKey = useMemo(
    () => `rub_gift_sticky_dismissed_${dismissKey}`,
    [dismissKey],
  );
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setHidden(true);
      return;
    }
    try {
      setHidden(localStorage.getItem(storageKey) === "1");
    } catch {
      setHidden(false);
    }
  }, [enabled, storageKey]);

  const onDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
      setHidden(true);
      try {
        window.dispatchEvent(new CustomEvent(DISMISS_EVENT, { detail: storageKey }));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  if (!enabled || hidden) return null;

  const text = label.trim() || DEFAULT_GIFT_CARD_STICKY_LABEL;

  return (
    <div
      role="region"
      aria-label="Gift card promotion"
      className={`fixed left-0 right-0 z-50 flex min-h-[52px] items-stretch bg-[#c0392b] shadow-[0_-4px_20px_rgba(0,0,0,0.2)] ${
        aboveMobileCallBar ? "bottom-14 md:bottom-0" : "bottom-0"
      }`}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center px-4 py-3 pr-12 text-center text-sm font-black uppercase tracking-wide text-white hover:bg-[#0c4a48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base"
      >
        {text}
      </a>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/10 text-lg font-bold leading-none text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Dismiss gift card banner"
      >
        ×
      </button>
    </div>
  );
}

/** Whether the sticky gift bar should reserve bottom padding (enabled and not dismissed). */
export function useGiftCardStickyVisible(props: GiftCardStickyBannerProps): boolean {
  const { enabled = true, dismissKey = "default" } = props;
  const storageKey = useMemo(
    () => `rub_gift_sticky_dismissed_${dismissKey}`,
    [dismissKey],
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    setVisible(!readDismissed(storageKey));

    // React immediately when the banner is dismissed (same tab via the custom
    // event, other tabs via `storage`) instead of waiting for a reload.
    const onDismiss = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (!key || key === storageKey) setVisible(false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setVisible(!readDismissed(storageKey));
    };
    window.addEventListener(DISMISS_EVENT, onDismiss);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DISMISS_EVENT, onDismiss);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, storageKey]);

  return visible;
}

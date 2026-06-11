"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GIFT_CARD_ORDER_URL } from "@/lib/constants";

export const DEFAULT_GIFT_CARD_STICKY_LABEL =
  "Give the Gift of Wellness â€” Buy a Gift Card";

export type GiftCardStickyBannerProps = {
  href?: string;
  label?: string;
  enabled?: boolean;
  /** Changes when admin edits label/url so dismiss resets intentionally. */
  dismissKey?: string;
};

export function GiftCardStickyBanner({
  href = GIFT_CARD_ORDER_URL,
  label = DEFAULT_GIFT_CARD_STICKY_LABEL,
  enabled = true,
  dismissKey = "default",
}: GiftCardStickyBannerProps) {
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
    },
    [storageKey],
  );

  if (!enabled || hidden) return null;

  const text = label.trim() || DEFAULT_GIFT_CARD_STICKY_LABEL;

  return (
    <div
      role="region"
      aria-label="Gift card promotion"
      className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[52px] items-stretch bg-[#015949] shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
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
        Ã—
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
    try {
      setVisible(localStorage.getItem(storageKey) !== "1");
    } catch {
      setVisible(true);
    }
  }, [enabled, storageKey]);

  return visible;
}

import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/constants";
import { SocialIcon } from "@/components/practice/UtilityBar";

/**
 * Site-wide black strip below the header: Facebook + Instagram.
 * CURSOR_PROMPT §2: shows a CMS-editable "Follow us on social media" label
 * (field `social_bar_label`) beside the icons.
 */
export function SiteSocialBar({ label }: { label?: string }) {
  const text = label?.trim();
  return (
    <div className="bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 py-2">
        {text ? (
          <span className="text-[0.9rem] font-bold uppercase tracking-[0.18em] text-white/90">
            {text}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-4">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="focus-ring text-white/90 hover:text-white"
          >
            <SocialIcon platform="facebook" large />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="focus-ring text-white/90 hover:text-white"
          >
            <SocialIcon platform="instagram" large />
          </a>
        </span>
      </div>
    </div>
  );
}

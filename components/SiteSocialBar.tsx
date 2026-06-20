import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/constants";
import { SocialIcon } from "@/components/practice/UtilityBar";

/** Site-wide black strip below the header: Facebook + Instagram only. */
export function SiteSocialBar() {
  return (
    <div className="bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-2">
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

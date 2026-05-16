import { describe, expect, it } from "vitest";
import {
  OWNER_MAX_TOTAL_VIDEOS,
  OWNER_MAX_VIDEOS_PER_DOCTOR,
  OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER,
} from "@/lib/owner-marketing-limits";
import {
  assertCanAddDoctorVideo,
  assertCanAddTestimonialVideo,
  countSitewideOwnerVideos,
} from "@/lib/owner-upload-quota";
import type { SiteOwnerSingleton } from "@/lib/site-owner-config";

const emptyConfig = {
  banner: { enabled: false, showOnHomepage: true, html: "", expiresAt: null },
  specials: {
    massageHtml: "",
    chiroHtml: "",
    generalHtml: "",
    massageImageUrl: "",
    massageImageStoragePath: "",
    chiroImageUrl: "",
    chiroImageStoragePath: "",
    generalImageUrl: "",
    generalImageStoragePath: "",
    modalTitle: "",
    closeLabel: "",
  },
  testimonialVideos: [],
  doctorMedia: [],
  editableCopy: {
    parisChiroPhone: "",
    sulphurChiroPhone: "",
    rubClubMassagePhone: "",
    giftCardOrderUrl: "",
    awardsStripHtml: "",
    footerBlurbHtml: "",
  },
} satisfies SiteOwnerSingleton;

describe("owner-upload-quota", () => {
  it("counts sitewide videos", () => {
    const config: SiteOwnerSingleton = {
      ...emptyConfig,
      testimonialVideos: [
        {
          id: "t1",
          title: "",
          label: "",
          url: "https://example.com/a.mp4",
          createdAt: "",
        },
      ],
      doctorMedia: [
        {
          id: "d1",
          doctorKey: "greg",
          caption: "",
          mediaType: "video",
          url: "https://example.com/b.mp4",
          sortOrder: 0,
        },
        {
          id: "d2",
          doctorKey: "greg",
          caption: "",
          mediaType: "photo",
          url: "https://example.com/c.jpg",
          sortOrder: 1,
        },
      ],
    };
    expect(countSitewideOwnerVideos(config)).toBe(2);
  });

  it("blocks when site total is reached", () => {
    const config: SiteOwnerSingleton = {
      ...emptyConfig,
      testimonialVideos: Array.from({ length: OWNER_MAX_TOTAL_VIDEOS }, (_, i) => ({
        id: `t${i}`,
        title: "",
        label: "",
        url: `https://example.com/${i}.mp4`,
        createdAt: "",
      })),
    };
    expect(() => assertCanAddTestimonialVideo(config, {})).toThrow(/Site video limit/);
  });

  it("blocks per-doctor video cap", () => {
    const config: SiteOwnerSingleton = {
      ...emptyConfig,
      doctorMedia: Array.from({ length: OWNER_MAX_VIDEOS_PER_DOCTOR }, (_, i) => ({
        id: `d${i}`,
        doctorKey: "greg" as const,
        caption: "",
        mediaType: "video" as const,
        url: `https://example.com/${i}.mp4`,
        sortOrder: i,
      })),
    };
    expect(() => assertCanAddDoctorVideo(config, "greg")).toThrow(/Greg Thompson/);
  });

  it("blocks per-massage-member testimonial cap", () => {
    const config: SiteOwnerSingleton = {
      ...emptyConfig,
      testimonialVideos: Array.from({ length: OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER }, (_, i) => ({
        id: `t${i}`,
        title: "",
        label: "",
        massageMemberId: "m1",
        url: `https://example.com/${i}.mp4`,
        createdAt: "",
      })),
    };
    expect(() => assertCanAddTestimonialVideo(config, { massageMemberId: "m1" })).toThrow(/massage therapist/);
  });
});

import {
  OWNER_MAX_TOTAL_VIDEOS,
  OWNER_MAX_VIDEOS_PER_DOCTOR,
  OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER,
} from "@/lib/owner-marketing-limits";
import type { DoctorMediaItem, SiteOwnerSingleton } from "@/lib/site-owner-config";

const DOCTOR_LABEL: Record<DoctorMediaItem["doctorKey"], string> = {
  greg: "Dr. Greg Thompson",
  sean: "Dr. Sean Welborn",
  brandy: "Dr. Brandy Collins",
};

export type OwnerVideoQuotaSnapshot = {
  total: number;
  maxTotal: number;
  perDoctor: Record<DoctorMediaItem["doctorKey"], { count: number; max: number }>;
  perMassageMember: Record<string, { count: number; max: number }>;
};

export function countSitewideOwnerVideos(config: SiteOwnerSingleton): number {
  const doctorVideos = config.doctorMedia.filter((m) => m.mediaType === "video").length;
  return config.testimonialVideos.length + doctorVideos;
}

export function countDoctorVideos(
  config: SiteOwnerSingleton,
  doctorKey: DoctorMediaItem["doctorKey"],
): number {
  return config.doctorMedia.filter((m) => m.doctorKey === doctorKey && m.mediaType === "video").length;
}

export function countMassageMemberTestimonialVideos(config: SiteOwnerSingleton, massageMemberId: string): number {
  return config.testimonialVideos.filter((v) => v.massageMemberId === massageMemberId).length;
}

export function buildOwnerVideoQuotaSnapshot(config: SiteOwnerSingleton): OwnerVideoQuotaSnapshot {
  const perDoctor = {
    greg: { count: countDoctorVideos(config, "greg"), max: OWNER_MAX_VIDEOS_PER_DOCTOR },
    sean: { count: countDoctorVideos(config, "sean"), max: OWNER_MAX_VIDEOS_PER_DOCTOR },
    brandy: { count: countDoctorVideos(config, "brandy"), max: OWNER_MAX_VIDEOS_PER_DOCTOR },
  };
  const perMassageMember: Record<string, { count: number; max: number }> = {};
  for (const v of config.testimonialVideos) {
    const id = v.massageMemberId?.trim();
    if (!id) continue;
    if (!perMassageMember[id]) {
      perMassageMember[id] = { count: 0, max: OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER };
    }
    perMassageMember[id].count += 1;
  }
  return {
    total: countSitewideOwnerVideos(config),
    maxTotal: OWNER_MAX_TOTAL_VIDEOS,
    perDoctor,
    perMassageMember,
  };
}

export function assertCanAddTestimonialVideo(
  config: SiteOwnerSingleton,
  opts: { massageMemberId?: string | null },
): void {
  if (countSitewideOwnerVideos(config) >= OWNER_MAX_TOTAL_VIDEOS) {
    throw new Error(
      `Site video limit reached (max ${OWNER_MAX_TOTAL_VIDEOS} total across testimonials and doctor media). Delete a video first.`,
    );
  }
  const mid = opts.massageMemberId?.trim();
  if (mid && countMassageMemberTestimonialVideos(config, mid) >= OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER) {
    throw new Error(
      `This massage therapist already has the maximum testimonial videos (max ${OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER}). Delete one or choose another therapist.`,
    );
  }
}

export function assertCanAddDoctorVideo(
  config: SiteOwnerSingleton,
  doctorKey: DoctorMediaItem["doctorKey"],
): void {
  if (countSitewideOwnerVideos(config) >= OWNER_MAX_TOTAL_VIDEOS) {
    throw new Error(
      `Site video limit reached (max ${OWNER_MAX_TOTAL_VIDEOS} total across testimonials and doctor media). Delete a video first.`,
    );
  }
  if (countDoctorVideos(config, doctorKey) >= OWNER_MAX_VIDEOS_PER_DOCTOR) {
    const name = DOCTOR_LABEL[doctorKey] ?? doctorKey;
    throw new Error(`${name} already has the maximum videos (max ${OWNER_MAX_VIDEOS_PER_DOCTOR}). Delete one first.`);
  }
}

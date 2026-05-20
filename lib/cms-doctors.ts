import { getContentMany } from "@/lib/cms";
import { IMAGES } from "@/lib/home-images";
import { DOCTORS } from "@/lib/home-verbatim";

export const DOCTOR_CMS_KEYS = [
  "doctor_greg_bio",
  "doctor_greg_photo",
  "doctor_greg_video",
  "doctor_sean_bio",
  "doctor_sean_photo",
  "doctor_sean_video",
  "doctor_brandy_bio",
  "doctor_brandy_photo",
  "doctor_brandy_video",
] as const;

export type DoctorCmsEntry = {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  videoUrl: string | null;
  videoFile: string | null;
};

function resolveDoctorVideo(
  raw: string,
  fallbackFile: string | null,
): { videoUrl: string | null; videoFile: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { videoUrl: null, videoFile: fallbackFile };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { videoUrl: trimmed, videoFile: null };
  }
  const file = trimmed.replace(/^\/+/, "").replace(/^media\/doctors\//, "");
  return { videoUrl: null, videoFile: file || fallbackFile };
}

export async function getDoctorsForMarketing(
  prefetched?: Record<string, string>,
): Promise<DoctorCmsEntry[]> {
  const c = prefetched ?? (await getContentMany([...DOCTOR_CMS_KEYS]));
  const specs = [
    { member: DOCTORS[0], bio: "doctor_greg_bio", photo: "doctor_greg_photo", video: "doctor_greg_video" },
    { member: DOCTORS[1], bio: "doctor_sean_bio", photo: "doctor_sean_photo", video: "doctor_sean_video" },
    { member: DOCTORS[2], bio: "doctor_brandy_bio", photo: "doctor_brandy_photo", video: "doctor_brandy_video" },
  ] as const;

  return specs.map(({ member, bio, photo, video }) => {
    const { videoUrl, videoFile } = resolveDoctorVideo(c[video] ?? "", member.videoFile);
    return {
      name: member.name,
      role: member.role,
      bio: c[bio]?.trim() || member.bio,
      imageSrc: c[photo]?.trim() || IMAGES[member.imageKey],
      videoUrl,
      videoFile,
    };
  });
}

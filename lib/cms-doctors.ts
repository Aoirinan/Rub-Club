import { getContentMany } from "@/lib/cms";
import { IMAGES } from "@/lib/home-images";
import { DOCTORS } from "@/lib/home-verbatim";
import type { DoctorMediaItem } from "@/lib/site-owner-config";

export const DOCTOR_CMS_KEYS = [
  "doctor_greg_name",
  "doctor_greg_role",
  "doctor_greg_bio",
  "doctor_greg_photo",
  "doctor_greg_video",
  "doctor_sean_name",
  "doctor_sean_role",
  "doctor_sean_bio",
  "doctor_sean_photo",
  "doctor_sean_video",
  "doctor_brandy_name",
  "doctor_brandy_role",
  "doctor_brandy_bio",
  "doctor_brandy_photo",
  "doctor_brandy_video",
] as const;

export type DoctorCmsEntry = {
  doctorKey: DoctorMediaItem["doctorKey"];
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  videoUrl: string | null;
  videoFile: string | null;
  actionVideos: { src: string; caption: string }[];
};

function actionVideosForDoctor(
  doctorKey: DoctorMediaItem["doctorKey"],
  doctorMedia: DoctorMediaItem[],
): { src: string; caption: string }[] {
  return doctorMedia
    .filter((m) => m.doctorKey === doctorKey && m.mediaType === "video")
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((m) => ({ src: m.url, caption: m.caption }));
}

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
  doctorMedia: DoctorMediaItem[] = [],
): Promise<DoctorCmsEntry[]> {
  const c = prefetched ?? (await getContentMany([...DOCTOR_CMS_KEYS]));
  const specs = [
    {
      doctorKey: "greg" as const,
      member: DOCTORS[0],
      name: "doctor_greg_name",
      role: "doctor_greg_role",
      bio: "doctor_greg_bio",
      photo: "doctor_greg_photo",
      video: "doctor_greg_video",
    },
    {
      doctorKey: "sean" as const,
      member: DOCTORS[1],
      name: "doctor_sean_name",
      role: "doctor_sean_role",
      bio: "doctor_sean_bio",
      photo: "doctor_sean_photo",
      video: "doctor_sean_video",
    },
    {
      doctorKey: "brandy" as const,
      member: DOCTORS[2],
      name: "doctor_brandy_name",
      role: "doctor_brandy_role",
      bio: "doctor_brandy_bio",
      photo: "doctor_brandy_photo",
      video: "doctor_brandy_video",
    },
  ] as const;

  return specs.map(({ doctorKey, member, name, role, bio, photo, video }) => {
    const { videoUrl, videoFile } = resolveDoctorVideo(c[video] ?? "", member.videoFile);
    return {
      doctorKey,
      name: c[name]?.trim() || member.name,
      role: c[role]?.trim() || member.role,
      bio: c[bio]?.trim() || member.bio,
      imageSrc: c[photo]?.trim() || IMAGES[member.imageKey],
      videoUrl,
      videoFile,
      actionVideos: actionVideosForDoctor(doctorKey, doctorMedia),
    };
  });
}

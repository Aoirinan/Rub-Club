import { readFile } from "fs/promises";
import path from "path";

export type DoctorMediaJsonItem = {
  id: string;
  doctor: "Greg" | "Sean" | "Brandy";
  caption: string;
  type: "photo" | "video";
  filename: string;
  order: number;
};

function isDoctorMediaItem(x: unknown): x is DoctorMediaJsonItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    (o.doctor === "Greg" || o.doctor === "Sean" || o.doctor === "Brandy") &&
    typeof o.caption === "string" &&
    (o.type === "photo" || o.type === "video") &&
    typeof o.filename === "string" &&
    typeof o.order === "number"
  );
}

/** Owner-managed list for the chiropractic page; empty or missing file shows a placeholder. */
export async function loadDoctorMediaFromJson(): Promise<DoctorMediaJsonItem[]> {
  try {
    const fp = path.join(process.cwd(), "data", "doctor_media.json");
    const raw = await readFile(fp, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDoctorMediaItem).sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export const DOCTOR_MEDIA_FULL_NAME: Record<DoctorMediaJsonItem["doctor"], string> = {
  Greg: "Greg Thompson",
  Sean: "Sean Welborn",
  Brandy: "Brandy Collins",
};

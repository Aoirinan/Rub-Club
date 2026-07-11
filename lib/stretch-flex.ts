/**
 * Stretch & Flex Rehab per-exercise photos (CURSOR_PROMPT §7).
 *
 * Each exercise/movement gets a name, verbatim instructions, and an image
 * gallery (url + alt + caption). Stored in Firestore `stretch_flex_exercises`;
 * images upload to Firebase Storage via the existing upload flow. Where no
 * photo exists, the gallery stays empty (Sean will shoot them).
 *
 * The five default movements come from the verbatim Stretch & Flex Rehab copy
 * ("attended stretching, aerobic exercise, CORE strengthening, resistance
 * exercise and instructions for at home stretching").
 */
import { getFirestore } from "@/lib/firebase-admin";

export const STRETCH_FLEX_COLLECTION = "stretch_flex_exercises";

export type StretchFlexImage = { url: string; alt: string; caption: string };

export type StretchFlexExercise = {
  id: string;
  name: string;
  /** VERBATIM instructions (empty until Sean writes them). */
  instructions: string;
  images: StretchFlexImage[];
  order: number;
};

export const DEFAULT_STRETCH_FLEX_EXERCISES: ReadonlyArray<{
  id: string;
  name: string;
  order: number;
}> = [
  { id: "attended-stretching", name: "Attended Stretching", order: 10 },
  { id: "aerobic-exercise", name: "Aerobic Exercise", order: 20 },
  { id: "core-strengthening", name: "CORE Strengthening", order: 30 },
  { id: "resistance-exercise", name: "Resistance Exercise", order: 40 },
  { id: "at-home-stretching", name: "At-Home Stretching", order: 50 },
];

function parseImages(v: unknown): StretchFlexImage[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((img) => ({
      url: typeof img?.url === "string" ? img.url : "",
      alt: typeof img?.alt === "string" ? img.alt : "",
      caption: typeof img?.caption === "string" ? img.caption : "",
    }))
    .filter((img) => img.url);
}

function toExercise(id: string, data: FirebaseFirestore.DocumentData): StretchFlexExercise {
  return {
    id,
    name: typeof data.name === "string" ? data.name : id,
    instructions: typeof data.instructions === "string" ? data.instructions : "",
    images: parseImages(data.images),
    order: typeof data.order === "number" ? data.order : 0,
  };
}

/**
 * All exercises. Reads Firestore; if empty, returns the default movement list
 * with empty galleries so the page + admin have rows to work with.
 */
export async function getStretchFlexExercises(): Promise<StretchFlexExercise[]> {
  try {
    const snap = await getFirestore().collection(STRETCH_FLEX_COLLECTION).get();
    if (!snap.empty) {
      return snap.docs
        .map((d) => toExercise(d.id, d.data()))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_STRETCH_FLEX_EXERCISES.map((e) => ({
    id: e.id,
    name: e.name,
    instructions: "",
    images: [],
    order: e.order,
  }));
}

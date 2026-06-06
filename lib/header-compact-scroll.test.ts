import { describe, expect, it } from "vitest";
import {
  COMPACT_ENTER_Y,
  COMPACT_EXIT_Y,
  resolveHeaderCompact,
} from "@/lib/header-compact-scroll";

describe("resolveHeaderCompact", () => {
  it("keeps expanded at the top of the page", () => {
    expect(resolveHeaderCompact(false, 0)).toBe(false);
    expect(resolveHeaderCompact(false, COMPACT_ENTER_Y - 1)).toBe(false);
  });

  it("enters compact at or above COMPACT_ENTER_Y", () => {
    expect(resolveHeaderCompact(false, COMPACT_ENTER_Y)).toBe(true);
    expect(resolveHeaderCompact(false, COMPACT_ENTER_Y + 40)).toBe(true);
  });

  it("stays compact in the middle band between exit and enter thresholds", () => {
    expect(resolveHeaderCompact(true, 60)).toBe(true);
    expect(resolveHeaderCompact(true, COMPACT_EXIT_Y + 1)).toBe(true);
  });

  it("exits compact at or below COMPACT_EXIT_Y", () => {
    expect(resolveHeaderCompact(true, COMPACT_EXIT_Y)).toBe(false);
    expect(resolveHeaderCompact(true, 0)).toBe(false);
  });

  it("does not flip-flop through a typical scroll sequence", () => {
    let compact = false;

    compact = resolveHeaderCompact(compact, 48);
    expect(compact).toBe(false);

    compact = resolveHeaderCompact(compact, 112);
    expect(compact).toBe(true);

    compact = resolveHeaderCompact(compact, 60);
    expect(compact).toBe(true);

    compact = resolveHeaderCompact(compact, COMPACT_EXIT_Y);
    expect(compact).toBe(false);
  });
});

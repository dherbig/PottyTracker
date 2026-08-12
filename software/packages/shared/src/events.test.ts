import { describe, expect, it } from "vitest";
import { applyOptimisticState, describeEvent } from "./events.js";
import type { PottyState } from "./types.js";

describe("describeEvent", () => {
  it("labels potty events", () => {
    expect(
      describeEvent({
        id: "1",
        dogId: "dog-1",
        type: "potty",
        timestamp: "2026-08-12T10:00:00Z",
        insertedAt: "2026-08-12T10:00:00Z",
        hadPoop: false,
      }),
    ).toBe("Out");

    expect(
      describeEvent({
        id: "2",
        dogId: "dog-1",
        type: "potty",
        timestamp: "2026-08-12T10:00:00Z",
        insertedAt: "2026-08-12T10:00:00Z",
        hadPoop: true,
      }),
    ).toBe("Out + poop");
  });

  it("labels clear events", () => {
    expect(
      describeEvent({
        id: "3",
        dogId: "dog-1",
        type: "clear",
        timestamp: "2026-08-12T10:00:00Z",
        insertedAt: "2026-08-12T10:00:00Z",
      }),
    ).toBe("Cleared");
  });
});

describe("applyOptimisticState", () => {
  const dogId = "dog-1";
  const current: PottyState = {
    dogId,
    lastEvent: null,
    lastOutAt: "2026-08-12T10:00:00Z",
    lastPoopAt: "2026-08-12T09:00:00Z",
    isCleared: false,
  };

  it("applies a new out event immediately", () => {
    const next = applyOptimisticState(current, dogId, {
      type: "log",
      hadPoop: false,
      timestamp: "2026-08-12T12:00:00Z",
    });

    expect(next.lastOutAt).toBe("2026-08-12T12:00:00Z");
    expect(next.lastPoopAt).toBe("2026-08-12T09:00:00Z");
    expect(next.isCleared).toBe(false);
  });

  it("applies poop to both lastOutAt and lastPoopAt", () => {
    const next = applyOptimisticState(current, dogId, {
      type: "log",
      hadPoop: true,
      timestamp: "2026-08-12T12:00:00Z",
    });

    expect(next.lastPoopAt).toBe("2026-08-12T12:00:00Z");
  });

  it("does not change display for older backdated events", () => {
    const next = applyOptimisticState(current, dogId, {
      type: "log",
      hadPoop: false,
      timestamp: "2026-08-12T08:00:00Z",
    });

    expect(next).toBe(current);
  });

  it("clears the display optimistically", () => {
    const next = applyOptimisticState(current, dogId, { type: "clear" });

    expect(next.isCleared).toBe(true);
    expect(next.lastOutAt).toBeNull();
  });
});

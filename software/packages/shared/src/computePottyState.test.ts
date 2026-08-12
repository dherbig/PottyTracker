import { describe, expect, it } from "vitest";
import { computePottyState } from "./computePottyState.js";
import type { TrackerEvent } from "./types.js";

const DOG_ID = "dog-1";

function potty(
  id: string,
  timestamp: string,
  insertedAt: string,
  hadPoop: boolean,
): TrackerEvent {
  return {
    id,
    dogId: DOG_ID,
    type: "potty",
    timestamp,
    insertedAt,
    hadPoop,
  };
}

function clear(id: string, insertedAt: string): TrackerEvent {
  return {
    id,
    dogId: DOG_ID,
    type: "clear",
    timestamp: insertedAt,
    insertedAt,
  };
}

describe("computePottyState", () => {
  it("returns empty state when there are no events", () => {
    expect(computePottyState(DOG_ID, [])).toEqual({
      dogId: DOG_ID,
      lastEvent: null,
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: false,
    });
  });

  it("returns latest potty outing by event timestamp", () => {
    const events = [
      potty("1", "2026-08-12T10:00:00Z", "2026-08-12T10:00:01Z", false),
      potty("2", "2026-08-12T12:00:00Z", "2026-08-12T12:00:01Z", true),
    ];

    const state = computePottyState(DOG_ID, events);
    expect(state.lastOutAt).toBe("2026-08-12T12:00:00Z");
    expect(state.lastPoopAt).toBe("2026-08-12T12:00:00Z");
    expect(state.isCleared).toBe(false);
  });

  it("uses event timestamp not insertion order for lastOutAt", () => {
    const events = [
      potty("1", "2026-08-12T12:00:00Z", "2026-08-12T12:05:00Z", false),
      potty("2", "2026-08-12T10:00:00Z", "2026-08-12T12:10:00Z", false),
    ];

    const state = computePottyState(DOG_ID, events);
    expect(state.lastOutAt).toBe("2026-08-12T12:00:00Z");
  });

  it("returns cleared state when the most recent event is clear", () => {
    const events = [
      potty("1", "2026-08-12T10:00:00Z", "2026-08-12T10:00:01Z", false),
      clear("2", "2026-08-12T11:00:00Z"),
    ];

    expect(computePottyState(DOG_ID, events)).toEqual({
      dogId: DOG_ID,
      lastEvent: null,
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: true,
    });
  });

  it("ignores potty events before the latest clear by insertion order", () => {
    const events = [
      potty("1", "2026-08-12T08:00:00Z", "2026-08-12T08:00:01Z", false),
      clear("2", "2026-08-12T09:00:00Z"),
      potty("3", "2026-08-12T10:00:00Z", "2026-08-12T10:00:01Z", true),
    ];

    const state = computePottyState(DOG_ID, events);
    expect(state.isCleared).toBe(false);
    expect(state.lastOutAt).toBe("2026-08-12T10:00:00Z");
    expect(state.lastPoopAt).toBe("2026-08-12T10:00:00Z");
  });

  it("tracks last poop separately from last out", () => {
    const events = [
      potty("1", "2026-08-12T10:00:00Z", "2026-08-12T10:00:01Z", true),
      potty("2", "2026-08-12T12:00:00Z", "2026-08-12T12:00:01Z", false),
    ];

    const state = computePottyState(DOG_ID, events);
    expect(state.lastOutAt).toBe("2026-08-12T12:00:00Z");
    expect(state.lastPoopAt).toBe("2026-08-12T10:00:00Z");
  });
});

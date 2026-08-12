import type { PottyEvent, PottyState, TrackerEvent } from "./types.js";

export function describeEvent(event: TrackerEvent): string {
  if (event.type === "clear") {
    return "Cleared";
  }

  return event.hadPoop ? "Out + poop" : "Out";
}

export type OptimisticAction =
  | { type: "log"; hadPoop: boolean; timestamp: string }
  | { type: "clear" };

export function applyOptimisticState(
  current: PottyState | null,
  dogId: string,
  action: OptimisticAction,
): PottyState {
  if (action.type === "clear") {
    return {
      dogId,
      lastEvent: null,
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: true,
    };
  }

  if (
    current?.lastOutAt &&
    action.timestamp.localeCompare(current.lastOutAt) < 0
  ) {
    return current;
  }

  const lastEvent: PottyEvent = {
    id: "optimistic",
    dogId,
    type: "potty",
    timestamp: action.timestamp,
    insertedAt: action.timestamp,
    hadPoop: action.hadPoop,
  };

  return {
    dogId,
    lastEvent,
    lastOutAt: action.timestamp,
    lastPoopAt: action.hadPoop
      ? action.timestamp
      : (current?.lastPoopAt ?? null),
    isCleared: false,
  };
}

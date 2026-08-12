import type { PottyEvent, PottyState, TrackerEvent } from "./types.js";

function compareInsertion(a: TrackerEvent, b: TrackerEvent): number {
  return a.insertedAt.localeCompare(b.insertedAt);
}

function compareTimestamp(a: PottyEvent, b: PottyEvent): number {
  return a.timestamp.localeCompare(b.timestamp);
}

export function computePottyState(
  dogId: string,
  events: TrackerEvent[],
): PottyState {
  if (events.length === 0) {
    return {
      dogId,
      lastEvent: null,
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: false,
    };
  }

  const sortedByInsertion = [...events].sort(compareInsertion);
  const mostRecent = sortedByInsertion[sortedByInsertion.length - 1];

  if (mostRecent.type === "clear") {
    return {
      dogId,
      lastEvent: null,
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: true,
    };
  }

  const latestClearIndex = sortedByInsertion.findLastIndex(
    (event) => event.type === "clear",
  );
  const pottyEvents = sortedByInsertion
    .slice(latestClearIndex + 1)
    .filter((event): event is PottyEvent => event.type === "potty");

  const lastOut = [...pottyEvents].sort(compareTimestamp).at(-1)!;
  const poopEvents = pottyEvents.filter((event) => event.hadPoop);
  const lastPoop =
    poopEvents.length > 0
      ? [...poopEvents].sort(compareTimestamp).at(-1)!
      : null;

  return {
    dogId,
    lastEvent: lastOut,
    lastOutAt: lastOut.timestamp,
    lastPoopAt: lastPoop?.timestamp ?? null,
    isCleared: false,
  };
}

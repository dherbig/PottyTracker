export interface Dog {
  id: string;
  name: string;
  createdAt: string;
}

export interface PottyEvent {
  id: string;
  dogId: string;
  type: "potty";
  timestamp: string;
  insertedAt: string;
  hadPoop: boolean;
}

export interface ClearEvent {
  id: string;
  dogId: string;
  type: "clear";
  timestamp: string;
  insertedAt: string;
}

export type TrackerEvent = PottyEvent | ClearEvent;

export interface PottyState {
  dogId: string;
  lastEvent: PottyEvent | null;
  lastOutAt: string | null;
  lastPoopAt: string | null;
  isCleared: boolean;
}

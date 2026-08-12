import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { nowInstantIso } from "@potty/shared";
import type { Dog, TrackerEvent } from "@potty/shared";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dogs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  dog_id TEXT NOT NULL REFERENCES dogs(id),
  type TEXT NOT NULL CHECK (type IN ('potty', 'clear')),
  timestamp TEXT NOT NULL,
  inserted_at TEXT NOT NULL,
  had_poop INTEGER
);
`;

export type PottyDatabase = Database.Database;

export function createDatabase(path: string): PottyDatabase {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  seedDefaultDog(db);
  return db;
}

function seedDefaultDog(db: PottyDatabase): void {
  const existing = db
    .prepare("SELECT COUNT(*) as count FROM dogs")
    .get() as { count: number };

  if (existing.count > 0) {
    return;
  }

  db.prepare(
    "INSERT INTO dogs (id, name, created_at) VALUES (?, ?, ?)",
  ).run(randomUUID(), "Default", nowInstantIso());
}

interface DogRow {
  id: string;
  name: string;
  created_at: string;
}

interface EventRow {
  id: string;
  dog_id: string;
  type: "potty" | "clear";
  timestamp: string;
  inserted_at: string;
  had_poop: number | null;
}

export function listDogs(db: PottyDatabase): Dog[] {
  const rows = db
    .prepare("SELECT id, name, created_at FROM dogs ORDER BY created_at ASC")
    .all() as DogRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));
}

export function createDog(db: PottyDatabase, name: string): Dog {
  const dog: Dog = {
    id: randomUUID(),
    name,
    createdAt: nowInstantIso(),
  };

  db.prepare(
    "INSERT INTO dogs (id, name, created_at) VALUES (?, ?, ?)",
  ).run(dog.id, dog.name, dog.createdAt);

  return dog;
}

export function dogExists(db: PottyDatabase, dogId: string): boolean {
  const row = db
    .prepare("SELECT id FROM dogs WHERE id = ?")
    .get(dogId) as { id: string } | undefined;
  return row !== undefined;
}

export function listEventsForDog(
  db: PottyDatabase,
  dogId: string,
): TrackerEvent[] {
  const rows = db
    .prepare(
      `SELECT id, dog_id, type, timestamp, inserted_at, had_poop
       FROM events WHERE dog_id = ? ORDER BY inserted_at ASC`,
    )
    .all(dogId) as EventRow[];

  return rows.map(mapEventRow);
}

export function listRecentEventsForDog(
  db: PottyDatabase,
  dogId: string,
  limit: number,
): TrackerEvent[] {
  const rows = db
    .prepare(
      `SELECT id, dog_id, type, timestamp, inserted_at, had_poop
       FROM events WHERE dog_id = ? ORDER BY timestamp DESC, inserted_at DESC LIMIT ?`,
    )
    .all(dogId, limit) as EventRow[];

  return rows.map(mapEventRow);
}

export function insertPottyEvent(
  db: PottyDatabase,
  dogId: string,
  timestamp: string,
  hadPoop: boolean,
): TrackerEvent {
  const insertedAt = nowInstantIso();
  const event: TrackerEvent = {
    id: randomUUID(),
    dogId,
    type: "potty",
    timestamp,
    insertedAt,
    hadPoop,
  };

  db.prepare(
    `INSERT INTO events (id, dog_id, type, timestamp, inserted_at, had_poop)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    event.id,
    event.dogId,
    event.type,
    event.timestamp,
    event.insertedAt,
    hadPoop ? 1 : 0,
  );

  return event;
}

export function insertClearEvent(
  db: PottyDatabase,
  dogId: string,
): TrackerEvent {
  const insertedAt = nowInstantIso();
  const event: TrackerEvent = {
    id: randomUUID(),
    dogId,
    type: "clear",
    timestamp: insertedAt,
    insertedAt,
  };

  db.prepare(
    `INSERT INTO events (id, dog_id, type, timestamp, inserted_at, had_poop)
     VALUES (?, ?, ?, ?, ?, NULL)`,
  ).run(
    event.id,
    event.dogId,
    event.type,
    event.timestamp,
    event.insertedAt,
  );

  return event;
}

function mapEventRow(row: EventRow): TrackerEvent {
  if (row.type === "clear") {
    return {
      id: row.id,
      dogId: row.dog_id,
      type: "clear",
      timestamp: row.timestamp,
      insertedAt: row.inserted_at,
    };
  }

  return {
    id: row.id,
    dogId: row.dog_id,
    type: "potty",
    timestamp: row.timestamp,
    insertedAt: row.inserted_at,
    hadPoop: row.had_poop === 1,
  };
}

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  computePottyState,
  nowInstantIso,
  validateEventTimestamp,
} from "@potty/shared";
import type { PottyDatabase } from "./db/database.js";
import {
  createDog,
  dogExists,
  insertClearEvent,
  insertPottyEvent,
  listDogs,
  listEventsForDog,
} from "./db/database.js";

export interface AppOptions {
  db: PottyDatabase;
  apiKey: string;
  staticRoot?: string;
}

export function createApp({ db, apiKey, staticRoot }: AppOptions): Hono {
  const app = new Hono();

  app.use("/api/*", async (c, next) => {
    const providedKey = c.req.header("X-API-Key");
    if (!providedKey || providedKey !== apiKey) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }
    await next();
  });

  app.get("/api/dogs", (c) => c.json(listDogs(db)));

  app.post("/api/dogs", async (c) => {
    const body = await c.req.json<{ name?: string }>();
    if (!body.name?.trim()) {
      throw new HTTPException(400, { message: "name is required" });
    }
    const dog = createDog(db, body.name.trim());
    return c.json(dog, 201);
  });

  app.get("/api/dogs/:dogId/state", (c) => {
    const dogId = c.req.param("dogId");
    if (!dogExists(db, dogId)) {
      throw new HTTPException(404, { message: "Dog not found" });
    }
    const events = listEventsForDog(db, dogId);
    return c.json(computePottyState(dogId, events));
  });

  app.post("/api/dogs/:dogId/events", async (c) => {
    const dogId = c.req.param("dogId");
    if (!dogExists(db, dogId)) {
      throw new HTTPException(404, { message: "Dog not found" });
    }

    const body = await c.req.json<{ hadPoop?: boolean; timestamp?: string }>();
    if (typeof body.hadPoop !== "boolean") {
      throw new HTTPException(400, { message: "hadPoop must be a boolean" });
    }

    let timestamp: string;
    try {
      timestamp = body.timestamp
        ? validateEventTimestamp(body.timestamp)
        : nowInstantIso();
    } catch {
      throw new HTTPException(400, { message: "Invalid or future timestamp" });
    }

    insertPottyEvent(db, dogId, timestamp, body.hadPoop);
    const events = listEventsForDog(db, dogId);
    return c.json(computePottyState(dogId, events), 201);
  });

  app.post("/api/dogs/:dogId/clear", (c) => {
    const dogId = c.req.param("dogId");
    if (!dogExists(db, dogId)) {
      throw new HTTPException(404, { message: "Dog not found" });
    }

    insertClearEvent(db, dogId);
    const events = listEventsForDog(db, dogId);
    return c.json(computePottyState(dogId, events));
  });

  if (staticRoot) {
    app.use("/*", serveStatic({ root: staticRoot }));
    app.get("*", serveStatic({ root: staticRoot, path: "index.html" }));
  }

  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  });

  return app;
}

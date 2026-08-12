import "temporal-polyfill/global";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDatabase } from "./db/database.js";

const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.API_KEY ?? "dev-api-key";
const dbPath = process.env.DB_PATH ?? "data/potty.db";
const staticRoot = process.env.STATIC_ROOT;

const db = createDatabase(dbPath);
const app = createApp({ db, apiKey, staticRoot });

console.log(`Potty Tracker API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

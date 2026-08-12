import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { createApp } from "./app.js";
import { createDatabase } from "./db/database.js";

const API_KEY = "test-api-key";

function authHeaders(): HeadersInit {
  return { "X-API-Key": API_KEY };
}

describe("Potty Tracker API", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    const db = createDatabase(":memory:");
    app = createApp({ db, apiKey: API_KEY });
  });

  it("rejects requests without API key", async () => {
    const response = await app.request("/api/dogs");
    expect(response.status).toBe(401);
  });

  it("lists seeded default dog", async () => {
    const response = await app.request("/api/dogs", {
      headers: authHeaders(),
    });
    expect(response.status).toBe(200);
    const dogs = await response.json();
    expect(dogs).toHaveLength(1);
    expect(dogs[0].name).toBe("Default");
  });

  it("creates a dog", async () => {
    const response = await app.request("/api/dogs", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rex" }),
    });
    expect(response.status).toBe(201);
    const dog = await response.json();
    expect(dog.name).toBe("Rex");
  });

  it("returns empty state for a new dog", async () => {
    const createResponse = await app.request("/api/dogs", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: "NewDog" }),
    });
    const dog = await createResponse.json();

    const response = await app.request(`/api/dogs/${dog.id}/state`, {
      headers: authHeaders(),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      dogId: dog.id,
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: false,
    });
  });

  it("logs an out event and returns updated state", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    const response = await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ hadPoop: false }),
    });

    expect(response.status).toBe(201);
    const state = await response.json();
    expect(state.lastOutAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(state.lastPoopAt).toBeNull();
    expect(state.isCleared).toBe(false);
  });

  it("logs a poop event with hadPoop true", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    const response = await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ hadPoop: true }),
    });

    const state = await response.json();
    expect(state.lastPoopAt).toBe(state.lastOutAt);
  });

  it("accepts a backdated timestamp", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;
    const timestamp = "2026-08-12T08:00:00Z";

    const response = await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ hadPoop: false, timestamp }),
    });

    expect(response.status).toBe(201);
    const state = await response.json();
    expect(state.lastOutAt).toBe(timestamp);
  });

  it("rejects a future timestamp", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    const response = await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        hadPoop: false,
        timestamp: "2099-01-01T00:00:00Z",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("clears state for a dog", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ hadPoop: false }),
    });

    const response = await app.request(`/api/dogs/${dogId}/clear`, {
      method: "POST",
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    const state = await response.json();
    expect(state).toMatchObject({
      lastOutAt: null,
      lastPoopAt: null,
      isCleared: true,
    });
  });

  it("returns 404 for unknown dog", async () => {
    const response = await app.request("/api/dogs/missing-dog/state", {
      headers: authHeaders(),
    });
    expect(response.status).toBe(404);
  });

  it("rejects creating a dog without a name", async () => {
    const response = await app.request("/api/dogs", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: "  " }),
    });
    expect(response.status).toBe(400);
  });

  it("rejects events without hadPoop", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    const response = await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
  });

  it("returns health without authentication", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns recent events newest-first", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        hadPoop: false,
        timestamp: "2026-08-12T08:00:00Z",
      }),
    });

    await app.request(`/api/dogs/${dogId}/events`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        hadPoop: true,
        timestamp: "2026-08-12T10:00:00Z",
      }),
    });

    const response = await app.request(
      `/api/dogs/${dogId}/events?limit=10`,
      { headers: authHeaders() },
    );

    expect(response.status).toBe(200);
    const events = await response.json();
    expect(events).toHaveLength(2);
    expect(events[0].timestamp).toBe("2026-08-12T10:00:00Z");
    expect(events[1].timestamp).toBe("2026-08-12T08:00:00Z");
  });

  it("returns 404 when listing events for unknown dog", async () => {
    const response = await app.request("/api/dogs/missing-dog/events", {
      headers: authHeaders(),
    });
    expect(response.status).toBe(404);
  });

  it("returns 404 when clearing unknown dog", async () => {
    const response = await app.request("/api/dogs/missing-dog/clear", {
      method: "POST",
      headers: authHeaders(),
    });
    expect(response.status).toBe(404);
  });

  it("respects limit query and caps at 100", async () => {
    const dogs = await (
      await app.request("/api/dogs", { headers: authHeaders() })
    ).json();
    const dogId = dogs[0].id;

    for (let index = 0; index < 3; index += 1) {
      await app.request(`/api/dogs/${dogId}/events`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ hadPoop: false }),
      });
    }

    const capped = await app.request(
      `/api/dogs/${dogId}/events?limit=500`,
      { headers: authHeaders() },
    );
    expect((await capped.json()).length).toBeLessThanOrEqual(100);

    const limited = await app.request(
      `/api/dogs/${dogId}/events?limit=2`,
      { headers: authHeaders() },
    );
    expect((await limited.json())).toHaveLength(2);

    const fallback = await app.request(
      `/api/dogs/${dogId}/events?limit=0`,
      { headers: authHeaders() },
    );
    expect((await fallback.json()).length).toBeGreaterThan(2);
  });

  it("returns 500 for unexpected errors", async () => {
    const response = await app.request("/api/dogs", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});

describe("Potty Tracker API static files", () => {
  it("serves the PWA shell when staticRoot is configured", async () => {
    const staticRoot = mkdtempSync(join(tmpdir(), "potty-static-"));
    writeFileSync(join(staticRoot, "index.html"), "<html>Potty</html>");

    const db = createDatabase(":memory:");
    const app = createApp({ db, apiKey: API_KEY, staticRoot });

    const response = await app.request("/");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Potty");
  });
});

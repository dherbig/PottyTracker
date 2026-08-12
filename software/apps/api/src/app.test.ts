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
});

import type { Dog, PottyState } from "./types.js";

export interface ApiClientOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export interface CreateEventInput {
  hadPoop: boolean;
  timestamp?: string;
}

export function createApiClient({
  baseUrl,
  apiKey,
  fetchImpl = fetch,
}: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || response.statusText);
    }

    return response.json() as Promise<T>;
  }

  return {
    listDogs(): Promise<Dog[]> {
      return request("/api/dogs");
    },
    getState(dogId: string): Promise<PottyState> {
      return request(`/api/dogs/${dogId}/state`);
    },
    logEvent(dogId: string, input: CreateEventInput): Promise<PottyState> {
      return request(`/api/dogs/${dogId}/events`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    clear(dogId: string): Promise<PottyState> {
      return request(`/api/dogs/${dogId}/clear`, { method: "POST" });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

import { describe, expect, it } from "vitest";
import { loadWebConfig } from "./config.js";

describe("loadWebConfig", () => {
  it("uses defaults when env vars are missing", () => {
    expect(loadWebConfig({})).toEqual({
      baseUrl: "",
      apiKey: "dev-api-key",
    });
  });

  it("reads configured env vars", () => {
    expect(
      loadWebConfig({
        VITE_API_URL: "http://192.168.1.10:3000",
        VITE_API_KEY: "secret-key",
      }),
    ).toEqual({
      baseUrl: "http://192.168.1.10:3000",
      apiKey: "secret-key",
    });
  });
});

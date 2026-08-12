import "temporal-polyfill/global";
import { describe, expect, it } from "vitest";
import {
  formatLocalTime,
  formatRelative,
  nowInstantIso,
  parseInstant,
  plainDateTimeLocalToInstant,
  plainDateTimeLocalToIso,
  validateEventTimestamp,
} from "./time.js";

describe("parseInstant", () => {
  it("parses a UTC ISO instant", () => {
    expect(parseInstant("2026-08-12T17:30:00Z").toString()).toBe(
      "2026-08-12T17:30:00Z",
    );
  });

  it("throws on invalid input", () => {
    expect(() => parseInstant("not-a-date")).toThrow();
  });
});

describe("validateEventTimestamp", () => {
  const now = "2026-08-12T12:00:00Z";

  it("returns normalized ISO for a past timestamp", () => {
    expect(validateEventTimestamp("2026-08-12T10:00:00Z", now)).toBe(
      "2026-08-12T10:00:00Z",
    );
  });

  it("accepts the reference instant", () => {
    expect(validateEventTimestamp(now, now)).toBe(now);
  });

  it("allows timestamps within the clock-skew window", () => {
    expect(validateEventTimestamp("2026-08-12T12:00:45Z", now)).toBe(
      "2026-08-12T12:00:45Z",
    );
  });

  it("rejects timestamps beyond the clock-skew window", () => {
    expect(() => validateEventTimestamp("2026-08-12T12:02:00Z", now)).toThrow(
      /future/i,
    );
  });
});

describe("formatLocalTime", () => {
  it("formats an instant in the given timezone", () => {
    const formatted = formatLocalTime(
      "2026-08-12T17:30:00Z",
      "America/Los_Angeles",
    );
    expect(formatted).toMatch(/10:30 AM/);
  });
});

describe("formatRelative", () => {
  it("formats hours and minutes ago", () => {
    expect(formatRelative("2026-08-12T10:37:00Z", "2026-08-12T12:00:00Z")).toBe(
      "1h 23m ago",
    );
  });

  it("formats minutes only", () => {
    expect(formatRelative("2026-08-12T11:45:00Z", "2026-08-12T12:00:00Z")).toBe(
      "15m ago",
    );
  });

  it("formats hours only", () => {
    expect(formatRelative("2026-08-12T10:00:00Z", "2026-08-12T12:00:00Z")).toBe(
      "2h ago",
    );
  });

  it("returns just now for very recent events", () => {
    expect(formatRelative("2026-08-12T11:59:30Z", "2026-08-12T12:00:00Z")).toBe(
      "just now",
    );
  });
});

describe("plainDateTimeLocalToInstant", () => {
  it("converts local plain date-time to UTC instant", () => {
    const instant = plainDateTimeLocalToInstant(
      { year: 2026, month: 8, day: 12, hour: 10, minute: 30 },
      "America/Los_Angeles",
    );
    expect(instant.toString()).toBe("2026-08-12T17:30:00Z");
  });
});

describe("plainDateTimeLocalToIso", () => {
  it("returns ISO string for local plain date-time", () => {
    expect(
      plainDateTimeLocalToIso(
        { year: 2026, month: 8, day: 12, hour: 10, minute: 30 },
        "America/Los_Angeles",
      ),
    ).toBe("2026-08-12T17:30:00Z");
  });
});

describe("nowInstant helpers", () => {
  it("returns ISO string from nowInstantIso", () => {
    expect(nowInstantIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

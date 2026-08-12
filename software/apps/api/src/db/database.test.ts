import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createDatabase } from "./database.js";

describe("createDatabase", () => {
  it("seeds a default dog only once per database file", () => {
    const dir = mkdtempSync(join(tmpdir(), "potty-db-test-"));
    const path = join(dir, "potty.db");

    try {
      const first = createDatabase(path);
      expect(
        (first.prepare("SELECT COUNT(*) as count FROM dogs").get() as { count: number })
          .count,
      ).toBe(1);
      first.close();

      const second = createDatabase(path);
      expect(
        (second.prepare("SELECT COUNT(*) as count FROM dogs").get() as { count: number })
          .count,
      ).toBe(1);
      second.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

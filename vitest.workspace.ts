import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "software/packages/shared/vitest.config.ts",
  "software/apps/api/vitest.config.ts",
  "software/apps/web/vitest.config.ts",
]);

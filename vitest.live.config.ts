import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/email/__tests__/send.live.test.ts"],
    exclude: ["**/node_modules/**"],
    env: {
      RUN_LIVE_EMAIL_TESTS: "1",
    },
    setupFiles: ["lib/email/__tests__/live.env.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});

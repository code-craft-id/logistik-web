import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/support/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    // Bound DOM/crypto workers; oversubscription can exhaust per-test timeouts.
    maxWorkers: 2,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "happy-dom",
          // DOM/focus behavior is tested here, not a five-second latency budget.
          // Radix interactions exceed that default on this development host.
          testTimeout: 15_000,
          include: ["tests/ui/**/*.test.ts"],
        },
      },
    ],
  },
});

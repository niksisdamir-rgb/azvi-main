import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "packages", "shared-core"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["client/tests/**/*.test.{ts,tsx}", "client/tests/**/*.spec.{ts,tsx}"],
    setupFiles: ["client/tests/setup.ts"],
    globals: true,
    pool: "vmForks",
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    coverage: {
      provider: "v8",
      include: ["client/src/**/*.{ts,tsx}"],
      exclude: [
        "client/src/main.tsx",
        "client/src/**/*.d.ts",
        "client/src/**/*.test.{ts,tsx}",
        "client/src/components/ui/**",
        "client/src/pages/ComponentShowcase.tsx",
        "client/src/pages/DesignSystem.tsx",
        "client/src/design-system/**",
      ],
      thresholds: {
        lines: 20,
        functions: 10,
        branches: 15,
        statements: 15,
      },
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Incluir solo tests en apps/admin por ahora
    include: ["apps/admin/__tests__/**/*.test.ts"],

    // Excluir node_modules y builds
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],

    // Entorno de ejecucion
    environment: "node",

    // Globals para no importar describe/it/expect en cada archivo
    globals: true,

    // Setup files que se ejecutan antes de cada test
    setupFiles: ["./apps/admin/__tests__/setup/index.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        "apps/admin/src/lib/**/*.ts",
        "apps/admin/src/middleware.ts",
        "apps/admin/src/app/api/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "**/node_modules/**",
      ],
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  // Resolver aliases (igual que en tsconfig de apps/admin)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/admin/src"),
      "@/lib": path.resolve(__dirname, "./apps/admin/src/lib"),
    },
  },
});

// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, "..");

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Generic aliases that need to resolve based on context
        // Point to salon by default (most used), but the specific @salon/* aliases take precedence
        "@lib": path.join(templatesDir, "salon/src/lib"),
        "@layouts": path.join(templatesDir, "salon/src/layouts"),
        "@components": path.join(templatesDir, "salon/src/components"),
        "@styles": path.join(templatesDir, "salon/src/styles"),

        // Template-specific explicit paths
        "@salon": path.join(templatesDir, "salon/src"),
        "@restaurant": path.join(templatesDir, "restaurant/src"),
        "@gym": path.join(templatesDir, "gym/src"),
        "@clinic": path.join(templatesDir, "clinic/src"),
        "@repairs": path.join(templatesDir, "repairs/src"),
        "@store": path.join(templatesDir, "store/src"),
      },
    },
  },
});

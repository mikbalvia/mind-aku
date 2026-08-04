import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const BUILD_ID = process.env.BUILD_ID ?? new Date().toISOString();

export default defineConfig({
  plugins: [
    {
      name: "inject-build-id",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          return html.replace(
            "%BUILD_ID%",
            `<meta name="build-id" content="${BUILD_ID}" />`,
          );
        },
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});

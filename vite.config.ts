/// <reference types="vitest/config" />

import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const isGithubPages = mode === "github";

  return {
    base: isGithubPages ? "./" : "/",

    plugins: [
      vue(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        manifest: {
          name: "Gestión Taller",
          short_name: "Gestión Taller",
          description: "Gestión operativa de CADASA Taller.",
          start_url: "./",
          scope: "./",
          display: "standalone",
          theme_color: "#004643",
          background_color: "#f0ede5",
          icons: [
            {
              src: "icon_go-maskable.png",
              sizes: "1254x1254",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globIgnores: ["**/version.json"],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.endsWith("/version.json"),
              handler: "NetworkOnly",
              method: "GET",
            },
          ],
        },
      }),

      {
        name: "github-pages-nojekyll",
        closeBundle() {
          if (!isGithubPages) return;

          const nojekyllPath = path.resolve(__dirname, "docs/.nojekyll");
          fs.writeFileSync(nojekyllPath, "");
        },
      },
    ],

    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },

    build: {
      outDir: isGithubPages ? "docs" : "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("echarts") || id.includes("zrender")) {
                return "echarts-vendor";
              }

              if (id.includes("@supabase")) {
                return "supabase-vendor";
              }

              return "vendor";
            }
          },
        },
      },
    },

    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
    },
  };
});

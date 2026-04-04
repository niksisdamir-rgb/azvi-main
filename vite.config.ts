import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";

import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const plugins = [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    ...(isDev ? [visualizer({ open: false, filename: "stats.html", gzipSize: true, brotliSize: true })] : [])
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "packages", "shared-core"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: 4000,
      strictPort: true,
      host: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
      ],
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

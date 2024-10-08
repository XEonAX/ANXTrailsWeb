// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      external: ["three", "@microsoft/signalr"],
      output: {
        paths: {
          three: "https://cdn.jsdelivr.net/npm/three@0.169.0/+esm",
          "@microsoft/signalr":
            "https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.7/+esm",
        },
      },
      preserveEntrySignatures: "allow-extension",
    },
  },
});

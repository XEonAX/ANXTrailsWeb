// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      external: [
        "three",
        "three/examples/jsm/postprocessing/EffectComposer.js",
        "three/examples/jsm/postprocessing/RenderPass.js",
        "three/examples/jsm/postprocessing/UnrealBloomPass.js",
        "@microsoft/signalr",
      ],
      output: {
        paths: {
          three: "https://cdn.jsdelivr.net/npm/three@0.169.0/+esm",
          "three/examples/jsm/postprocessing/EffectComposer.js":
            "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js",
          "three/examples/jsm/postprocessing/RenderPass.js":
            "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js",
          "three/examples/jsm/postprocessing/UnrealBloomPass.js":
            "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js",
          "@microsoft/signalr":
            "https://cdn.jsdelivr.net/npm/@microsoft/signalr@8.0.7/+esm",
        },
      },
      preserveEntrySignatures: "allow-extension",
    },
  },
});

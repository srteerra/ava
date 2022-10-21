import { defineConfig } from "astro/config";
import deno from "@astrojs/deno";
import tailwind from "@astrojs/tailwind";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 8080
  },
  integrations: [tailwind(), vue()]
});
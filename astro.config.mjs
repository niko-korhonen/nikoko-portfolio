// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/system/item': '/system/item-action',
  },
});

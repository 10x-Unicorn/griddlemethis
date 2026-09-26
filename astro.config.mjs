// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://www.griddlemethisdad.com';

// Recipes marked `unlisted: true` ("Hide from recipe lists" in Pages CMS) stay
// reachable by link but are left out of the sitemap too.
const recipesDir = new URL('./src/content/recipes/', import.meta.url);
const unlistedPages = new Set(
  fs
    .readdirSync(recipesDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => /^unlisted:\s*true\s*$/m.test(fs.readFileSync(new URL(file, recipesDir), 'utf8').split(/^---$/m)[1] ?? ''))
    .map((file) => `${site}/recipes/${file.replace(/\.md$/, '')}/`),
);

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !unlistedPages.has(page) })],
});

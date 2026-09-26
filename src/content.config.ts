import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Recipes and newsletters are edited both by hand and through Pages CMS
// (see .pages.yml), which can save a blank optional field as null or "" and
// can leave empty rows in lists. Normalize those before validating.
const isBlank = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (isBlank(v) ? undefined : v), schema.optional());
const list = <T extends z.ZodType>(schema: T, min = 0) =>
  z.preprocess((v) => (Array.isArray(v) ? v.filter((item) => !isBlank(item)) : []), z.array(schema).min(min));

const group = z.object({
  heading: optional(z.string()),
  items: list(z.string(), 1),
});

const recipes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/recipes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      published: z.coerce.date(),
      category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Side', 'Snack', 'Dessert', 'Sauce', 'Seasoning', 'Other']),
      tags: list(z.string()),
      rating: optional(z.number().int().min(1).max(5)),
      prepMinutes: optional(z.number().int().nonnegative()),
      cookMinutes: optional(z.number().int().nonnegative()),
      totalMinutes: z.number().int().positive(),
      // Reachable by URL but left off listings (e.g. not ready yet).
      unlisted: optional(z.boolean()).transform((v) => v ?? false),
      hero: image(),
      ingredients: list(group, 1),
      steps: list(group, 1),
      prepNotes: list(z.string()),
      photos: optional(
        z.object({
          plan: list(image()),
          prep: list(image()),
          performance: list(image()),
        }),
      ).transform((p) => p ?? { plan: [], prep: [], performance: [] }),
    }),
});

const newsletters = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/newsletters' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      published: z.coerce.date(),
      pdf: z.string().startsWith('/newsletters/'),
      cover: image(),
    }),
});

export const collections = { recipes, newsletters };

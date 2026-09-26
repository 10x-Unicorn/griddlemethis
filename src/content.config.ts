import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const group = z.object({
  heading: z.string().nullable(),
  items: z.array(z.string()).min(1),
});

const recipes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/recipes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      published: z.coerce.date(),
      category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Side', 'Snack', 'Dessert', 'Sauce', 'Seasoning', 'Other']),
      tags: z.array(z.string()).default([]),
      rating: z.number().int().min(1).max(5).optional(),
      prepMinutes: z.number().int().nonnegative().optional(),
      cookMinutes: z.number().int().nonnegative().optional(),
      totalMinutes: z.number().int().positive(),
      // Reachable by URL but left off listings (e.g. not ready yet).
      unlisted: z.boolean().default(false),
      hero: image(),
      ingredients: z.array(group).min(1),
      steps: z.array(group).min(1),
      prepNotes: z.array(z.string()).default([]),
      photos: z
        .object({
          plan: z.array(image()).default([]),
          prep: z.array(image()).default([]),
          performance: z.array(image()).default([]),
        })
        .default({ plan: [], prep: [], performance: [] }),
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

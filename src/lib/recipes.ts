import { getCollection } from 'astro:content';

/** Listed recipes, newest first. */
export async function getListedRecipes() {
  const recipes = await getCollection('recipes', ({ data }) => !data.unlisted);
  return recipes.sort(
    (a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.data.title.localeCompare(b.data.title),
  );
}

/** ISO 8601 duration for schema.org, e.g. 90 -> "PT1H30M". */
export function isoDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ''}${m || !h ? `${m}M` : ''}`;
}

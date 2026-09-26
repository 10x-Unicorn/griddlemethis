import { getCollection, type CollectionEntry } from 'astro:content';
import { normalize } from './search';

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

/** 75 -> "1 hr 15 min", 20 -> "20 min". */
export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${h} hr`, (m || !h) && `${m} min`].filter(Boolean).join(' ');
}

/** Everything a recipe can be found by in the recipe list's search box. */
export function searchText({ data }: CollectionEntry<'recipes'>) {
  return normalize(
    [
      data.title,
      data.category,
      ...data.tags,
      data.description,
      ...data.ingredients.flatMap((group) => [group.heading ?? '', ...group.items]),
    ].join(' '),
  );
}

// Recipe list for the header search's results preview, built into /search.json.
// The header loads it the first time someone focuses the search box.
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { formatMinutes, getListedRecipes, searchText } from '../lib/recipes';
import type { SearchItem } from '../lib/search';

export const GET: APIRoute = async () => {
  const recipes = await getListedRecipes();
  const items: SearchItem[] = await Promise.all(
    recipes.map(async (recipe) => ({
      title: recipe.data.title,
      url: `/recipes/${recipe.id}/`,
      category: recipe.data.category,
      time: formatMinutes(recipe.data.totalMinutes),
      thumb: (await getImage({ src: recipe.data.hero, width: 96, height: 96, fit: 'cover', format: 'webp' })).src,
      text: searchText(recipe),
    })),
  );
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};

// Shared by the build (recipe card search text) and the browser (search box),
// so both sides normalize text the same way. No imports: this runs client-side.

/** Lowercase, drop accents ("Sauté" -> "saute") and collapse punctuation to spaces. */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Search words from what the visitor typed; plurals are trimmed so "potatoes" finds "potato". */
export const queryWords = (query: string) =>
  normalize(query)
    .split(' ')
    .filter(Boolean)
    .map((word) => (word.length > 3 ? word.replace(/(es|s)$/, '') : word));

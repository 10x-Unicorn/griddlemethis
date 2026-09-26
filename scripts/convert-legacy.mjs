// One-off migration: converts the legacy hand-written HTML pages into Astro
// content collection entries (src/content/**) and writes public/_redirects so
// old URLs keep working. Safe to re-run; it overwrites its own output.
//
//   node scripts/convert-legacy.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

const ROOT = process.cwd();
const RECIPES_OUT = path.join(ROOT, 'src/content/recipes');
const NEWSLETTERS_OUT = path.join(ROOT, 'src/content/newsletters');
const warnings = [];

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const yamlStr = (s) => JSON.stringify(s); // JSON strings are valid YAML scalars

// Old pages were built on macOS, which ignores filename case; Netlify doesn't.
// Resolve each referenced file to its real on-disk spelling.
function resolveCase(rel) {
  rel = decodeURIComponent(rel).normalize('NFC');
  if (fs.existsSync(path.join(ROOT, rel))) return rel;
  let dir = ROOT;
  const out = [];
  for (const part of rel.split('/')) {
    const match = fs.readdirSync(dir).find((e) => e.normalize('NFC').toLowerCase() === part.toLowerCase());
    if (!match) {
      warnings.push(`missing file: ${rel}`);
      return null;
    }
    out.push(match);
    dir = path.join(dir, match);
  }
  const fixed = out.join('/');
  warnings.push(`case fixed: ${rel} -> ${fixed}`);
  return fixed;
}

// Frontmatter image paths are relative to the .md file (for Astro's image()).
const imgRef = (rel, fromDir) => {
  const real = resolveCase(rel);
  return real && path.relative(fromDir, path.join(ROOT, real));
};

const slugify = (file) =>
  file
    .replace(/\.html$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/_recipe$/i, '')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();

const minutes = (s) => {
  const n = parseInt(s, 10);
  if (Number.isNaN(n)) throw new Error(`unparseable time: ${s}`);
  return n;
};

const firstAdded = (file) =>
  execFileSync('git', ['log', '--diff-filter=A', '--format=%as', '--', file], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .pop();

// --- Recipe cards (Recipes.html) give category, card title and thumbnail ---
const cards = new Map();
for (const card of parse(read('Recipes.html')).querySelectorAll('.single_recipe')) {
  const link = card.querySelector('a.line_btn');
  if (!link) continue;
  cards.set(decodeURIComponent(link.getAttribute('href')).normalize('NFC'), {
    thumb: card.querySelector('img')?.getAttribute('src'),
    category: clean(card.querySelector('span')?.text ?? ''),
    timeNeeded: clean(card.querySelector('p')?.text ?? '').replace(/^Time Needed:\s*/i, ''),
  });
}

// --- Recipe pages ---
const recipeFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && read(f).includes('recipe_details_area'))
  .map((f) => f.normalize('NFC'));

fs.rmSync(RECIPES_OUT, { recursive: true, force: true });
fs.mkdirSync(RECIPES_OUT, { recursive: true });
const redirects = [];

for (const file of recipeFiles) {
  const html = read(file);
  const doc = parse(html);
  const info = doc.querySelector('.recipes_info');
  const details = {};
  for (const li of info.querySelectorAll('.recipes_details li')) {
    const [k, ...v] = clean(li.text).split(':');
    details[k.trim().toLowerCase()] = clean(v.join(':'));
  }
  const rating = info.querySelectorAll('.fa-star').length || undefined;

  // Walk the body (Planning -> Return to All Recipes) in document order.
  const start = html.indexOf('<h2');
  const end = html.indexOf('Return to All Recipes');
  const body = parse(html.slice(start, end));
  const sections = { plan: newSection(), prep: newSection(), performance: newSection() };
  let current = null;
  for (const el of body.querySelectorAll('h2, h6, img, li, p')) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h2') {
      const t = el.text.toLowerCase();
      current = t.includes('plan') ? sections.plan : t.includes('prep') ? sections.prep : sections.performance;
      continue;
    }
    if (!current) continue;
    if (tag === 'img') {
      current.photos.push(el.getAttribute('src'));
    } else if (tag === 'h6') {
      current.groups.push({ heading: clean(el.text), items: [] });
    } else if (tag === 'li') {
      if (el.querySelector('li, ul, ol')) continue; // malformed wrapper <li>
      const text = clean(el.text);
      if (!text) continue;
      if (!current.groups.length) current.groups.push({ items: [] });
      current.groups.at(-1).items.push(text);
    } else if (tag === 'p') {
      if (el.closest('li') || el.querySelector('li, ul, ol, img')) continue;
      const text = clean(el.text);
      if (text) current.notes.push(text);
    }
  }

  const slug = slugify(file);
  const card = cards.get(file);
  if (!card) warnings.push(`${file}: not linked from Recipes.html, marked unlisted`);
  const dir = RECIPES_OUT;
  const photos = (list) => list.map((src) => imgRef(src, dir)).filter(Boolean);
  const hero = doc.querySelector('.recipes_thumb img')?.getAttribute('src');

  const strip = (re) => (g) => ({ ...g, items: g.items.map((i) => i.replace(re, '').replace(/\/p>$/, '').trim()) });
  const ingredients = sections.plan.groups.filter((g) => g.items.length).map(strip(/^[-–•]\s*/));
  const steps = sections.prep.groups.filter((g) => g.items.length).map(strip(/^\d+\s*[.)]\s*/));

  const fm = [
    '---',
    `title: ${yamlStr(clean(info.querySelector('h3').text))}`,
    `description: ${yamlStr(clean(info.querySelector('p')?.text ?? ''))}`,
    `published: ${firstAdded(file)}`,
    `category: ${yamlStr(card?.category || details.category || 'Other')}`,
    `tags: [${(details.tags ?? '').split(',').map(clean).filter(Boolean).map(yamlStr).join(', ')}]`,
    rating ? `rating: ${rating}` : null,
    details['prep time'] ? `prepMinutes: ${minutes(details['prep time'])}` : null,
    details['cook time'] ? `cookMinutes: ${minutes(details['cook time'])}` : null,
    `totalMinutes: ${minutes(card?.timeNeeded || details['ready in'])}`,
    card ? null : 'unlisted: true',
    `hero: ${yamlStr(imgRef(hero, dir))}`,
    card?.thumb ? `thumbnail: ${yamlStr(imgRef(card.thumb, dir))}` : null,
    'ingredients:',
    ...ingredients.flatMap((g) => [
      g.heading ? `  - heading: ${yamlStr(g.heading)}` : '  - heading: null',
      '    items:',
      ...g.items.map((i) => `      - ${yamlStr(i)}`),
    ]),
    'steps:',
    ...steps.flatMap((g) => [
      g.heading ? `  - heading: ${yamlStr(g.heading)}` : '  - heading: null',
      '    items:',
      ...g.items.map((i) => `      - ${yamlStr(i)}`),
    ]),
    sections.prep.notes.length ? `prepNotes: [${sections.prep.notes.map(yamlStr).join(', ')}]` : null,
    'photos:',
    ...['plan', 'prep', 'performance'].map((k) => `  ${k}: [${photos(sections[k].photos).map(yamlStr).join(', ')}]`),
    '---',
  ].filter((l) => l !== null);

  // Performance section: paragraphs (+ any list items) become the Markdown body.
  const perf = [...sections.plan.notes.map((n) => `> ${n}`), ...sections.performance.notes];
  for (const g of sections.performance.groups) perf.push(g.items.map((i) => `- ${i}`).join('\n'));

  fs.writeFileSync(path.join(RECIPES_OUT, `${slug}.md`), `${fm.join('\n')}\n\n${perf.join('\n\n')}\n`);
  const old = file.replace(/\.html$/, '');
  redirects.push([`/${encodeURI(old)}.html`, `/recipes/${slug}/`], [`/${encodeURI(old)}`, `/recipes/${slug}/`]);
}

function newSection() {
  return { photos: [], groups: [], notes: [] };
}

// --- Newsletters ---
fs.rmSync(NEWSLETTERS_OUT, { recursive: true, force: true });
fs.mkdirSync(NEWSLETTERS_OUT, { recursive: true });
for (const item of parse(read('newsletters.html')).querySelectorAll('article.blog_item')) {
  const pdf = decodeURIComponent(item.querySelector('.blog_details a').getAttribute('href'));
  const num = pdf.match(/(\d+)\.pdf$/)[1];
  const date = new Date(clean(item.querySelector('.blog-info-link li').text));
  const fm = [
    '---',
    `title: ${yamlStr(clean(item.querySelector('h2').text))}`,
    `published: ${date.toISOString().slice(0, 10)}`,
    `pdf: ${yamlStr(`/${pdf}`)}`,
    `cover: ${yamlStr(imgRef(item.querySelector('img').getAttribute('src'), NEWSLETTERS_OUT))}`,
    '---',
  ];
  fs.writeFileSync(
    path.join(NEWSLETTERS_OUT, `${num}.md`),
    `${fm.join('\n')}\n\n${clean(item.querySelector('.blog_details > p').text)}\n`,
  );
}

// --- Redirects for the old top-level pages ---
for (const [from, to] of [
  ['index', '/'],
  ['Recipes', '/recipes/'],
  ['about', '/about/'],
  ['contact', '/contact/'],
  ['newsletters', '/newsletters/'],
]) {
  if (from !== 'index') redirects.push([`/${from}`, to]);
  redirects.push([`/${from}.html`, to]);
}
fs.writeFileSync(
  path.join(ROOT, 'public/_redirects'),
  `# Old .html URLs -> new routes (generated by scripts/convert-legacy.mjs)\n${redirects
    .map(([a, b]) => `${a}  ${b}  301`)
    .join('\n')}\n`,
);

console.log(`recipes: ${recipeFiles.length}, redirects: ${redirects.length}`);
for (const w of warnings) console.log(`warn: ${w}`);

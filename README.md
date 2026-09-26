# griddlemethis
A modern cookbook website dedicated to griddling.

## Infrastructure
### Stack
The site is built with [Astro](https://astro.build) and deployed on [Netlify](https://www.netlify.com/), which
runs `npm run build` on every push and serves the `dist/` folder. All styling lives in `src/styles/site.css`
(colors and fonts are defined as variables at the top, with a matching dark mode).

```
├── img/                     original photos (resized/compressed automatically at build time)
├── public/                  files served as-is: favicon, newsletter PDFs, _redirects
├── src/
│   ├── content/recipes/     one Markdown file per recipe
│   ├── content/newsletters/ one Markdown file per newsletter
│   ├── content.config.ts    the fields every recipe/newsletter must have
│   ├── layouts/Base.astro   header, footer, <head> (shared by every page)
│   ├── assets/              logo (dark and light versions)
│   ├── components/          recipe card, page header, icons
│   └── pages/               one file per route
```

### Local development
Requires Node 22+.

```
npm install
npm run dev      # live preview at http://localhost:4321
npm run build    # production build into dist/
```

## Contribution Guide
### Adding a recipe
1. Put the photos in `img/recipe/<recipe_name>/`. Full-size phone photos are fine: the build resizes them, converts
   them to WebP and strips location (GPS) data.
1. Copy an existing file in `src/content/recipes/` to `src/content/recipes/<recipe-name>.md` (the filename becomes
   the URL: `/recipes/<recipe-name>/`) and edit the fields. The text below the `---` is the "Performance" section.
1. Run `npm run dev` to check it. If a required field is missing or a photo path is wrong, the build tells you which
   file and field.

The recipe list, the three newest recipes on the home page and the search index all update automatically based on
the `published` date. The `hero` photo is used everywhere the recipe appears (cards, the recipe page, search
results), cropped automatically, so no separate thumbnail is needed. Set `unlisted: true` to publish a recipe
without listing it.

### Adding a newsletter
1. Save the PDF to `public/newsletters/GMTD Newsletter <N>.pdf`.
1. Save a cover screenshot to `img/blog/`.
1. Copy an existing file in `src/content/newsletters/` to `<N>.md` and edit the title, date, paths and summary.

We use [Canva](https://www.canva.com/) to make the newsletters.

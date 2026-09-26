# griddlemethis
A modern cookbook website dedicated to griddling.

## Infrastructure
The design is adapted from this [template](https://colorlib.com/wp/template/tasty-recipes/) 
via [Colorlib](https://colorlib.com).

### Stack
The site is built with [Astro](https://astro.build) and deployed on [Netlify](https://www.netlify.com/), which
runs `npm run build` on every push and serves the `dist/` folder. The look still comes from the original Colorlib
template (`public/css/style.css`).

```
├── img/                     original photos (resized/compressed automatically at build time)
├── public/                  files served as-is: template CSS/fonts, logos, newsletter PDFs, _redirects
├── src/
│   ├── content/recipes/     one Markdown file per recipe
│   ├── content/newsletters/ one Markdown file per newsletter
│   ├── content.config.ts    the fields every recipe/newsletter must have
│   ├── layouts/Base.astro   header, footer, <head> (shared by every page)
│   ├── components/          recipe card, page banner
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
the `published` date. No circle-cropped thumbnail is needed: the card crops the photo to a circle itself. Set
`thumbnail` only if you want a different photo on the card than the main one. Set `unlisted: true` to publish a
recipe without listing it.

### Adding a newsletter
1. Save the PDF to `public/newsletters/GMTD Newsletter <N>.pdf`.
1. Save a cover screenshot to `img/blog/`.
1. Copy an existing file in `src/content/newsletters/` to `<N>.md` and edit the title, date, paths and summary.

We use [Canva](https://www.canva.com/) to make the newsletters.

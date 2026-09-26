# griddlemethis
A modern cookbook website dedicated to griddling.

## Infrastructure
### Stack
The site is built with [Astro](https://astro.build) and deployed on [Netlify](https://www.netlify.com/), which
runs `npm run build` on every push and serves the `dist/` folder. All styling lives in `src/styles/site.css`
(the dark charcoal-and-flame palette and the fonts are defined as variables at the top).

```
├── img/                     original photos (resized/compressed automatically at build time)
├── public/                  files served as-is: favicon, newsletter PDFs, _redirects
├── src/
│   ├── content/recipes/     one Markdown file per recipe
│   ├── content/newsletters/ one Markdown file per newsletter
│   ├── content.config.ts    the fields every recipe/newsletter must have
│   ├── layouts/Base.astro   header, footer, <head> (shared by every page)
│   ├── assets/              logo
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
Recipes and newsletters can be added through [Pages CMS](https://pagescms.org), a free web editor, without touching
any code. Editing the Markdown files by hand works too (see [Editing files directly](#editing-files-directly)).

### Adding a recipe or newsletter with Pages CMS
1. Go to [app.pagescms.org](https://app.pagescms.org), sign in (with GitHub, or through the email invitation for
   editors without a GitHub account) and open this repository.
1. Switch to the **`content`** branch in Pages CMS's branch menu, not `master`. See [Why the `content` branch](#why-the-content-branch).
1. Open **Recipes** (or **Newsletters**) and add a new entry.
1. Fill in the form and upload photos. Full-size phone photos are fine: the build resizes them, converts them to WebP
   and strips location (GPS) data.
1. Save. Each save is a commit to the `content` branch, and Netlify builds a preview of it.

The recipe name becomes the web address: "Smash Burgers" is published at `/recipes/smash-burgers/`. The recipe list,
the three newest recipes on the home page and search all update automatically from the **Date published** field.

### Publishing
When a batch of changes on `content` is ready, open a pull request from `content` into `master` on GitHub and merge
it. That publishes everything in one production deploy. Afterwards, bring `content` up to date with `master` before the next
batch: merge a pull request from `master` into `content`, or run `git merge master` on `content` locally.

### Why the `content` branch
Every save in Pages CMS is a commit, and every commit to `master` is a Netlify production deploy, which counts
against the free plan's monthly limit (on Netlify's credit-based free plan, 15 of the 300 monthly credits each).
Deploy previews of other branches are free, so drafting on `content` and merging in batches keeps the site well
inside the free plan and lets you check changes on the preview before they go live.

### One-time setup
1. Someone with admin access to the `10x-Unicorn` GitHub organization signs in at
   [app.pagescms.org](https://app.pagescms.org) and installs the Pages CMS GitHub app on this repository.
1. Create a `content` branch from `master` (from the branch dropdown on GitHub, or `git push origin master:content`).
1. Invite editors from Pages CMS by email. They don't need a GitHub account: invited collaborators can edit
   content and media, but not settings like `.pages.yml`.
1. In Netlify's site settings, turn on branch deploys for `content` so each save gets a preview link.

The editor forms are defined in `.pages.yml`. They mirror the fields in `src/content.config.ts`, so if a field is added
or renamed in one, update the other.

### Editing files directly
Recipes are Markdown files in `src/content/recipes/`, newsletters in `src/content/newsletters/`. Copy an existing
file, edit its fields, and run `npm run dev` to check it; if a required field is missing or a photo path is wrong,
the build says which file and field. Photos go in `img/` and are referenced from the root, e.g.
`/img/recipe/butter_chicken/butter_chicken_fin.jpg`; newsletter PDFs go in `public/newsletters/`. In a recipe
file, the text below the closing `---` is the "Performance" section. Set `unlisted: true` to publish a recipe
without listing it.

We use [Canva](https://www.canva.com/) to make the newsletters.

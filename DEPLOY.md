# Deploying molio on Cloudflare Pages

**Stack:** Cloudflare Pages (static site + Functions) · Neon (Postgres) · Cloudinary (media) · Resend (email)

The public site is **static**: `manage.py build_static` renders the home page from the
database into `myportfolio/dist/`, and Pages serves it from the edge — always on, no
cold starts. Only the contact and feedback forms run code
([`functions/api/`](myportfolio/functions/api)).

The Django admin is no longer hosted. You run it **locally** against the same Neon
database, edit content, then trigger a rebuild.

```
edit content (local admin → Neon/Cloudinary)
  → trigger a Pages build (git push, or the deploy hook)
  → Pages runs build_static (reads Neon) → publishes dist/
```

---

## 1. Create the Pages project

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `myportfolio` |
| Build command | `pip install -r requirements.txt && python manage.py build_static --settings=config.settings.static` |
| Build output directory | `dist` |

## 2. Environment variables

Pages → project → **Settings → Variables and Secrets**.

> Set these for **Production** (preview builds without them build an empty site).
> Paste the value only; quotes or Neon's `psql '…'` wrapper are tolerated.
> `SECRET_KEY` isn't needed: the static settings supply a build-only one.
> Python comes from `.python-version`.

| Name | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | build | Neon connection string (`postgresql://…`, value only) |
| `CLOUDINARY_URL` | build | `cloudinary://…`, so image + CV URLs resolve |
| `RESEND_API_KEY` | functions | **secret** |
| `RESEND_FROM_EMAIL` | functions | e.g. `Portfolio <onboarding@resend.dev>` |
| `CONTACT_RECIPIENT_EMAIL` | functions | your inbox |

## 3. Rebuild when content changes

A deploy hook (`admin-rebuild`, Pages → Settings → Deploy hooks) rebuilds `main`.
Put its URL in your local `.env` as `DEPLOY_HOOK_URL`, and the admin's Projects
page gets a working **Rebuild site** button. Without the button:

```bash
curl -X POST "<your deploy hook URL>"
```

(or push to `main`). Rebuilds take ~1–2 minutes. The URL is a credential: keep it
in `.env` only; if it leaks, delete the hook in Cloudflare and make a new one.

## 4. Custom domain

Pages → **Custom domains** → add yours. Nothing else to configure.

## 5. Decommission the old hosts

Once the Pages URL works, delete the Back4App/Render/Vercel services. The `release`
branch and its Actions workflow are no longer used and can be deleted.

---

## Content

`build_static` renders the home page and one page per published project at
`/work/<slug>/`. A project shows only when it is **published and has a category**.

Every project page is its own *world* (colours, fonts, layouts): see the **World**
section of a project in the admin. New projects get three chapters automatically:
design work gets The thought / The brand / The experience; anything else gets
The itch / The rabbit hole / The souvenirs. Add images on each chapter's own page.

To load the design projects and the "Off the clock" photos:

```bash
python manage.py seed_content --settings=config.settings.dev     # local
python manage.py seed_content --settings=config.settings.prod    # production (Neon + Cloudinary)
```

Re-running is safe; `--refresh` rebuilds the seeded projects from
`apps/projects/seed_data.py` (this discards admin edits to those projects).

The feedback carousel and form were retired in the 2026 redesign. The `Feedback`
model and `functions/api/feedback.js` remain so no data is lost.

## Local development

```bash
cd myportfolio
python manage.py runserver 8080     # dev settings, SQLite, console email
npm run dev                         # Tailwind watcher
python manage.py build_static --settings=config.settings.static   # preview the static build in dist/
npx wrangler pages dev dist         # serve dist/ with the Functions locally
```

To edit **production** content locally, run the admin with `DATABASE_URL` and
`CLOUDINARY_URL` set to the same values as Pages and
`--settings=config.settings.prod`.

> Local admin uses `create_admin.py` defaults only if you run it; if you ever created
> the superuser with its default password, change it in Neon now.

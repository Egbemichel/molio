# Deploying molio (free stack)

**Stack:** Render (web, free) · Neon (Postgres, free) · Cloudinary (media, free)
**CI/CD:** GitHub Actions — every push to `main` runs tests, then triggers a Render deploy.

---

## 1. Database — Neon (free Postgres)

1. Sign up at <https://neon.tech> (no credit card).
2. Create a project → it gives you a **connection string** that looks like:
   `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
3. Copy it — this is your `DATABASE_URL`.

## 2. Media — Cloudinary (free, persists uploads)

1. Sign up at <https://cloudinary.com>.
2. On the dashboard copy the **API Environment variable**, which looks like:
   `cloudinary://<api_key>:<api_secret>@<cloud_name>`
3. This is your `CLOUDINARY_URL`.

> Without this, images uploaded through the Django admin are wiped on every deploy
> (Render's free disk is ephemeral).

## 3. Web app — Render

1. Push this repo to GitHub.
2. On <https://render.com> → **New → Blueprint**, point it at this repo.
   Render reads [`render.yaml`](render.yaml) and creates the web service.
3. When prompted, set the env vars marked `sync: false`:
   - `DATABASE_URL` → Neon string from step 1
   - `CLOUDINARY_URL` → Cloudinary string from step 2
   - `ALLOWED_HOSTS` → your Render hostname, e.g. `molio-portfolio.onrender.com`
   - `SECRET_KEY` is generated automatically.
4. First deploy runs `collectstatic` + `migrate` automatically (see `buildCommand`).

### Create your admin user
After the first successful deploy, open the Render service **Shell** tab and run:
```bash
python manage.py createsuperuser
```

## 4. CI/CD — make pushes go live automatically

1. In Render: **Settings → Deploy Hook** → copy the URL.
2. In GitHub: repo **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `RENDER_DEPLOY_HOOK`
   - Value: the deploy hook URL.

Done. From now on:

```
git push origin main
  → GitHub Actions runs the test suite (.github/workflows/deploy.yml)
  → if green, it calls the Render deploy hook
  → Render rebuilds, migrates, and goes live
```

Pull requests run the tests but do **not** deploy.

---

## Local development
Local runs use [`config/settings/dev.py`](myportfolio/config/settings/dev.py) (SQLite, `DEBUG=True`),
so none of the production env vars above are needed locally — just a `SECRET_KEY`.

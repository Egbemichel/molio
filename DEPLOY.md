# Deploying molio (free stack)

**Stack:** Back4App Containers (web, free, no card) · Neon (Postgres, free) · Cloudinary (media, free)
**CI/CD:** GitHub Actions runs tests on every push to `main`; if green it advances the
`release` branch, which Back4App auto-deploys. Push → tested → live.

> We landed on Back4App because Render's IPs are blocked on this network and Koyeb
> now requires a paid plan. Back4App Containers has a genuine no-credit-card free tier.

---

## 1. Database — Neon (free Postgres)

1. Sign up at <https://neon.tech> (no credit card).
2. Create a project (Postgres 18 default is fine). Copy the **connection string**:
   `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
3. That's your `DATABASE_URL`.

## 2. Media — Cloudinary (free, persists uploads)

1. Sign up at <https://cloudinary.com>.
2. Copy the **API Environment variable**: `cloudinary://<api_key>:<api_secret>@<cloud_name>`
3. That's your `CLOUDINARY_URL`.

> Needed because Back4App container storage is ephemeral — admin-uploaded images
> would otherwise vanish on every redeploy.

## 3. Web app — Back4App Containers

1. Push this repo to GitHub.
2. Go to <https://www.back4app.com> → **Containers** → **Deploy a Web App** →
   connect GitHub and pick this repo.
3. Settings:
   - Branch to deploy: **`release`**  ← important (GitHub Actions populates it)
   - Build: **Dockerfile** (auto-detected — [`Dockerfile`](Dockerfile) at repo root)
   - Port: **8000**
   - Auto-deploy: **ON**
4. Environment variables (mark the secrets as private):
   - `SECRET_KEY` → a long random string
     (`python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
   - `DATABASE_URL` → Neon string from step 1
   - `CLOUDINARY_URL` → Cloudinary string from step 2
   - `ALLOWED_HOSTS` → your Back4App hostname, e.g. `molio-xxxx.b4a.run`
   - `DJANGO_SETTINGS_MODULE` → `config.settings.prod`
5. Deploy. The container runs `collectstatic` at build and `migrate` on start
   (see [`Dockerfile`](Dockerfile)).

### Create your admin user
After the first deploy, open the Back4App container **Logs/Console** (or temporarily
add a one-off command) and run:
```bash
python manage.py createsuperuser
```
> Back4App's free console access is limited; if you can't get a shell, create the
> superuser by running the app locally against the same Neon `DATABASE_URL` once:
> `DATABASE_URL=... python manage.py createsuperuser` — it writes to the shared DB.

## 4. CI/CD — how pushes go live

Already wired in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). No
secrets required — it uses the built-in `GITHUB_TOKEN`.

```
git push origin main
  → GitHub Actions runs the test suite
  → if green, it force-updates the `release` branch to that commit
  → Back4App sees `release` change and auto-deploys → live
```

Pull requests and failing pushes never touch `release`, so they never deploy.

**One-time setup:** create the `release` branch so Back4App can watch it:
```bash
git push origin main:release
```

---

## Local development
Local runs use [`config/settings/dev.py`](myportfolio/config/settings/dev.py) (SQLite, `DEBUG=True`),
so none of the production env vars above are needed locally — just a `SECRET_KEY`.

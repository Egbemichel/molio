"""
Diagnose (and optionally repair) delivery of the active CV on Cloudinary.

Clicking the CV link returned:

    HTTP 401  |  X-Cld-Error: deny or ACL failure

That is Cloudinary refusing to *deliver* the asset. There are two usual causes,
and they need different fixes, so this command determines which one it is:

  1. The account restricts the PDF media type (Settings -> Security ->
     "Restricted media types"). Plain URLs are denied; SIGNED urls are allowed.
  2. The asset itself was stored with access_mode="authenticated" (or type
     "authenticated"), so only a signed *authenticated* URL is delivered.

Usage (needs CLOUDINARY_URL in the environment):

    python manage.py cv_check          # report only
    python manage.py cv_check --fix    # also set access_mode=public if needed
"""

from django.core.management.base import BaseCommand

from apps.core.models import Resume


class Command(BaseCommand):
    help = 'Diagnose (and optionally repair) Cloudinary delivery of the active CV.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help="Set the asset's access_mode to 'public' when it isn't already.",
        )

    def handle(self, *args, **options):
        resume = Resume.objects.filter(is_active=True).order_by('-updated_at').first()
        if not resume or not resume.file:
            self.stderr.write(self.style.ERROR('No active CV with a file. Upload one in the admin first.'))
            return

        public_id = resume.file.name
        self.stdout.write(f'Active CV : {resume.label}')
        self.stdout.write(f'public_id : {public_id}')

        try:
            import cloudinary
            import cloudinary.api
            import requests
            from cloudinary.utils import cloudinary_url
        except Exception as exc:  # pragma: no cover - import guard
            self.stderr.write(self.style.ERROR(f'Cloudinary SDK unavailable: {exc}'))
            return

        # ── what does Cloudinary think this asset is? ────────────────────────
        access_mode = None
        try:
            info = cloudinary.api.resource(public_id, resource_type='raw')
            access_mode = info.get('access_mode')
            self.stdout.write(
                'metadata  : type={type} resource_type={resource_type} '
                'access_mode={access_mode} bytes={bytes}'.format(
                    type=info.get('type'),
                    resource_type=info.get('resource_type'),
                    access_mode=access_mode,
                    bytes=info.get('bytes'),
                )
            )
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f'Admin API lookup failed: {exc}'))

        # ── which delivery URL actually works? ───────────────────────────────
        candidates = [('plain', resume.file.url)]
        for label, kwargs in (
            ('signed upload', {'type': 'upload'}),
            ('signed authenticated', {'type': 'authenticated'}),
        ):
            try:
                url, _ = cloudinary_url(
                    public_id, resource_type='raw', sign_url=True, secure=True, **kwargs
                )
                candidates.append((label, url))
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f'Could not build {label} URL: {exc}'))

        self.stdout.write('')
        working = []
        for label, url in candidates:
            try:
                resp = requests.head(url, timeout=20, allow_redirects=True)
                status, err = resp.status_code, resp.headers.get('X-Cld-Error', '')
            except Exception as exc:
                status, err = 'ERR', str(exc)
            ok = status == 200
            if ok:
                working.append(label)
            style = self.style.SUCCESS if ok else self.style.ERROR
            self.stdout.write(style(f'  {label:<22} {status} {err}'))
            self.stdout.write(f'    {url}')

        # ── repair ──────────────────────────────────────────────────────────
        if options['fix'] and access_mode and access_mode != 'public':
            self.stdout.write('')
            self.stdout.write(f'Setting access_mode public (was {access_mode})…')
            try:
                cloudinary.api.update(public_id, resource_type='raw', access_mode='public')
                resp = requests.head(resume.file.url, timeout=20)
                self.stdout.write(self.style.SUCCESS(f'  plain URL now returns {resp.status_code}'))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f'  update failed: {exc}'))

        self.stdout.write('')
        if working:
            self.stdout.write(self.style.SUCCESS(f'Deliverable via: {", ".join(working)}'))
            if 'signed upload' in working:
                self.stdout.write('The site already uses the signed upload URL — nothing else to do.')
        else:
            self.stdout.write(self.style.ERROR('Nothing delivers. The account is blocking PDFs outright.'))
            self.stdout.write(
                'Fix: Cloudinary Console -> Settings -> Security -> "Restricted media types" '
                'and allow delivery of PDF files. No redeploy needed.'
            )

"""Management command: sync public GitHub repos into Project drafts.

Usage:
    python manage.py sync_github [--username someuser]
"""
from django.core.management.base import BaseCommand

from apps.projects.github_sync import sync_github_repos


class Command(BaseCommand):
    help = "Sync public, non-fork GitHub repositories into Project records (as drafts)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            help="GitHub username to sync (defaults to settings.GITHUB_USERNAME).",
        )

    def handle(self, *args, **options):
        self.stdout.write("Syncing GitHub repositories…")
        summary = sync_github_repos(username=options.get("username"))
        self.stdout.write(self.style.SUCCESS(
            f"Done. {summary['created']} created, {summary['updated']} updated "
            f"({summary['total_repos']} public repos scanned)."
        ))

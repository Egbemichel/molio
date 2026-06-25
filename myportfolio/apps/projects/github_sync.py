"""
Sync public GitHub repositories into Project records.

Auto-fills the fields GitHub can supply (title, description, links, languages,
date range) and leaves the curated fields (role, category, logo, points...) for
manual editing. New projects are created as drafts (published=False) so they
never reach the public site until you finish them.

Idempotent: repos are matched by their stable GitHub numeric id, so re-running
updates in place instead of duplicating. Manually-edited fields are never
clobbered — updates only refresh links/technologies and fill empty text.
"""
from __future__ import annotations

from datetime import datetime, timezone

from django.conf import settings
from django.utils import timezone as dj_timezone
from django.utils.text import slugify

import requests

from .models import Project, TechStack

GITHUB_API = "https://api.github.com"
_RECENT_DAYS = 120  # pushed within this window → date range ends in "present"


def _headers():
    headers = {"Accept": "application/vnd.github+json"}
    token = getattr(settings, "GITHUB_TOKEN", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _parse_dt(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _format_date_range(created, pushed):
    """e.g. 'Nov 2023 – present' or 'Nov 2023 – Mar 2024'."""
    start = _parse_dt(created)
    end = _parse_dt(pushed)
    if not start:
        return ""
    start_str = start.strftime("%b %Y")
    if end:
        recent = (datetime.now(timezone.utc) - end).days <= _RECENT_DAYS
        end_str = "present" if recent else end.strftime("%b %Y")
    else:
        end_str = "present"
    return f"{start_str} – {end_str}"


def _prettify(name: str) -> str:
    """'my-cool_project' → 'My Cool Project'."""
    return name.replace("-", " ").replace("_", " ").strip().title()


def _unique_slug(name: str, repo_id: int) -> str:
    base = slugify(name) or f"repo-{repo_id}"
    slug = base
    n = 2
    qs = Project.objects.exclude(github_repo_id=repo_id)
    while qs.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _fetch_repos(username: str):
    """All of the user's public, non-fork, non-archived repos."""
    repos, page = [], 1
    while True:
        resp = requests.get(
            f"{GITHUB_API}/users/{username}/repos",
            headers=_headers(),
            params={"type": "owner", "sort": "pushed", "per_page": 100, "page": page},
            timeout=20,
        )
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        repos.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return [
        r for r in repos
        if not r.get("private") and not r.get("fork") and not r.get("archived")
    ]


def _fetch_languages(username: str, repo_name: str):
    resp = requests.get(
        f"{GITHUB_API}/repos/{username}/{repo_name}/languages",
        headers=_headers(), timeout=20,
    )
    if resp.status_code != 200:
        return []
    return list(resp.json().keys())


def _apply_technologies(project: Project, languages):
    for lang in languages:
        tech, _ = TechStack.objects.get_or_create(name=lang)
        project.technologies.add(tech)


def sync_github_repos(username: str | None = None):
    """Run the sync. Returns a summary dict."""
    username = username or getattr(settings, "GITHUB_USERNAME", "")
    if not username:
        raise ValueError("GITHUB_USERNAME is not configured.")

    created = updated = 0
    repos = _fetch_repos(username)

    for repo in repos:
        repo_id = repo["id"]
        languages = _fetch_languages(username, repo["name"])
        defaults_common = {
            "github_link": repo.get("html_url", ""),
            "live_url": repo.get("homepage") or "",
            "last_synced_at": dj_timezone.now(),
            "is_github_managed": True,
        }

        project = Project.objects.filter(github_repo_id=repo_id).first()
        if project is None:
            # CREATE as a draft with everything GitHub can give us.
            project = Project(
                github_repo_id=repo_id,
                title=_prettify(repo["name"]),
                slug=_unique_slug(repo["name"], repo_id),
                description=repo.get("description") or "",
                date_range=_format_date_range(repo.get("created_at"), repo.get("pushed_at")),
                published=False,
                **defaults_common,
            )
            project.save()
            _apply_technologies(project, languages)
            created += 1
        else:
            # UPDATE: refresh links + tech; fill description only if still empty.
            # Never overwrite curated fields (title, role, category, points...).
            project.github_link = defaults_common["github_link"]
            project.live_url = defaults_common["live_url"]
            project.is_github_managed = True
            project.last_synced_at = defaults_common["last_synced_at"]
            if not project.description:
                project.description = repo.get("description") or ""
            if not project.date_range:
                project.date_range = _format_date_range(repo.get("created_at"), repo.get("pushed_at"))
            project.save()
            _apply_technologies(project, languages)
            updated += 1

    return {"created": created, "updated": updated, "total_repos": len(repos)}

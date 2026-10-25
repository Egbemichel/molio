"""Admin-only actions that aren't tied to one model."""
import logging

import requests
from django.conf import settings
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


@require_POST
@staff_member_required
def rebuild_site(request):
    """Trigger a Cloudflare Pages build so admin edits reach the public site."""
    back = request.POST.get('next') or request.META.get('HTTP_REFERER') or '/admin/'
    if not url_has_allowed_host_and_scheme(back, allowed_hosts={request.get_host()}):
        back = '/admin/'

    if not settings.DEPLOY_HOOK_URL:
        messages.error(request, 'No deploy hook configured. Add DEPLOY_HOOK_URL to your .env (see DEPLOY.md).')
        return redirect(back)

    try:
        resp = requests.post(settings.DEPLOY_HOOK_URL, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as exc:
        # Never log the hook URL itself: it's a credential.
        logger.warning('Deploy hook failed: %s', type(exc).__name__)
        messages.error(request, f'Rebuild failed ({type(exc).__name__}). Try again, or check the hook in Cloudflare.')
        return redirect(back)

    messages.success(request, 'Rebuild started. The public site updates in about two minutes.')
    return redirect(back)

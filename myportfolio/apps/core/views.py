from django.shortcuts import render
from apps.projects.models import Project

def home(request):
    projects = Project.objects.prefetch_related('tags').all()
    return render(request, 'core/home.html', {'projects': projects})

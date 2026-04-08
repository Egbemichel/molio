from django.shortcuts import render
from apps.projects.models import Project, Category

def home(request):
    projects = Project.objects.prefetch_related('technologies').all()
    categories = Category.objects.prefetch_related('projects', 'projects__technologies').all()
    return render(request, 'core/home.html', {
        'projects': projects,
        'categories': categories
    })

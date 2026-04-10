from django.shortcuts import render
from apps.projects.models import Project, Category
from datetime import date

def home(request):
    projects = Project.objects.prefetch_related('technologies').all()
    categories = Category.objects.prefetch_related('projects', 'projects__technologies').all()
    
    # Calculate age dynamically
    birth_date = date(2005, 8, 20)
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    return render(request, 'core/home.html', {
        'projects': projects,
        'categories': categories,
        'age': age
    })

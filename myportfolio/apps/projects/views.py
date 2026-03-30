# apps/projects/views.py
from django.shortcuts import render
from .models import Category # <-- Check this import!

def home_view(request):
    # Fetch all categories AND their projects
    categories = Category.objects.prefetch_related('projects').all()
    
    # DEBUG: This will print in your terminal/cmd where you ran 'runserver'
    print(f"CATEGORIES IN DB: {categories.count()}")
    for cat in categories:
        print(f"- {cat.name} has {cat.projects.count()} projects")

    return render(request, 'home.html', {'categories': categories})
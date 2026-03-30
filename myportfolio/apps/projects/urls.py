from django.urls import path
from . import views

# Remove the admin import and admin path from here!
# They belong in the main project config, not the projects app.

urlpatterns = [
    # If you have a view for your portfolio home, add it here
    # path('', views.home_view, name='home'),
]
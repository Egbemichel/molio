from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('whichdb/', views.whichdb, name='whichdb'),  # TEMP debug — remove after
    path('contact/', views.contact, name='contact'),
    path('api/feedback/', views.submit_feedback, name='submit_feedback'),
    path('api/feedback/get/', views.get_feedback, name='get_feedback'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/feedback/', views.submit_feedback, name='submit_feedback'),
    path('api/feedback/get/', views.get_feedback, name='get_feedback'),
]

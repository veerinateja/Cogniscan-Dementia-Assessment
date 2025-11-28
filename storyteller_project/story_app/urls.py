from django.urls import path
from . import views

urlpatterns = [
    # This URL serves the main HTML page
    path('', views.index, name='index'),
    # This URL serves the about page
    path('about/', views.about, name='about'),
    # API endpoint for transcription and question generation
    path('api/process-audio/', views.process_audio_and_generate_questions, name='process_audio_and_generate_questions'),
    # NEW API endpoint for checking the user's answer
    path('api/check-answer/', views.check_user_answer, name='check_user_answer'),
]
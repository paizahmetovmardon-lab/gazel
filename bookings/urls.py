from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('api/booking/create/', views.create_booking_view, name='create_booking'),
]

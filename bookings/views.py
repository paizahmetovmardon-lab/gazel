from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from datetime import datetime
from .models import Booking

def home_view(request):
    return render(request, 'bookings/index.html')

@require_POST
def create_booking_view(request):
    try:
        data = json.loads(request.body)
        name = data.get('name')
        phone = data.get('phone')
        destination_lat = data.get('destination_lat')
        destination_lng = data.get('destination_lng')
        destination_name = data.get('destination_name')
        booking_date_str = data.get('booking_date')

        if not all([name, phone, destination_lat, destination_lng, destination_name, booking_date_str]):
            return JsonResponse({'status': 'error', 'message': 'Пожалуйста, заполните все поля и выберите место на карте.'}, status=400)

        try:
            booking_date = datetime.strptime(booking_date_str, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'status': 'error', 'message': 'Неверный формат даты.'}, status=400)

        booking = Booking.objects.create(
            name=name,
            phone=phone,
            destination_lat=float(destination_lat),
            destination_lng=float(destination_lng),
            destination_name=destination_name,
            booking_date=booking_date
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Ваш заказ успешно принят! Мы свяжемся с вами в ближайшее время.',
            'booking_id': booking.id
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Ошибка сервера: {str(e)}'}, status=500)

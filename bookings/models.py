from django.db import models

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает (Pending)'),
        ('confirmed', 'Подтвержден (Confirmed)'),
        ('completed', 'Завершен (Completed)'),
        ('cancelled', 'Отменен (Cancelled)'),
    ]

    name = models.CharField(max_length=100, verbose_name="Имя клиента")
    phone = models.CharField(max_length=20, verbose_name="Номер телефона")
    destination_lat = models.FloatField(verbose_name="Широта назначения (Lat)")
    destination_lng = models.FloatField(verbose_name="Долгота назначения (Lng)")
    destination_name = models.CharField(max_length=255, verbose_name="Место назначения (Адрес)")
    booking_date = models.DateField(verbose_name="Дата поездки")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Время заказа")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус заказа")

    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.destination_name} ({self.booking_date})"

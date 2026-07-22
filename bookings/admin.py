from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'booking_date', 'destination_name', 'status', 'created_at')
    list_filter = ('status', 'booking_date', 'created_at')
    search_fields = ('name', 'phone', 'destination_name')
    list_editable = ('status',)
    date_hierarchy = 'booking_date'
    ordering = ('-created_at',)

from django.contrib import admin

from accounts.models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "full_name", "mobile_number", "gender"]
    search_fields = ["user__username", "user__email", "full_name", "mobile_number"]

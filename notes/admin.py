from django.contrib import admin

from notes.models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ["id", "owner", "title", "created_at", "modified_at"]
    search_fields = ["title", "description", "owner__username", "owner__email"]

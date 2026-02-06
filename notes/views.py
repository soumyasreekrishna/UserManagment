from rest_framework import filters, permissions, viewsets

from notes.models import Note
from notes.serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NoteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "modified_at", "title"]

    def get_queryset(self):
        return Note.objects.filter(owner=self.request.user).order_by("-modified_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

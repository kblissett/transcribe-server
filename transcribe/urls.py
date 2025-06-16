from django.urls import path

from .views import index, record, transcribe_audio

urlpatterns = [
    path("", index, name="index"),
    path("record/", record, name="record"),
    path("transcribe/", transcribe_audio, name="transcribe_audio"),
]

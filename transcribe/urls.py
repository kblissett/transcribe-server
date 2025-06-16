from django.urls import path

from .views import index, record

urlpatterns = [
    path("", index, name="index"),
    path("record/", record, name="record"),
]

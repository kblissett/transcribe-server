from django.shortcuts import render


# Create your views here.
def index(request):
    """
    Render the index page.
    """
    return render(request, "transcribe/index.html")


def record(request):
    """
    Render the audio recording page.
    """
    return render(request, "transcribe/record.html")

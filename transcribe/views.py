import os
import tempfile

import openai
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods


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


@require_http_methods(["POST"])
def transcribe_audio(request):
    """
    Transcribe uploaded audio file using OpenAI's speech-to-text API.
    """
    try:
        # Check if audio file is in request
        if "audio" not in request.FILES:
            return JsonResponse({"error": "No audio file provided"}, status=400)

        audio_file = request.FILES["audio"]

        # Validate file size (max 25MB for OpenAI API)
        if audio_file.size > 25 * 1024 * 1024:
            return JsonResponse(
                {"error": "File too large. Maximum size is 25MB."}, status=400
            )

        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            # Check if OpenAI API key is configured
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                return JsonResponse(
                    {
                        "error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
                    },
                    status=500,
                )

            # Initialize OpenAI client
            client = openai.OpenAI(api_key=api_key)

            # Open the audio file and transcribe
            with open(temp_file_path, "rb") as audio_file_handle:
                transcript = client.audio.transcriptions.create(
                    model="gpt-4o-transcribe",
                    file=audio_file_handle,
                    response_format="text",
                )

            return JsonResponse({"success": True, "transcription": transcript})

        except openai.OpenAIError as e:
            return JsonResponse({"error": f"OpenAI API error: {str(e)}"}, status=500)

        except Exception as e:
            return JsonResponse(
                {"error": f"Transcription failed: {str(e)}"}, status=500
            )

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        return JsonResponse(
            {"error": f"Request processing failed: {str(e)}"}, status=500
        )

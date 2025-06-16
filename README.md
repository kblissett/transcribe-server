# Transcribe Server

Transcribe Server is a Django application that lets you record audio in the browser and use OpenAI's speech-to-text API to produce transcripts.  The project provides a minimal interface for recording, downloading and transcribing audio clips.

## Features

- Modern web UI built with Django templates and static assets
- Client side audio recorder implemented in JavaScript
- Uploads the recording and returns the transcription using the `gpt-4o-transcribe` model

## Requirements

- Python 3.13+
- An [OpenAI](https://openai.com/) API key set in the `OPENAI_API_KEY` environment variable
- The [`uv`](https://github.com/astral-sh/uv) package manager to install dependencies

## Installation

1. Clone this repository.
2. (Optional) Create and activate a virtual environment.
3. Install dependencies:

```bash
uv sync
```

4. Apply database migrations and start the development server:

```bash
uv run manage.py migrate
uv run manage.py runserver
```

The site will be available at `http://127.0.0.1:8000/`.

## Usage

- Visit the home page and choose **Record** to open the audio recorder.
- Click the microphone button to start and stop recording.
- After recording, click **Transcribe** to send the audio to OpenAI and display the resulting text.
- You can also download the audio file for local use.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.


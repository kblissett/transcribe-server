// Audio Recorder JavaScript
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.startTime = null;
        this.timerInterval = null;
        this.staticUrl = '/static/transcribe/icons/';

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.statusText = document.getElementById('statusText');
        this.timer = document.getElementById('timer');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.audioSection = document.getElementById('audioSection');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.transcribeBtn = document.getElementById('transcribeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newRecordingBtn = document.getElementById('newRecordingBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.transcriptionSection = document.getElementById('transcriptionSection');
        this.transcriptionLoading = document.getElementById('transcriptionLoading');
        this.transcriptionText = document.getElementById('transcriptionText');
        this.copyTranscriptionBtn = document.getElementById('copyTranscriptionBtn');
    }

    attachEventListeners() {
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.transcribeBtn.addEventListener('click', () => this.transcribeAudio());
        this.downloadBtn.addEventListener('click', () => this.downloadAudio());
        this.newRecordingBtn.addEventListener('click', () => this.startNewRecording());
        this.copyTranscriptionBtn.addEventListener('click', () => this.copyTranscription());
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            // Hide any previous error messages
            this.hideError();

            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Create MediaRecorder instance
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: this.getSupportedMimeType()
            });

            this.audioChunks = [];

            // Handle data available event
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Handle stop event
            this.mediaRecorder.onstop = () => {
                this.createAudioBlob();
            };

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();

            // Update UI
            this.updateUIForRecording();
            this.startTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to access microphone. Please check your permissions and try again.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            // Stop all tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            // Update UI
            this.updateUIForStopped();
            this.stopTimer();
        }
    }

    createAudioBlob() {
        const audioBlob = new Blob(this.audioChunks, {
            type: this.getSupportedMimeType()
        });

        const audioUrl = URL.createObjectURL(audioBlob);
        this.audioPlayer.src = audioUrl;
        this.audioBlob = audioBlob;

        // Show audio section
        this.audioSection.style.display = 'block';
    }

    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];

        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // Fallback
    }

    updateUIForRecording() {
        this.recordBtn.classList.add('recording');
        this.statusText.textContent = 'Recording...';
        this.timer.style.display = 'block';
        this.audioSection.style.display = 'none';
    }

    updateUIForStopped() {
        this.recordBtn.classList.remove('recording');
        this.statusText.textContent = 'Recording complete';
        this.timer.style.display = 'none';
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.startTime) {
                const elapsed = Date.now() - this.startTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.timerDisplay.textContent =
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    downloadAudio() {
        if (this.audioBlob) {
            const url = URL.createObjectURL(this.audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    startNewRecording() {
        // Reset UI
        this.statusText.textContent = 'Ready to record';
        this.timerDisplay.textContent = '00:00';
        this.audioSection.style.display = 'none';
        this.transcriptionSection.style.display = 'none';
        this.hideError();

        // Clean up previous recording
        if (this.audioPlayer.src) {
            URL.revokeObjectURL(this.audioPlayer.src);
            this.audioPlayer.src = '';
        }

        this.audioBlob = null;
        this.audioChunks = [];
        this.transcriptionText.textContent = '';
        this.copyTranscriptionBtn.style.display = 'none';
    }

    async transcribeAudio() {
        if (!this.audioBlob) {
            this.showError('No audio recording available to transcribe.');
            return;
        }

        try {
            // Show loading state
            this.transcriptionSection.style.display = 'block';
            this.transcriptionLoading.style.display = 'flex';
            this.transcriptionText.textContent = '';
            this.copyTranscriptionBtn.style.display = 'none';
            this.transcribeBtn.disabled = true;
            this.transcribeBtn.textContent = 'Transcribing...';

            // Create FormData and append the audio file
            const formData = new FormData();
            formData.append('audio', this.audioBlob, 'recording.webm');

            // Get CSRF token
            const csrfToken = this.getCSRFToken();

            // Send transcription request
            const response = await fetch('/transcribe/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken,
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Display transcription
                this.transcriptionText.textContent = result.transcription;
                this.copyTranscriptionBtn.style.display = 'inline-flex';
                this.hideError();
            } else {
                throw new Error(result.error || 'Transcription failed');
            }

        } catch (error) {
            console.error('Transcription error:', error);
            this.showError(`Transcription failed: ${error.message}`);
        } finally {
            // Hide loading state
            this.transcriptionLoading.style.display = 'none';
            this.transcribeBtn.disabled = false;
            this.transcribeBtn.innerHTML = `
                <img src="${this.staticUrl}transcribe.svg" alt="Transcribe">
                Transcribe
            `;
        }
    }

    async copyTranscription() {
        try {
            await navigator.clipboard.writeText(this.transcriptionText.textContent);

            // Temporarily change button text to show success
            const originalContent = this.copyTranscriptionBtn.innerHTML;
            this.copyTranscriptionBtn.innerHTML = `
                <img src="${this.staticUrl}check.svg" alt="Copied">
                Copied!
            `;

            setTimeout(() => {
                this.copyTranscriptionBtn.innerHTML = originalContent;
            }, 2000);

        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Failed to copy transcription to clipboard.');
        }
    }

    getCSRFToken() {
        // Get CSRF token from meta tag or cookie
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }

        // Fallback to cookie
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];

        return cookieValue || '';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }
}

// Initialize the audio recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if browser supports required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.';
        errorMessage.style.display = 'block';

        const recordBtn = document.getElementById('recordBtn');
        recordBtn.disabled = true;
        recordBtn.style.opacity = '0.5';
        recordBtn.style.cursor = 'not-allowed';
        return;
    }

    if (!window.MediaRecorder) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'MediaRecorder API is not supported in your browser.';
        errorMessage.style.display = 'block';
        return;
    }

    // Initialize the recorder
    new AudioRecorder();
});

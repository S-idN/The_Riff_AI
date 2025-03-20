from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import whisper
import torch
import tempfile
import os

input_router = APIRouter()

# ------------------------ #
# Model Loading Section    #
# ------------------------ #
try:
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load Whisper model for local speech-to-text
    whisper_model = whisper.load_model("base").to(device)  # Change to "base" or "medium" for better accuracy

    # Load NLP models (Updated for higher accuracy)
    mood_pipeline = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest", device=0 if torch.cuda.is_available() else -1)
    emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None, device=0 if torch.cuda.is_available() else -1)
    intent_context_model = SentenceTransformer("all-mpnet-base-v2")
except Exception as e:
    raise RuntimeError(f"Error loading models: {e}")

# ------------------------ #
# Request/Response Schemas #
# ------------------------ #
class TextInput(BaseModel):
    text: str

class UserInputResponse(BaseModel):
    mood: str
    emotion: str
    intent_context_embedding: list[float]

# ------------------------ #
# Helper Functions         #
# ------------------------ #
async def extract_text_from_audio(file: UploadFile) -> str:
    """Extracts text from an uploaded audio file using Whisper."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(await file.read())
            temp_audio.flush()
            audio_path = temp_audio.name

        print(f"🔹 Processing audio file: {audio_path}")  # Debugging log

        result = whisper_model.transcribe(audio_path)
        os.remove(audio_path)  # Cleanup temp file

        text = result["text"].strip()
        return text if text else "Unable to recognize speech"
    except Exception as e:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise HTTPException(status_code=500, detail=f"Audio transcription error: {str(e)}")

async def analyze_text(text: str) -> dict:
    """Analyzes text for mood, emotion, and generates an intent-context embedding."""
    text = text.strip()
    
    # Fallback if empty text or unrecognized audio
    if not text or text == "Unable to recognize speech":
        return {
            "mood": "neutral",
            "emotion": "neutral",
            "intent_context_embedding": [0.0] * 768
        }

    print(f"🔹 Analyzing text: {text}")  # Debugging log

    try:
        # Extract mood
        mood_result = mood_pipeline(text)
        mood = mood_result[0]['label'] if mood_result else "neutral"

        # Extract emotion
        emotion_scores = emotion_pipeline(text)
        emotion = max(emotion_scores[0], key=lambda x: x['score'])['label'] if emotion_scores else "neutral"

        # Generate intent-context embedding
        embedding = intent_context_model.encode(text, convert_to_numpy=True).tolist()

        return {
            "mood": mood,
            "emotion": emotion,
            "intent_context_embedding": embedding
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text analysis error: {str(e)}")

# ------------------------ #
# API Endpoints            #
# ------------------------ #
@input_router.post("/analyze_text", response_model=UserInputResponse)
async def analyze_text(text: str) -> dict:
    text = text.strip()
    
    if not text or text == "Unable to recognize speech":
        return {
            "mood": "neutral",
            "emotion": "neutral",
            "intent_context_embedding": [0.0] * 768
        }

    mood_result = mood_pipeline(text)
    mood = mood_result[0]['label'] if mood_result else "neutral"

    emotion_scores = emotion_pipeline(text)
    
    if emotion_scores:
        # Sort by confidence and pick the highest scoring emotion
        top_emotion = max(emotion_scores[0], key=lambda x: x['score'])
        emotion = top_emotion['label']
        emotion_confidence = top_emotion['score']
    else:
        emotion = "neutral"
        emotion_confidence = 0.0

    embedding = intent_context_model.encode(text, convert_to_numpy=True).tolist()

    return {
        "mood": mood,
        "emotion": emotion,
        "emotion_confidence": emotion_confidence,  # <-- Add this for debugging
        "intent_context_embedding": embedding
    }

@input_router.post("/analyze_audio", response_model=UserInputResponse)
async def analyze_audio_endpoint(file: UploadFile = File(...)):
    """
    Extract text from uploaded audio file using Whisper and analyze it.
    Returns fallback response if speech recognition fails.
    """
    print(f"🔹 Received audio file: {file.filename}, Content-Type: {file.content_type}")  # Debugging log
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

    text = await extract_text_from_audio(file)
    print(f"🔹 Transcribed Text: {text}")  # Debugging log

    result = await analyze_text(text)
    return UserInputResponse(**result)

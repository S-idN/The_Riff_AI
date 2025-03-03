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
    whisper_model = whisper.load_model("small").to(device)  # Change to "base" or "medium" for better accuracy

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
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(await file.read())
        temp_audio.flush()
        audio_path = temp_audio.name

    try:
        result = whisper_model.transcribe(audio_path)
        os.remove(audio_path)  # Cleanup temp file
        return result["text"].strip() if result["text"].strip() else "Unable to recognize speech"
    except Exception as e:
        os.remove(audio_path)
        raise HTTPException(status_code=500, detail=f"Audio transcription error: {str(e)}")

async def analyze_text(text: str) -> dict:
    text = text.strip()
    
    # Fallback if empty text or unrecognized audio
    if not text or text == "Unable to recognize speech":
        return {
            "mood": "neutral",
            "emotion": "neutral",
            "intent_context_embedding": [0.0] * 768
        }

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

# ------------------------ #
# API Endpoints            #
# ------------------------ #
@input_router.post("/analyze_text", response_model=UserInputResponse)
async def analyze_text_endpoint(input: TextInput):
    """
    Analyze provided text and extract mood, emotion, and intent-context embedding.
    """
    result = await analyze_text(input.text)
    return UserInputResponse(**result)


@input_router.post("/analyze_audio", response_model=UserInputResponse)
async def analyze_audio_endpoint(file: UploadFile = File(...)):
    """
    Extract text from uploaded audio file using Whisper and analyze it.
    Returns fallback response if speech recognition fails.
    """
    text = await extract_text_from_audio(file)
    result = await analyze_text(text)
    return UserInputResponse(**result)

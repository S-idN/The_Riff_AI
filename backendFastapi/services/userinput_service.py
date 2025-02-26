from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import speech_recognition as sr
import tempfile

input_router = APIRouter()

# ------------------------ #
# Model Loading Section    #
# ------------------------ #
try:
    mood_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    emotion_pipeline = pipeline("text-classification", model="nateraw/bert-base-uncased-emotion", top_k=None)
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
def extract_text_from_audio(file: UploadFile) -> str:
    recognizer = sr.Recognizer()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(file.file.read())
        temp_audio.flush()
        try:
            with sr.AudioFile(temp_audio.name) as source:
                audio = recognizer.record(source)
            return recognizer.recognize_google(audio)
        except sr.UnknownValueError:
            # Failsafe: Return default text if audio is not understood
            return "Unable to recognize speech"
        except sr.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Speech Recognition API error: {e}")


def analyze_text(text: str) -> dict:
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
def analyze_text_endpoint(input: TextInput):
    """
    Analyze provided text and extract mood, emotion, and intent-context embedding.
    """
    result = analyze_text(input.text)
    return UserInputResponse(**result)


@input_router.post("/analyze_audio", response_model=UserInputResponse)
def analyze_audio_endpoint(file: UploadFile = File(...)):
    """
    Extract text from uploaded audio file and analyze it.
    Returns fallback response if speech recognition fails.
    """
    text = extract_text_from_audio(file)
    result = analyze_text(text)
    return UserInputResponse(**result)

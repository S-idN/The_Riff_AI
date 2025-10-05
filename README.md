# 🎵 Riff AI

**Riff AI** is a transformer-based, emotion-centric music recommendation system designed to generate playlists aligned with a user’s emotional state. Unlike traditional recommendation systems that rely solely on collaborative or content-based filtering, Riff AI leverages modern **transformer architectures** and **contrastive learning** to understand emotional context and provide truly personalized music recommendations.

---

## 🚀 Features

* 🎧 **Emotion-based playlist generation** from text or audio input
* 🧠 **Transformer-powered emotion detection** using models like DistilBERT and RoBERTa
* 🔊 **Speech-to-text transcription** with Whisper for audio inputs
* 💡 **Dual-tower embedding model** for matching user emotions and song features
* ⚡ **Seamless integration** between React Native frontend, Django orchestration, and FastAPI AI inference
* 🌦️ **Context-aware recommendation** (optional) using features like weather, time, and location
* 🪄 **Cross-platform** — compatible with both Android and iOS via Expo

---

## 🧰 Tech Stack

* **Frontend:** React Native + Expo
* **Backend:** Django (API orchestration, Spotify OAuth, and playlist management)
* **AI Microservice:** FastAPI (emotion detection, sentiment analysis, and audio transcription)
* **Frameworks/Libraries:** PyTorch, HuggingFace Transformers
* **APIs:** Spotify Web API, Last.fm API
* **Hosting:** Google Cloud Platform (GCP)

---

## ⚙️ How It Works

1. **Input Processing:** Users provide either text or voice input via the mobile app.
2. **Emotion Analysis:** Audio input is transcribed with Whisper and analyzed using fine-tuned transformer models (DistilBERT, RoBERTa) to classify emotion and mood.
3. **Embedding Generation:** A dual-tower model maps user emotions and song features into a shared embedding space for similarity matching.
4. **Playlist Recommendation:** The system retrieves songs whose embeddings closely align with the detected emotion, building a personalized playlist.
5. **Optional Contextual Features:** Weather, time, and GeoIP data can refine recommendations further.

---

## 🧩 Setup & Development

### Clone the repository

```bash
git clone https://github.com/yourusername/riff-ai.git
cd riff-ai
```

### Backend Setup

```bash
# Install dependencies
yarn install  # or npm install

# Run backend services
python manage.py runserver  # Django API
uvicorn main:app --reload --port 8001  # FastAPI service
```

### Frontend Setup

```bash
cd frontend
npm install
npm start  # or expo start
```

> Ensure that both backend services (Django + FastAPI) are running and that the app is configured to connect to their respective ports.

---

## 📱 App Overview

Riff AI delivers a seamless experience across devices:

* Text or audio input to detect mood
* Instant emotion analysis feedback
* Curated playlist preview and export to Spotify
---

## 🧪 Testing

* ✅ Unit tests for authentication and playlist generation modules
* 🔗 End-to-end integration between frontend, FastAPI, and Django
* 📱 Validated across Android and iOS simulators

---

## 🧭 Future Enhancements

* 🎶 Add in-app database for improved offline caching
* 🧩 Integrate fine-tuned custom emotion models
* 🎙️ Expand to include voice-driven interaction and commentary
* 💾 Introduce local storage for user history and analytics

---

## 🩵 Contributing

Contributions, ideas, and feature suggestions are welcome!
Submit issues or pull requests to help improve Riff AI.

---

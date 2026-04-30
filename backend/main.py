import json
import os
import base64
import re
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse
from twilio.twiml.voice_response import VoiceResponse
from services.jalsetu_engine import get_water_advice

load_dotenv()

app = FastAPI(title="KRISHIVE API")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")
ALLOW_CREDENTIALS = FRONTEND_ORIGIN != "*"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_API_BASE = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1").rstrip("/")
APP_ENV = os.getenv("APP_ENV", "development")
DEFAULT_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")
LANG_MODEL = os.getenv("GROQ_LANG_MODEL", "llama-3.1-8b-instant")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "20"))
FALLBACK_CHAT_MODEL = os.getenv("GROQ_FALLBACK_CHAT_MODEL", "llama-3.1-8b-instant")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "").strip()
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
GROQ_VISION_FALLBACK_MODEL = os.getenv("GROQ_VISION_FALLBACK_MODEL", "").strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN != "*" else ["*"],
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VoiceQueryReq(BaseModel):
    text: str
    language: str = "auto"
    groq_api_key: str | None = None
    location: dict[str, Any] | None = None


class WaterAdviceReq(BaseModel):
    crop: str
    soil_condition: str
    temperature: float
    humidity: float
    rain_forecast: bool
    location: dict[str, Any] | None = None


class WeatherByLocationReq(BaseModel):
    lat: float
    lon: float


class FertilizerSuggestionReq(BaseModel):
    crop: str
    soil_ph: float | None = None
    nitrogen_level: str | None = None
    phosphorus_level: str | None = None
    potassium_level: str | None = None
    growth_stage: str | None = None
    visible_symptoms: str | None = None


def get_groq_key(override_key: str | None = None):
    if override_key and override_key.strip():
        return override_key.strip()
    return GROQ_API_KEY


def post_groq(payload: dict[str, Any], groq_key: str):
    url = f"{GROQ_API_BASE}/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
    }
    return requests.post(url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)


def extract_error_message(response: requests.Response):
    try:
        payload = response.json()
        return payload.get("error", {}).get("message") or str(payload)
    except Exception:
        return response.text


def parse_json_object(text: str):
    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("Empty model response")

    # Try direct JSON parse first
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Fallback for markdown/fenced responses
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        raise ValueError("No JSON object found in response")
    return json.loads(match.group(0))


def parse_language_from_content(content: str):
    cleaned = content.strip().lower()
    try:
        parsed = json.loads(cleaned)
        lang = str(parsed.get("language", "")).strip().lower()
        if len(lang) == 2:
            return lang
    except Exception:
        pass

    cleaned = cleaned.replace('"', "").replace("'", "").replace("`", "").strip()
    if len(cleaned) >= 2:
        candidate = cleaned[:2]
        if candidate.isalpha():
            return candidate
    return ""


def detect_language_groq(text: str, fallback_language: str, override_key: str | None = None):
    groq_key = get_groq_key(override_key)
    if not groq_key:
        return fallback_language if fallback_language != "auto" else "en"

    payload = {
        "model": LANG_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Detect the language of the user's text. "
                    "Return only the 2-letter ISO 639-1 code (example: en, hi, ta)."
                ),
            },
            {"role": "user", "content": text},
        ],
        "temperature": 0,
    }

    try:
        res = post_groq(payload, groq_key)
        res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"]
        lang = parse_language_from_content(content)
        if len(lang) == 2:
            return lang
    except Exception:
        pass
    return fallback_language if fallback_language != "auto" else "en"


def ask_groq(
    user_text: str,
    language: str,
    override_key: str | None = None,
    location: dict[str, Any] | None = None,
):
    groq_key = get_groq_key(override_key)
    if not groq_key:
        return {
            "ok": True,
            "answer": (
                "Service is running in demo mode because no Groq API key is configured. "
                "Provide `GROQ_API_KEY` in backend `.env` or send it from the frontend."
            ),
        }

    location_bits = []
    if location:
        district = str(location.get("district") or "").strip()
        state = str(location.get("state") or "").strip()
        if district:
            location_bits.append(district)
        if state:
            location_bits.append(state)

    location_prompt = ""
    if location_bits:
        location_prompt = (
            "The farmer is located in "
            + ", ".join(location_bits)
            + ". Give localized advice based on climate and region. "
        )

    system_prompt = (
        "You are a professional agriculture advisory assistant for India. "
        "Provide practical, safe, concise, and actionable guidance. "
        "Use simple wording and short paragraphs. "
        + location_prompt
        + " "
        f"Respond in language code `{language}`."
    )
    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        "temperature": 0.2,
    }

    try:
        res = post_groq(payload, groq_key)
        if res.status_code == 400 and FALLBACK_CHAT_MODEL and FALLBACK_CHAT_MODEL != DEFAULT_MODEL:
            fallback_payload = {
                **payload,
                "model": FALLBACK_CHAT_MODEL,
            }
            res = post_groq(fallback_payload, groq_key)
        if not res.ok:
            return {
                "ok": False,
                "answer": f"Model provider rejected the request: {extract_error_message(res)}",
            }
        return {"ok": True, "answer": res.json()["choices"][0]["message"]["content"]}
    except Exception as exc:
        return {"ok": False, "answer": f"Unable to contact model provider: {str(exc)}"}


def is_water_query(text: str):
    lowered = text.lower()
    keywords = ["water", "irrigation", "paani", "sinchai", "पानी", "सिंचाई"]
    return any(word in lowered for word in keywords)


def infer_water_inputs(text: str):
    lowered = text.lower()
    crop_map = {
        "wheat": ["wheat", "gehun", "गेहूं"],
        "rice": ["rice", "paddy", "dhaan", "धान"],
        "maize": ["maize", "corn", "makka", "मक्का"],
        "cotton": ["cotton", "kapas", "कपास"],
        "sugarcane": ["sugarcane", "ganna", "गन्ना"],
    }

    crop = "wheat"
    for key, aliases in crop_map.items():
        if any(alias in lowered for alias in aliases):
            crop = key
            break

    soil = "medium"
    if any(token in lowered for token in ["dry", "sukhi", "सूखी"]):
        soil = "dry"
    elif any(token in lowered for token in ["wet", "geeli", "गीली"]):
        soil = "wet"

    rain_forecast = any(token in lowered for token in ["rain", "baarish", "बारिश", "monsoon", "मेघ"])
    return {
        "crop": crop,
        "soil_condition": soil,
        "temperature": 30.0,
        "humidity": 55.0,
        "rain_forecast": rain_forecast,
    }


def fetch_rain_forecast_by_location(location: dict[str, Any] | None):
    if not location:
        return None

    lat = location.get("lat")
    lon = location.get("lon")
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return None

    if abs(lat) < 0.0001 and abs(lon) < 0.0001:
        return None

    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}&daily=precipitation_sum&forecast_days=1&timezone=auto"
    )
    try:
        response = requests.get(url, timeout=3)
        if not response.ok:
            return None
        daily = response.json().get("daily", {})
        precipitation = daily.get("precipitation_sum", [])
        if not precipitation:
            return None
        rainfall_mm = float(precipitation[0])
        return rainfall_mm >= 2.0
    except Exception:
        return None


def fetch_openweather_snapshot(lat: float, lon: float):
    if not OPENWEATHER_API_KEY:
        return None

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    )
    try:
        response = requests.get(url, timeout=5)
        if not response.ok:
            return None
        payload = response.json()
        main = payload.get("main", {})
        rain = payload.get("rain", {})
        weather = payload.get("weather", [])
        weather_main = str((weather[0] if weather else {}).get("main", "")).lower()
        rain_mm = float(rain.get("1h", 0) or rain.get("3h", 0) or 0)
        rain_forecast = rain_mm > 0 or ("rain" in weather_main or "drizzle" in weather_main or "thunderstorm" in weather_main)
        return {
            "temperature": main.get("temp"),
            "humidity": main.get("humidity"),
            "rain_forecast": rain_forecast,
        }
    except Exception:
        return None


def detect_disease_with_groq(file_bytes: bytes, content_type: str):
    groq_key = get_groq_key(None)
    if not groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is missing in backend environment.")

    encoded = base64.b64encode(file_bytes).decode("utf-8")
    data_uri = f"data:{content_type};base64,{encoded}"

    base_payload = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert plant pathologist and agricultural AI. "
                    "Analyze this crop/plant image and identify any diseases. "
                    "Respond in JSON format with fields: disease_name, confidence (0-100), "
                    "description, treatment_recommendations (array of strings), severity (low/medium/high). "
                    "If no disease is detected, set disease_name to 'Healthy Plant'."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this plant image and return only JSON."},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            },
        ],
        "temperature": 0.1,
        "max_tokens": 700,
    }
    models_to_try = [GROQ_VISION_MODEL]
    if GROQ_VISION_FALLBACK_MODEL and GROQ_VISION_FALLBACK_MODEL != GROQ_VISION_MODEL:
        models_to_try.append(GROQ_VISION_FALLBACK_MODEL)

    response = None
    last_error = ""
    for model in models_to_try:
        payload = {**base_payload, "model": model}
        response = post_groq(payload, groq_key)
        if response.ok:
            break
        last_error = extract_error_message(response)

    if not response or not response.ok:
        raise HTTPException(status_code=502, detail=f"Vision model error: {last_error}")

    content = response.json()["choices"][0]["message"]["content"]
    parsed = parse_json_object(content)

    return {
        "disease_name": str(parsed.get("disease_name") or "Healthy Plant"),
        "confidence": float(parsed.get("confidence") or 0),
        "description": str(parsed.get("description") or "No additional description available."),
        "treatment_recommendations": parsed.get("treatment_recommendations")
        if isinstance(parsed.get("treatment_recommendations"), list)
        else [],
        "severity": str(parsed.get("severity") or "low").lower(),
    }


@app.post("/voice-query")
async def voice_query(req: VoiceQueryReq):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="`text` must not be empty.")

    lang = detect_language_groq(text, req.language, req.groq_api_key)
    if is_water_query(text):
        inferred = infer_water_inputs(text)
        forecast_from_location = fetch_rain_forecast_by_location(req.location)
        if forecast_from_location is not None:
            inferred["rain_forecast"] = forecast_from_location
        water_advice = get_water_advice(**inferred, location=req.location)
        enriched_prompt = (
            f"User query: {text}\n"
            "You must explain irrigation advice in very simple, farmer-friendly language. "
            "Use short sentences and be practical.\n"
            f"Water engine output: {json.dumps(water_advice)}"
        )
        groq_result = ask_groq(enriched_prompt, lang, req.groq_api_key, req.location)
        combined_answer = (
            f"Water decision: {water_advice['decision']}. "
            f"{water_advice['reason']} "
            f"Amount: {water_advice['water_amount']}. "
            f"Timing: {water_advice['timing']}.\n\n"
            f"{groq_result['answer']}"
        )
        return {"answer": combined_answer, "language": lang, "ok": groq_result["ok"]}

    groq_result = ask_groq(text, lang, req.groq_api_key, req.location)
    return {"answer": groq_result["answer"], "language": lang, "ok": groq_result["ok"]}


@app.post("/water-advice")
async def water_advice(req: WaterAdviceReq):
    rain_forecast = req.rain_forecast
    forecast_from_location = fetch_rain_forecast_by_location(req.location)
    if forecast_from_location is not None:
        rain_forecast = forecast_from_location

    result = get_water_advice(
        crop=req.crop,
        soil_condition=req.soil_condition,
        temperature=req.temperature,
        humidity=req.humidity,
        rain_forecast=rain_forecast,
        location=req.location,
    )
    return result


@app.post("/weather-by-location")
async def weather_by_location(req: WeatherByLocationReq):
    data = fetch_openweather_snapshot(req.lat, req.lon)
    if not data:
        raise HTTPException(status_code=503, detail="Weather service unavailable or OPENWEATHER_API_KEY missing.")
    return data


@app.post("/detect-disease")
async def detect_disease(file: UploadFile = File(...)):
    return {
        "disease": "Leaf Blight (Mock)",
        "confidence": 0.85,
        "treatment": "Apply a copper-based fungicide and ensure proper drainage in the field.",
    }


@app.post("/api/detect-disease")
async def detect_disease_api(file: UploadFile = File(...)):
    if not file.content_type or file.content_type not in {"image/jpeg", "image/jpg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Only jpg, png, and webp images are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    result = detect_disease_with_groq(content, file.content_type)
    return result


@app.post("/api/fertilizer-suggestion")
async def fertilizer_suggestion(req: FertilizerSuggestionReq):
    groq_key = get_groq_key(None)
    if not groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is missing in backend environment.")

    system_prompt = (
        "You are an expert agronomist. Based on the soil data and crop information provided, give precise fertilizer recommendations. "
        "Respond in JSON with: primary_fertilizer (name, NPK ratio, dosage, application_method), secondary_fertilizer (optional, same fields), organic_alternatives (array of strings), application_schedule (array of {timing, action}), important_notes (array of strings), estimated_yield_improvement (string)."
    )
    soil_ph = req.soil_ph if req.soil_ph is not None else 6.5
    nitrogen = req.nitrogen_level or "Medium"
    phosphorus = req.phosphorus_level or "Medium"
    potassium = req.potassium_level or "Medium"
    growth = req.growth_stage or "Vegetative"

    user_prompt = (
        f"Crop: {req.crop}\n"
        f"Soil pH: {soil_ph} (assumed if not provided)\n"
        f"Nitrogen level: {nitrogen} (assumed if not provided)\n"
        f"Phosphorus level: {phosphorus} (assumed if not provided)\n"
        f"Potassium level: {potassium} (assumed if not provided)\n"
        f"Growth stage: {growth} (assumed if not provided)\n"
        f"Visible symptoms: {req.visible_symptoms or 'None'}\n\n"
        "If inputs are assumed, keep recommendations conservative and advise a soil test."
    )

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }

    response = post_groq(payload, groq_key)
    if response.status_code == 400 and FALLBACK_CHAT_MODEL and FALLBACK_CHAT_MODEL != DEFAULT_MODEL:
        payload["model"] = FALLBACK_CHAT_MODEL
        response = post_groq(payload, groq_key)

    if not response.ok:
        raise HTTPException(status_code=502, detail=f"Model provider rejected request: {extract_error_message(response)}")

    try:
        content = response.json()["choices"][0]["message"]["content"]
        parsed = parse_json_object(content)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to parse model output as JSON: {str(exc)}")

    def normalize_fertilizer(obj: Any):
        if not isinstance(obj, dict):
            return {}
        name = obj.get("name") or obj.get("Name") or ""
        npk = obj.get("npk_ratio") or obj.get("NPK_ratio") or obj.get("npk") or obj.get("NPK") or ""
        dosage = obj.get("dosage") or obj.get("Dosage") or ""
        method = obj.get("application_method") or obj.get("applicationMethod") or obj.get("method") or ""
        return {
            "name": str(name),
            "npk_ratio": str(npk),
            "dosage": str(dosage),
            "application_method": str(method),
        }

    return {
        "primary_fertilizer": normalize_fertilizer(parsed.get("primary_fertilizer")),
        "secondary_fertilizer": normalize_fertilizer(parsed.get("secondary_fertilizer"))
        if parsed.get("secondary_fertilizer") is not None
        else None,
        "organic_alternatives": parsed.get("organic_alternatives") if isinstance(parsed.get("organic_alternatives"), list) else [],
        "application_schedule": parsed.get("application_schedule") if isinstance(parsed.get("application_schedule"), list) else [],
        "important_notes": parsed.get("important_notes") if isinstance(parsed.get("important_notes"), list) else [],
        "estimated_yield_improvement": str(parsed.get("estimated_yield_improvement") or ""),
    }


@app.post("/voice")
async def voice():
    resp = VoiceResponse()
    resp.say("Namaste. Kripya apni samasya batayein.", language="hi-IN")
    resp.record(input="speech", action="/process", method="POST")
    return str(resp)


@app.post("/process")
async def process(request: Request):
    form = await request.form()
    user_text = form.get("SpeechResult", "Mujhe fasal ke baare mein janna hai")
    answer = ask_groq(user_text, "hi")["answer"]

    resp = VoiceResponse()
    resp.say(answer, language="hi-IN")
    return str(resp)


@app.post("/whatsapp")
async def whatsapp(req: Request):
    data = await req.form()
    msg = data.get("Body", "")
    reply_text = ask_groq(msg, "en")["answer"]

    resp = MessagingResponse()
    resp.message(reply_text)
    return str(resp)


@app.get("/")
def read_root():
    return {"message": "KRISHIVE API is running."}


@app.get("/health")
def health():
    return {"status": "ok", "environment": APP_ENV, "groq_configured": bool(GROQ_API_KEY)}

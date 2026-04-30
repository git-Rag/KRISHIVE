import type { FarmerLocation } from "@/lib/location";

export type VoiceQueryResponse = {
  answer: string;
  language: string;
  ok: boolean;
};

export type WaterAdviceRequest = {
  crop: string;
  soil_condition: "dry" | "medium" | "wet";
  temperature: number;
  humidity: number;
  rain_forecast: boolean;
  location?: FarmerLocation;
};

export type WaterAdviceResponse = {
  decision: string;
  reason: string;
  water_amount: string;
  timing: string;
};

export type WeatherByLocationResponse = {
  temperature: number | null;
  humidity: number | null;
  rain_forecast: boolean;
};

export type FertilizerSuggestionRequest = {
  crop: string;
  soil_ph?: number;
  nitrogen_level?: "Low" | "Medium" | "High";
  phosphorus_level?: "Low" | "Medium" | "High";
  potassium_level?: "Low" | "Medium" | "High";
  growth_stage?: "Seeding" | "Vegetative" | "Flowering" | "Fruiting";
  visible_symptoms?: string;
};

export type FertilizerRecommendation = {
  name: string;
  npk_ratio: string;
  dosage: string;
  application_method: string;
};

export type FertilizerSuggestionResponse = {
  primary_fertilizer: FertilizerRecommendation;
  secondary_fertilizer?: FertilizerRecommendation | null;
  organic_alternatives: string[];
  application_schedule: { timing: string; action: string }[];
  important_notes: string[];
  estimated_yield_improvement: string;
};

export type DiseaseDetectionResponse = {
  disease_name: string;
  confidence: number;
  description: string;
  treatment_recommendations: string[];
  severity: "low" | "medium" | "high" | string;
};

type VoiceQueryPayload = {
  text: string;
  language: string;
  groq_api_key?: string;
  location?: FarmerLocation;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function postVoiceQuery(payload: VoiceQueryPayload): Promise<VoiceQueryResponse> {
  const response = await fetch(`${API_URL}/voice-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = response.status === 400 ? "Please provide a valid request." : "Service unavailable.";
    throw new Error(message);
  }

  return (await response.json()) as VoiceQueryResponse;
}

export async function postWaterAdvice(payload: WaterAdviceRequest): Promise<WaterAdviceResponse> {
  const response = await fetch(`${API_URL}/water-advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch water advice.");
  }

  return (await response.json()) as WaterAdviceResponse;
}

export async function postWeatherByLocation(lat: number, lon: number): Promise<WeatherByLocationResponse> {
  const response = await fetch(`${API_URL}/weather-by-location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch weather for location.");
  }

  return (await response.json()) as WeatherByLocationResponse;
}

export async function postFertilizerSuggestion(
  payload: FertilizerSuggestionRequest,
): Promise<FertilizerSuggestionResponse> {
  const response = await fetch(`${API_URL}/api/fertilizer-suggestion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Unable to fetch fertilizer suggestion.");
  }

  return (await response.json()) as FertilizerSuggestionResponse;
}

export async function postDiseaseDetection(file: File): Promise<DiseaseDetectionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/detect-disease`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "Unable to detect disease from this image.";
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) detail = data.detail;
    } catch {
      // keep default detail
    }
    throw new Error(detail);
  }

  return (await response.json()) as DiseaseDetectionResponse;
}

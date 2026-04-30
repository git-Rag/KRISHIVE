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

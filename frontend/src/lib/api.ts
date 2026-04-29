export type VoiceQueryResponse = {
  answer: string;
  language: string;
  ok: boolean;
};

type VoiceQueryPayload = {
  text: string;
  language: string;
  groq_api_key?: string;
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

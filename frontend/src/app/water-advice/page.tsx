"use client";

import { useEffect, useRef, useState } from "react";
import { Droplets, LocateFixed, Mic } from "lucide-react";
import Link from "next/link";
import { MicButton } from "@/components/home/MicButton";
import { postWaterAdvice, WaterAdviceResponse } from "@/lib/api";
import { detectFarmerLocation, FarmerLocation, getCachedLocation, saveManualLocation } from "@/lib/location";
import { BrowserSpeechRecognitionEvent, getSpeechRecognitionCtor, SpeechRecognitionCtor } from "@/lib/speech";

export default function WaterAdvicePage() {
  const [crop, setCrop] = useState("wheat");
  const [soilCondition, setSoilCondition] = useState<"dry" | "medium" | "wet">("medium");
  const [temperature, setTemperature] = useState(30);
  const [humidity, setHumidity] = useState(55);
  const [rainForecast, setRainForecast] = useState(false);
  const [result, setResult] = useState<WaterAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(() => (typeof window === "undefined" ? true : navigator.onLine));
  const [location, setLocation] = useState<FarmerLocation | null>(() => (typeof window === "undefined" ? null : getCachedLocation()));
  const [isLocating, setIsLocating] = useState(false);
  const [manualDistrict, setManualDistrict] = useState("");
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceText(transcript);
      const lowered = transcript.toLowerCase();
      if (lowered.includes("sukhi") || lowered.includes("dry")) setSoilCondition("dry");
      if (lowered.includes("geeli") || lowered.includes("wet")) setSoilCondition("wet");
      if (lowered.includes("medium") || lowered.includes("normal")) setSoilCondition("medium");
      if (lowered.includes("gehun") || lowered.includes("wheat")) setCrop("wheat");
      if (lowered.includes("dhaan") || lowered.includes("rice")) setCrop("rice");
      if (lowered.includes("makka") || lowered.includes("maize")) setCrop("maize");
    };
    recognition.onerror = () => setError("Voice input unavailable.");
    recognitionRef.current = recognition;
    return () => {
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const onAskAdvice = async () => {
    setError("");
    setLoading(true);
    try {
      const advice = await postWaterAdvice({
        crop,
        soil_condition: soilCondition,
        temperature,
        humidity,
        rain_forecast: rainForecast,
        location: location || undefined,
      });
      setResult(advice);
    } catch {
      setError("Unable to fetch water advice right now.");
    } finally {
      setLoading(false);
    }
  };

  const onMicClick = async () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }
    recognitionRef.current.start();
  };

  const onUseLocation = async () => {
    setIsLocating(true);
    setError("");
    try {
      const detected = await detectFarmerLocation();
      setLocation(detected);
    } catch {
      setError("Location unavailable. Enter district manually.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3e8] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm text-[#1b5e20] hover:underline">← Back to KRISHIVE</Link>
        <div className="mt-4 rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-[#1b5e20]">
            <Droplets size={22} />
            <h1 className="text-2xl font-semibold">Water Advice</h1>
          </div>
          <p className="text-sm text-[#4d594d]">Get quick irrigation guidance for your crop.</p>
          <div className="mt-4 rounded-xl border border-[#ddd6c4] bg-[#fffdf8] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => void onUseLocation()}
                disabled={isLocating}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-[#1b5e20] px-4 text-sm font-medium text-[#1b5e20]"
              >
                <LocateFixed size={16} />
                {isLocating ? "Detecting..." : "Use My Location"}
              </button>
              <p className="text-sm text-[#3f4c3f]">
                {location ? `Location: ${location.district}, ${location.state}` : "Location not set"}
              </p>
            </div>
            {!isOnline && !location ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={manualDistrict}
                  onChange={(event) => setManualDistrict(event.target.value)}
                  placeholder="Enter district manually"
                  className="min-h-[48px] flex-1 rounded-lg border border-[#d8d2bf] px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setLocation(saveManualLocation(manualDistrict))}
                  className="min-h-[48px] rounded-lg bg-[#1b5e20] px-4 text-sm font-medium text-white"
                >
                  Save
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            <label className="text-sm font-medium">Crop</label>
            <select
              value={crop}
              onChange={(event) => setCrop(event.target.value)}
              className="min-h-[56px] rounded-lg border border-[#d8d2bf] px-3"
            >
              <option value="wheat">Wheat</option>
              <option value="rice">Rice</option>
              <option value="maize">Maize</option>
              <option value="cotton">Cotton</option>
              <option value="sugarcane">Sugarcane</option>
            </select>

            <label className="text-sm font-medium">Soil Condition</label>
            <div className="grid grid-cols-3 gap-2">
              {(["dry", "medium", "wet"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSoilCondition(item)}
                  className={`min-h-[60px] rounded-lg border text-sm font-medium ${
                    soilCondition === item ? "border-[#1b5e20] bg-[#1b5e20] text-white" : "border-[#d8d2bf] bg-white text-[#1f2a1f]"
                  }`}
                >
                  {item === "dry" ? "Dry" : item === "medium" ? "Medium" : "Wet"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Temp (C)</label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                  className="mt-1 min-h-[56px] w-full rounded-lg border border-[#d8d2bf] px-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Humidity (%)</label>
                <input
                  type="number"
                  value={humidity}
                  onChange={(event) => setHumidity(Number(event.target.value))}
                  className="mt-1 min-h-[56px] w-full rounded-lg border border-[#d8d2bf] px-3"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRainForecast((prev) => !prev)}
              className={`min-h-[60px] rounded-lg border px-4 text-left text-sm font-medium ${
                rainForecast ? "border-[#1b5e20] bg-[#e8f3e8] text-[#1b5e20]" : "border-[#d8d2bf] bg-white"
              }`}
            >
              Rain forecast: {rainForecast ? "Yes" : "No"}
            </button>

            <div className="mt-2 flex items-center gap-3">
              <MicButton isRecording={isRecording} onClick={() => void onMicClick()} label="Voice input for crop and soil" />
              <p className="text-sm text-[#4d594d]">{isRecording ? "Listening..." : "Use voice: गेहूं, सूखी मिट्टी, etc."}</p>
              <Mic size={16} className="text-[#1b5e20]" />
            </div>
            {voiceText ? <p className="rounded-lg bg-[#f7f3e8] p-2 text-sm">{voiceText}</p> : null}

            <button
              type="button"
              onClick={() => void onAskAdvice()}
              disabled={loading}
              className="mt-2 min-h-[60px] rounded-lg bg-[#1b5e20] px-4 text-base font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {loading ? "Getting Advice..." : "Get Water Advice"}
            </button>
            {error ? <p className="text-sm text-[#8f2f14]">{error}</p> : null}
          </div>
        </div>

        {result ? (
          <article className="mt-4 rounded-2xl border border-[#d8d2bf] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6a786a]">Decision</p>
            <p className="text-2xl font-bold text-[#1b5e20]">{result.decision}</p>
            <p className="mt-3 text-sm"><span className="font-semibold">Reason:</span> {result.reason}</p>
            <p className="mt-1 text-sm"><span className="font-semibold">Water Amount:</span> {result.water_amount}</p>
            <p className="mt-1 text-sm"><span className="font-semibold">Timing:</span> {result.timing}</p>
          </article>
        ) : null}
      </div>
    </main>
  );
}


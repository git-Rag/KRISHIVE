"use client";

import { useEffect, useRef, useState } from "react";
import { CloudRain, Droplets, LoaderCircle, LocateFixed, Mic, Thermometer } from "lucide-react";
import Link from "next/link";
import { MicButton } from "@/components/home/MicButton";
import { postWaterAdvice, postWeatherByLocation, WaterAdviceResponse } from "@/lib/api";
import { detectFarmerLocation, FarmerLocation, getCachedLocation, saveManualLocation } from "@/lib/location";
import { BrowserSpeechRecognitionEvent, getSpeechRecognitionCtor, SpeechRecognitionCtor } from "@/lib/speech";

export default function WaterAdvicePage() {
  const [crop, setCrop] = useState("wheat");
  const [soilCondition, setSoilCondition] = useState<"dry" | "medium" | "wet">("medium");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [rainForecast, setRainForecast] = useState(false);
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<string>("");
  const [result, setResult] = useState<WaterAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(() => (typeof window === "undefined" ? true : navigator.onLine));
  const [location, setLocation] = useState<FarmerLocation | null>(() => (typeof window === "undefined" ? null : getCachedLocation()));
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
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

  const fetchWeatherByLocation = async (target: FarmerLocation) => {
    if (!target.lat || !target.lon) return;
    setIsFetchingWeather(true);
    try {
      const data = await postWeatherByLocation(target.lat, target.lon);
      setTemperature(typeof data.temperature === "number" ? Math.round(data.temperature) : null);
      setHumidity(typeof data.humidity === "number" ? Math.round(data.humidity) : null);
      setRainForecast(Boolean(data.rain_forecast));
      setWeatherUpdatedAt(new Date().toLocaleTimeString());
    } catch {
      setError("Unable to fetch weather from location.");
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const onAskAdvice = async () => {
    setError("");
    if (temperature == null || humidity == null) {
      setError("Please use location first to auto-fill weather.");
      return;
    }
    setLoading(true);
    try {
      const advice = await postWaterAdvice({
        crop,
        soil_condition: soilCondition,
        temperature: Number(temperature),
        humidity: Number(humidity),
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
      await fetchWeatherByLocation(detected);
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
          <section className="mt-6 rounded-xl border border-[#d6e3d6] bg-[#eef6ee] p-4">
            <h2 className="text-lg font-semibold text-[#1b5e20]">Ask Your Farming Question</h2>
            <div className="mt-3 flex flex-col gap-3">
              <div className="mx-auto">
                <MicButton isRecording={isRecording} onClick={() => void onMicClick()} label="Voice input for crop and soil" prominent />
              </div>
              <p className="text-center text-sm text-[#4d594d]">{isRecording ? "Listening..." : "Tap mic and ask in Hindi or English."}</p>
              <div className="relative">
                <Mic size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1b5e20]" />
                <input
                  value={voiceText}
                  onChange={(event) => setVoiceText(event.target.value)}
                  placeholder="Transcribed question appears here"
                  className="min-h-[56px] w-full rounded-lg border border-[#cfd8cf] bg-white pl-9 pr-3 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-[#ddd6c4] bg-[#fffdf8] p-4">
            <h2 className="text-lg font-semibold text-[#1f2a1f]">Location + Auto Weather</h2>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void onUseLocation()}
                disabled={isLocating || isFetchingWeather}
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-lg border border-[#1b5e20] px-4 text-sm font-medium text-[#1b5e20]"
              >
                {(isLocating || isFetchingWeather) ? <LoaderCircle size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                {(isLocating || isFetchingWeather) ? "Fetching location and weather..." : "Use My Location"}
              </button>
              <p className="mt-2 text-sm text-[#3f4c3f]">
                {location ? `Location: ${location.district}, ${location.state}` : "Location not set"}
              </p>
              {weatherUpdatedAt ? <p className="text-xs text-[#667366]">Last updated: {weatherUpdatedAt}</p> : null}
            </div>

            {!isOnline && !location ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <article className="rounded-lg border border-[#ddd6c4] bg-white p-3">
                <p className="text-xs text-[#6a786a]">🌡 Temp</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-[#1f2a1f]"><Thermometer size={16} /> {temperature ?? "--"}{temperature != null ? " C" : ""}</p>
              </article>
              <article className="rounded-lg border border-[#ddd6c4] bg-white p-3">
                <p className="text-xs text-[#6a786a]">💧 Humidity</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-[#1f2a1f]"><Droplets size={16} /> {humidity ?? "--"}{humidity != null ? "%" : ""}</p>
              </article>
              <article className="rounded-lg border border-[#ddd6c4] bg-white p-3">
                <p className="text-xs text-[#6a786a]">🌧 Rain</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-[#1f2a1f]"><CloudRain size={16} /> {rainForecast ? "Likely" : "Not likely"}</p>
              </article>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-[#ddd6c4] bg-white p-4">
            <h2 className="text-lg font-semibold text-[#1f2a1f]">Crop &amp; Soil Details</h2>
            <div className="mt-3 grid gap-3">
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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

              <button
                type="button"
                onClick={() => void onAskAdvice()}
                disabled={loading}
                className="mt-2 min-h-[60px] w-full rounded-lg bg-[#1b5e20] px-4 text-base font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {loading ? "Getting Advice..." : "Get Water Advice"}
              </button>
              {error ? <p className="text-sm text-[#8f2f14]">{error}</p> : null}
            </div>
          </section>
        </div>

        {result ? (
          <article className="mt-4 rounded-2xl border border-[#d8d2bf] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#6a786a]">Decision</p>
            <p
              className={`text-2xl font-bold ${
                result.decision.toLowerCase().includes("irrigate") ? "text-[#1b5e20]" : "text-[#b45309]"
              }`}
            >
              {result.decision}
            </p>
            <p className="mt-3 text-sm"><span className="font-semibold">Reason:</span> {result.reason}</p>
            <p className="mt-1 text-sm"><span className="font-semibold">Water Amount:</span> {result.water_amount}</p>
            <p className="mt-1 text-sm"><span className="font-semibold">Timing:</span> {result.timing}</p>
          </article>
        ) : null}
      </div>
    </main>
  );
}


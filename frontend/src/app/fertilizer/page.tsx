"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Leaf, LoaderCircle, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { FertilizerSuggestionRequest, FertilizerSuggestionResponse, postFertilizerSuggestion } from "@/lib/api";

const cropOptions = [
  "Wheat",
  "Rice",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Pulses",
  "Groundnut",
];

function parseNpk(value: string) {
  const match = String(value || "").match(/(\d+)\s*[-:]\s*(\d+)\s*[-:]\s*(\d+)/);
  if (!match) return null;
  return { n: Number(match[1]), p: Number(match[2]), k: Number(match[3]) };
}

export default function FertilizerPage() {
  const [crop, setCrop] = useState("Wheat");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FertilizerSuggestionResponse | null>(null);
  const debounceRef = useRef<number | null>(null);

  const requestPayload: FertilizerSuggestionRequest = useMemo(
    () => ({
      crop,
      visible_symptoms: symptoms.trim() || undefined,
    }),
    [crop, symptoms],
  );

  const fetchSuggestion = async () => {
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await postFertilizerSuggestion(requestPayload);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch fertilizer recommendation right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void fetchSuggestion();
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop]);

  const primaryNpk = parseNpk(result?.primary_fertilizer?.npk_ratio || "");
  const secondaryNpk = parseNpk(result?.secondary_fertilizer?.npk_ratio || "");

  return (
    <main className="min-h-screen bg-[#f7f3e8] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm text-[#1b5e20] hover:underline">← Back to KRISHIVE</Link>

        <section className="mt-4 rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[#1b5e20]">
                <Leaf size={22} />
                <h1 className="text-2xl font-semibold">Fertilizer Suggestions</h1>
              </div>
              <p className="text-sm text-[#4d594d]">Select a crop to get an instant fertilizer plan. No soil lab values required.</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchSuggestion()}
              disabled={loading}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-[#1b5e20] bg-white px-4 text-sm font-semibold text-[#1b5e20] disabled:opacity-60"
            >
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
              Refresh
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-[#ddd6c4] bg-[#fffdf8] p-5">
            <label className="block text-sm font-medium text-[#1f2a1f]">Crop type</label>
            <input
              list="crop-options"
              value={crop}
              onChange={(event) => setCrop(event.target.value)}
              className="mt-2 min-h-[56px] w-full rounded-lg border border-[#d8d2bf] bg-white px-3 text-sm"
              placeholder="Type to search (e.g., Wheat)"
            />
            <datalist id="crop-options">
              {cropOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>

            <label className="mt-5 block text-sm font-medium text-[#1f2a1f]">Visible symptoms (optional)</label>
            <textarea
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={3}
              placeholder="Yellow leaves, poor growth, leaf spots, etc."
              className="mt-2 w-full rounded-lg border border-[#d8d2bf] bg-white px-3 py-3 text-sm"
            />

            {error ? (
              <div className="mt-5 rounded-xl border border-[#f2c6be] bg-[#fff2ef] p-4 text-sm text-[#8f2f14]">{error}</div>
            ) : null}

            {loading ? (
              <div className="mt-5 rounded-xl border border-[#ddd6c4] bg-white p-4">
                <Skeleton className="h-5 w-52" />
                <Skeleton className="mt-3 h-4 w-72" />
                <Skeleton className="mt-4 h-24 w-full" />
              </div>
            ) : null}
          </div>
        </section>

        {result && !loading ? (
          <section className="mt-6 rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-[#1b5e20]">
              <CheckCircle2 size={24} />
              <div>
                <h2 className="text-2xl font-semibold">Recommendation Results</h2>
                <p className="text-sm text-[#334233]">Clear fertilizer guidance with NPK ratios, organics, and schedule.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-[#ddd6c4] bg-[#fbfdf7] p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1b5e20]">Primary Fertilizer</p>
                <p className="mt-2 text-lg font-semibold text-[#1f2a1f]">{result.primary_fertilizer.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-sm text-[#334233]">NPK: {result.primary_fertilizer.npk_ratio}</span>
                  {primaryNpk ? (
                    <>
                      <span className="rounded-full bg-[#eef7ec] px-3 py-1 text-xs text-[#1b5e20]">N {primaryNpk.n}</span>
                      <span className="rounded-full bg-[#f5ead2] px-3 py-1 text-xs text-[#8f5a12]">P {primaryNpk.p}</span>
                      <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs text-[#2456a6]">K {primaryNpk.k}</span>
                    </>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-[#334233]">Dosage: {result.primary_fertilizer.dosage}</p>
                <p className="mt-2 text-sm text-[#334233]">Method: {result.primary_fertilizer.application_method}</p>
              </div>

              {result.secondary_fertilizer ? (
                <div className="rounded-2xl border border-[#ddd6c4] bg-[#fbfdf7] p-5 shadow-sm">
                  <p className="text-sm font-semibold text-[#1b5e20]">Secondary Fertilizer</p>
                  <p className="mt-2 text-lg font-semibold text-[#1f2a1f]">{result.secondary_fertilizer.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-sm text-[#334233]">NPK: {result.secondary_fertilizer.npk_ratio}</span>
                    {secondaryNpk ? (
                      <>
                        <span className="rounded-full bg-[#eef7ec] px-3 py-1 text-xs text-[#1b5e20]">N {secondaryNpk.n}</span>
                        <span className="rounded-full bg-[#f5ead2] px-3 py-1 text-xs text-[#8f5a12]">P {secondaryNpk.p}</span>
                        <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs text-[#2456a6]">K {secondaryNpk.k}</span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-[#334233]">Dosage: {result.secondary_fertilizer.dosage}</p>
                  <p className="mt-2 text-sm text-[#334233]">Method: {result.secondary_fertilizer.application_method}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-[#ddd6c4] bg-[#fbfdf7] p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1b5e20]">Organic Alternatives</p>
                {result.organic_alternatives.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.organic_alternatives.map((item) => (
                      <span key={item} className="rounded-full bg-[#eef7ec] px-3 py-1 text-sm text-[#1b5e20]">{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#334233]">No organic alternatives were recommended.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[#ddd6c4] bg-[#fbfdf7] p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1b5e20]">Yield Improvement</p>
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-[#1b5e20]" />
                  <p className="text-sm text-[#1f2a1f]">{result.estimated_yield_improvement}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ddd6c4] bg-[#fbfdf7] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#1b5e20]">Application Schedule</p>
              <div className="mt-4 space-y-4 border-l border-[#cfe0cf] pl-4">
                {result.application_schedule.map((item) => (
                  <div key={`${item.timing}-${item.action}`} className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#1b5e20]" />
                    <div>
                      <p className="text-sm font-semibold text-[#1f2a1f]">{item.timing}</p>
                      <p className="mt-1 text-sm text-[#334233]">{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ddd6c4] bg-[#fbfdf7] p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#1b5e20]">Important Notes</p>
              <ul className="mt-3 space-y-3 text-sm text-[#334233]">
                {result.important_notes.length ? (
                  result.important_notes.map((note) => (
                    <li key={note} className="rounded-xl bg-white p-3 shadow-sm">{note}</li>
                  ))
                ) : (
                  <li>No additional notes were provided.</li>
                )}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

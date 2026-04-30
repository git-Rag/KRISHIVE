"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ImagePlus, RefreshCw, UploadCloud } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { DiseaseDetectionResponse, postDiseaseDetection } from "@/lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function DiseaseDetectionPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiseaseDetectionResponse | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const validateAndSetFile = (candidate: File | null) => {
    if (!candidate) return;
    if (!ALLOWED_TYPES.includes(candidate.type)) {
      setError("Please upload a jpg, png, or webp image.");
      return;
    }
    setError("");
    setResult(null);
    setFile(candidate);
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.target.files?.[0] || null);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0] || null);
  };

  const onSubmit = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await postDiseaseDetection(file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not detect disease right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const severityBadgeClass =
    result?.severity === "high"
      ? "bg-red-100 text-red-700"
      : result?.severity === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <main className="min-h-screen bg-[#f7f3e8] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-sm text-[#1b5e20] hover:underline">← Back to KRISHIVE</Link>

        <section className="mt-4 rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-[#1b5e20]">Disease Detection</h1>
          <p className="mt-1 text-sm text-[#516051]">Upload a crop image to get AI disease analysis.</p>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`mt-5 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
              isDragging ? "border-[#1b5e20] bg-[#eef6ee]" : "border-[#cfd8cf] bg-[#fbf9f2]"
            }`}
          >
            <UploadCloud className="mx-auto text-[#1b5e20]" size={30} />
            <p className="mt-2 text-sm font-medium text-[#233123]">Drag and drop image here</p>
            <p className="text-xs text-[#5d6a5d]">or click to browse (jpg, png, webp)</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={onFileInputChange}
            />
          </div>

          {previewUrl ? (
            <div className="mt-5 rounded-xl border border-[#ddd6c4] bg-[#f9f6ee] p-3">
              <p className="mb-2 text-sm font-medium text-[#334233]">Image Preview</p>
              <Image
                src={previewUrl}
                alt="Uploaded crop preview"
                width={1200}
                height={800}
                unoptimized
                className="max-h-80 w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[#ddd6c4] bg-[#f9f6ee] p-6 text-center text-sm text-[#607060]">
              <ImagePlus className="mx-auto mb-1 text-[#6f7f6f]" size={24} />
              No image selected
            </div>
          )}

          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={loading}
            className="mt-5 min-h-[56px] w-full rounded-lg bg-[#1b5e20] px-4 text-base font-semibold text-white shadow-sm disabled:opacity-70"
          >
            {loading ? "Analyzing Image..." : "Detect Disease"}
          </button>

          {error ? (
            <div className="mt-4 rounded-xl border border-[#f2c6be] bg-[#fff2ef] p-3">
              <p className="text-sm text-[#8f2f14]">{error}</p>
              <button
                type="button"
                onClick={() => void onSubmit()}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#c9553d] px-3 py-2 text-sm text-[#8f2f14]"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : null}
        </section>

        {loading ? (
          <section className="mt-5 rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-3 h-5 w-32" />
            <Skeleton className="mt-4 h-20 w-full" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </section>
        ) : null}

        {result && !loading ? (
          <section className="mt-5 rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-[#1f2a1f]">{result.disease_name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${severityBadgeClass}`}>{result.severity}</span>
            </div>
            <p className="mt-2 text-sm text-[#4a584a]">Confidence: {Math.max(0, Math.min(100, Number(result.confidence || 0))).toFixed(1)}%</p>
            <p className="mt-3 text-sm leading-6 text-[#2e3c2e]">{result.description}</p>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[#1f2a1f]">Recommended Treatment</p>
              {result.treatment_recommendations.length ? (
                <ul className="mt-2 space-y-2 text-sm text-[#2e3c2e]">
                  {result.treatment_recommendations.map((item) => (
                    <li key={item} className="rounded-md bg-[#f7f4ea] px-3 py-2">- {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#677467]">No treatment steps provided.</p>
              )}
            </div>
          </section>
        ) : null}

        {!loading && !result && !error ? (
          <div className="mt-4 flex items-start gap-2 text-xs text-[#677467]">
            <AlertTriangle size={14} className="mt-[2px]" />
            Use a clear leaf/crop photo in daylight for better accuracy.
          </div>
        ) : null}
      </div>
    </main>
  );
}


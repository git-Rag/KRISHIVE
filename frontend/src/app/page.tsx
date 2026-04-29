"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Mic,
  ShieldCheck,
  Users,
  Volume2,
  StopCircle,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { ToastItem, ToastStack } from "@/components/ui/ToastStack";
import { postVoiceQuery } from "@/lib/api";
import { SUPPORTED_LANGUAGES, ttsLanguageMap } from "@/lib/languages";
import { BrowserSpeechRecognitionEvent, getSpeechRecognitionCtor, SpeechRecognitionCtor } from "@/lib/speech";

type AssistantResponse = { text: string; lang: string; ok: boolean };

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [role] = useState<"Admin" | "User">("Admin");
  const [language, setLanguage] = useState("en");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [openRequestModal, setOpenRequestModal] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<AssistantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [groqApiKey, setGroqApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("krishive_groq_key") || "";
  });
  const [applicationId, setApplicationId] = useState("");
  const [applicationIdError, setApplicationIdError] = useState("");

  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("krishive_dark_mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";

    recognition.onstart = () => {
      setIsRecording(true);
        pushToast("Listening started.", "info");
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === "network") {
        setMicError("Speech recognition network error. Check internet and try again.");
      } else if (event.error === "not-allowed") {
        setMicError("Microphone permission denied. Please allow microphone access in browser settings.");
      } else if (event.error !== "aborted") {
        setMicError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const selected = SUPPORTED_LANGUAGES.find((lang) => lang.value === selectedLanguage);
    if (recognitionRef.current && selected) {
      recognitionRef.current.lang = selected.speechLang;
    }
  }, [selectedLanguage]);

  const toggleRecording = () => {
    const recognitionSupported = Boolean(recognitionRef.current);
    if (!recognitionSupported) {
      setMicError("Voice input is not supported in this browser. Use latest Chrome on Android or desktop.");
      pushToast("Voice input unsupported in this browser.", "error");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setMicError("");
      setTranscript("");
      setAiResponse(null);
      void startRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        recognitionRef.current?.start();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      recognitionRef.current?.start();
    } catch {
      setMicError("Microphone permission was denied or unavailable. Allow microphone access and try again.");
      pushToast("Microphone permission denied.", "error");
    }
  };

  const saveApiKey = () => {
    const trimmed = groqApiKey.trim();
    window.localStorage.setItem("krishive_groq_key", trimmed);
    pushToast("API key stored in local browser storage.", "success");
  };

  const sendToBackend = async (text: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsLoading(true);
    try {
      const data = await postVoiceQuery({
        text,
        language: selectedLanguage === "auto" ? language : selectedLanguage,
        groq_api_key: groqApiKey.trim() || undefined,
      });
      setAiResponse({ text: data.answer, lang: data.language, ok: data.ok });
      playAudio(data.answer, data.language);
      pushToast("Response received successfully.", "success");
    } catch (error) {
      console.error(error);
      setAiResponse({
        text: "We could not complete the request. Please verify your network, backend status, and API key.",
        lang: "en",
        ok: false,
      });
      pushToast("Request failed. Please verify service configuration.", "error");
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const playAudio = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLanguageMap[lang] || "hi-IN";
      utterance.rate = 0.9;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const submitTranscript = () => {
    if (!transcript.trim() || isLoading) return;
    sendToBackend(transcript.trim());
  };

  function pushToast(message: string, type: ToastItem["type"]) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  }

  const validateTrackingForm = () => {
    const value = applicationId.trim();
    if (!/^[A-Z0-9-]{6,20}$/i.test(value)) {
      setApplicationIdError("Enter a valid application ID (6-20 chars, letters, numbers, hyphen).");
      return false;
    }
    setApplicationIdError("");
    pushToast(`Tracking details loaded for ${value.toUpperCase()}.`, "info");
    return true;
  };

  const kpis = [
    { label: "Total Service Requests", value: "2,184", icon: ClipboardCheck },
    { label: "Citizens Served Today", value: "746", icon: Users },
    { label: "System Uptime", value: "99.98%", icon: ShieldCheck },
    { label: "Active Incidents", value: "03", icon: AlertTriangle },
  ];

  const requestRows = [
    { id: "1", service: "Agricultural Subsidy", applicant: "Rakesh Kumar", status: "Under Review" as const, updatedAt: "Today, 12:40" },
    { id: "2", service: "Crop Insurance Claim", applicant: "Shanti Devi", status: "Pending" as const, updatedAt: "Today, 11:20" },
    { id: "3", service: "Soil Health Card", applicant: "Manoj Singh", status: "Approved" as const, updatedAt: "Yesterday, 17:05" },
  ];

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
      <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeId={activeNav}
          onSelect={setActiveNav}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            title="Dashboard"
            role={role}
            darkMode={darkMode}
            language={language}
            onDarkModeToggle={() => setDarkMode((prev) => !prev)}
            onLanguageChange={setLanguage}
          />

          <main className="flex-1 p-4 md:p-6">
            <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">Home / Dashboard / Service Operations</div>

            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card key={kpi.label} className="transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{kpi.label}</p>
                        <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
                      </div>
                      <Icon size={18} className="text-[#0b3d91]" />
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card
                title="Core Service Assistant"
                subtitle="Voice and text-enabled citizen service support"
                className="xl:col-span-2"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    aria-label="Language preference"
                  >
                    {SUPPORTED_LANGUAGES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="Groq API key"
                    className="min-w-[260px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    aria-label="Groq API key"
                  />
                  <button type="button" onClick={saveApiKey} className="rounded-lg bg-[#0b3d91] px-3 py-2 text-sm text-white">
                    Save Key
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`rounded-full p-3 text-white ${isRecording ? "bg-red-600" : "bg-[#0b3d91]"}`}
                  >
                    {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                  </button>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{isRecording ? "Listening..." : "Tap to start voice capture"}</p>
                </div>
                {micError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{micError}</p>}

                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                  placeholder="Enter query or use voice input..."
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={submitTranscript}
                    disabled={!transcript.trim() || isLoading}
                    className="rounded-lg bg-[#0b3d91] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript("");
                      setAiResponse(null);
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
                  >
                    Reset
                  </button>
                </div>

                {isLoading && (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                )}

                {aiResponse && !isLoading && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detected language: {aiResponse.lang}</p>
                      <button
                        type="button"
                        onClick={() => (isPlaying ? stopAudio() : playAudio(aiResponse.text, aiResponse.lang))}
                        className="rounded-md border border-slate-300 p-1 dark:border-slate-600"
                      >
                        {isPlaying ? <StopCircle size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                    <p className="text-sm leading-6 text-slate-800 dark:text-slate-200">{aiResponse.text}</p>
                  </div>
                )}
              </Card>

              <Card title="Status Tracker" subtitle="Track citizen application">
                <label className="mb-1 block text-sm font-medium">Application ID</label>
                <input
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-slate-900 ${
                    applicationIdError ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                  }`}
                  placeholder="Ex: AGRI-2026-1001"
                />
                {applicationIdError && <p className="mt-1 text-xs text-red-600">{applicationIdError}</p>}
                <button
                  className="mt-3 w-full rounded-lg bg-[#0b3d91] px-3 py-2 text-sm text-white"
                  type="button"
                  onClick={validateTrackingForm}
                >
                  Check Status
                </button>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-green-600" /> Submitted</div>
                  <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-green-600" /> Under Verification</div>
                  <div className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-amber-500" /> Approval Pending</div>
                </div>
              </Card>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <Card title="Analytics" subtitle="Weekly service volume" className="xl:col-span-2">
                <div className="grid h-40 grid-cols-7 items-end gap-2">
                  {[46, 58, 35, 66, 72, 61, 80].map((height, idx) => (
                    <div key={idx} className="rounded-t bg-[#0b3d91]/80 transition-all hover:bg-[#0b3d91]" style={{ height: `${height}%` }} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Service requests processed over the last 7 days</p>
              </Card>

              <Card title="Quick Actions">
                <button
                  type="button"
                  className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
                  onClick={() => setOpenRequestModal(true)}
                >
                  New Service Request <ArrowRight size={14} />
                </button>
                <button className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600" type="button">
                  Generate Department Report
                </button>
                <button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600" type="button">
                  View Incident Queue
                </button>
              </Card>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <Card title="Recent Activity" className="xl:col-span-2">
                <Table rows={requestRows} />
              </Card>
              <Card title="Alerts & Announcements">
                <ul className="space-y-2 text-sm">
                  <li className="rounded-lg bg-amber-50 p-2 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                    Scheduled maintenance window: Saturday 11:00 PM - 01:00 AM.
                  </li>
                  <li className="rounded-lg bg-blue-50 p-2 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
                    New farmer assistance policy circular is now available.
                  </li>
                  <li className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                    Helpdesk SLA compliance this week: 97.4%.
                  </li>
                </ul>
              </Card>
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>© 2026 KRISHIVE Digital Services</p>
              <div className="flex gap-4">
                <a href="#" className="hover:underline">Privacy Policy</a>
                <a href="#" className="hover:underline">Terms</a>
                <a href="#" className="hover:underline">Help</a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <Modal open={openRequestModal} title="Create Service Request" onClose={() => setOpenRequestModal(false)}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Applicant Name</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Service Type</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
              <option>Subsidy Application</option>
              <option>Insurance Claim</option>
              <option>Document Verification</option>
            </select>
          </div>
          <button
            type="button"
            className="rounded-lg bg-[#0b3d91] px-4 py-2 text-sm text-white"
            onClick={() => {
              setOpenRequestModal(false);
              pushToast("Service request submitted.", "success");
            }}
          >
            Submit Request
          </button>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Droplets, Landmark, Leaf, LocateFixed, Sprout, Stethoscope, TrendingUp } from "lucide-react";
import { ActionCard } from "@/components/home/ActionCard";
import { HeroAIInput } from "@/components/home/HeroAIInput";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { LanguageToggle } from "@/components/home/LanguageToggle";
import { NewsCard } from "@/components/home/NewsCard";
import { SchemeCard } from "@/components/home/SchemeCard";
import { SectionWrapper } from "@/components/home/SectionWrapper";
import { AppLanguage, LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { postVoiceQuery } from "@/lib/api";
import { detectFarmerLocation, FarmerLocation, getCachedLocation, saveManualLocation } from "@/lib/location";
import { BrowserSpeechRecognitionEvent, getSpeechRecognitionCtor, SpeechRecognitionCtor } from "@/lib/speech";

type TranslationDictionary = {
  brandSubtitle: string;
  title: string;
  heroDescription: string;
  placeholder: string;
  send: string;
  listening: string;
  loading: string;
  micLabel: string;
  languageLabels: Record<AppLanguage, string>;
  quickActionsTitle: string;
  quickActionsSubtitle: string;
  schemesTitle: string;
  schemesSubtitle: string;
  schemesCta: string;
  newsTitle: string;
  newsSubtitle: string;
  voiceTitle: string;
  voiceDescription: string;
  voiceHighlights: string[];
  footerAbout: string;
  footerHelp: string;
  footerPrivacy: string;
  helpline: string;
  assistantResponse: string;
  assistantFallback: string;
  sections: { actions: string; schemes: string; news: string; voice: string };
  suggestions: string[];
};

const contentByLanguage: Record<AppLanguage, TranslationDictionary> = {
  en: {
    brandSubtitle: "Your AI Farming Assistant - works even offline",
    title: "National Digital Farming Support Platform",
    heroDescription: "Voice-first advisory for crop planning, disease support, fertilizers, schemes, and market updates.",
    placeholder: "Ask about crops, disease, fertilizers...",
    send: "Send",
    listening: "Listening... speak in Hindi or English.",
    loading: "Sending",
    micLabel: "Start voice input",
    languageLabels: { en: "English", hi: "Hindi" },
    quickActionsTitle: "Quick Farm Services",
    quickActionsSubtitle: "Tap once to open major services.",
    schemesTitle: "Government Schemes",
    schemesSubtitle: "Simple bilingual information with direct eligibility checks.",
    schemesCta: "Check Eligibility",
    newsTitle: "Latest Krishi News",
    newsSubtitle: "Updates curated for weather, policy, and mandi markets.",
    voiceTitle: "Voice-First and Offline Ready",
    voiceDescription: "KRISHIVE keeps key guidance available in low-connectivity regions for small and medium farmers.",
    voiceHighlights: [
      "Works in rural low-network conditions with cached key sections.",
      "Supports English and Hindi voice interaction.",
      "Designed for low literacy with larger touch targets and plain language.",
    ],
    footerAbout: "About",
    footerHelp: "Help",
    footerPrivacy: "Privacy Policy",
    helpline: "Farmer Helpline: 1800-180-1551",
    assistantResponse: "Assistant response",
    assistantFallback: "Unable to fetch live answer. Please check backend connectivity.",
    sections: { actions: "Services", schemes: "Schemes", news: "News", voice: "Voice AI" },
    suggestions: ["Best crop for my soil?", "Plant disease detection", "Fertilizer advice"],
  },
  hi: {
    brandSubtitle: "आपका AI कृषि सहायक - इंटरनेट के बिना भी काम करता है",
    title: "राष्ट्रीय डिजिटल कृषि सहायता मंच",
    heroDescription: "फसल योजना, रोग सलाह, उर्वरक, योजनाएं और मंडी भाव के लिए वॉइस-फर्स्ट सहायता।",
    placeholder: "फसल, रोग, उर्वरक के बारे में पूछें...",
    send: "भेजें",
    listening: "सुन रहा है... हिंदी या अंग्रेजी में बोलें।",
    loading: "भेजा जा रहा है",
    micLabel: "वॉइस इनपुट शुरू करें",
    languageLabels: { en: "English", hi: "हिंदी" },
    quickActionsTitle: "त्वरित कृषि सेवाएं",
    quickActionsSubtitle: "मुख्य सेवाएं एक टैप में खोलें।",
    schemesTitle: "सरकारी योजनाएं",
    schemesSubtitle: "सरल द्विभाषी जानकारी और सीधा पात्रता जांच विकल्प।",
    schemesCta: "पात्रता जांचें",
    newsTitle: "ताजा कृषि समाचार",
    newsSubtitle: "मौसम, नीति और मंडी बाजार से जुड़ी महत्वपूर्ण अपडेट।",
    voiceTitle: "वॉइस-फर्स्ट और ऑफलाइन सक्षम",
    voiceDescription: "KRISHIVE कम नेटवर्क वाले क्षेत्रों में भी किसानों को मुख्य सलाह उपलब्ध कराता है।",
    voiceHighlights: [
      "कम नेटवर्क वाले ग्रामीण क्षेत्रों में भी जरूरी सेक्शन कैश से उपलब्ध।",
      "हिंदी और अंग्रेजी वॉइस इंटरैक्शन का समर्थन।",
      "कम साक्षरता को ध्यान में रखकर सरल भाषा और बड़े बटन।",
    ],
    footerAbout: "परिचय",
    footerHelp: "सहायता",
    footerPrivacy: "गोपनीयता नीति",
    helpline: "किसान हेल्पलाइन: 1800-180-1551",
    assistantResponse: "सहायक उत्तर",
    assistantFallback: "लाइव उत्तर प्राप्त नहीं हुआ। कृपया बैकएंड कनेक्शन जांचें।",
    sections: { actions: "सेवाएं", schemes: "योजनाएं", news: "समाचार", voice: "वॉइस AI" },
    suggestions: ["मेरी मिट्टी के लिए सबसे अच्छी फसल?", "पौधों के रोग की पहचान", "उर्वरक सलाह"],
  },
};

function HomeContent() {
  const { language, setLanguage } = useLanguage();
  const t = contentByLanguage[language];

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [micError, setMicError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof window === "undefined" ? true : navigator.onLine));
  const [location, setLocation] = useState<FarmerLocation | null>(() => (typeof window === "undefined" ? null : getCachedLocation()));
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualDistrict, setManualDistrict] = useState("");
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        currentTranscript += event.results[i][0].transcript;
      }
      setQuery(currentTranscript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: { error: string }) => {
      setIsRecording(false);
      setMicError(event.error === "not-allowed" ? "Microphone permission denied." : `Voice error: ${event.error}`);
    };
    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;
    };
  }, [language]);

  const actions = useMemo(
    () => [
      {
        icon: <Sprout size={18} />,
        title: language === "en" ? "Crop Recommendation" : "फसल सिफारिश",
        description:
          language === "en" ? "Find crops suitable to your soil and season." : "आपकी मिट्टी और मौसम के अनुसार फसल सुझाव।",
        cta: language === "en" ? "Open Service" : "सेवा खोलें",
        href: "#hero",
      },
      {
        icon: <Leaf size={18} />,
        title: language === "en" ? "Soil & Fertilizer Advice" : "मिट्टी और उर्वरक सलाह",
        description: language === "en" ? "Balanced nutrient plans for better yield." : "बेहतर उत्पादन के लिए संतुलित पोषण योजना।",
        cta: language === "en" ? "Get Advice" : "सलाह लें",
        href: "#hero",
      },
      {
        icon: <Stethoscope size={18} />,
        title: language === "en" ? "Disease Detection" : "रोग पहचान",
        description: language === "en" ? "Identify symptoms and get treatment tips." : "लक्षण पहचानें और उपचार सुझाव पाएं।",
        cta: language === "en" ? "Detect Now" : "अभी पहचानें",
        href: "#hero",
      },
      {
        icon: <TrendingUp size={18} />,
        title: language === "en" ? "Market Prices" : "मंडी भाव",
        description: language === "en" ? "Track mandi trends and price signals." : "मंडी रुझान और भाव संकेत देखें।",
        cta: language === "en" ? "View Prices" : "भाव देखें",
        href: "#news",
      },
      {
        icon: <Landmark size={18} />,
        title: language === "en" ? "Government Schemes" : "सरकारी योजनाएं",
        description: language === "en" ? "Discover subsidy and insurance opportunities." : "सब्सिडी और बीमा लाभ खोजें।",
        cta: language === "en" ? "Explore Schemes" : "योजनाएं देखें",
        href: "#schemes",
      },
      {
        icon: <Droplets size={18} />,
        title: language === "en" ? "Water Advice" : "जल सलाह",
        description:
          language === "en"
            ? "Get irrigation and water guidance for your crops."
            : "अपनी फसल के लिए सिंचाई और पानी की सलाह पाएं।",
        cta: language === "en" ? "Open Water Advice" : "जल सलाह खोलें",
        href: "/water-advice",
      },
    ],
    [language],
  );

  const schemes = [
    {
      title: "PM-KISAN",
      summaryEnglish: "Income support for eligible farmer families through direct benefit transfer.",
      summaryHindi: "योग्य किसान परिवारों के लिए प्रत्यक्ष लाभ हस्तांतरण के माध्यम से आय सहायता।",
    },
    {
      title: "Soil Health Card",
      summaryEnglish: "Periodic soil testing and nutrient recommendations for scientific farming.",
      summaryHindi: "वैज्ञानिक खेती हेतु मृदा परीक्षण और पोषक तत्वों की सिफारिश।",
    },
    {
      title: language === "en" ? "Crop Insurance" : "फसल बीमा",
      summaryEnglish: "Protection against crop loss due to weather risks and natural events.",
      summaryHindi: "मौसम जोखिम और प्राकृतिक घटनाओं से फसल नुकसान पर सुरक्षा।",
    },
  ];

  const newsByLanguage = {
    en: [
      { headline: "Monsoon expected to arrive early in central India", summary: "Advisory encourages early seed preparation for rain-fed regions.", tag: "weather" },
      { headline: "New MSP revision announced for kharif crops", summary: "Updated support prices released for paddy, pulses, and oilseeds.", tag: "policy" },
      { headline: "Tomato prices rise in key mandis this week", summary: "Farmers advised to monitor local demand before dispatch.", tag: "market" },
    ],
    hi: [
      { headline: "मध्य भारत में मानसून जल्दी आने की संभावना", summary: "वर्षा आधारित क्षेत्रों में बीज तैयारी जल्दी शुरू करने की सलाह।", tag: "मौसम" },
      { headline: "खरीफ फसलों के लिए नया MSP संशोधन जारी", summary: "धान, दाल और तिलहन के लिए अद्यतन समर्थन मूल्य घोषित।", tag: "नीति" },
      { headline: "इस सप्ताह प्रमुख मंडियों में टमाटर के भाव बढ़े", summary: "किसानों को स्थानीय मांग देखकर आपूर्ति करने की सलाह।", tag: "बाजार" },
    ],
  };

  const toggleMic = async () => {
    if (!recognitionRef.current) {
      setMicError("Speech recognition not supported in this browser.");
      return;
    }
    setMicError("");
    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      recognitionRef.current.start();
    } catch {
      setMicError("Unable to access microphone.");
    }
  };

  const submitQuery = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const result = await postVoiceQuery({ text: query.trim(), language, location: location || undefined });
      setAnswer(result.answer);
    } catch {
      setAnswer(t.assistantFallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setLocationError("");
    try {
      const detected = await detectFarmerLocation();
      setLocation(detected);
    } catch {
      setLocationError(language === "en" ? "Location unavailable. Enter district manually." : "लोकेशन उपलब्ध नहीं है। जिला मैनुअली भरें।");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveManualDistrict = () => {
    if (!manualDistrict.trim()) return;
    const saved = saveManualLocation(manualDistrict.trim(), language === "en" ? "Unknown state" : "अज्ञात राज्य");
    setLocation(saved);
    setLocationError("");
  };

  return (
    <div className="min-h-screen bg-[#f7f3e8] text-[#1f2a1f]">
      <header className="sticky top-0 z-20 border-b border-[#ddd6c4] bg-[#f7f3e8]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#hero" className="text-xl font-bold text-[#1b5e20]">KRISHIVE</a>
          <div className="hidden items-center gap-5 text-sm text-[#2f3a2f] sm:flex">
            <a href="#actions">{language === "en" ? "Crop" : "फसल"}</a>
            <a href="#actions">{language === "en" ? "Disease" : "रोग"}</a>
            <a href="#news">{language === "en" ? "Weather" : "मौसम"}</a>
            <a href="/water-advice">{language === "en" ? "Water Advice" : "जल सलाह"}</a>
            <a href="#actions">{t.sections.actions}</a>
            <a href="#schemes">{t.sections.schemes}</a>
            <a href="#news">{t.sections.news}</a>
            <a href="#voice">{t.sections.voice}</a>
          </div>
          <LanguageToggle labels={t.languageLabels} />
        </div>
      </header>

      <main>
        <section id="hero" className="border-b border-[#dfd8c7] bg-[radial-gradient(circle_at_top,#f9f6eb,#f2ecd9)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16">
            <p className="text-sm font-medium uppercase tracking-wide text-[#8a6119]">Government-grade digital agriculture</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#1b5e20] sm:text-6xl">KRISHIVE</h1>
            <p className="mt-3 text-base text-[#334233] sm:text-lg">{t.brandSubtitle}</p>
            <p className="mt-2 max-w-2xl text-sm text-[#4f5d4f] sm:text-base">{t.heroDescription}</p>
            <div className="mt-5 w-full max-w-4xl rounded-xl border border-[#ddd6c4] bg-white p-3 text-left sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => void handleUseMyLocation()}
                  disabled={isLocating}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-[#1b5e20] px-4 text-sm font-medium text-[#1b5e20]"
                >
                  <LocateFixed size={16} />
                  {isLocating ? (language === "en" ? "Detecting..." : "ढूंढ रहे हैं...") : language === "en" ? "Use My Location" : "मेरी लोकेशन उपयोग करें"}
                </button>
                <p className="text-sm text-[#3f4c3f]">
                  {location
                    ? `${language === "en" ? "Location" : "स्थान"}: ${location.district}, ${location.state}`
                    : language === "en"
                      ? "Location not set"
                      : "स्थान सेट नहीं है"}
                </p>
              </div>
              {!isOnline && !location ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={manualDistrict}
                    onChange={(event) => setManualDistrict(event.target.value)}
                    placeholder={language === "en" ? "Enter district manually" : "जिला नाम दर्ज करें"}
                    className="min-h-[48px] flex-1 rounded-lg border border-[#d8d2bf] px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualDistrict}
                    className="min-h-[48px] rounded-lg bg-[#1b5e20] px-4 text-sm font-medium text-white"
                  >
                    {language === "en" ? "Save District" : "जिला सहेजें"}
                  </button>
                </div>
              ) : null}
              {locationError ? <p className="mt-2 text-sm text-[#8f2f14]">{locationError}</p> : null}
            </div>
            <div className="mt-8 w-full max-w-4xl">
              <HeroAIInput
                query={query}
                placeholder={t.placeholder}
                micLabel={t.micLabel}
                sendLabel={t.send}
                listeningLabel={t.listening}
                loadingLabel={t.loading}
                suggestions={t.suggestions}
                isRecording={isRecording}
                isLoading={isLoading}
                onQueryChange={setQuery}
                onMicClick={() => void toggleMic()}
                onSend={() => void submitQuery()}
                onSuggestionClick={setQuery}
              />
            </div>
            {micError ? <p className="mt-4 rounded-lg bg-[#fce9e4] px-4 py-2 text-sm text-[#8f2f14]">{micError}</p> : null}
            {answer ? (
              <div className="mt-4 w-full max-w-4xl rounded-2xl border border-[#d9d3c2] bg-white p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6e7a6f]">{t.assistantResponse}</p>
                <p className="mt-2 text-sm leading-6 text-[#2d392d]">{answer}</p>
              </div>
            ) : null}
          </div>
        </section>
        <HeroShowcase
          headline={language === "en" ? "Smart Farming. Simple Decisions." : "स्मार्ट खेती। सरल फैसले।"}
          subtext={language === "en" ? "Voice-powered AI for every farmer" : "हर किसान के लिए वॉइस-सक्षम AI"}
          micLabel={t.micLabel}
          isRecording={isRecording}
          onMicClick={() => void toggleMic()}
        />

        <SectionWrapper id="actions" title={t.quickActionsTitle} subtitle={t.quickActionsSubtitle}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((item) => (
              <ActionCard key={item.title} icon={item.icon} title={item.title} description={item.description} cta={item.cta} href={item.href} />
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="schemes" title={t.schemesTitle} subtitle={t.schemesSubtitle}>
          <div className="grid gap-4 md:grid-cols-3">
            {schemes.map((item) => (
              <SchemeCard
                key={item.title}
                title={item.title}
                summaryEnglish={item.summaryEnglish}
                summaryHindi={item.summaryHindi}
                cta={t.schemesCta}
              />
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="news" title={t.newsTitle} subtitle={t.newsSubtitle}>
          <div className="mb-5">
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1 text-sm ${language === "en" ? "bg-[#1b5e20] text-white" : "bg-white text-[#1b5e20]"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`rounded-full px-3 py-1 text-sm ${language === "hi" ? "bg-[#1b5e20] text-white" : "bg-white text-[#1b5e20]"}`}
              >
                हिंदी
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {newsByLanguage[language].map((item) => (
              <NewsCard key={item.headline} headline={item.headline} summary={item.summary} tag={item.tag} />
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="voice" title={t.voiceTitle} subtitle={t.voiceDescription}>
          {!isOnline ? (
            <div className="mb-4 rounded-xl border border-[#e2ad6a] bg-[#fff4e5] p-3 text-sm text-[#8d4a00]">
              {language === "en" ? "You are offline. Cached guidance sections are still available." : "आप ऑफलाइन हैं। कैश किए गए सेक्शन अभी भी उपलब्ध हैं।"}
            </div>
          ) : null}
          <div className="rounded-2xl border border-[#d9d3c2] bg-[#fffdf7] p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${isRecording ? "animate-pulse bg-[#b23c17]" : "bg-[#1b5e20]"}`} />
              <p className="text-sm text-[#4d594d]">
                {isRecording
                  ? language === "en"
                    ? "Voice capture is active."
                    : "वॉइस कैप्चर सक्रिय है।"
                  : language === "en"
                    ? "Tap microphone in hero to speak."
                    : "बोलने के लिए हीरो सेक्शन में माइक्रोफोन दबाएं।"}
              </p>
            </div>
            <ul className="space-y-2 text-sm text-[#3d4a3d]">
              {t.voiceHighlights.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </div>
        </SectionWrapper>
      </main>

      <footer className="border-t border-[#ddd6c4] bg-[#efe8d3]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[#334133] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t.helpline}</p>
          <div className="flex items-center gap-4">
            <a href="#">{t.footerAbout}</a>
            <a href="#">{t.footerHelp}</a>
            <a href="#">{t.footerPrivacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}

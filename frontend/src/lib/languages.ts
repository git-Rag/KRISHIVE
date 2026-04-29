export type SupportedLanguage = {
  label: string;
  value: string;
  speechLang: string;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { label: "Auto", value: "auto", speechLang: "hi-IN" },
  { label: "English", value: "en", speechLang: "en-IN" },
  { label: "Hindi", value: "hi", speechLang: "hi-IN" },
  { label: "Marathi", value: "mr", speechLang: "mr-IN" },
  { label: "Tamil", value: "ta", speechLang: "ta-IN" },
  { label: "Telugu", value: "te", speechLang: "te-IN" },
  { label: "Kannada", value: "kn", speechLang: "kn-IN" },
  { label: "Bengali", value: "bn", speechLang: "bn-IN" },
  { label: "Gujarati", value: "gu", speechLang: "gu-IN" },
  { label: "Punjabi", value: "pa", speechLang: "pa-IN" },
];

export const ttsLanguageMap: Record<string, string> = {
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  en: "en-IN",
};

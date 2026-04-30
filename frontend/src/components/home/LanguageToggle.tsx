import { Languages } from "lucide-react";
import { AppLanguage, useLanguage } from "@/context/LanguageContext";

type LanguageToggleProps = {
  labels: Record<AppLanguage, string>;
};

export function LanguageToggle({ labels }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d2bf] bg-[#fffdf7] p-1">
      <span className="pl-2 text-[#1b5e20]">
        <Languages size={16} />
      </span>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-3 py-1.5 text-sm transition ${
          language === "en" ? "bg-[#1b5e20] text-white" : "text-[#1b5e20] hover:bg-[#f0efe9]"
        }`}
      >
        {labels.en}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        className={`rounded-full px-3 py-1.5 text-sm transition ${
          language === "hi" ? "bg-[#1b5e20] text-white" : "text-[#1b5e20] hover:bg-[#f0efe9]"
        }`}
      >
        {labels.hi}
      </button>
    </div>
  );
}

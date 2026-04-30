import { ArrowRight, LoaderCircle } from "lucide-react";
import { MicButton } from "@/components/home/MicButton";

type HeroAIInputProps = {
  query: string;
  placeholder: string;
  micLabel: string;
  sendLabel: string;
  listeningLabel: string;
  loadingLabel: string;
  suggestions: string[];
  isRecording: boolean;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onMicClick: () => void;
  onSend: () => void;
  onSuggestionClick: (value: string) => void;
};

export function HeroAIInput({
  query,
  placeholder,
  micLabel,
  sendLabel,
  listeningLabel,
  loadingLabel,
  suggestions,
  isRecording,
  isLoading,
  onQueryChange,
  onMicClick,
  onSend,
  onSuggestionClick,
}: HeroAIInputProps) {
  return (
    <div className="w-full rounded-2xl border border-[#d8d2bf] bg-[#fffdf7] p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="h-[60px] w-full rounded-xl border border-[#d8d2bf] bg-white px-4 text-base text-[#213123] outline-none ring-[#1b5e20] focus:ring-2"
        />
        <div className="mx-auto sm:mx-0">
          <MicButton isRecording={isRecording} onClick={onMicClick} label={micLabel} />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={isLoading || !query.trim()}
          className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl bg-[#1b5e20] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#144a1a] disabled:cursor-not-allowed disabled:bg-[#82a187] sm:h-[60px]"
        >
          {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {isLoading ? loadingLabel : sendLabel}
        </button>
      </div>
      <p className="mt-3 text-sm text-[#4e5b4f]">{isRecording ? listeningLabel : " "}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSuggestionClick(item)}
            className="rounded-full border border-[#dfd9c7] bg-white px-3 py-1.5 text-sm text-[#1b5e20] transition hover:bg-[#f4f1e8]"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

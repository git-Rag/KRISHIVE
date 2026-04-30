import { Mic, Square } from "lucide-react";

type MicButtonProps = {
  isRecording: boolean;
  label: string;
  onClick: () => void;
  prominent?: boolean;
};

export function MicButton({ isRecording, label, onClick, prominent = false }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex min-h-[60px] min-w-[60px] items-center justify-center rounded-full text-white shadow-md transition ${
        prominent ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14"
      } ${isRecording ? "mic-pulsing bg-[#b23c17]" : "bg-[#1b5e20] hover:bg-[#144a1a]"}
      }`}
    >
      {isRecording ? <Square size={prominent ? 24 : 20} /> : <Mic size={prominent ? 24 : 20} />}
    </button>
  );
}

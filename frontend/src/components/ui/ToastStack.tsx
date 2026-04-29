"use client";

import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

export type ToastItem = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const tone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-sm ${tone[toast.type]}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : toast.type === "error" ? <AlertTriangle size={16} /> : <Info size={16} />}
          <p className="flex-1 text-sm">{toast.message}</p>
          <button className="text-xs underline" onClick={() => onDismiss(toast.id)} type="button">
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

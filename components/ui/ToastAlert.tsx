"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastAlertProps = {
  message: string;
  variant?: "success" | "error";
  onClose?: () => void;
};

export default function ToastAlert({
  message,
  variant = "success",
  onClose,
}: ToastAlertProps) {
  const isSuccess = variant === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`pointer-events-auto flex min-w-[280px] max-w-[360px] items-start gap-3 rounded-[20px] border px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur ${
        isSuccess
          ? "border-emerald-200 bg-white/95 text-emerald-700"
          : "border-red-200 bg-white/95 text-red-600"
      }`}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${
          isSuccess ? "text-emerald-500" : "text-red-500"
        }`}
      />
      <div className="min-w-0 flex-1 text-sm font-medium leading-6">
        {message}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-black/5 hover:text-neutral-700"
          aria-label="알림 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

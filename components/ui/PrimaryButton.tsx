import { ArrowRight } from "lucide-react";

type PrimaryButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
};

export default function PrimaryButton({
  children,
  type = "button",
  disabled = false,
}: PrimaryButtonProps) {
  if (disabled) {
    return (
      <button
        type={type}
        disabled
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-gray-300 px-6 py-3.5 text-[14px] font-semibold text-gray-500"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff6a00] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(255,106,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,106,0,0.55)] active:translate-y-0 active:scale-[0.98]"
    >
      {/* 호버 시 지나가는 광택 */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <span className="relative">{children}</span>

      <ArrowRight
        size={17}
        strokeWidth={2.4}
        className="relative transition-transform duration-300 group-hover:translate-x-1"
      />
    </button>
  );
}

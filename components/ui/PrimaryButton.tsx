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
  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-[12px] px-5 py-3 text-[13px] font-medium transition
        ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-black text-white hover:opacity-90"}
      `}
    >
      {children}
    </button>
  );
}
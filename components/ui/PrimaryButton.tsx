type PrimaryButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
};

export default function PrimaryButton({
  children,
  href,
  type = "button",
}: PrimaryButtonProps) {
  const className =
    "inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:scale-[1.02] hover:opacity-95";

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={className}>
      {children}
    </button>
  );
}
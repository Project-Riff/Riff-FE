type SectionTitleProps = {
  eyebrow: string;
  title: string;
  desc?: string;
};

export default function SectionTitle({
  eyebrow,
  title,
  desc,
}: SectionTitleProps) {
  return (
    <div className="mb-8">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
        {eyebrow}
      </p>

      <div className="mt-3 flex items-end justify-between gap-8">
        <h2 className="font-[var(--font-serif)] text-[24px] tracking-[-0.02em] text-[#111] whitespace-nowrap">
          {title}
        </h2>

        {desc && (
          <p className="hidden min-w-[420px] whitespace-nowrap text-[15px] leading-[1.6] text-[#666] md:block">
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}
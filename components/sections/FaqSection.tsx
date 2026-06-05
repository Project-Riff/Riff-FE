import { faqs } from "@/lib/data";

export default function FaqSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[960px]">
        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            FAQ
          </p>

          <div className="mt-3 flex items-end justify-between gap-8">
            <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
              자주 받을
              <br />
              <span className="text-[#ff7a2f]">질문도 정리했습니다</span>
            </h2>

            <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:block">
              궁금하신 부분은 언제든지 문의해 주세요. 빠르게 답변드리겠습니다.
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="group rounded-[18px] border border-[#ececec] bg-[#fcfcfc] p-5 transition-all duration-300 hover:border-[#ffcaa3] hover:bg-white hover:shadow-[0_12px_30px_rgba(255,122,47,0.08)] md:p-6"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a3d] to-[#ff6a00] text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(255,106,0,0.3)]">
                  Q
                </span>

                <h3 className="pt-0.5 font-[var(--font-serif)] text-[18px] font-semibold leading-[1.4] text-[#111] md:text-[19px]">
                  {item.q}
                </h3>
              </div>

              <div className="mt-3.5 flex items-start gap-3.5 border-t border-[#f0f0f0] pt-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[13px] font-bold text-[#999]">
                  A
                </span>

                <p className="pt-0.5 text-[14px] leading-[1.85] text-[#555]">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
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

        <div className="space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-[16px] border border-[#dcdcdc] bg-white p-5"
            >
              <h3 className="font-[var(--font-serif)] text-[18px] leading-[1.35] text-[#111]">
                {item.q}
              </h3>
              <p className="mt-3 text-[13px] leading-[1.8] text-[#666]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
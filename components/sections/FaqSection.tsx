import SectionTitle from "@/components/ui/SectionTitle";
import { faqs } from "@/lib/data";

export default function FaqSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[960px]">
        <SectionTitle
          eyebrow="FAQ"
          title={<>자주 받을 <span className="text-[#ff7a2f]">질문</span>도 같이 정리했습니다</>}
          desc="궁금하신 부분은 언제든지 문의해 주세요. 빠르게 답변드리겠습니다."
        />

        <div className="space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-[16px] border border-[#f2f2f2] bg-white p-5"
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
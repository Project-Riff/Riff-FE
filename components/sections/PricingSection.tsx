import SectionTitle from "@/components/ui/SectionTitle";
import { pricingItems } from "@/lib/data";

export default function PricingSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[960px]">
        <SectionTitle
          eyebrow="Pricing"
          title="빠르게 시작할 수 있는 가격 구조"
          desc="원하시는 영상 유형과 예산에 맞춰 선택할 수 있습니다."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricingItems.map((item) => (
            <div
              key={item.name}
              className="rounded-[16px] border border-[#f2f2f2] bg-white p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#b0b0b0]">
                {item.name}
              </p>

              <h3 className="mt-3 text-[26px] font-semibold text-[#111]">
                {item.price}
              </h3>

              <ul className="mt-4 space-y-2 text-[13px] leading-[1.7] text-[#666]">
                {item.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
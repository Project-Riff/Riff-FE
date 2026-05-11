import { Check, Sparkles } from "lucide-react";
import { pricingItems } from "@/lib/data";

export default function PricingSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            Pricing
          </p>

          <div className="mt-3 flex items-end justify-between gap-8">
            <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
              빠르게 시작할 수 있는{" "}
              <span className="text-[#ff7a2f]">론칭 특가</span>
            </h2>

            <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:block">
              론칭 기념으로 한 달간 Single 상품을 3만원에서 2만원으로 할인합니다.
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricingItems.map((item) => {
            const isFeatured = item.name === "Single";

            return (
              <div
                key={item.name}
                className={[
                  "group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-[22px] border p-5 transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(0,0,0,0.08)]",
                  isFeatured
                    ? "border-orange-300 bg-[#fff7ef] shadow-[0_16px_42px_rgba(255,122,47,0.16)]"
                    : "border-[#e8e8e8] bg-white",
                ].join(" ")}
              >
                {isFeatured && (
                  <>
                    <div className="absolute -right-5 top-5 rotate-45 bg-orange-500 px-10 py-1 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(255,122,47,0.25)]">
                      SALE
                    </div>

                    <div className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(255,122,47,0.22)]">
                      론칭 기념 한달간 할인
                    </div>
                  </>
                )}

                <div className="mb-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#b0b0b0]">
                    {item.name}
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    {item.originalPrice && (
                      <span className="mb-1 text-[15px] font-medium text-[#b8b8b8] line-through">
                        {item.originalPrice}
                      </span>
                    )}

                    <h3 className="text-[30px] font-semibold tracking-[-0.04em] text-[#111]">
                      {item.price}
                    </h3>
                  </div>

                  {isFeatured && (
                    <p className="mt-2 text-[12px] font-medium text-[#ff7a2f]">
                      지금 신청 시 1만원 할인 적용
                    </p>
                  )}
                </div>

                <div
                  className={[
                    "h-px w-full bg-gradient-to-r to-transparent",
                    isFeatured
                      ? "from-orange-200 via-orange-300"
                      : "from-[#eeeeee] via-[#dddddd]",
                  ].join(" ")}
                />

                <ul className="mt-5 space-y-3 text-[13px] leading-[1.7] text-[#666]">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span
                        className={[
                          "mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          isFeatured
                            ? "bg-orange-500 text-white"
                            : "bg-[#f3f3f3] text-[#777]",
                        ].join(" ")}
                      >
                        <Check size={11} strokeWidth={2.2} />
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <a
                    href="#request"
                    className={[
                      "inline-flex h-[40px] w-full items-center justify-center rounded-full text-[13px] font-medium transition",
                      isFeatured
                        ? "bg-[#111] text-white hover:opacity-90"
                        : "border border-[#e8e8e8] bg-white text-[#111] hover:bg-[#fafafa]",
                    ].join(" ")}
                  >
                    {isFeatured ? "할인가로 문의하기" : "문의하기"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
import { pricingItems } from "@/lib/data";
import { Check } from "lucide-react";

export default function PricingSection() {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-9">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            Pricing
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
              처음 시작하기 좋은{" "}
              <span className="text-[#ff7a2f]">쇼츠 제작 플랜</span>
            </h2>

            <p className="max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:text-right">
              [론칭기념] Basic 상품을 한정 특가로 제공합니다.
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricingItems.map((item) => {
            const isFeatured = item.name === "Basic";

            return (
              <div
                key={item.name}
                className={[
                  "flex h-full min-h-[320px] flex-col rounded-[20px] border p-5 transition duration-300",
                  isFeatured
                    ? "border-[#ffb98f] bg-[#fffaf6]"
                    : "border-[#ededed] bg-white hover:border-[#dddddd]",
                ].join(" ")}
              >
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-medium text-[#999]">
                      {item.name}
                    </p>

                    {isFeatured && (
                      <span className="rounded-full bg-[#fff0e6] px-2.5 py-1 text-[11px] font-medium text-[#ff7a2f]">
                        첫 달 특가
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    {item.originalPrice && (
                      <p className="mb-1 text-[13px] text-[#aaa] line-through">
                        {item.originalPrice}
                      </p>
                    )}

                    <div className="flex items-end gap-1">
                      <h3 className="text-[32px] font-semibold tracking-[-0.04em] text-[#111]">
                        {item.price}
                      </h3>
                    </div>

                    {isFeatured && (
                      <p className="mt-2 text-[12px] leading-[1.6] text-[#ff7a2f]">
                        기존 2,900원에서 1,900원으로 할인 적용
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px w-full bg-[#eeeeee]" />

                <ul className="mt-5 space-y-3 text-[13px] leading-[1.7] text-[#666]">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span
                        className={[
                          "mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          isFeatured
                            ? "bg-[#ff7a2f] text-white"
                            : "bg-[#f4f4f4] text-[#888]",
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
                        ? "bg-[#111] text-white hover:bg-[#222]"
                        : "border border-[#e5e5e5] bg-white text-[#111] hover:bg-[#fafafa]",
                    ].join(" ")}
                  >
                    {isFeatured ? "특가로 문의하기" : "문의하기"}
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

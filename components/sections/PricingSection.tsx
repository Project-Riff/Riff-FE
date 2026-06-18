import { pricingItems } from "@/lib/data";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#071716] px-6 py-16 md:px-10 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,107,44,0.24),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(7,23,22,0))]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6b2c]/20 blur-[130px]" />

      <div className="relative mx-auto max-w-[1180px]">
        <div className="mx-auto mb-10 max-w-[720px] text-center">
          <p className="font-[var(--font-pretendard)] text-[14px] font-semibold tracking-[0] text-[#ff6b2c]">
            Pricing
          </p>

          <div className="mt-3 flex flex-col items-center gap-3">
            <h2 className="font-[var(--font-pretendard)] text-[28px] font-semibold leading-[1.2] tracking-[0] text-white md:text-[34px]">
              <span className="block md:inline">처음 시작하기 좋은</span>
              <span className="text-[#ff6b2c] md:ml-2">쇼츠 제작 플랜</span>
            </h2>

            <p className="max-w-[520px] text-[14px] leading-[1.7] text-white/80">
              부담 없는 가격으로 시작하는 Basic 상품을 제공합니다.
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {pricingItems.map((item) => {
            const isFeatured = item.name === "Basic";

            return (
              <div
                key={item.name}
                className={[
                  "group/card relative flex h-full min-h-[520px] flex-col rounded-[22px] border p-6 transition-all duration-300 hover:-translate-y-1",
                  isFeatured
                    ? "border-[#ff6b2c]/70 bg-[linear-gradient(180deg,rgba(255,107,44,0.34),rgba(255,107,44,0.18)_44%,rgba(255,107,44,0.08))] shadow-[0_0_0_1px_rgba(255,107,44,0.22),0_0_90px_rgba(255,107,44,0.34),inset_0_1px_0_rgba(255,255,255,0.18)]"
                    : "border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]",
                ].join(" ")}
              >
                {isFeatured && (
                  <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_42%)]" />
                )}

                <div className="relative mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={[
                        "text-[16px] font-semibold tracking-[0]",
                        isFeatured ? "text-white" : "text-white/75",
                      ].join(" ")}
                    >
                      {item.name}
                    </p>
                    {isFeatured && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#ff6b2c]">
                        추천
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    {item.originalPrice && (
                      <p className="mb-1 text-[13px] text-white/40 line-through">
                        {item.originalPrice}
                      </p>
                    )}

                    <div className="flex items-end gap-2">
                      <h3 className="text-[44px] font-semibold tracking-[-0.03em] text-white">
                        {item.price}
                      </h3>
                      <span className="pb-2 text-[13px] font-semibold text-white/60">
                        / 릴스 제작
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/apply"
                  className={[
                    "relative inline-flex h-[46px] w-full items-center justify-center gap-1.5 rounded-lg text-[14px] font-semibold transition-all duration-300 active:scale-[0.98]",
                    isFeatured
                      ? "bg-white text-[#071716] shadow-[0_14px_36px_rgba(255,255,255,0.16)] hover:bg-[#fff5ef]"
                      : "bg-white text-[#071716] hover:bg-[#fff5ef]",
                  ].join(" ")}
                >
                  문의하기
                  <ArrowUpRight
                    size={16}
                    strokeWidth={2.2}
                    className="transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
                  />
                </Link>

                <p className="relative mt-3 text-center text-[12px] font-medium text-white/60">
                  작업 범위 확인 후 진행됩니다.
                </p>

                <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-white/14 to-transparent" />

                <p className="relative mb-4 text-[14px] font-semibold text-white">
                  포함 사항
                </p>

                <ul className="relative space-y-3.5 text-[14px] leading-[1.7] text-white/85">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span
                        className={[
                          "mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          isFeatured
                            ? "bg-[#ff6b2c] text-white"
                            : "bg-white/10 text-[#ff6b2c]",
                        ].join(" ")}
                      >
                        <Check size={11} strokeWidth={2.2} />
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

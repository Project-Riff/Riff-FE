import { pricingItems } from "@/lib/data";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";

export default function PricingSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fff6ef] via-white to-[#fdf2ea] px-6 py-16">
      {/* glassmorphism 배경 글로우 */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#ff7a2f]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#ffb98f]/30 blur-[120px]" />

      <div className="relative mx-auto max-w-[960px]">
        <div className="mb-9">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            Pricing
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="font-[var(--font-serif)] text-[34px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#111]">
              처음 시작하기 좋은{" "}
              <span className="text-[#ff7a2f]">쇼츠 제작 플랜</span>
            </h2>

            <p className="max-w-[420px] text-[14px] leading-[1.7] text-[#555] md:text-right">
              부담 없는 가격으로 시작하는 Basic 상품을 제공합니다.
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
                  "group/card relative flex h-full min-h-[320px] flex-col rounded-[24px] border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5",
                  isFeatured
                    ? "border-white/60 bg-white/55 shadow-[0_8px_40px_rgba(255,122,47,0.22),inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-[0_16px_50px_rgba(255,122,47,0.3),inset_0_1px_0_rgba(255,255,255,0.8)]"
                    : "border-white/50 bg-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-white/55 hover:shadow-[0_16px_44px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.7)]",
                ].join(" ")}
              >
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={[
                        "text-[14px] font-semibold uppercase tracking-[0.04em]",
                        isFeatured ? "text-[#ff7a2f]" : "text-[#333]",
                      ].join(" ")}
                    >
                      {item.name}
                    </p>
                    {isFeatured && (
                      <span className="rounded-full bg-[#ff7a2f] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
                        추천
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
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent" />

                <ul className="mt-5 space-y-3 text-[14px] leading-[1.7] text-[#333]">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span
                        className={[
                          "mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          isFeatured
                            ? "bg-[#ff7a2f] text-white"
                            : "bg-[#ffe9dc] text-[#ff7a2f]",
                        ].join(" ")}
                      >
                        <Check size={11} strokeWidth={2.2} />
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <Link
                    href="/apply"
                    className={[
                      "group inline-flex h-[44px] w-full items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 active:scale-[0.98]",
                      isFeatured
                        ? "bg-[#ff7a2f] text-white shadow-[0_6px_16px_rgba(255,122,47,0.32)] hover:bg-[#ff8a3d] hover:shadow-[0_8px_22px_rgba(255,122,47,0.42)] hover:-translate-y-0.5"
                        : "border border-[#e5e5e5] bg-white text-[#111] hover:border-[#ff7a2f] hover:text-[#ff7a2f] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]",
                    ].join(" ")}
                  >
                    문의하기
                    <ArrowUpRight
                      size={16}
                      strokeWidth={2.2}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

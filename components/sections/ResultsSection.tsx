"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Images, MessageSquareText, TrendingUp } from "lucide-react";

const results = [
  {
    value: 1000,
    suffix: "+",
    title: "팔로워 성장 사례",
    desc: "Ryff 영상만으로 2주 안에 팔로워",
    icon: TrendingUp,
  },
  {
    value: 50,
    suffix: "+",
    title: "제작 · 협업 문의",
    desc: "초기 제작 문의와 협업 요청",
    icon: MessageSquareText,
  },
  {
    value: "썸네일 + 본문",
    title: "게시물까지 한 번에",
    desc: "영상부터 업로드 문구까지",
    icon: Images,
  },
];

function CountUpValue({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let frame = 0;
    const start = performance.now();
    const duration = 1050;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [inView, value]);

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function ResultsSection() {
  return (
    <section
      id="results"
      className="overflow-hidden bg-white px-6 py-16 md:px-10 md:py-20"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-9 max-w-[720px]">
          <p className="font-[var(--font-pretendard)] text-[14px] font-semibold tracking-[0] text-[#ff6b2c]">
            단 2주의 성과
          </p>

          <h2 className="mt-3 text-[28px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px]">
            숫자로 먼저 확인된
            <br />
            <span className="text-[#ff6b2c]">짧은 영상의 반응</span>
          </h2>

          <p className="mt-4 max-w-[620px] text-[14px] leading-[1.8] text-[#5f6666]">
            <span className="md:hidden">
              작은 매장도 콘텐츠가 쌓이면 발견되는 방식이 달라집니다.
              <br />
              Ryff는 영상 하나가 노출, 저장, 문의로
              <br />
              이어지는 흐름을 만듭니다.
            </span>
            <span className="hidden md:inline">
              작은 매장도 콘텐츠가 쌓이면 발견되는 방식이 달라집니다.
              <br />
              Ryff는 영상 하나가 노출, 저장, 문의로 이어지는 흐름을 만듭니다.
            </span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {results.map((result, index) => {
            const Icon = result.icon;
            return (
              <div
                key={result.title}
                className="group relative overflow-hidden rounded-lg border border-black/8 bg-[#fbfaf7] p-6 shadow-[0_18px_42px_rgba(7,23,22,0.08)]"
              >
                <div className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#ff6b2c] shadow-[0_10px_24px_rgba(7,23,22,0.08)]">
                  <Icon size={20} />
                </div>

                <p className="text-[13px] font-semibold text-[#5f6666]">
                  {result.title}
                </p>

                <motion.div
                  className={[
                    "mt-6 font-semibold leading-none tracking-[0] text-[#ff6b2c]",
                    typeof result.value === "number"
                      ? "text-[44px] md:text-[58px]"
                      : "text-[28px] md:text-[42px]",
                  ].join(" ")}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  {typeof result.value === "number" ? (
                    <CountUpValue
                      value={result.value}
                      suffix={result.suffix ?? ""}
                    />
                  ) : (
                    result.value
                  )}
                </motion.div>

                <p className="mt-4 text-[14px] font-semibold leading-[1.7] text-[#4d5554]">
                  {result.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

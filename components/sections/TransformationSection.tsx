"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const examples = [
  {
    label: "카페 메뉴 컷",
    before: "/source-videos/cafe-leoiseau.mp4",
    beforeType: "video",
    after: "/cafe/cafe-1.mp4",
    note: "음료와 테이블 장면을 살려 방문하고 싶은 분위기로 편집",
  },
  {
    label: "식사 테이블 컷",
    before: "/source-videos/ronnies-pizza-original.mp4",
    beforeType: "video",
    after: "/restaurant/restaurant-1.mp4",
    note: "메뉴 구성을 빠르게 보여주고 자막으로 대표 포인트 강조",
  },
];

export default function TransformationSection() {
  return (
    <section className="overflow-hidden bg-white px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-10 max-w-[720px]">
          <h2 className="text-[28px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px]">
            평범한 촬영본도
            <br />
            <span className="text-[#ff6b2c]">보여주고 싶은 콘텐츠가 됩니다</span>
          </h2>

          <p className="mt-4 max-w-none text-[14px] leading-[1.8] text-[#5f6666] md:whitespace-nowrap">
            <span className="md:hidden">
              원본 사진과 짧은 영상을 바탕으로 장면 순서,
              <br />
              자막 포인트, 릴스 템포를 잡아
              <br />
              바로 업로드할 수 있는 세로형 콘텐츠로 만듭니다.
            </span>
            <span className="hidden md:inline">
              원본 사진과 짧은 영상을 바탕으로 장면 순서, 자막 포인트, 릴스 템포를 잡아 바로 업로드할 수 있는 세로형 콘텐츠로 만듭니다.
            </span>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {examples.map((example, index) => (
            <motion.article
              key={example.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-lg border border-black/8 bg-[#fbfaf7] p-4 shadow-[0_16px_38px_rgba(7,23,22,0.08)] md:p-5"
            >
              <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_0.72fr]">
                <div>
                  <p className="mb-3 text-[12px] font-semibold text-[#5f6666]">
                    전달받은 촬영본
                  </p>
                  <div className="overflow-hidden rounded-lg border border-black/8 bg-white">
                    {example.beforeType === "video" ? (
                      <video
                        src={example.before}
                        className="aspect-[4/3] w-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={example.before}
                        alt={`${example.label} 원본 이미지`}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#071716] text-white md:h-11 md:w-11">
                    <ArrowRight size={18} />
                  </span>
                </div>

                <div>
                  <p className="mb-3 text-[12px] font-semibold text-[#5f6666]">
                    완성된 릴스
                  </p>
                  <div className="mx-auto max-w-[190px] overflow-hidden rounded-lg border border-black/8 bg-black shadow-[0_18px_36px_rgba(7,23,22,0.16)]">
                    <video
                      className="aspect-[9/16] w-full object-cover"
                      src={example.after}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-black/8 pt-4">
                <p className="text-[13px] font-semibold text-[#071716]">
                  {example.label}
                </p>
                <p className="mt-1 text-[13px] leading-[1.7] text-[#5f6666]">
                  {example.note}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

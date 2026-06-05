"use client";

import { motion } from "framer-motion";

const thumbnails = [
  "/Thumbnail-1.png",
  "/Thumbnail-2.png",
  "/Thumbnail-3.png",
  "/Thumbnail-4.png",
  "/Thumbnail-5.png",
  "/Thumbnail-6.jpg",
];

// 이음새 없는 루프를 위해 전체 목록을 2배로 복제
const marqueeThumbs = [...thumbnails, ...thumbnails];

export default function SampleSection() {
  return (
    <section id="samples" className="overflow-hidden bg-white py-14 md:py-16">
      <div className="mx-auto mb-10 max-w-[960px] px-6">
        {/* 헤더 */}
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
          Samples
        </p>

        <div className="mt-3 flex items-end justify-between gap-8">
          <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
            <span className="text-[#ff7a2f]">이런 느낌으로,</span>
            <br />
            자연스럽게 제작합니다
          </h2>

          <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:block">
            맛집, 카페, 매장 홍보 등 다양한 유형의 쇼츠형 영상을 빠르게 제작합니다.
          </p>
        </div>
      </div>

      {/* 가로로 흐르는 썸네일 슬라이드 (960px 안으로 제한) */}
      <div className="relative mx-auto max-w-[960px] overflow-hidden px-6">
        {/* 좌우 페이드 (아주 약간) */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-3 bg-gradient-to-r from-white to-transparent md:w-4" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-3 bg-gradient-to-l from-white to-transparent md:w-4" />

        <motion.div
          className="flex w-max gap-4 md:gap-5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {marqueeThumbs.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="w-[150px] shrink-0 md:w-[190px]"
            >
              <div className="overflow-hidden rounded-[16px] shadow-[0_14px_34px_rgba(0,0,0,0.1)]">
                <img
                  src={src}
                  alt="thumbnail"
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover"
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

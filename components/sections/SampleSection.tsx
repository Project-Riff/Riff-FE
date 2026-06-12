"use client";

import { motion } from "framer-motion";

const thumbnails = [
  "/Thumbnail/thumbnail-1.png",
  "/Thumbnail/thumbnail-2.png",
  "/Thumbnail/thumbnail-3.png",
  "/Thumbnail/thumbnail-4.png",
  "/Thumbnail/thumbnail-5.png",
  "/Thumbnail/thumbnail-6.png",
  "/Thumbnail/thumbnail-7.jpg",
];

// 이음새 없는 루프를 위해 전체 목록을 2배로 복제
const marqueeThumbs = [...thumbnails, ...thumbnails];

export default function SampleSection() {
  return (
    <section
      id="samples"
      className="overflow-hidden bg-[#fbfaf7] px-6 py-14 md:px-10 md:py-20"
    >
      <div className="mx-auto mb-10 max-w-[1180px]">
        <p className="font-[var(--font-pretendard)] text-[14px] font-semibold tracking-[0] text-[#ff6b2c]">
          오늘 찍은 사진이면 됩니다
        </p>

        <div className="mt-3 flex max-w-[760px] flex-col gap-4">
          <h2 className="max-w-[680px] text-[30px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px]">
            공들여 찍은 사진이 아니어도
            <br />
            <span className="text-[#ff6b2c]">릴스로 만들 수 있습니다</span>
          </h2>

          <p className="max-w-[520px] text-[14px] leading-[1.8] text-[#5f6666]">
            흔들린 컷, 짧은 메뉴 영상, 매장 입구 사진도 충분합니다. Ryff는
            판매 포인트가 보이는 장면을 골라 짧은 릴스 흐름으로 정리합니다.
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1180px] overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#fbfaf7] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#fbfaf7] to-transparent" />

        <motion.div
          className="flex w-max gap-3 md:gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {marqueeThumbs.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="w-[148px] shrink-0 md:w-[196px]"
            >
              <div className="overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_14px_34px_rgba(7,23,22,0.08)]">
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

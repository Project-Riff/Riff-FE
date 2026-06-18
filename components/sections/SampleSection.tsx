"use client";

import { PointerEvent, useRef, useState } from "react";
import { motion } from "framer-motion";

const sampleVideos = [
  { src: "/sample-videos/gamjatang.mp4", label: "감자탕" },
  { src: "/sample-videos/dakhanmari.mp4", label: "닭한마리" },
  { src: "/sample-videos/ronnies-pizza.mp4", label: "로니스피자" },
  { src: "/sample-videos/roizo.mp4", label: "로이조" },
  { src: "/sample-videos/babiking.mp4", label: "바비킹" },
  { src: "/sample-videos/beijing-duck.mp4", label: "북경오리" },
  { src: "/sample-videos/ouvrir-bakery.mp4", label: "오뷔르베이커리" },
  { src: "/sample-videos/jeoljeong-tuna.mp4", label: "절정참치" },
  { src: "/sample-videos/grilled-galbi.mp4", label: "직화갈비" },
  { src: "/sample-videos/koramu.mp4", label: "코라무" },
];

// 이음새 없는 루프를 위해 전체 목록을 2배로 복제
const marqueeVideos = [...sampleVideos, ...sampleVideos];

export default function SampleSection() {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeMobileVideo, setActiveMobileVideo] = useState<string | null>(
    null,
  );

  const pauseAllVideos = () => {
    railRef.current?.querySelectorAll("video").forEach((video) => {
      video.pause();
    });
  };

  const playVideo = (video: HTMLVideoElement) => {
    pauseAllVideos();
    video.play().catch(() => {});
  };

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    src: string,
  ) => {
    if (event.pointerType === "mouse") return;

    const video = event.currentTarget.querySelector("video");
    if (!video) return;

    if (activeMobileVideo === src) {
      video.pause();
      setActiveMobileVideo(null);
      return;
    }

    setActiveMobileVideo(src);
    playVideo(video);
  };

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
          <h2 className="max-w-[680px] text-[28px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px]">
            공들여 찍은 사진이 아니어도
            <br />
            <span className="text-[#ff6b2c]">릴스로 만들 수 있습니다</span>
          </h2>

          <p className="max-w-none text-[14px] leading-[1.8] text-[#5f6666] md:whitespace-nowrap">
            <span className="md:hidden">
              흔들린 컷, 짧은 메뉴 영상, 매장 입구 사진도 충분합니다.
              <br />
              Ryff는 판매 포인트가 보이는 장면을 골라
              <br />
              짧은 릴스 흐름으로 정리합니다.
            </span>
            <span className="hidden md:inline">
              흔들린 컷, 짧은 메뉴 영상, 매장 입구 사진도 충분합니다. Ryff는 판매 포인트가 보이는 장면을 골라 짧은 릴스 흐름으로 정리합니다.
            </span>
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1180px] overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#fbfaf7] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#fbfaf7] to-transparent" />

        <motion.div
          ref={railRef}
          className="flex w-max gap-3 md:gap-4"
          animate={activeMobileVideo ? { x: 0 } : { x: ["0%", "-50%"] }}
          transition={
            activeMobileVideo
              ? { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
              : { duration: 48, ease: "linear", repeat: Infinity }
          }
        >
          {marqueeVideos.map((item, index) => (
            <div
              key={`${item.src}-${index}`}
              className="w-[148px] shrink-0 md:w-[196px]"
            >
              <button
                type="button"
                aria-label={`${item.label} 샘플 영상`}
                onPointerDown={(event) => handlePointerDown(event, item.src)}
                onMouseEnter={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) playVideo(video);
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.querySelector("video")?.pause();
                }}
                onFocus={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) playVideo(video);
                }}
                onBlur={(event) => {
                  event.currentTarget.querySelector("video")?.pause();
                }}
                className="block w-full overflow-hidden rounded-lg border border-black/8 bg-white text-left shadow-[0_14px_34px_rgba(7,23,22,0.08)]"
              >
                <video
                  src={item.src}
                  className="aspect-[9/16] w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              </button>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

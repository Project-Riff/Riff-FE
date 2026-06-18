"use client";

import { useEffect, useRef, useState } from "react";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function mapProgress(value: number, start: number, end: number) {
  return clamp((value - start) / (end - start));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function mixColor(
  from: [number, number, number],
  to: [number, number, number],
  amount: number,
) {
  const r = Math.round(lerp(from[0], to[0], amount));
  const g = Math.round(lerp(from[1], to[1], amount));
  const b = Math.round(lerp(from[2], to[2], amount));

  return `rgb(${r}, ${g}, ${b})`;
}

export default function PhoneRevealSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let frame = 0;
    const media = window.matchMedia("(max-width: 767px)");

    const updateMedia = () => {
      setIsMobile(media.matches);
    };

    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollableDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1,
      );

      setProgress(clamp(-rect.top / scrollableDistance));
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateProgress);
    };

    updateMedia();
    updateProgress();
    media.addEventListener("change", updateMedia);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", updateMedia);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  const darkProgress = mapProgress(progress, 0, 0.24);
  const headlineEnter = mapProgress(progress, 0.26, 0.42);
  const headlineMove = isMobile ? 0 : mapProgress(progress, 0.5, 0.68);
  const phoneEnter = isMobile
    ? mapProgress(progress, 0.48, 0.78)
    : mapProgress(progress, 0.72, 0.88);
  const backgroundColor = mixColor([255, 255, 255], [7, 23, 22], darkProgress);
  const headlineY = isMobile
    ? lerp(32, -198, phoneEnter)
    : lerp(64, 0, headlineEnter);
  const headlineLeft = lerp(50, 0, headlineMove);
  const headlineTranslateX = lerp(-50, 0, headlineMove);
  const headlineAlign = headlineMove > 0.5 ? "left" : "center";
  const phoneY = isMobile ? lerp(170, -40, phoneEnter) : lerp(104, 0, phoneEnter);
  const phoneScale = isMobile ? lerp(0.84, 0.92, phoneEnter) : lerp(0.94, 1, phoneEnter);

  return (
    <section
      ref={sectionRef}
      style={{ backgroundColor }}
      className="relative h-[430vh]"
    >
      <div className="sticky top-0 h-screen overflow-hidden px-6 md:px-10">
        <div className="relative mx-auto h-full w-full max-w-[1180px]">
          <div
            style={{
              opacity: headlineEnter,
              left: `${headlineLeft}%`,
              textAlign: headlineAlign,
              transform: `translate(${headlineTranslateX}%, -50%) translateY(${headlineY}px)`,
            }}
            className="absolute top-1/2 z-10 w-[min(760px,calc(100vw-48px))]"
          >
            <h2 className="whitespace-nowrap text-[19px] font-semibold leading-[1.22] tracking-[0] text-white md:text-[28px] lg:text-[32px]">
              Ryff는, 찍어둔 영상을 릴스로 바꿔드려요.
            </h2>
          </div>

          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:right-10 md:top-[55%] md:-translate-y-1/2 md:translate-x-0">
            <div
              style={{
                opacity: phoneEnter,
                transform: `translate3d(0, ${phoneY}px, 0) scale(${phoneScale})`,
              }}
              className="relative h-[500px] w-[246px] rounded-[42px] border-[9px] border-[#111] bg-[#111] shadow-[0_40px_120px_rgba(0,0,0,0.36)] will-change-transform md:h-[640px] md:w-[314px] md:rounded-[46px] md:border-[10px]"
            >
              <div className="absolute left-1/2 top-3 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[#111]" />
              <div className="h-full overflow-hidden rounded-[34px] bg-black">
                <video
                  src="/restaurant/restaurant-1.mp4"
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

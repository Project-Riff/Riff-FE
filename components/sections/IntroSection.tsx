"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const storyItems = [
  {
    title: "촬영은 했는데,",
    image: "/generated/intro-filming.png",
    alt: "촬영한 음식 영상을 고르는 모습",
  },
  {
    title: "편집할 시간은 없고,",
    image: "/generated/intro-editing.png",
    alt: "영업 중 편집 시간이 부족한 매장 모습",
  },
  {
    title: "문구도 고민되고",
    image: "/generated/intro-copy.png",
    alt: "메뉴 소개 문구를 고민하는 테이블",
  },
];

const titleVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.22,
      staggerChildren: 0.1,
    },
  },
};

const lineVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  show: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
  },
};

function RevealLine({ children }: { children: ReactNode }) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span className="block" variants={lineVariants}>
        {children}
      </motion.span>
    </span>
  );
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function mapProgress(value: number, start: number, end: number) {
  return clamp((value - start) / (end - start));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export default function IntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const storyIndexRef = useRef(0);
  const isSnappingRef = useRef(false);
  const hasSettledFirstSlideRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    let frame = 0;
    let snapTimer = 0;

    const setStorySlide = (nextIndex: number) => {
      if (storyIndexRef.current === nextIndex) return;

      storyIndexRef.current = nextIndex;
      setStoryIndex(nextIndex);
    };

    const getCarouselIndex = (value: number) => {
      if (value < 0.68) return 0;
      if (value < 0.83) return 1;
      return 2;
    };

    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollableDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1,
      );

      const nextProgress = clamp(-rect.top / scrollableDistance);
      progressRef.current = nextProgress;
      if (nextProgress < 0.49 || nextProgress > 0.98) {
        hasSettledFirstSlideRef.current = false;
      }
      if (nextProgress >= 0.66) {
        hasSettledFirstSlideRef.current = true;
      }
      if (
        !isSnappingRef.current &&
        nextProgress >= 0.56 &&
        nextProgress <= 0.97
      ) {
        setStorySlide(getCarouselIndex(nextProgress));
      }
      setProgress(nextProgress);
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateProgress);
    };

    const scrollToProgress = (targetProgress: number, targetIndex: number) => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = window.scrollY + section.getBoundingClientRect().top;
      const scrollableDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1,
      );

      isSnappingRef.current = true;
      setStorySlide(targetIndex);
      window.dispatchEvent(new Event("ryff:snap-scroll"));
      window.scrollTo({
        top: sectionTop + scrollableDistance * targetProgress,
        behavior: "smooth",
      });

      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        isSnappingRef.current = false;
      }, 780);
    };

    const handleWheel = (event: WheelEvent) => {
      const value = progressRef.current;
      const targets = [0.62, 0.78, 0.93];

      if (event.ctrlKey || Math.abs(event.deltaY) < 8) return;
      if (value < 0.5 || value > 0.97) return;

      const direction = event.deltaY > 0 ? 1 : -1;

      if (direction > 0 && value < 0.66 && !hasSettledFirstSlideRef.current) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (isSnappingRef.current) return;

        hasSettledFirstSlideRef.current = true;
        scrollToProgress(targets[0], 0);
        return;
      }

      const currentIndex = getCarouselIndex(value);
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex > 2) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (isSnappingRef.current) return;

      scrollToProgress(targets[nextIndex], nextIndex);
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(snapTimer);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  const titleScale = lerp(0.82, 1.12, mapProgress(progress, 0, 0.36));
  const titleExit = mapProgress(progress, 0.4, 0.52);
  const titleY = lerp(0, -150, titleExit);
  const titleOpacity = 1 - titleExit;
  const trackEnter = mapProgress(progress, 0.5, 0.56);
  const trackOpacity = trackEnter;
  const trackY = lerp(36, 0, trackEnter);
  const activeSlide = storyIndex;

  return (
    <section
      id="why-ryff"
      ref={sectionRef}
      className="relative h-[540vh] scroll-mt-24 bg-gradient-to-b from-[#fbfaf7] via-[#fbfaf7] to-white"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center px-6 md:px-10">
          <div
            style={{
              opacity: titleOpacity,
              transform: `translate3d(0, ${titleY}px, 0) scale(${titleScale})`,
            }}
            className="mx-auto max-w-[900px] origin-center text-center"
          >
            <motion.h2
              variants={titleVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-[28px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px] lg:text-[46px]"
            >
              <RevealLine>장점이 넘치는 매장인데,</RevealLine>
              <RevealLine>
                콘텐츠 만들 시간이 없어서 놓치고 있던 순간들.
              </RevealLine>
            </motion.h2>

            <motion.p
              className="mx-auto mt-5 max-w-[600px] text-[14px] leading-[1.85] text-[#5f6666] md:text-[16px]"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{
                duration: 0.62,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.58,
              }}
            >
              찍어둔 영상은 있지만, 릴스로 만들 여유가 없었던 순간들을 Ryff가
              콘텐츠로 바꿔드립니다.
            </motion.p>
          </div>
        </div>

        <div
          style={{
            opacity: trackOpacity,
            transform: `translate3d(0, ${trackY}px, 0)`,
          }}
          className="relative z-10 h-full will-change-[opacity,transform]"
        >
          {storyItems.map((item, index) => (
            <article
              key={item.title}
              className={[
                "absolute inset-0 flex h-full w-full items-center px-6 transition-opacity duration-500 ease-out md:px-10",
                activeSlide === index
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              ].join(" ")}
            >
              <div className="mx-auto grid w-full max-w-[1180px] items-center gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-12">
                <div
                  className={[
                    "overflow-hidden rounded-lg bg-white shadow-[0_26px_78px_rgba(7,23,22,0.14)] transition-transform duration-500 ease-out will-change-transform",
                    activeSlide === index ? "translate-y-0" : "translate-y-3",
                  ].join(" ")}
                >
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>

                <div>
                  <h3
                    className={[
                      "max-w-[520px] text-[34px] font-semibold leading-[1.16] tracking-[0] text-[#071716] transition-transform duration-500 ease-out will-change-transform md:text-[56px]",
                      activeSlide === index
                        ? "translate-y-0"
                        : "translate-y-4",
                    ].join(" ")}
                  >
                    {item.title}
                  </h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

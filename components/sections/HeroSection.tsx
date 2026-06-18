"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type FloatingVideoProps = {
  src: string;
  poster: string;
  className: string;
  delay?: number;
};

const floatingVideos: FloatingVideoProps[] = [
  {
    src: "/restaurant/restaurant-1.mp4",
    poster: "/hero-detail-1.jpg",
    className: "left-[7%] top-[18%] w-[76px] md:left-[9%] md:top-[13%] md:w-[108px] lg:left-[11%] lg:top-[13%] lg:w-[122px] xl:left-[12%] xl:w-[128px]",
    delay: 0.1,
  },
  {
    src: "/cafe/cafe-3.mp4",
    poster: "/card4.jpg",
    className: "right-[16%] top-[12%] w-[72px] md:right-[9%] md:top-[11%] md:w-[112px] lg:right-[11%] lg:top-[11%] lg:w-[128px] xl:right-[12%] xl:w-[136px]",
    delay: 0.25,
  },
  {
    src: "/restaurant/restaurant-4.mp4",
    poster: "/hero-detail-2.jpg",
    className: "left-[3%] top-[59%] w-[86px] md:left-[1%] md:top-[48%] md:w-[142px] lg:left-[2%] lg:top-[46%] lg:w-[164px] xl:left-[2%] xl:w-[178px]",
    delay: 0.4,
  },
  {
    src: "/restaurant/restaurant-5.mp4",
    poster: "/Thumbnail/thumbnail-1.png",
    className: "right-[4%] top-[54%] w-[92px] md:right-[1%] md:top-[48%] md:w-[144px] lg:right-[2%] lg:top-[46%] lg:w-[168px] xl:right-[2%] xl:w-[184px]",
    delay: 0.55,
  },
  {
    src: "/restaurant/restaurant-2.mp4",
    poster: "/hero-detail-2.jpg",
    className: "left-[39%] top-[38%] w-[82px] md:bottom-[4%] md:left-[22%] md:top-auto md:w-[84px] lg:bottom-[5%] lg:left-[26%] lg:w-[96px] xl:left-[27%] xl:w-[102px]",
    delay: 0.7,
  },
];

function FloatingVideo({
  src,
  poster,
  className,
  delay = 0,
  isMobile,
}: FloatingVideoProps & { isMobile: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateY: -54, scale: 0.78 }}
      animate={
        isMobile
          ? {
              opacity: [0, 1, 1, 0],
              y: [20, 0, 0, -18],
              rotateY: [-26, -6, 4, 0],
              rotateX: [4, 0, -2, 0],
              scale: [0.84, 1, 1, 0.94],
            }
          : {
              opacity: 1,
              y: [0, -10, 0],
              rotateY: [-8, 7, -8],
              rotateX: [3, -2, 3],
              scale: [1, 1.04, 1],
            }
      }
      transition={
        isMobile
          ? {
              duration: 5,
              times: [0, 0.12, 0.94, 1],
              ease: [0.16, 1, 0.3, 1],
              delay,
            }
          : {
              opacity: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
              scale: { duration: 0.85, ease: [0.16, 1, 0.3, 1], delay },
              y: { duration: 5.8, repeat: Infinity, ease: "easeInOut", delay },
              rotateY: {
                duration: 6.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
              rotateX: {
                duration: 6.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
            }
      }
      className={[
        "pointer-events-none absolute z-0 overflow-hidden rounded-lg border border-black/8 bg-neutral-100 shadow-[0_20px_50px_rgba(7,23,22,0.12)]",
        className,
      ].join(" ")}
      style={{ transformStyle: "preserve-3d" }}
    >
      <video
        className="aspect-[9/16] w-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    </motion.div>
  );
}

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-white via-white to-[#fbfaf7] text-[#071716]">
      <div className="relative mx-auto min-h-[calc(100svh-76px)] max-w-[1240px] px-6 md:px-10">
        <div className="pointer-events-none absolute inset-0 [perspective:1100px]">
          {floatingVideos.map((video) => (
            <FloatingVideo
              key={video.src}
              {...video}
              isMobile={isMobile === true}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 42 }}
          animate={{ opacity: isMobile === null ? 0 : 1, y: 0 }}
          transition={{
            duration: isMobile === true ? 1.05 : 0.6,
            delay: isMobile === true ? 5.5 : 0,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative z-10 mx-auto flex min-h-[calc(100svh-76px)] max-w-[560px] flex-col items-center justify-center py-16 text-center md:py-20"
        >
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: isMobile === null ? 0 : 1, y: 0 }}
            transition={{
              duration: isMobile === true ? 0.95 : 0.5,
              delay: isMobile === true ? 5.55 : 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-[28px] font-semibold leading-[1.3] tracking-[0] text-[#071716] md:text-[52px] lg:text-[58px]"
          >
            내 가게의 순간을,
            <br />
            매출을 올려줄 숏폼으로.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: isMobile === null ? 0 : 1, y: 0 }}
            transition={{
              duration: isMobile === true ? 0.9 : 0.5,
              delay: isMobile === true ? 5.72 : 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-5 max-w-[480px] text-[14px] leading-[1.85] text-[#5f6666] md:text-[16px]"
          >
            <span className="md:hidden">
              촬영한 영상 한 개만 보내주세요.
              <br />
              Ryff가 메뉴의 장면, 매장의 분위기, 방문을 부르는 포인트를
              <br />
              짧고 선명한 릴스 흐름으로 편집합니다.
            </span>
            <span className="hidden md:inline">
              촬영한 영상 한 개만 보내주세요. Ryff가 메뉴의 장면, 매장의 분위기,
              <br />
              방문을 부르는 포인트를 짧고 선명한 릴스 흐름으로 편집합니다.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: isMobile === null ? 0 : 1, y: 0 }}
            transition={{
              duration: isMobile === true ? 0.85 : 0.5,
              delay: isMobile === true ? 5.9 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-7 flex flex-wrap justify-center gap-3"
          >
            <Link
              href="/apply"
              className="inline-flex h-[48px] items-center gap-2 rounded-full bg-[#071716] px-6 text-[14px] font-semibold text-white shadow-[0_14px_30px_rgba(7,23,22,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b2a28]"
            >
              제작 문의
              <ArrowRight size={16} />
            </Link>

            <a
              href="https://www.instagram.com/ryff_food/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[48px] items-center gap-2 rounded-full border border-black/10 bg-white px-6 text-[14px] font-semibold text-[#071716] shadow-[0_10px_24px_rgba(7,23,22,0.08)] transition hover:-translate-y-0.5 hover:border-[#071716]"
            >
              <Play size={15} />
              샘플 보기
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

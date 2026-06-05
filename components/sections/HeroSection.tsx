"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

const heroStats = [
  { value: "1,000+", label: "Ryff 영상만으로 2주안에 팔로워" },
  { value: "50+", label: "제작 · 협업 문의" },
  { value: "썸네일 + 본문", label: "영상부터 게시물까지" },
];

const sampleSrcs = ["/sample-2.mp4", "/sample-3.mp4"];

const randomDifferent = (prev: number, max: number) => {
  if (max <= 1) return prev;
  let next = prev;
  while (next === prev) {
    next = Math.floor(Math.random() * max);
  }
  return next;
};

export default function HeroSection() {
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoIndex2, setVideoIndex2] = useState(1);

  useEffect(() => {
    const first = Math.floor(Math.random() * sampleSrcs.length);
    setVideoIndex(first);
    setVideoIndex2(randomDifferent(first, sampleSrcs.length));
  }, []);

  const handleVideoEnded = () => {
    setVideoIndex((prev) => randomDifferent(prev, sampleSrcs.length));
  };

  const handleVideoEnded2 = () => {
    setVideoIndex2((prev) => randomDifferent(prev, sampleSrcs.length));
  };

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-[17%] top-[16%] h-5 w-5 rounded-full bg-orange-400 shadow-[0_0_24px_rgba(251,146,60,0.65)]" />
      <div className="pointer-events-none absolute left-[38%] top-[22%] h-3 w-3 rounded-full bg-orange-300/80" />
      <div className="pointer-events-none absolute right-[8%] top-[28%] h-4 w-4 rounded-full bg-orange-400/90 shadow-[0_0_22px_rgba(251,146,60,0.5)]" />
      <div className="pointer-events-none absolute right-[17%] bottom-[16%] h-3 w-3 rounded-full bg-orange-300/90" />
      <div className="pointer-events-none absolute left-[28%] bottom-[18%] h-2.5 w-2.5 rounded-full bg-orange-400/70" />

      <svg
        className="pointer-events-none absolute left-[-40px] top-[42%] h-[260px] w-[260px]"
        viewBox="0 0 260 260"
        fill="none"
      >
        <path
          d="M210 28C118 42 58 94 64 158C70 220 150 236 226 196"
          stroke="#fb923c"
          strokeWidth="1.4"
          strokeDasharray="7 11"
          opacity="0.35"
        />
      </svg>

      <svg
        className="pointer-events-none absolute right-[-40px] top-[18%] h-[300px] w-[300px]"
        viewBox="0 0 300 300"
        fill="none"
      >
        <path
          d="M42 92C95 22 225 34 258 112C292 193 205 256 116 232"
          stroke="#fb923c"
          strokeWidth="1.4"
          strokeDasharray="7 11"
          opacity="0.38"
        />
      </svg>

      <div className="relative mx-auto max-w-[960px] px-6 py-14 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative max-w-[420px]"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
              Riff short-form studio
            </p>

            <div className="relative mt-4">
              <div className="pointer-events-none absolute -left-8 top-3 h-[150px] w-[210px] rounded-full bg-orange-100/45 blur-3xl" />
              <div className="pointer-events-none absolute left-[120px] top-[16px] h-[95px] w-[120px] rounded-full bg-orange-50/70 blur-2xl" />

              <h1 className="relative z-10 font-[var(--font-serif)] text-[32px] leading-[1.08] tracking-[-0.03em] text-[#111] md:text-[40px] lg:text-[48px]">
                가게의{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(249,115,22,0.35)]">
                  온도
                </span>
                를
                <br />
                남기는 짧은 영상
              </h1>
            </div>

            <p className="mt-4 text-[13px] leading-[1.8] text-[#666] md:text-[14px]">
              사진과 짧은 클립만 보내주시면
              <br className="hidden md:block" />
              매장 분위기에 맞는 릴스형 영상으로 정리해드립니다.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.instagram.com/ryff_food/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-5 text-[13px] font-medium text-[#111] transition hover:bg-[#fafafa]"
              >
                <Play size={13} />
                샘플 보기
              </a>

              <Link
                href="/apply"
                className="inline-flex h-[42px] items-center gap-2 rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff6a00] px-5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(255,106,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(255,106,0,0.45)]"
              >
                제작 문의
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="w-full"
          >
            <div className="relative mx-auto w-full max-w-[360px] md:max-w-[500px]">
              <div className="relative grid items-center gap-4 md:grid-cols-[1.05fr_0.95fr] md:gap-5">
                <div className="group relative mx-auto w-full max-w-[210px] overflow-hidden rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.13)] md:max-w-[260px] md:rounded-[26px] md:shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                  <video
                    key={sampleSrcs[videoIndex]}
                    className="aspect-[9/16] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    src={sampleSrcs[videoIndex]}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnded}
                  />

                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                </div>

                <div className="group relative mx-auto w-full max-w-[210px] overflow-hidden rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.13)] md:max-w-[260px] md:rounded-[26px] md:shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                  <video
                    key={sampleSrcs[videoIndex2]}
                    className="aspect-[9/16] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    src={sampleSrcs[videoIndex2]}
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnded2}
                  />

                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="relative mt-12 border-t border-[#f0f0f0] pt-8 md:mt-16"
        >
          <div className="relative flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.7)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">
              Real results · 단 2주의 성과
            </p>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-y-0">
            {heroStats.map((stat, index) => (
              <div
                key={stat.label}
                className={[
                  "flex flex-col gap-1.5 sm:px-7",
                  index !== 0 ? "sm:border-l sm:border-[#f0f0f0]" : "",
                  index === 0 ? "sm:pl-0" : "",
                ].join(" ")}
              >
                <span className="font-[var(--font-serif)] text-[34px] font-bold leading-none tracking-[-0.03em] md:text-[40px]">
                  <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(249,115,22,0.25)]">
                    {stat.value}
                  </span>
                </span>

                <span className="text-[13px] font-medium leading-[1.6] text-[#555] md:text-[14px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

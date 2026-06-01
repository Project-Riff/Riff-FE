"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
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
                href="#samples"
                className="inline-flex h-[42px] items-center gap-2 rounded-full bg-[#111] px-5 text-[13px] font-medium text-white transition hover:opacity-90"
              >
                <Play size={13} />
                샘플 보기
              </a>

              <Link
                href="/request"
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-[#ededed] bg-white px-5 text-[13px] font-medium text-[#111] transition hover:bg-[#fafafa]"
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
                    className="aspect-[9/16] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    src="/sample-2.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />

                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/45 to-transparent p-5 md:p-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/80">
                      Sample
                    </p>

                    <p className="mt-1 font-[var(--font-serif)] text-[15px] text-white md:text-[18px]">
                      감도 있는 매장 숏폼
                    </p>
                  </div>
                </div>

                <div className="relative mx-auto h-[260px] w-full max-w-[260px] md:h-[430px] md:max-w-none">
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="group absolute right-[10px] top-[0px] z-10 w-[138px] rotate-[2deg] overflow-hidden rounded-[22px] shadow-[0_16px_38px_rgba(0,0,0,0.12)] md:right-[-8px] md:top-[8px] md:w-[182px] md:rounded-[28px] md:shadow-[0_20px_48px_rgba(0,0,0,0.12)]"
                  >
                    <img
                      src="/hero-wide.jpg"
                      alt="mood"
                      className="aspect-[4/4.8] w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="group absolute left-[8px] top-[105px] z-30 w-[132px] -rotate-[5deg] overflow-hidden rounded-[20px] border-[4px] border-white bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)] md:left-[0px] md:top-[172px] md:w-[168px] md:rounded-[24px] md:shadow-[0_22px_50px_rgba(0,0,0,0.15)]"
                  >
                    <img
                      src="/hero-detail-1.jpg"
                      alt="food"
                      className="aspect-[4/3.7] w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="group absolute bottom-[8px] right-[24px] z-20 w-[95px] rotate-[4deg] overflow-hidden rounded-[20px] border-[4px] border-white bg-white shadow-[0_16px_34px_rgba(0,0,0,0.13)] md:bottom-[6px] md:right-[10px] md:w-[120px] md:rounded-[24px] md:shadow-[0_18px_42px_rgba(0,0,0,0.14)]"
                  >
                    <img
                      src="/hero-detail-2.jpg"
                      alt="store"
                      className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

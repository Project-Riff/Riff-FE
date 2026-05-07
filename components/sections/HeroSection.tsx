"use client";

import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[960px] px-6 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-[420px]"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
              Riff short-form studio
            </p>

            <h1 className="mt-4 font-[var(--font-serif)] text-[32px] leading-[1.08] tracking-[-0.03em] text-[#111] md:text-[40px] lg:text-[48px]">
              가게의{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(249,115,22,0.35)]">
                온도
              </span>
              를
              <br />
              남기는 짧은 영상
            </h1>

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

              <a
                href="#request"
                className="inline-flex h-[42px] items-center gap-2 rounded-full border border-[#ededed] bg-white px-5 text-[13px] font-medium text-[#111] transition hover:bg-[#fafafa]"
              >
                제작 문의
                <ArrowRight size={13} />
              </a>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="w-full"
          >
            <div className="grid items-start gap-4 md:grid-cols-[1.08fr_0.92fr]">
              {/* VIDEO */}
              <div className="group relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[24px] sm:max-w-[320px] md:max-w-none">
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

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/40 to-transparent">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/80">
                    Sample
                  </p>

                  <p className="mt-1 font-[var(--font-serif)] text-[16px] text-white md:text-[18px]">
                    감도 있는 매장 숏폼
                  </p>
                </div>
              </div>

              {/* SIDE */}
              <div className="grid gap-4">
                {/* wide image */}
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="group relative hidden overflow-hidden rounded-[20px] md:block"
                >
                  <img
                    src="/hero-wide.jpg"
                    alt="mood"
                    className="aspect-[10/11] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />

                  <div className="absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-70 transition duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 transition duration-500 group-hover:ring-white/15" />
                </motion.div>

                {/* detail images */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="group relative overflow-hidden rounded-[16px]"
                  >
                    <img
                      src="/hero-detail-1.jpg"
                      alt="food"
                      className="aspect-[1/2] w-full object-cover object-bottom transition duration-700 group-hover:scale-[1.05]"
                    />

                    <div className="absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/12" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-70 transition duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 transition duration-500 group-hover:ring-white/15" />
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="group relative overflow-hidden rounded-[16px]"
                  >
                    <img
                      src="/hero-detail-2.jpg"
                      alt="store"
                      className="aspect-[1/2] w-full object-cover object-bottom transition duration-700 group-hover:scale-[1.05]"
                    />

                    <div className="absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/12" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-70 transition duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 transition duration-500 group-hover:ring-white/15" />
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
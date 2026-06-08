"use client";

import { motion } from "framer-motion";
import {
  Send,
  Wand2,
  MessageCircleMore,
  BadgeCheck,
} from "lucide-react";
import { processItems } from "@/lib/data";

const icons = [Send, Wand2, MessageCircleMore, BadgeCheck];
const cardImages = ["/card1.jpg", "/card2.jpg", "/card3.jpg", "/card4.jpg"];

export default function ProcessSection() {
  return (
    <section
      id="process"
      className="relative scroll-mt-24 overflow-hidden bg-white px-6 py-16"
    >
      <div className="relative mx-auto max-w-[960px]">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            Process
          </p>

          <div className="mt-3 flex items-end justify-between gap-8">
            <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
              <span className="text-[#ff7a2f]">어렵지 않게,</span>
              <br />
              자연스럽게 진행됩니다
            </h2>

            <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#555] md:block">
              자료 전달부터 최종 전달까지 복잡한 절차 없이 진행됩니다.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {processItems.map((item, index) => {
            const Icon = icons[index] ?? Send;
            const bgImage = cardImages[index];

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-[0_8px_32px_rgba(31,38,135,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] transition-all duration-300 hover:shadow-[0_16px_44px_rgba(31,38,135,0.16),inset_0_1px_0_rgba(255,255,255,0.85)]"
              >
                {/* 원본 사진 배경 — 평소엔 숨김, 호버 시에만 표시 */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-0 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />

                {/* 가독성용 라이트 워시 — 호버 시에만 */}
                <div className="absolute inset-0 bg-white/65 opacity-0 backdrop-blur-[1.5px] transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10 flex items-center justify-between p-5 pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/55 text-[#ff7a2f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-[#ff7a2f] group-hover:text-white">
                    <Icon size={16} strokeWidth={1.8} />
                  </div>

                  <span className="text-[11px] font-semibold tracking-[0.14em] text-[#8a7a6f] drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="relative z-10 p-5 pt-4">
                  <h3 className="text-[16px] font-semibold leading-[1.35] text-[#111] drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[12px] font-medium leading-[1.7] text-[#444] drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)]">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
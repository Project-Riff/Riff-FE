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
      className="scroll-mt-24 overflow-hidden bg-white px-6 py-16"
    >
      <div className="mx-auto max-w-[960px]">
        {/* 헤더 */}
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

            <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:block">
              자료 전달부터 최종 전달까지 복잡한 절차 없이 진행됩니다.
            </p>
          </div>
        </div>

        {/* 카드 */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {processItems.map((item, index) => {
            const Icon = icons[index] ?? Send;
            const bgImage = cardImages[index];

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-[16px] border border-[#e9e9e9] bg-[#d7d7d7] p-4 transition-all duration-300 hover:bg-white hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
              >
                {/* 기본 이미지 */}
                <div
  className="absolute inset-0 bg-cover bg-center opacity-[0.62] saturate-[0.95] brightness-[0.72] contrast-[0.95] transition-all duration-500 group-hover:scale-[1.01] group-hover:opacity-0"
  style={{ backgroundImage: `url(${bgImage})` }}
/>

<div className="absolute inset-0 bg-[#3f3f3f]/22 opacity-100 transition duration-500 group-hover:opacity-0" />
                {/* 상단 */}
                <div className="relative z-10 flex items-center justify-between">
                  {/* 아이콘 */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-white backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:border-[#dcdcdc] group-hover:bg-[#fafafa] group-hover:text-[#111]">
                    <Icon size={16} strokeWidth={1.8} />
                  </div>

                  {/* 숫자 */}
                  <span className="text-[10px] tracking-[0.14em] text-white/80 transition group-hover:text-[#b6b6b6]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* 텍스트 */}
                <div className="relative z-10 mt-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/80 transition group-hover:text-[#b0b0b0]">
                    {item.step}
                  </p>

                  <h3 className="mt-2 text-[16px] font-semibold leading-[1.35] text-white transition group-hover:text-[#111]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[12px] leading-[1.7] text-white/95 transition group-hover:text-[#777]">
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
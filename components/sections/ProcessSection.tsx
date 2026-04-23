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
              어렵지 않게,
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
                className="group relative overflow-hidden rounded-[16px] border border-[#f2f2f2] bg-white p-4 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
              >
                {/* 🔥 배경 이미지 */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-0 transition-all duration-500 group-hover:opacity-[0.28] group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />

                {/* 🔥 어두운 오버레이 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 transition duration-500 group-hover:opacity-100" />

                {/* 상단 */}
                <div className="relative z-10 flex items-center justify-between">
                  {/* 아이콘 (주황 포인트) */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f0f0f0] bg-[#fafafa] text-[#111] transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-105">
                    <Icon size={16} strokeWidth={1.8} />
                  </div>

                  {/* 숫자 */}
                  <span className="text-[10px] tracking-[0.14em] text-[#b6b6b6] transition group-hover:text-white/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* 텍스트 */}
                <div className="relative z-10 mt-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#b0b0b0] transition group-hover:text-white/80">
                    {item.step}
                  </p>

                  <h3 className="mt-2 text-[16px] font-semibold leading-[1.35] text-[#111] transition group-hover:text-white group-hover:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[12px] leading-[1.7] text-[#777] transition group-hover:text-white/90">
                    {item.desc}
                  </p>
                </div>

                {/* 하단 라인 */}
                <div className="relative z-10 mt-4 h-px bg-[#f3f3f3] transition group-hover:bg-white/30" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
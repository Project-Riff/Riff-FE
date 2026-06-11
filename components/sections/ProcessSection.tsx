"use client";

import { motion } from "framer-motion";
import {
  Send,
  Wand2,
  MessageCircleMore,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { processItems } from "@/lib/data";

const icons = [Send, Wand2, MessageCircleMore, BadgeCheck];
const cardImages = [
  "/card1.jpg",
  "/generated/intro-copy.png",
  "/generated/intro-editing.png",
  "/Thumbnail/thumbnail-1.png",
];

export default function ProcessSection() {
  return (
    <section
      id="process"
      className="relative scroll-mt-24 overflow-hidden bg-white px-6 py-16 md:px-10 md:py-20"
    >
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-10">
          <p className="font-[var(--font-pretendard)] text-[14px] font-semibold tracking-[0] text-[#ff6b2c]">
            작업은 어떻게 진행되나요?
          </p>

          <div className="mt-3 flex max-w-[680px] flex-col gap-4">
            <h2 className="max-w-[560px] text-[30px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px]">
              쉽고 간편하게
              <br />
              <span className="text-[#ff6b2c]">사진만 전달하세요.</span>
            </h2>

            <p className="max-w-[520px] text-[14px] leading-[1.8] text-[#5f6666]">
              자료를 보내주시면 구성, 편집, 자막, 최종 납품까지 필요한 단계를
              Ryff가 순서대로 정리합니다.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-[58px] hidden h-px bg-gradient-to-r from-transparent via-[#ff6b2c]/45 to-transparent xl:block" />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
                whileHover={{ y: -4 }}
                className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_14px_36px_rgba(7,23,22,0.08)] transition-all duration-300 hover:shadow-[0_18px_46px_rgba(7,23,22,0.12)]"
              >
                <div className="relative flex items-center justify-between border-b border-black/8 bg-[#fbfaf7] px-5 py-4">
                  <span className="text-[14px] font-semibold text-[#ff6b2c]">
                    Step {index + 1}
                  </span>

                  {index < processItems.length - 1 ? (
                    <span className="hidden h-8 w-8 items-center justify-center rounded-full border border-[#ff6b2c]/25 bg-white text-[#ff6b2c] xl:flex">
                      <ArrowRight size={15} strokeWidth={2} />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ff6b2c]/25 bg-white text-[#ff6b2c]">
                      <BadgeCheck size={15} strokeWidth={2} />
                    </span>
                  )}
                </div>

                <div className="relative h-40 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,23,22,0)_0%,rgba(7,23,22,0.22)_100%)]" />
                </div>

                <div className="relative z-10 flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#071716] text-white transition-all duration-300 group-hover:bg-[#ff6b2c]">
                      <Icon size={16} strokeWidth={1.8} />
                    </div>

                    <h3 className="text-[19px] font-semibold leading-[1.35] text-[#071716]">
                      {item.title}
                    </h3>
                  </div>

                  <p className="mt-4 text-[13px] leading-[1.75] text-[#5f6666]">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}

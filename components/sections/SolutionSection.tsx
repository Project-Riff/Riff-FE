"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const solutionItems = [
  {
    number: "01",
    title: "장면을 고릅니다",
    desc: "흔들린 영상 안에서도 손님이 멈춰 볼 메뉴의 순간을 먼저 찾습니다.",
    range: [0.34, 0.46],
  },
  {
    number: "02",
    title: "릴스 흐름으로 엮습니다",
    desc: "첫 장면, 전환, 자막 속도를 맞춰 짧지만 끝까지 보이게 만듭니다.",
    range: [0.5, 0.62],
  },
  {
    number: "03",
    title: "올릴 말까지 정리합니다",
    desc: "썸네일 문구와 본문까지 함께 정리해 바로 게시할 수 있게 전달합니다.",
    range: [0.66, 0.78],
  },
];

function SolutionStep({
  item,
  progress,
}: {
  item: (typeof solutionItems)[number];
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, item.range, [0, 1]);
  const y = useTransform(progress, item.range, [28, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="border-t border-white/[0.12] py-5"
    >
      <p className="font-mono text-[13px] text-[#ff7a3d]">{item.number}</p>
      <h3 className="mt-3 text-[22px] font-semibold leading-[1.35] text-white md:text-[28px]">
        {item.title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.75] text-white/60 md:text-[16px]">
        {item.desc}
      </p>
    </motion.div>
  );
}

export default function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const headlineX = useTransform(scrollYProgress, [0.16, 0.36], ["0vw", "-24vw"]);
  const frameScale = useTransform(scrollYProgress, [0, 0.28], [0.96, 1]);
  const listOpacity = useTransform(scrollYProgress, [0.3, 0.42], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[260vh] overflow-hidden bg-[#071716] text-white"
    >
      <div className="sticky top-0 flex h-svh items-center px-6 py-10 md:px-10">
        <motion.div
          style={{ scale: frameScale }}
          className="relative mx-auto h-[min(720px,calc(100svh-80px))] w-full max-w-[1180px] overflow-hidden rounded-lg border border-white/[0.14] bg-white/[0.03] shadow-[0_40px_140px_rgba(0,0,0,0.28)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,61,0.18),transparent_32%),radial-gradient(circle_at_78%_72%,rgba(113,214,203,0.14),transparent_34%)]" />

          <motion.div
            style={{ x: headlineX }}
            className="absolute left-1/2 top-1/2 z-10 w-[min(760px,calc(100%-40px))] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 38 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-center text-[36px] font-semibold leading-[1.2] tracking-[0] text-white md:text-[60px]">
              Ryff는,
              <br />
              찍어둔 영상을 릴스로 바꿔드려요.
            </h2>
          </motion.div>

          <motion.div
            style={{ opacity: listOpacity }}
            className="relative z-20 ml-auto flex h-full w-full max-w-[520px] flex-col justify-center px-6 md:px-10"
          >
            {solutionItems.map((item) => (
              <SolutionStep
                key={item.number}
                item={item}
                progress={scrollYProgress}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

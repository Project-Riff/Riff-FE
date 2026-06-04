"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import requestAnimation from "@/public/lottie/Social.json";

const requestItems = [
  "가게 이름 및 연락처",
  "대표 메뉴 또는 대표 상품",
  "영상 파일 업로드",
  "추가 요청사항",
];

const typingTexts = [
  "제작에 필요한 정보를\n간단히 남겨주세요.",
  "매장의 분위기를\n영상으로 전해드려요.",
  "짧은 클립만 보내도\n제작 방향을 잡아드려요.",
];

export default function RequestSection() {
  const [isHovered, setIsHovered] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">(
    "typing"
  );

  useEffect(() => {
    const currentText = typingTexts[textIndex];

    let timer: NodeJS.Timeout;

    if (phase === "typing") {
      if (displayText.length < currentText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timer = setTimeout(() => {
          setPhase("pause");
        }, 900);
      }
    }

    if (phase === "pause") {
      timer = setTimeout(() => {
        setPhase("deleting");
      }, 600);
    }

    if (phase === "deleting") {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length - 1));
        }, 45);
      } else {
        timer = setTimeout(() => {
          setTextIndex((prev) => (prev + 1) % typingTexts.length);
          setPhase("typing");
        }, 250);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, phase, textIndex]);

  return (
    <section id="request" className="scroll-mt-24 overflow-hidden bg-white">
      <div className="mx-auto max-w-[960px] px-6 py-12 md:py-16">
        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            Request
          </p>

          <div className="mt-3 flex items-end justify-between gap-8">
            <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
              <span className="text-[#ff7a2f]">제작 문의,</span>
              <br />
              간단하게 남겨주세요
            </h2>

            <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:block">
              구글폼에서 필요한 정보를 작성해주시면 빠르게 확인 후 연락드리겠습니다.
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#ededed] bg-[#fcfcfc] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)] md:p-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
                Riff request form
              </p>

              <h3 className="mt-3 min-h-[72px] whitespace-pre-line font-[var(--font-serif)] text-[24px] leading-[1.18] tracking-[-0.03em] text-[#111] md:min-h-[84px] md:text-[30px]">
                {displayText}
                <span className="ml-1 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-[#111]" />
              </h3>

              <p className="mt-3 max-w-[380px] text-[13px] leading-[1.8] text-[#666]">
                가게 정보와 영상 파일을 남겨주시면 매장의 분위기에 맞는
                방향으로 확인 후 연락드립니다.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <Link href="/apply">
                  <PrimaryButton type="button">문의하기</PrimaryButton>
                </Link>

                <span className="text-[12px] text-[#999]">
                  문의 페이지로 이동합니다.
                </span>
              </div>
            </div>

            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative rounded-[18px] border border-[#ededed] bg-white p-4 transition duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
            >
              {isHovered && (
                <div className="pointer-events-none absolute right-4 top-[-30px] z-20 h-[110px] w-[110px]">
                  <Lottie
                    animationData={requestAnimation}
                    loop={false}
                    autoplay
                  />
                </div>
              )}

              <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
                Checklist
              </p>

              <h4 className="mt-1 text-[15px] font-semibold text-[#111]">
                작성 항목
              </h4>

              <div className="mt-4 grid gap-2.5">
                {requestItems.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[14px] border border-[#ededed] bg-[#fcfcfc] px-3.5 py-2.5 transition duration-300 hover:bg-white"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111] text-[10px] text-white">
                      {index + 1}
                    </span>

                    <span className="text-[12px] leading-[1.6] text-[#666]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[14px] border border-[#ededed] bg-[#fcfcfc] px-3.5 py-2.5 text-[11px] leading-[1.7] text-[#777]">
                사진과 짧은 영상 클립이 있으면 제작 방향을 더 빠르게 맞출 수
                있습니다.
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

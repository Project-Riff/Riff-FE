"use client";

import Link from "next/link";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function RequestSection() {
  return (
    <section id="request" className="scroll-mt-24 overflow-hidden bg-white">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.88fr)]">
        <div>
          <p className="font-[var(--font-pretendard)] text-[14px] font-semibold tracking-[0] text-[#ff6b2c]">
            Request
          </p>

          <div className="mt-3 flex max-w-[620px] flex-col gap-4">
            <h2 className="font-[var(--font-pretendard)] text-[30px] font-semibold leading-[1.18] tracking-[0] text-[#071716] md:text-[42px]">
              <span className="text-[#ff7a2f]">제작 문의,</span>
              <br />
              간단하게 남겨주세요
            </h2>

            <p className="max-w-[520px] text-[14px] leading-[1.8] text-[#5f6666]">
              구글폼에서 필요한 정보를 작성해주시면 빠르게 확인 후 연락드리겠습니다.
            </p>

            <div className="mt-3">
              <Link href="/apply">
                <PrimaryButton type="button">문의하기</PrimaryButton>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[420px] w-full justify-self-end lg:min-h-[500px]">
          <div className="pointer-events-none absolute inset-x-10 top-8 h-56 rounded-full bg-[#ff6b2c]/12 blur-[70px]" />

          <div className="relative ml-auto w-full max-w-[520px] rounded-[24px] border border-black/8 bg-[#fbfaf7] p-5 shadow-[0_28px_90px_rgba(7,23,22,0.10)] md:p-6">
            <div className="mb-7 text-center">
              <p className="text-[24px] font-semibold tracking-[0] text-[#071716]">
                제작 문의
              </p>

              <div className="mx-auto mt-5 inline-flex items-center gap-3 rounded-full border border-black/8 bg-white px-5 py-3 text-[13px] font-medium text-[#555d66] shadow-[0_10px_30px_rgba(7,23,22,0.05)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[13px] text-[#5f6666]">
                  i
                </span>
                문의하시면 1~2일 내로 연락드립니다.
              </div>
            </div>

            <div className="mb-7 flex items-center gap-4">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#dde1e7]">
                <div className="request-progress h-full rounded-full bg-[#ff6b2c]" />
              </div>
              <span className="text-[13px] font-semibold text-[#9aa4b8]">
                1/4
              </span>
            </div>

            <div className="mb-7 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[#ff6b2c]" />
              <h3 className="text-[22px] font-semibold text-[#071716]">
                가게 정보
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[14px] font-semibold text-[#071716]">
                  음식점 정보를 입력해주세요. <span className="text-[#ff6b2c]">*</span>
                </label>
                <div className="mt-4 space-y-1.5 text-[13px] font-semibold leading-[1.55] text-[#98a3bb]">
                  <p>1. 음식점명: 예) 홍길동식당</p>
                  <p>2. 주소: 예) 서울시 강남구 OO로 123</p>
                  <p>3. 운영시간: 예) 매일 11:00 ~ 22:00</p>
                  <p>4. 대표 메뉴: 예) 김치찌개, 제육볶음</p>
                </div>
                <div className="mt-4 h-[96px] rounded-[16px] border border-[#dfe3ea] bg-white px-5 py-4 text-[15px] font-medium text-[#071716]">
                  <span className="request-typing request-typing-one" />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#071716]">
                  요청사항을 입력해주세요.
                </label>
                <div className="mt-3 h-[82px] rounded-[16px] border border-[#dfe3ea] bg-white px-5 py-4 text-[15px] font-medium text-[#071716]">
                  <span className="request-typing request-typing-two" />
                </div>
              </div>

              <div className="grid grid-cols-[0.9fr_1.7fr] gap-3">
                <button
                  type="button"
                  className="h-[52px] rounded-[16px] bg-[#f3f5f8] text-[15px] font-semibold text-[#525a70]"
                >
                  이전
                </button>
                <button
                  type="button"
                  className="request-button h-[52px] rounded-[16px] bg-[#ff6b2c] text-[15px] font-semibold text-white shadow-[0_18px_36px_rgba(255,107,44,0.24)]"
                >
                  신청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .request-progress {
          width: 25%;
          animation: request-progress-fill 4.8s ease-in-out infinite;
        }

        .request-typing {
          position: relative;
          display: inline-block;
          min-height: 1.4em;
        }

        .request-typing::after {
          content: "";
          display: inline-block;
          height: 1em;
          width: 2px;
          margin-left: 2px;
          transform: translateY(2px);
          background: #071716;
          animation: request-caret 0.8s steps(1) infinite;
        }

        .request-typing-one::before {
          content: "";
          animation: request-type-one 4.8s steps(1) infinite;
        }

        .request-typing-two::before {
          content: "";
          animation: request-type-two 4.8s steps(1) infinite;
        }

        .request-button {
          animation: request-button-pulse 4.8s ease-in-out infinite;
        }

        @keyframes request-progress-fill {
          0%,
          12% {
            width: 25%;
          }
          55%,
          100% {
            width: 44%;
          }
        }

        @keyframes request-type-one {
          0%,
          10% {
            content: "";
          }
          16% {
            content: "홍";
          }
          22% {
            content: "홍길동식당";
          }
          28% {
            content: "홍길동식당\\A서울시 강남구 OO로 123";
          }
          34%,
          100% {
            content: "홍길동식당\\A서울시 강남구 OO로 123\\A매일 11:00 ~ 22:00\\A김치찌개, 제육볶음";
            white-space: pre-line;
          }
        }

        @keyframes request-type-two {
          0%,
          38% {
            content: "";
          }
          46% {
            content: "대표";
          }
          54% {
            content: "대표 메뉴가 잘 보이게";
          }
          62%,
          100% {
            content: "대표 메뉴가 잘 보이게 강조해주세요.";
          }
        }

        @keyframes request-caret {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }

        @keyframes request-button-pulse {
          0%,
          72% {
            transform: translateY(0);
          }
          78% {
            transform: translateY(-2px);
          }
          86%,
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

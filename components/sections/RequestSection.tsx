"use client";

import { FormEvent, useState } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import PrimaryButton from "@/components/ui/PrimaryButton";

const initialForm = {
  storeName: "",
  contact: "",
  category: "음식점",
  menu: "",
  point: "",
  mood: "감성",
  memo: "",
};

export default function RequestSection() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setForm(initialForm);
  };

  return (
    <section
      id="request"
      className="scroll-mt-24 bg-white px-6 py-16"
    >
      <div className="mx-auto max-w-[960px]">
        <SectionTitle
          eyebrow="Request"
          title="제작 문의"
          desc="아래 양식에 필요한 정보를 입력하시면 빠르게 연락드리겠습니다."
        />

        <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-[16px] border border-[#f2f2f2] bg-white p-5">
            <h3 className="font-[var(--font-serif)] text-[20px] leading-[1.3] text-[#111]">
              어떤 정보를 보내면 되나요
            </h3>

            <ul className="mt-4 space-y-3 text-[13px] leading-[1.7] text-[#666]">
              <li>• 가게 이름과 업종</li>
              <li>• 대표 메뉴 또는 대표 상품</li>
              <li>• 강조하고 싶은 포인트</li>
              <li>• 원하는 분위기</li>
            </ul>

            <div className="mt-5 h-px bg-[#f3f3f3]" />

            <p className="mt-4 text-[12px] leading-[1.7] text-[#888]">
              사진과 짧은 영상 클립이 있으면 더 빠르게 작업 방향을
              맞출 수 있습니다.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[16px] border border-[#f2f2f2] bg-white p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#666]">
                  가게 이름
                </span>
                <input
                  value={form.storeName}
                  onChange={(e) =>
                    setForm({ ...form, storeName: e.target.value })
                  }
                  className="w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none placeholder:text-[#b0b0b0] transition focus:border-[#d9d9d9]"
                  placeholder="예: 리트모 김밥"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#666]">
                  연락처
                </span>
                <input
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                  className="w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none placeholder:text-[#b0b0b0] transition focus:border-[#d9d9d9]"
                  placeholder="010-0000-0000"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#666]">
                  업종
                </span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none transition focus:border-[#d9d9d9]"
                >
                  <option>음식점</option>
                  <option>카페</option>
                  <option>헬스장</option>
                  <option>네일샵</option>
                  <option>기타 로컬 매장</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#666]">
                  원하는 분위기
                </span>
                <select
                  value={form.mood}
                  onChange={(e) =>
                    setForm({ ...form, mood: e.target.value })
                  }
                  className="w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none transition focus:border-[#d9d9d9]"
                >
                  <option>감성</option>
                  <option>힙함</option>
                  <option>깔끔함</option>
                  <option>고급스러움</option>
                  <option>가성비 강조</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-[12px] font-medium text-[#666]">
                대표 메뉴 또는 상품
              </span>
              <input
                value={form.menu}
                onChange={(e) => setForm({ ...form, menu: e.target.value })}
                className="w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none placeholder:text-[#b0b0b0] transition focus:border-[#d9d9d9]"
                placeholder="예: 김치삼겹덮밥, 아메리카노, 1:1 PT"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[12px] font-medium text-[#666]">
                강조 포인트
              </span>
              <input
                value={form.point}
                onChange={(e) => setForm({ ...form, point: e.target.value })}
                className="w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none placeholder:text-[#b0b0b0] transition focus:border-[#d9d9d9]"
                placeholder="예: 가성비 좋음, 39년 전통, 디저트 맛집"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[12px] font-medium text-[#666]">
                추가 요청사항
              </span>
              <textarea
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                className="min-h-[120px] w-full rounded-[12px] border border-[#ededed] bg-white px-4 py-3 text-[13px] text-[#111] outline-none placeholder:text-[#b0b0b0] transition focus:border-[#d9d9d9]"
                placeholder="예: 인스타 릴스용, 가격 정보 꼭 넣기, 지도 안내 문구 포함"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-[12px] leading-[1.6] text-[#888]">
                보내주신 정보는 제작 문의 확인 용도로만 사용됩니다.
              </p>
              <PrimaryButton type="submit">문의 접수하기</PrimaryButton>
            </div>

            {submitted && (
              <div className="mt-4 rounded-[12px] border border-[#ececec] bg-[#fafafa] px-4 py-3 text-[12px] leading-[1.7] text-[#666]">
                문의가 접수되었습니다. 빠르게 연락드리겠습니다!
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
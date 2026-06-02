"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

const initialForm = {
  businessNumber: "",
  businessLocation: "",
  name: "",
  phone: "",
  email: "",
  restaurantInfo: "",
  requestNote: "",
};

type FormState = typeof initialForm;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string) {
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim());
}

export default function RequestPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string;
    email?: string;
  }>({});

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorMessage("");

    if (key === "phone") {
      setFieldErrors((prev) => ({
        ...prev,
        phone:
          value.trim() && !isValidPhone(value)
            ? "연락처 형식을 확인해주세요."
            : "",
      }));
    }

    if (key === "email") {
      setFieldErrors((prev) => ({
        ...prev,
        email:
          value.trim() && !isValidEmail(value)
            ? "이메일 형식을 확인해주세요."
            : "",
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidPhone(form.phone)) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: "연락처 형식을 확인해주세요.",
      }));
      return;
    }

    if (!isValidEmail(form.email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "이메일 형식을 확인해주세요.",
      }));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(result.error || "문의 접수 중 오류가 발생했습니다.");
        return;
      }

      alert("문의가 접수되었습니다.");
      setForm(initialForm);
      setFieldErrors({});
    } catch (error) {
      console.error("[consult] submit error:", error);
      setErrorMessage("문의 접수 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative h-[calc(100vh-76px)] overflow-hidden bg-white px-5 py-5 text-[#111] md:px-8">
      <div className="pointer-events-none absolute left-[max(42px,calc(50%-560px))] top-1/2 hidden h-[430px] w-[250px] -translate-y-1/2 opacity-90 lg:block">
        <svg
          className="decor-line-drift absolute inset-0 h-full w-full"
          viewBox="0 0 250 430"
          fill="none"
        >
          <path
            d="M42 44C116 6 202 42 204 112C206 196 82 176 60 274C47 332 94 384 176 356"
            stroke="#FFB98F"
            strokeWidth="1.4"
            strokeDasharray="5 10"
            strokeLinecap="round"
            opacity="0.62"
          />
          <path
            d="M28 322C58 264 142 258 210 294"
            stroke="#E8E8E8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M26 128C68 102 120 100 154 128"
            stroke="#FFD2B8"
            strokeWidth="1.2"
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
        </svg>
        <div className="decor-float-a absolute left-10 top-6 h-9 w-9 rounded-full border border-[#ffb98f] bg-[#fff8f3]" />
        <div className="decor-float-b absolute right-5 top-[92px] h-7 w-7 rotate-12 rounded-[8px] border border-[#eeeeee] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]" />
        <div className="decor-float-c absolute left-4 top-[178px] h-0 w-0 border-l-[13px] border-r-[13px] border-b-[23px] border-l-transparent border-r-transparent border-b-[#ffb98f]" />
        <div className="decor-float-b absolute right-10 top-[230px] h-11 w-11 rounded-full border-[7px] border-[#fff0e6]" />
        <div className="decor-float-a absolute left-24 bottom-10 h-8 w-8 rotate-45 rounded-[9px] bg-[#fff0e6]" />
        <div className="decor-pulse absolute right-16 bottom-4 h-2.5 w-2.5 rounded-full bg-[#ff7a2f] shadow-[0_0_16px_rgba(255,122,47,0.45)]" />
        <div className="decor-float-c absolute right-0 top-[166px] h-3 w-3 rounded-full bg-orange-200" />
      </div>

      <div className="pointer-events-none absolute right-[max(42px,calc(50%-560px))] top-1/2 hidden h-[430px] w-[250px] -translate-y-1/2 opacity-90 lg:block">
        <svg
          className="decor-line-drift-reverse absolute inset-0 h-full w-full"
          viewBox="0 0 250 430"
          fill="none"
        >
          <path
            d="M212 48C128 12 56 64 64 142C72 222 190 202 184 294C180 354 116 380 54 344"
            stroke="#FFB98F"
            strokeWidth="1.4"
            strokeDasharray="2 10"
            strokeLinecap="round"
            opacity="0.66"
          />
          <path
            d="M34 128C74 92 154 84 212 118"
            stroke="#E8E8E8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M68 318C116 284 172 284 218 318"
            stroke="#FFD2B8"
            strokeWidth="1.2"
            strokeDasharray="5 9"
            strokeLinecap="round"
          />
        </svg>
        <div className="decor-float-c absolute right-12 top-8 h-8 w-8 rounded-full bg-[#ff7a2f]/80" />
        <div className="decor-float-a absolute left-8 top-[126px] h-10 w-10 rotate-6 rounded-[12px] border border-[#ffcfb0] bg-[#fff8f3]" />
        <div className="decor-float-b absolute right-5 top-[210px] h-0 w-0 rotate-12 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-[#ffb98f]" />
        <div className="decor-float-c absolute left-0 top-[270px] h-10 w-10 rounded-full border border-[#e9e9e9] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]" />
        <div className="decor-float-b absolute right-20 bottom-12 h-8 w-8 rotate-45 rounded-[9px] bg-[#fff0e6]" />
        <div className="decor-pulse absolute left-16 bottom-2 h-2.5 w-2.5 rounded-full bg-orange-300" />
        <div className="decor-float-a absolute left-2 top-12 h-3 w-3 rounded-full bg-orange-200" />
      </div>

      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-center">
        <section className="w-full max-w-[620px]">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-[26px] border border-[#ededed] bg-white/94 p-4 shadow-[0_20px_58px_rgba(0,0,0,0.08)] backdrop-blur md:p-5"
          >
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-[#eeeeee] pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
                  Contact form
                </p>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#111]">
                  제작 문의
                </h2>
              </div>
            </div>

            <div className="grid gap-x-3 gap-y-2.5 md:grid-cols-2">
              <Field
                label="사업자번호"
                value={form.businessNumber}
                onChange={(value) => updateField("businessNumber", value)}
                placeholder="예: 123-45-67890"
                required
              />
              <Field
                label="사업장위치"
                value={form.businessLocation}
                onChange={(value) => updateField("businessLocation", value)}
                placeholder="예: 서울시 강남구"
                required
              />
              <Field
                label="이름"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                placeholder="담당자 이름"
                required
              />
              <Field
                label="연락처"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
                placeholder="예: 010-0000-0000"
                error={fieldErrors.phone}
                required
              />
              <div className="md:col-span-2">
                <Field
                  label="이메일"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  placeholder="예: riff@example.com"
                  error={fieldErrors.email}
                  required
                />
              </div>
            </div>

            <div className="mt-3">
              <Textarea
                label="음식점 정보"
                value={form.restaurantInfo}
                onChange={(value) => updateField("restaurantInfo", value)}
                required
                placeholder={`1. 음식점명: 예) 홍길동식당\n2. 주소: 예) 서울시 강남구 ○○로 123\n3. 운영시간: 예) 매일 11:00 ~ 22:00\n4. 대표 메뉴: 예) 김치찌개, 제육볶음`}
              />
            </div>

            <div className="mt-2.5">
              <Textarea
                label="요청사항"
                value={form.requestNote}
                onChange={(value) => updateField("requestNote", value)}
                placeholder="강조하고 싶은 메뉴 또는 장점이 있으면 작성해주세요."
              />
            </div>

            {errorMessage ? (
              <p className="mt-3 rounded-[13px] border border-red-100 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-500">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3.5 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[#ff7a2f] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(255,122,47,0.28)] transition hover:bg-[#ff8a3d]"
            >
              <Send size={15} />
              {isSubmitting ? "문의 접수 중..." : "문의 접수하기"}
            </button>
          </form>
        </section>
      </div>

      <style jsx>{`
        .decor-line-drift {
          animation: decor-line-drift 8s ease-in-out infinite;
          transform-origin: center;
        }

        .decor-line-drift-reverse {
          animation: decor-line-drift-reverse 9s ease-in-out infinite;
          transform-origin: center;
        }

        .decor-float-a {
          animation: decor-float-a 5.8s ease-in-out infinite;
        }

        .decor-float-b {
          animation: decor-float-b 6.6s ease-in-out infinite;
        }

        .decor-float-c {
          animation: decor-float-c 7.2s ease-in-out infinite;
        }

        .decor-pulse {
          animation: decor-pulse 2.8s ease-in-out infinite;
        }

        @keyframes decor-line-drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(4px, -6px, 0) rotate(1.2deg);
          }
        }

        @keyframes decor-line-drift-reverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-5px, 5px, 0) rotate(-1deg);
          }
        }

        @keyframes decor-float-a {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(var(--tw-rotate, 0deg));
          }
          50% {
            transform: translate3d(0, -8px, 0) rotate(var(--tw-rotate, 0deg));
          }
        }

        @keyframes decor-float-b {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(var(--tw-rotate, 0deg));
          }
          50% {
            transform: translate3d(7px, 5px, 0) rotate(var(--tw-rotate, 0deg));
          }
        }

        @keyframes decor-float-c {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(var(--tw-rotate, 0deg));
          }
          50% {
            transform: translate3d(-6px, 7px, 0) rotate(var(--tw-rotate, 0deg));
          }
        }

        @keyframes decor-pulse {
          0%,
          100% {
            opacity: 0.78;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.28);
          }
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  error = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold text-[#111]">
        {label}
        {required ? <span className="ml-1 text-[#ff7a2f]">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          "h-[38px] w-full rounded-[13px] border bg-[#fcfcfc] px-3.5 text-[12px] font-medium text-[#111] outline-none transition placeholder:font-normal placeholder:text-[#9f9f9f] focus:bg-white",
          error
            ? "border-red-200 focus:border-red-300"
            : "border-[#e6e6e6] focus:border-[#ffb98f]",
        ].join(" ")}
      />
      {error ? (
        <span className="mt-1.5 block text-[11px] font-medium text-red-500">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold text-[#111]">
        {label}
        {required ? <span className="ml-1 text-[#ff7a2f]">*</span> : null}
      </span>
      <textarea
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={label === "음식점 정보" ? 5 : 2}
        className="w-full resize-none overflow-hidden rounded-[13px] border border-[#e6e6e6] bg-[#fcfcfc] px-3.5 py-2.5 text-[12px] font-medium leading-5 text-[#111] outline-none transition placeholder:font-normal placeholder:text-[#9a9a9a] focus:border-[#ffb98f] focus:bg-white"
      />
    </label>
  );
}

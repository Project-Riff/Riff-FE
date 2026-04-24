"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "로그인에 실패했습니다.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-88px)] items-center justify-center bg-[#f5f3ef] px-6 py-16 text-neutral-900">
      <div className="w-full max-w-md rounded-[28px] border border-black/8 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-medium text-[#ff6a1a]">Admin Access</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-neutral-900">
          관리자 로그인
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          관리자 키를 입력해야 접근할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            placeholder="관리자 키 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-[#f8f6f2] px-4 py-4 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#ff6a1a]/40 focus:bg-white"
          />

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-neutral-900 px-4 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "확인 중..." : "관리자 로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}
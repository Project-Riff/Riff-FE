"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Instagram, ShieldCheck } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const sectionHref = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        isAdmin
          ? "border-[#ff7a2f]/25 bg-gradient-to-r from-[#fff5ec]/85 via-white/85 to-white/85"
          : "border-black/5 bg-white/80"
      }`}
    >
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link
            href={isAdmin ? "/admin" : "/"}
            className="group inline-flex items-center gap-2.5"
          >
            <span className="font-[var(--font-serif)] text-[26px] tracking-[-0.04em] text-[#ff7a2f] transition duration-300 group-hover:text-[#ff8a3d]">
              Riff
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7a2f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_12px_rgba(255,122,47,0.28)]">
                <ShieldCheck size={11} strokeWidth={2.5} />
                Admin
              </span>
            )}
          </Link>

          {!isAdmin && (
            <nav className="hidden items-center gap-8 md:flex">
              <Link
                href={sectionHref("#samples")}
                className="text-[14px] font-medium text-[#777] transition hover:text-[#111]"
              >
                샘플
              </Link>
              <Link
                href={sectionHref("#process")}
                className="text-[14px] font-medium text-[#777] transition hover:text-[#111]"
              >
                제작 방식
              </Link>
              <Link
                href={sectionHref("#pricing")}
                className="text-[14px] font-medium text-[#777] transition hover:text-[#111]"
              >
                안내
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <span className="hidden text-[12px] font-medium text-[#b5541c] sm:inline">
              관리자 전용 페이지
            </span>
          ) : (
            <>
              <a
                href="https://www.instagram.com/riff_food/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff7a2f] text-white shadow-[0_4px_12px_rgba(255,122,47,0.2)] transition-all duration-300 hover:bg-[#ff8a3d] hover:scale-105 active:scale-95"
                title="인스타그램 방문하기"
              >
                <Instagram size={17} strokeWidth={2} />
              </a>

              <Link
                href="/consult"
                className="inline-flex h-[40px] items-center gap-2 rounded-full border border-black/8 bg-white px-4 text-[13px] font-medium text-[#111] transition duration-300 hover:bg-[#fafafa]"
              >
                제작 문의
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Instagram } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const sectionHref = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  if (isAdmin) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto flex h-[58px] max-w-[1240px] items-center justify-between px-6 md:h-[76px]">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt="Ryff Logo"
              className="h-8 w-auto object-contain transition duration-300 group-hover:opacity-90"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href={sectionHref("#samples")}
              className="text-[14px] font-medium text-[#5f6666] transition hover:text-[#071716]"
            >
              작업물
            </Link>
            <Link
              href={sectionHref("#process")}
              className="text-[14px] font-medium text-[#5f6666] transition hover:text-[#071716]"
            >
              진행 방식
            </Link>
            <Link
              href={sectionHref("#pricing")}
              className="text-[14px] font-medium text-[#5f6666] transition hover:text-[#071716]"
            >
              플랜
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://www.instagram.com/ryff_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-black/10 bg-white text-[#071716] transition-all duration-300 hover:bg-[#eef7f5] hover:scale-105 active:scale-95"
            title="인스타그램 방문하기"
          >
            <Instagram size={17} strokeWidth={2} />
          </a>

          <Link
            href="/apply"
            className="inline-flex h-[40px] items-center gap-2 rounded-full bg-[#071716] px-4 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(7,23,22,0.18)] transition duration-300 hover:bg-[#0b2a28]"
          >
            제작 문의
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="group inline-flex items-center">
            <span className="font-[var(--font-serif)] text-[26px] tracking-[-0.04em] text-[#ff7a2f] transition duration-300 group-hover:text-[#ff8a3d]">
              Riff
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#samples"
              className="text-[14px] font-medium text-[#777] transition hover:text-[#111]"
            >
              샘플
            </Link>
            <Link
              href="#process"
              className="text-[14px] font-medium text-[#777] transition hover:text-[#111]"
            >
              제작 방식
            </Link>
            <Link
              href="#pricing"
              className="text-[14px] font-medium text-[#777] transition hover:text-[#111]"
            >
              안내
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="#request"
            className="inline-flex h-[42px] items-center gap-2 rounded-full border border-black/8 bg-white px-4 text-[13px] font-medium text-[#111] transition duration-300 hover:bg-[#fafafa]"
          >
            제작 문의
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
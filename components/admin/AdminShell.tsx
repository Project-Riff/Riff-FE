"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Film,
  Home,
} from "lucide-react";
import { ReactNode, useState } from "react";

const adminLinks = [
  {
    href: "/admin",
    label: "홈",
    icon: Home,
  },
  {
    href: "/admin/shortform-studio",
    label: "숏폼 제작",
    icon: Film,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-white text-[#111]">
      <aside
        className={[
          "sticky top-0 hidden h-screen shrink-0 border-r border-[#f0f0f0] bg-white px-2.5 py-3 transition-[width] duration-300 ease-out md:block",
          isOpen ? "w-[224px]" : "w-[58px]",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div
            className={[
              "mb-5 flex h-11 items-center",
              isOpen ? "justify-between gap-2 px-2" : "justify-center",
            ].join(" ")}
          >
            {isOpen ? (
              <Link href="/admin" className="group inline-flex items-center">
                <img
                  src="/logo.png"
                  alt="Ryff Logo"
                  className="h-8 w-auto object-contain transition duration-300 group-hover:opacity-90"
                />
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#777] transition hover:bg-[#fafafa] hover:text-[#111]"
              aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
            >
              {isOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
            </button>
          </div>

          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={[
                    "flex h-10 items-center rounded-[12px] text-[13px] font-medium transition",
                    isOpen ? "gap-3 px-3" : "justify-center px-0",
                    active
                      ? "bg-[#fff0e6] text-[#ff7a2f]"
                      : "text-[#777] hover:bg-[#fafafa] hover:text-[#111]",
                  ].join(" ")}
                >
                  <Icon size={18} strokeWidth={2.1} />
                  {isOpen && <span className="truncate">{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[#f0f0f0] pt-3">
            <Link
              href="/"
              title="main으로 가기"
              className={[
                "flex h-10 items-center rounded-[12px] text-[13px] font-medium text-[#777] transition hover:bg-[#fafafa] hover:text-[#111]",
                isOpen ? "gap-2.5 px-3" : "justify-center px-0",
              ].join(" ")}
            >
              <ArrowUpRight size={16} />
              {isOpen && <span>main으로 가기</span>}
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-[#f3f3f3] bg-white px-4 py-3 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center"
            >
              <img
                src="/logo.png"
                alt="Ryff Logo"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#ededed] bg-white px-3 text-[12px] font-medium text-[#111]"
            >
              main
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium",
                    active
                      ? "bg-[#fff0e6] text-[#ff7a2f]"
                      : "border border-[#ededed] text-[#777]",
                  ].join(" ")}
                >
                  <Icon size={14} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}

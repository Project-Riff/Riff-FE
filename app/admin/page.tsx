import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";

const adminMenus = [
  {
    href: "/admin/shortform-studio",
    title: "숏폼 제작",
    desc: "영상 넣고 바로 만들기",
    image: "/card1.jpg",
    icon: Film,
  },
];

export default function AdminPage() {
  return (
    <main className="bg-white px-5 py-5 text-[#111] md:px-7 md:py-6">
      <section className="max-w-[760px]">
        <div className="grid max-w-[520px] grid-cols-2 gap-3">
          {adminMenus.map((menu) => {
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="group rounded-[14px] border border-[#f2f2f2] bg-white p-1.5 transition duration-300 hover:-translate-y-0.5 hover:border-[#ffcfb0] hover:bg-[#fffaf6] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
              >
                <div className="relative overflow-hidden rounded-[10px] bg-[#f5f5f5]">
                  <img
                    src={menu.image}
                    alt=""
                    className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/6" />
                  <div className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-[#ff7a2f] shadow-[0_6px_16px_rgba(0,0,0,0.10)]">
                    <Icon size={15} strokeWidth={2.1} />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 px-2.5 pb-3 pt-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-[var(--font-serif)] text-[17px] tracking-[-0.02em] text-[#111]">
                      {menu.title}
                    </h2>
                    <p className="mt-0.5 truncate text-[11px] leading-[1.5] text-[#777]">
                      {menu.desc}
                    </p>
                  </div>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ededed] bg-white text-[#999] transition group-hover:border-[#ff7a2f] group-hover:bg-[#ff7a2f] group-hover:text-white">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

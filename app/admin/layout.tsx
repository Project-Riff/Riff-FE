import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Admin
            </p>
            <h1 className="text-lg font-semibold">Riff 관리자</h1>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              메인으로
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
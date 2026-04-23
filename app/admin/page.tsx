import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">관리자 페이지</h2>
        <p className="mt-2 text-sm text-white/60">
          관리자 전용 기능을 사용할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/create-shortform"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
        >
          <p className="text-lg font-bold">숏폼 생성</p>
          <p className="mt-2 text-sm text-white/60">
            원본 영상 업로드 / YouTube 링크 기반 작업 생성
          </p>
        </Link>
      </div>
    </section>
  );
}
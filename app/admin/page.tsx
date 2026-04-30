import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-[28px] border border-black/8 bg-white px-8 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <p className="text-sm font-medium text-[#ff6a1a]">Admin Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-neutral-900">
          관리자 페이지
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Riff 내부 작업용 페이지입니다. 원본 영상 업로드와 숏폼 생성 등 관리자 전용
          기능을 사용할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/create-shortform"
          className="group rounded-[24px] border border-black/8 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              숏폼 생성
            </p>
            <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-neutral-500 transition group-hover:text-neutral-800">
              바로가기
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            원본 영상을 업로드해 숏폼 작업을 생성합니다.
          </p>
        </Link>
      </div>
    </section>
  );
}

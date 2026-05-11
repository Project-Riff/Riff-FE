import { sampleVideos } from "@/lib/data";

export default function SampleSection() {
  return (
    <section id="samples" className="bg-white px-6 py-14 md:py-16">
      <div className="mx-auto max-w-[960px]">
        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8b8b8]">
            Samples
          </p>

          <div className="mt-3 flex items-end justify-between gap-8">
            <h2 className="font-[var(--font-serif)] text-[28px] leading-[1.2] tracking-[-0.02em] text-[#111]">
              <span className="text-[#ff7a2f]">이런 느낌으로,</span>
              <br />
              자연스럽게 제작합니다
            </h2>

            <p className="hidden max-w-[420px] text-[13px] leading-[1.7] text-[#777] md:block">
              맛집, 카페, 매장 홍보 등 다양한 유형의 쇼츠형 영상을 빠르게 제작합니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 justify-center">
          {sampleVideos.map((video) => (
            <div
              key={video.title}
              className="group mx-auto w-full max-w-[280px] rounded-[14px] border border-[#f2f2f2] bg-white p-2"
            >
              <div className="overflow-hidden rounded-[10px] bg-[#f5f5f5]">
                <video
                  className="aspect-[2/3] w-full object-cover"
                  src={video.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>

              <div className="mt-2">
                <h3 className="font-[var(--font-serif)] text-[15px] text-[#111] truncate">
                  {video.title}
                </h3>

                <p className="mt-1 text-[11px] leading-[1.6] text-[#777] line-clamp-2">
                  {video.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
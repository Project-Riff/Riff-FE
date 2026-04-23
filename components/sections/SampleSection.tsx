import SectionTitle from "@/components/ui/SectionTitle";
import { sampleVideos } from "@/lib/data";

export default function SampleSection() {
  return (
    <section id="samples" className="bg-white px-6 py-14 md:py-16">
      <div className="mx-auto max-w-[880px]">
        <SectionTitle
          eyebrow="Samples"
          title="이런 느낌의 영상으로 제작합니다"
          desc="가성비 맛집, 감성 카페, 로컬 매장 홍보 등 다양한 유형의 쇼츠형 영상을 빠르게 제작합니다."
        />

        <div className="grid gap-4 grid-cols-3">
          {sampleVideos.map((video) => (
            <div
              key={video.title}
              className="group rounded-[14px] border border-[#f2f2f2] bg-white p-2"
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
                <p className="mt-1 text-[11px] text-[#777] line-clamp-2">
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
import HeroSection from "@/components/sections/HeroSection";
import ProcessSection from "@/components/sections/ProcessSection";
import SampleSection from "@/components/sections/SampleSection";
import PricingSection from "@/components/sections/PricingSection";
import RequestSection from "@/components/sections/RequestSection";
import FaqSection from "@/components/sections/FaqSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <SampleSection />
      <ProcessSection />
      <PricingSection />
      <RequestSection />
      <FaqSection />

      <footer className="border-t border-neutral-200 bg-neutral-50 px-6 py-12 text-sm text-neutral-500 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href="https://sfacspace.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-neutral-800 transition-colors hover:text-neutral-900"
            >
              (주)스팩스페이스
            </a>
            <span className="text-neutral-600">개인정보 처리방침</span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <span>대표 염민호</span>
            <span>사업자등록번호 450-87-01864</span>
            <span>전화 02-6217-1119</span>
            <span>팩스 02-6217-1115</span>
            <a
              href="mailto:help@sfacspace.com"
              className="transition-colors hover:text-neutral-900"
            >
              메일 help@sfacspace.com
            </a>
          </div>

          <p className="text-neutral-400">© 2026. SFACSPACE All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}
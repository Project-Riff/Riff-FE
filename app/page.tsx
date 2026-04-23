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
      <ProcessSection />
      <SampleSection />
      <PricingSection />
      <RequestSection />
      <FaqSection />

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-white/45 md:px-10">
        © 2026 Riff. AI 기반 매장 홍보 영상 제작 서비스 MVP
      </footer>
    </main>
  );
}
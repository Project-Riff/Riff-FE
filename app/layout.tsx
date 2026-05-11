import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import localFont from "next/font/local";
import { Noto_Serif_KR } from "next/font/google";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
});

const suit = localFont({
  src: "../public/fonts/SUIT-Variable.woff2",
  variable: "--font-suit",
  display: "swap",
});

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Riff | AI 매장 홍보 영상 제작",
  description: "사진과 영상만 보내면 AI로 빠르게 홍보 영상을 제작해드립니다.",
};

import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${suit.variable} ${serif.variable}`}
    >
      <body className="bg-white text-[#111] font-[var(--font-pretendard)] antialiased">
        <Header />
        {children}
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
    </html>
  );
}
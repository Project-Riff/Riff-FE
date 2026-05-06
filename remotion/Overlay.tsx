import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  getInputProps,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type OverlayInput = {
  videoSrc?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  infoSubtitles?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
};

const input = getInputProps() as OverlayInput;

const palette = {
  cream: "#fff7f0",
  ink: "#121212",
};

const romanizedCityMap: Record<string, string> = {
  서울: "Seoul",
  부산: "Busan",
  대구: "Daegu",
  인천: "Incheon",
  광주: "Gwangju",
  대전: "Daejeon",
  울산: "Ulsan",
  세종: "Sejong",
  제주: "Jeju",
};

function normalizeDisplayTitle(title: string) {
  const normalized = title.trim();
  return romanizedCityMap[normalized] ?? normalized;
}

function hasHangul(text: string) {
  return /[가-힣]/.test(text);
}

function getLetterOffsets(text: string) {
  const gap = text.length <= 5 ? 58 : 52;
  const start = -((text.length - 1) * gap) / 2;
  return Array.from({ length: text.length }, (_, index) => start + index * gap);
}

function getHangulLetterOffsets(text: string) {
  const gap = text.length <= 3 ? 94 : text.length <= 5 ? 82 : 72;
  const start = -((text.length - 1) * gap) / 2;
  return Array.from({ length: text.length }, (_, index) => start + index * gap);
}

const SeoulLetters: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const centerX = width / 2;
  const titleTop = height * 0.34;
  const isHangulTitle = hasHangul(title);

  if (isHangulTitle) {
    const offsets = getHangulLetterOffsets(title);

    return (
      <>
        {title.split("").map((letter, index) => {
          const phase = index * 0.7;
          const x = centerX + offsets[index] + Math.sin(frame / 10 + phase) * 5;
          const y = titleTop + Math.cos(frame / 14 + phase) * 2;
          const rotation = Math.sin(frame / 10 + phase) * 5.5;

          return (
            <div
              key={`${letter}-${index}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                fontFamily:
                  '"NanumSquareRound", "BM Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
                fontSize: 102,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: palette.cream,
                textShadow: "0 2px 0 rgba(0,0,0,0.14)",
                whiteSpace: "nowrap",
              }}
            >
              {letter}
            </div>
          );
        })}
      </>
    );
  }

  const offsets = getLetterOffsets(title);

  return (
    <>
      {title.split("").map((letter, index) => {
        const phase = index * 0.7;
        const x = centerX + offsets[index] + Math.sin(frame / 10 + phase) * 5;
        const rotation = Math.sin(frame / 10 + phase) * 7;

        return (
          <div
            key={`${letter}-${index}`}
            style={{
              position: "absolute",
              left: x,
              top: titleTop,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              fontFamily: "Georgia, Times New Roman, serif",
              fontSize: 108,
              lineHeight: 1,
              fontWeight: 600,
              color: palette.cream,
              textShadow: "0 2px 0 rgba(0,0,0,0.14)",
            }}
          >
            {letter}
          </div>
        );
      })}
    </>
  );
};

export const OverlayVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const title = normalizeDisplayTitle(input.heroTitle?.trim() || "Seoul");
  const subtitle = input.heroSubtitle?.trim() || "";
  const infoSubtitles = input.infoSubtitles ?? [];
  const videoSrc = input.videoSrc?.startsWith("/")
    ? staticFile(input.videoSrc.replace(/^\//, ""))
    : input.videoSrc;
  const subtitleTop = height * 0.38;
  const infoSubtitleTop = height * 0.65;
  const currentSeconds = frame / fps;
  const activeInfoSubtitle =
    infoSubtitles.find(
      (item) =>
        currentSeconds >= item.start && currentSeconds < item.end,
    ) ?? null;

  if (!videoSrc) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#cab29e",
          color: "#fff",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        videoSrc is required
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#cab29e",
        overflow: "hidden",
      }}
    >
      <OffthreadVideo
        src={videoSrc}
        style={{
          width,
          height,
          objectFit: "cover",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(48, 31, 20, 0.18) 0%, rgba(48, 31, 20, 0.02) 34%, rgba(15, 8, 5, 0.08) 100%)",
        }}
      />
      <SeoulLetters title={title} />
      {subtitle ? (
        <div
          style={{
            position: "absolute",
            top: subtitleTop,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#fff",
            borderRadius: 4,
            padding: "14px 18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: palette.ink,
            fontSize: 30,
            fontWeight: 700,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </div>
      ) : null}
      {activeInfoSubtitle ? (
        <div
          style={{
            position: "absolute",
            top: infoSubtitleTop,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "78%",
            fontFamily:
              '"Pretendard Variable", "SUIT", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
            color: "#fffdf8",
            fontSize: 34,
            lineHeight: 1.25,
            fontWeight: 500,
            textAlign: "center",
            letterSpacing: "-0.02em",
            textShadow: "0 1px 10px rgba(0,0,0,0.28)",
            whiteSpace: "pre-wrap",
          }}
        >
          {activeInfoSubtitle.text}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

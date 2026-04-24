import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import script from '../test-script.json';

const title = script.title;

const letterOffsets = [-104, -54, -6, 42, 92];

const palette = {
  cream: '#fff7f0',
  ink: '#121212',
  plum: '#7c6bb3',
  gold: '#ffe266',
};

const SeoulLetters: React.FC = () => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const centerX = width / 2;

  return (
    <>
      {title.split('').map((letter, index) => {
        const phase = index * 0.7;
        const x = centerX + letterOffsets[index] + Math.sin(frame / 10 + phase) * 5;
        const rotation = Math.sin(frame / 10 + phase) * 7;

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: 92,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: 76,
              lineHeight: 1,
              fontWeight: 700,
              color: palette.cream,
              textShadow: '0 2px 0 rgba(0,0,0,0.10)',
            }}
          >
            {letter}
          </div>
        );
      })}
    </>
  );
};

const TopScript: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 42,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Snell Roundhand, Brush Script MT, cursive',
        fontSize: 28,
        fontStyle: 'italic',
        letterSpacing: 0.3,
        color: palette.cream,
        textShadow: `-1px -1px 0 ${palette.plum}, 1px -1px 0 ${palette.plum}, -1px 1px 0 ${palette.plum}, 1px 1px 0 ${palette.plum}`,
      }}
    >
      {script.accent}
    </div>
  );
};

const CaptionCard: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 60;
  const currentSecond = frame / fps;
  const activeSegment =
    script.segments.find(
      (segment) =>
        currentSecond >= segment.start && currentSecond < segment.end && segment.type !== 'hero'
    ) ?? null;

  if (!activeSegment) {
    return null;
  }

  const isCta = activeSegment.type === 'cta';

  return (
    <div
      style={{
        position: 'absolute',
        top: 146,
        left: isCta ? 56 : 28,
        right: isCta ? 56 : 28,
        backgroundColor: isCta ? palette.gold : '#fff',
        borderRadius: isCta ? 999 : 4,
        padding: isCta ? '16px 22px' : '14px 18px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: palette.ink,
        fontSize: isCta ? 24 : 22,
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
      {activeSegment.text}
    </div>
  );
};

export const SeoulSwingVideo: React.FC = () => {
  const {width, height, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const currentSecond = frame / fps;
  const showHero = currentSecond < 4.2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#cab29e',
        overflow: 'hidden',
      }}
    >
      <OffthreadVideo
        src={staticFile('sample-2.mp4')}
        style={{
          width,
          height,
          objectFit: 'cover',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(48, 31, 20, 0.18) 0%, rgba(48, 31, 20, 0.02) 34%, rgba(15, 8, 5, 0.08) 100%)',
        }}
      />
      {showHero ? (
        <>
          <TopScript />
          <SeoulLetters />
        </>
      ) : null}
      {showHero ? (
        <div
          style={{
            position: 'absolute',
            top: 146,
            left: 28,
            right: 28,
            backgroundColor: '#fff',
            borderRadius: 4,
            padding: '14px 18px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: palette.ink,
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {script.headline}
        </div>
      ) : null}
      {!showHero ? <CaptionCard /> : null}
    </AbsoluteFill>
  );
};

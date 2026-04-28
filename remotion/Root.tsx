import {Composition} from 'remotion';
import {SeoulSwingVideo} from './SeoulSwingVideo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="SeoulSwing"
      component={SeoulSwingVideo}
      durationInFrames={1800}
      calculateMetadata={({props}) => {
        return {
          durationInFrames:
            typeof props.durationInFrames === 'number' && props.durationInFrames > 0
              ? props.durationInFrames
              : 1800,
        };
      }}
      fps={60}
      width={1080}
      height={1920}
      defaultProps={{
        videoSrc: '/sample-2.mp4',
        heroTitle: 'Seoul',
        heroSubtitle: '강남역 5분 거리, 유럽이 펼쳐진다',
        durationInFrames: 1800,
      }}
    />
  );
};

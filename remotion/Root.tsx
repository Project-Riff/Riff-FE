import {Composition} from 'remotion';
import {SeoulSwingVideo} from './SeoulSwingVideo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="SeoulSwing"
      component={SeoulSwingVideo}
      durationInFrames={1800}
      fps={60}
      width={720}
      height={1280}
    />
  );
};

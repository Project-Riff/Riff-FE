import {spawn} from 'node:child_process';
import path from 'node:path';

type RenderSeoulVideoOptions = {
  cwd?: string;
  entry?: string;
  compositionId?: string;
  output?: string;
};

const defaultOptions: Required<RenderSeoulVideoOptions> = {
  cwd: process.cwd(),
  entry: 'remotion/index.ts',
  compositionId: 'SeoulSwing',
  output: 'out/remotion-seoul.mp4',
};

export const renderSeoulVideoExample = (
  options: RenderSeoulVideoOptions = {}
) => {
  const resolved = {...defaultOptions, ...options};

  return new Promise<string>((resolve, reject) => {
    const outputPath = path.resolve(resolved.cwd, resolved.output);
    const command = spawn(
      'npx',
      ['remotion', 'render', resolved.entry, resolved.compositionId, outputPath],
      {
        cwd: resolved.cwd,
        stdio: 'inherit',
        shell: true,
      }
    );

    command.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
        return;
      }

      reject(new Error(`Remotion render failed with exit code ${code ?? 'unknown'}`));
    });
  });
};

const run = async () => {
  try {
    const outputPath = await renderSeoulVideoExample({
      cwd: '/Users/aiden/Riff-FE',
      output: 'out/remotion-seoul-from-code.mp4',
    });

    console.log(`Render complete: ${outputPath}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
};

void run();

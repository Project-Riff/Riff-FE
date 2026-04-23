export function getJobBlobPaths(jobId: string) {
  return {
    status: `jobs/${jobId}/status.json`,
    analysis: `jobs/${jobId}/analysis.json`,
    source: `jobs/${jobId}/source`,
    compressed: `jobs/${jobId}/compressed.mp4`,
    final: `jobs/${jobId}/final.mp4`,
    tts: `jobs/${jobId}/tts.mp3`,
    clipsPrefix: `jobs/${jobId}/clips/`,
  };
}
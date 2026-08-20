/** Mic recording + WAV encoding, no external deps - Azure's pronunciation endpoint requires real RIFF/PCM WAV, but browsers only record compressed formats (webm/opus in Chrome, mp4 in Safari), so recorded audio has to be decoded and re-encoded client-side before it's usable. */

export type RecordingController = {
  /** Stops recording and resolves with the raw recorded blob (browser's native format, not yet WAV). */
  stop: () => Promise<Blob>;
  /** Stops and discards - use when the user cancels instead of sending. */
  cancel: () => void;
};

export async function recordAudio(): Promise<RecordingController> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  let resolveStopped: (blob: Blob) => void;
  const stopped = new Promise<Blob>((resolve) => {
    resolveStopped = resolve;
  });
  recorder.onstop = () => {
    stream.getTracks().forEach((t) => t.stop());
    resolveStopped(new Blob(chunks, { type: recorder.mimeType }));
  };

  recorder.start();

  return {
    stop: () => {
      recorder.stop();
      return stopped;
    },
    cancel: () => {
      if (recorder.state !== 'inactive') recorder.stop();
    },
  };
}

const TARGET_SAMPLE_RATE = 16000;

/** Decodes whatever the browser recorded and re-encodes as 16kHz mono 16-bit PCM WAV. */
export async function encodeWavFromBlob(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextCtor();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const mono = downmixToMono(decoded);
    const resampled = resampleLinear(mono, decoded.sampleRate, TARGET_SAMPLE_RATE);
    return pcm16ToWavBlob(resampled, TARGET_SAMPLE_RATE);
  } finally {
    audioCtx.close();
  }
}

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
  const out = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < buffer.length; i++) out[i] += data[i] / buffer.numberOfChannels;
  }
  return out;
}

function resampleLinear(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, samples.length - 1);
    const frac = srcIndex - i0;
    result[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
  }
  return result;
}

function pcm16ToWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

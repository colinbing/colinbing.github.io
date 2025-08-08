import React, { useRef, useState, useEffect } from 'react';

/**
 * Helper: load a script once (returns when onload fires)
 */
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    // If already added, resolve immediately
    const existing = Array.from(document.scripts).find(s => s.src.endsWith(src));
    if (existing) return existing.dataset.loaded ? resolve() : existing.addEventListener('load', resolve);

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.loaded = '0';
    s.onload = () => {
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Minimal replacement for @ffmpeg/util's fetchFile
 * Accepts File/Blob or URL string and returns Uint8Array
 */
async function fetchFileLike(input) {
  if (input instanceof Blob || input instanceof File) {
    const buf = await input.arrayBuffer();
    return new Uint8Array(buf);
  }
  const res = await fetch(input);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export default function VideoCompressor() {
  const [status, setStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const fileRef = useRef(null);
  const ffmpegRef = useRef(null); // will hold the ffmpeg instance

  // Optional: confirm isolation on mount
  useEffect(() => {
    // console.log('crossOriginIsolated?', window.crossOriginIsolated);
  }, []);

const ensureFFmpegLoaded = async () => {

    if (!window.FFmpeg && !window.createFFmpeg) {
  setStatus('Loading FFmpeg… (wrapper)');
  await loadScriptOnce('/ffmpeg/ffmpeg.js');
}
  if (ffmpegRef.current?.loaded) return;

  // Get createFFmpeg from the global UMD wrapper
  const create =
    (window.FFmpeg && window.FFmpeg.createFFmpeg) ||
    window.createFFmpeg;

  if (!create) {
    setStatus('Could not find FFmpeg wrapper. Check that /ffmpeg/ffmpeg.min.js is loading.');
    console.error('No FFmpeg wrapper found. Verify the <script src="/ffmpeg/ffmpeg.min.js"> tag in index.html and that the file exists.');
    return;
  }

  if (!ffmpegRef.current) {
    ffmpegRef.current = create({ log: true });
    // Optional simple progress
    if (typeof ffmpegRef.current.on === 'function') {
      ffmpegRef.current.on('log', ({ message }) => {
        if (typeof message === 'string' && message.includes('time=')) {
          const m = message.match(/time=\S+/)?.[0];
          if (m) setStatus(`Compressing… ${m}`);
        }
      });
    }
  }

  setStatus('Loading FFmpeg… (core)');
  await ffmpegRef.current.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    workerURL: '/ffmpeg/ffmpeg-core.worker.js',
  });
};


  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setDownloadUrl('');
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const compress = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      alert('Please select a video first.');
      return;
    }

    try {
      setIsWorking(true);
      setStatus('Initializing…');
      await ensureFFmpegLoaded();

      setStatus('Writing input…');
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.FS?.('unlink', 'input.mp4').catch(() => {});
      await ffmpeg.FS?.('unlink', 'output.mp4').catch(() => {});
      await ffmpeg.FS('writeFile', 'input.mp4', await fetchFileLike(file));

      setStatus('Compressing…');
      // Adjust CRF/preset to taste (lower CRF = higher quality, larger file)
      await ffmpeg.run(
        '-i', 'input.mp4',
        '-vcodec', 'libx264',
        '-crf', '28',
        // '-preset', 'medium', // uncomment if you want a specific preset
        'output.mp4'
      );

      setStatus('Finishing…');
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const outUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setDownloadUrl(outUrl);
      setStatus('Compression complete ✅');
    } catch (err) {
      console.error(err);
      setStatus('Error during compression. Check console for details.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto auto',
        gap: 12,
        padding: 16,
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <h1 style={{ margin: 0 }}>Video Compressor</h1>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          overflow: 'auto',
          minHeight: 100,
        }}
      >
        {previewUrl ? (
          <video
            src={previewUrl}
            controls
            style={{
              width: '100%',
              maxHeight: 300, // keep UI visible
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
        ) : (
          <div style={{ color: '#6b7280' }}>No video selected yet.</div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <input type="file" accept="video/*" onChange={onFileChange} ref={fileRef} />
        <button
          onClick={compress}
          disabled={isWorking}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: 0,
            background: isWorking ? '#9ca3af' : '#111827',
            color: 'white',
            cursor: isWorking ? 'not-allowed' : 'pointer',
          }}
        >
          {isWorking ? 'Working…' : 'Compress'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 14, color: '#374151' }}>{status}</div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="compressed.mp4"
            style={{
              display: 'inline-block',
              padding: '10px 12px',
              background: '#2563eb',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              width: 'fit-content',
            }}
          >
            Download Compressed Video
          </a>
        )}
      </div>
    </div>
  );
}

const toBlobURL = async (url, mimeType) => {
  const resp = await fetch(url);
  const buf = await resp.arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
};

const fetchFile = async (file) => {
  const arr = await file.arrayBuffer();
  return new Uint8Array(arr);
};

const ffmpeg = FFmpeg.createFFmpeg({ log: true });

const uploader = document.getElementById('uploader');
const compressBtn = document.getElementById('compressBtn');
const status = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');

let inputFile;

uploader.addEventListener('change', (e) => {
  inputFile = e.target.files[0];
  const preview = document.getElementById('preview');
  const videoURL = URL.createObjectURL(inputFile);
  preview.src = videoURL;
  preview.style.display = 'block';

});

compressBtn.addEventListener('click', async () => {
  if (!inputFile) return alert('Please select a video file.');

  status.textContent = 'Loading FFmpeg…';
  await ffmpeg.load({
    coreURL: await toBlobURL('./ffmpeg/ffmpeg-core.js','text/javascript'),
    wasmURL: await toBlobURL('./ffmpeg/ffmpeg-core.wasm','application/wasm'),
    workerURL: await toBlobURL('./ffmpeg/ffmpeg-core.worker.js','text/javascript'),
  });

  status.textContent = 'Compressing video…';
  const inName = 'input.mp4', outName = 'output.mp4';

  await ffmpeg.writeFile(inName, await fetchFile(inputFile));
  await ffmpeg.exec(['-i', inName, '-vcodec', 'libx264', '-crf', '28', outName]);

  const data = await ffmpeg.readFile(outName);
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  downloadLink.href = url;
  downloadLink.style.display = 'inline';
  downloadLink.textContent = 'Download Compressed Video';

  status.textContent = 'Compression complete.';
});

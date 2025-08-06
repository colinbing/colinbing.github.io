import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });
let videoDuration = 0;
let selectedFile = null;

const uploader = document.getElementById('uploader');
const preview = document.getElementById('preview');
const compressBtn = document.getElementById('compressBtn');
const outputSection = document.getElementById('outputSection');
const outputVideo = document.getElementById('outputVideo');
const downloadLink = document.getElementById('downloadLink');

uploader.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  if (!selectedFile) return;

  const url = URL.createObjectURL(selectedFile);
  preview.src = url;
  preview.load();

  preview.onloadedmetadata = () => {
    videoDuration = preview.duration;
    compressBtn.disabled = false;
  };
});

compressBtn.addEventListener('click', async () => {
  if (!selectedFile || !videoDuration) return;

  compressBtn.innerText = 'Compressing...';
  compressBtn.disabled = true;

  if (!ffmpeg.isLoaded()) await ffmpeg.load();

  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(selectedFile));

  const targetSizeKB = 3000;
  const estimatedBitrate = Math.floor((targetSizeKB * 8) / videoDuration);

  await ffmpeg.run(
    '-i', 'input.mp4',
    '-vf', 'scale=-2:480,fps=24',
    '-b:v', estimatedBitrate + 'k',
    '-c:a', 'aac',
    '-b:a', '64k',
    'output.mp4'
  );

  const data = ffmpeg.FS('readFile', 'output.mp4');
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  outputVideo.src = url;
  downloadLink.href = url;
  outputSection.style.display = 'block';

  compressBtn.innerText = 'Compress to under 3MB';
  compressBtn.disabled = false;
});

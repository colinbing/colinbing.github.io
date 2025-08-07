const { createFFmpeg, fetchFile } = window.FFmpeg;

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'ffmpeg-core/ffmpeg-core.js'
});

const fileInput = document.getElementById('fileInput');
const videoPlayer = document.getElementById('videoPlayer');
const fileInfo = document.getElementById('fileInfo');

(async () => {
  fileInfo.innerText = 'Loading FFmpeg...';
  try {
    await ffmpeg.load();
    console.log("🟢 FFmpeg successfully loaded");
    fileInfo.innerText = '✅ FFmpeg loaded.';
  } catch (e) {
    console.error("❌ FFmpeg failed to load:", e);
    fileInfo.innerText = '❌ FFmpeg failed to load.';
  }
})();

fileInput.addEventListener('change', async (event) => {
  console.log("🎬 File input triggered");

  const file = event.target.files[0];
  if (!file) {
    console.warn("⚠️ No file selected.");
    return;
  }

  console.log("📁 File selected:", file.name);

  const url = URL.createObjectURL(file);
  videoPlayer.src = url;

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  fileInfo.innerText = `Original file size: ${sizeMB} MB\nCompressing...`;

  try {
    console.log("🧠 Writing file to FS...");
    await ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

    console.log("⚙️ Running FFmpeg compression...");
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-vf', 'scale=640:-2',
      '-b:v', '600k',
      '-preset', 'veryfast',
      '-movflags', '+faststart',
      'output.mp4'
    );

    console.log("✅ FFmpeg run complete. Reading output...");
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const compressedUrl = URL.createObjectURL(compressedBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = compressedUrl;
    downloadLink.download = 'compressed.mp4';
    downloadLink.innerText = '⬇️ Download Compressed Video';
    downloadLink.style.display = 'block';
    downloadLink.style.marginTop = '1rem';

    fileInfo.innerText += '\n✅ Compression complete.';
    fileInfo.appendChild(downloadLink);
  } catch (err) {
    console.error("❌ FFmpeg compression failed:", err);
    fileInfo.innerText += '\n❌ Compression failed. Check console.';
  }
});

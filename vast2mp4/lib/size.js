const { spawn } = require('child_process');
const ffprobePath = require('ffprobe-static').path;
const axios = require('axios');

async function getMp4Size(url, ua = 'TagSafe-VAST-Inspector') {
  try {
    const r = await axios.head(url, { maxRedirects: 5, headers: { 'User-Agent': ua } });
    const len = Number(r.headers['content-length'] || 0);
    return { bytes: len || 0, method: 'head' };
  } catch {
    return { bytes: 0, method: 'head' };
  }
}

async function estimateHlsMp4Size(m3u8Url) {
  return new Promise((resolve) => {
    let out = '';
    const ff = spawn(ffprobePath, [
      '-v','error',
      '-show_entries','format=duration:stream=bit_rate',
      '-of','json', m3u8Url
    ]);
    ff.stdout.on('data', d => { out += d; });
    ff.on('close', () => {
      try {
        const j = JSON.parse(out || '{}');
        const br = Number((j.streams || [])[0]?.bit_rate || 0);
        const dur = Number(j.format?.duration || 0);
        const bytes = br && dur ? Math.round((br/8) * dur) : 0;
        resolve({ bytes, method: 'ffprobe' });
      } catch { resolve({ bytes: 0, method: 'ffprobe' }); }
    });
    ff.on('error', () => resolve({ bytes: 0, method: 'ffprobe' }));
  });
}

module.exports = { getMp4Size, estimateHlsMp4Size };

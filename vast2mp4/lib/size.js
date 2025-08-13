const { httpHead } = require('./fetch'); const { spawn } = require('child_process');
const { spawn } = require('child_process');
const ffprobePath = require('ffprobe-static').path;

async function getMp4Size(url,ua){
  const h=await httpHead(url,ua); const len=h['content-length']?Number(h['content-length']):null;
  return { bytes: len, method: len?'head':'unknown' };
}
async function estimateHlsMp4Size(m3u8Url){
  return new Promise((res)=>{
    const ff = spawn(ffprobePath, ['-v','error','-show_entries','format=duration:stream=bit_rate','-of','json', m3u8Url]);
    let out=''; ff.stdout.on('data',d=>out+=d);
    ff.on('close',()=>{ try{
      const j=JSON.parse(out); const dur=Number(j?.format?.duration||0);
      const br=(j?.streams||[]).reduce((s,x)=>s+Number(x.bit_rate||0),0);
      if(dur>0&&br>0) res({ bytes: Math.round(dur*br/8), method:'ffprobe-estimate' });
      else res({ bytes:null, method:'unknown' });
    } catch{ res({ bytes:null, method:'unknown' }); }});
  });
}
module.exports={ getMp4Size, estimateHlsMp4Size };


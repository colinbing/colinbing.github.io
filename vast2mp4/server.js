require('dotenv').config();
const express=require('express'); const helmet=require('helmet'); const morgan=require('morgan'); const rate=require('express-rate-limit');
const { unwrap }=require('./lib/vast'); const { stringify }=require('csv-stringify/sync');
const { inferVendor }=require('./lib/vendors'); const { getMp4Size, estimateHlsMp4Size }=require('./lib/size');
const { spawn }=require('child_process');
const axios = require('axios');
const path = require('path');


const app=express();
app.use(helmet());
app.use(express.json({limit:'2mb'}));
app.use(morgan('tiny'));
app.use(rate({windowMs:60_000,max:60}));

// CORS
const allow=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
app.use((req,res,next)=>{
  const o=req.headers.origin;
  if(allow.includes(o)){ res.header('Access-Control-Allow-Origin',o); res.header('Vary','Origin'); }
  res.header('Access-Control-Allow-Headers','Content-Type');
  res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS') return res.sendStatus(200);
  next();
});

// Unwrap
app.post('/api/unwrap', async (req,res)=>{
  try{
    const { url }=req.body||{}; if(!url) return res.status(400).json({error:'url required'});
    const maxDepth=Number(process.env.MAX_WRAPPER_DEPTH||8); const ua=process.env.USER_AGENT||'TagSafe-VAST-Inspector';
    const merged=await unwrap(url,ua,0,maxDepth);

    const trackers=[
      ...merged.impressions.map(u=>({type:'impression',event:'impression',url:u})),
      ...merged.tracking.map(t=>({type:'tracking',event:t.event||'',url:t.url})),
      ...merged.clickTracking.map(u=>({type:'clickTracking',event:'click',url:u}))
    ].map(t=>({...t,provider:inferVendor(t.url)}));

    const placementId=merged.adIds.find(Boolean)||null;
    const adSystem=merged.adSystems.find(Boolean)||null;

    let mediaSummary={kind:'none'};
    const best=merged.bestMp4;
    if(best) mediaSummary={kind:'mp4',url:best.url,width:best.width,height:best.height,bitrate:best.bitrate};
    else{
      const hls=merged.media.find(m=>m.type.includes('mpegurl')||m.url.endsWith('.m3u8'));
      if(hls) mediaSummary={kind:'hls',url:hls.url};
    }

    res.json({ placementId, adSystem, click:{through: merged.clickThrough||null}, trackers, mediaSummary, allMedia: merged.media });
  } catch(e){ res.status(500).json({ error:String(e.message||e) }); }
});

// Trackers CSV
app.post('/api/trackers.csv',(req,res)=>{
  const m=req.body||{}; const rows=[];
  (m.trackers||[]).forEach(r=>rows.push({type:r.type,event:r.event,provider:r.provider,url:r.url}));
  if(m.click?.through) rows.push({type:'clickThrough',event:'clickThrough',provider:'Unknown',url:m.click.through});
  const csv=stringify(rows,{header:true,columns:['type','event','provider','url']});
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="vast-trackers.csv"');
  res.send(csv);
});

// File size
app.get('/api/filesize', async (req,res)=>{
  try{
    const { url, kind }=req.query; if(!url) return res.status(400).json({error:'url required'});
    if(kind==='mp4'){ const r=await getMp4Size(url,process.env.USER_AGENT); return res.json(r); }
    if(kind==='hls'){ const r=await estimateHlsMp4Size(url); return res.json(r); }
    res.status(400).json({error:'kind must be mp4 or hls'});
  } catch(e){ res.status(500).json({error:String(e.message||e)}); }
});

// Download MP4 (mp4 or hls remux)
app.get('/api/download-mp4', async (req,res)=>{
  const { url, kind } = req.query;
  if (!url || !kind) return res.status(400).send('url and kind required');

  // Helper to set headers once
  const setHeaders = () => {
    res.setHeader('Content-Type','video/mp4');
    res.setHeader('Content-Disposition','attachment; filename="creative.mp4"');
  };

  try {
    if (kind === 'mp4') {
      // Try direct stream first (keeps original file; HEAD already worked)
      const r = await axios.get(url, {
        responseType: 'stream',
        headers: { 'User-Agent': process.env.USER_AGENT || 'TagSafe-VAST-Inspector' },
        maxRedirects: 10,
        validateStatus: s => s >= 200 && s < 400
      });
      setHeaders();
      r.data.pipe(res);
      return;
    }

    // kind === 'hls' or fallback will use ffmpeg copy/remux
    const ffmpegPath = require('ffmpeg-static') || 'ffmpeg';
    const { spawn } = require('child_process');
    const args = [
      '-hide_banner','-loglevel','error',
      '-user_agent', process.env.USER_AGENT || 'TagSafe-VAST-Inspector',
      '-i', url,
      '-c','copy','-movflags','+faststart','-f','mp4','pipe:1'
    ];
    const ff = spawn(ffmpegPath, args);
    setHeaders();
    ff.stdout.pipe(res);

    let errBuf = '';
    ff.stderr.on('data', d => { errBuf += d.toString(); });
    ff.on('close', (code) => {
      if (code !== 0) {
        if (!res.headersSent) res.status(502);
        res.end(errBuf || 'ffmpeg failed');
      }
    });
    ff.on('error', e => {
      if (!res.headersSent) res.status(500);
      res.end(String(e));
    });
  } catch (e) {
    // Axios path failed; try ffmpeg as fallback for MP4 too
    try {
      const ffmpegPath = require('ffmpeg-static') || 'ffmpeg';
      const { spawn } = require('child_process');
      const args = [
        '-hide_banner','-loglevel','error',
        '-user_agent', process.env.USER_AGENT || 'TagSafe-VAST-Inspector',
        '-i', url,
        '-c','copy','-movflags','+faststart','-f','mp4','pipe:1'
      ];
      const ff = spawn(ffmpegPath, args);
      setHeaders();
      ff.stdout.pipe(res);
      let errBuf = '';
      ff.stderr.on('data', d => { errBuf += d.toString(); });
      ff.on('close', (code) => {
        if (code !== 0) {
          if (!res.headersSent) res.status(502);
          res.end(errBuf || 'ffmpeg failed');
        }
      });
      ff.on('error', e2 => {
        if (!res.headersSent) res.status(500);
        res.end(String(e2));
      });
    } catch (e2) {
      if (!res.headersSent) res.status(500);
      res.end(String(e));
    }
  }
});

app.use(express.static(path.join(__dirname, 'vast2mp4')));
app.listen(process.env.PORT||8080,()=>console.log('API on',process.env.PORT||8080));

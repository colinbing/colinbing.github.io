#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$HOME/Documents/GitHub/colinbing.github.io"
APP_DIR="$BASE_DIR/tagsafe-vast-backend"

echo "Base: $BASE_DIR"
[ -d "$BASE_DIR" ] || { echo "Error: $BASE_DIR not found"; exit 1; }

mkdir -p "$APP_DIR/lib"

cd "$APP_DIR"
if [ ! -f package.json ]; then
  npm init -y >/dev/null
fi

npm i express axios fast-xml-parser csv-stringify helmet morgan express-rate-limit dotenv

# .gitignore
if [ ! -f .gitignore ]; then
  cat > .gitignore <<'EOF'
node_modules
.env
EOF
fi

# .env
if [ ! -f .env ]; then
  cat > .env <<'EOF'
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173
USER_AGENT=TagSafe-VAST-Inspector
MAX_WRAPPER_DEPTH=8
EOF
fi

# lib/fetch.js
[ -f lib/fetch.js ] || cat > lib/fetch.js <<'EOF'
const axios = require('axios'); const dns = require('dns').promises; const net = require('net');
const PRIVATE = [
  ['10.0.0.0','10.255.255.255'],
  ['172.16.0.0','172.31.255.255'],
  ['192.168.0.0','192.168.255.255'],
  ['127.0.0.0','127.255.255.255'],
  ['0.0.0.0','0.255.255.255'],
  ['169.254.0.0','169.254.255.255']
];
function ipInRange(ip,[s,e]){const toN=i=>i.split('.').reduce((a,b)=>a*256+ +b,0);const n=toN(ip);return n>=toN(s)&&n<=toN(e);}
async function assertPublic(url){
  const host=new URL(url).hostname;
  const addrs=await dns.lookup(host,{all:true,verbatim:true});
  for(const a of addrs){ if(net.isIP(a.address)&&PRIVATE.some(r=>ipInRange(a.address,r))) throw new Error('Blocked private address'); }
}
async function httpGet(url,ua,type='text'){
  await assertPublic(url);
  const res=await axios.get(url,{responseType:type,maxRedirects:10,timeout:15000,
    headers:{'User-Agent':ua,'Accept':'application/xml,text/xml,*/*'},validateStatus:s=>s>=200&&s<400});
  const finalUrl=res.request?.res?.responseUrl||url;
  return { data: res.data, finalUrl, headers: res.headers };
}
async function httpHead(url,ua){
  await assertPublic(url);
  const res=await axios.head(url,{maxRedirects:10,timeout:10000,headers:{'User-Agent':ua}})
    .catch(()=>({headers:{}}));
  return res.headers||{};
}
module.exports={ httpGet, httpHead };
EOF

# lib/macros.js
[ -f lib/macros.js ] || cat > lib/macros.js <<'EOF'
function expandSafeMacros(url){
  const cb='12345678';
  const ts=String(Math.floor(Date.now()/1000));
  return url.replace(/\[CACHEBUSTER\]/gi,cb).replace(/\[TIMESTAMP\]/gi,ts);
}
module.exports={ expandSafeMacros };
EOF

# lib/vendors.js
[ -f lib/vendors.js ] || cat > lib/vendors.js <<'EOF'
const MAP=[
  {key:'moatads',vendor:'Oracle Moat'},
  {key:'doubleverify',vendor:'DoubleVerify'},
  {key:'integralads',vendor:'IAS'},
  {key:'iasds',vendor:'IAS'},
  {key:'adloox',vendor:'Adloox'},
  {key:'comscore',vendor:'Comscore'},
  {key:'adform',vendor:'Adform'},
  {key:'flashtalking',vendor:'Flashtalking'},
  {key:'sizmek',vendor:'Sizmek'},
  {key:'googlesyndication',vendor:'Google'}
];
function inferVendor(url){ const h=url.toLowerCase(); const hit=MAP.find(m=>h.includes(m.key)); return hit?hit.vendor:'Unknown'; }
module.exports={ inferVendor };
EOF

# lib/vast.js
[ -f lib/vast.js ] || cat > lib/vast.js <<'EOF'
const { XMLParser } = require('fast-xml-parser');
const { httpGet } = require('./fetch'); const { expandSafeMacros } = require('./macros');
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',textNodeName:'#text'});
const A=a=>Array.isArray(a)?a:(a?[a]:[]);
const T=n=>typeof n==='string'?n.trim():String(n?.['#text']||'').trim();

function extractUnits(obj){
  const ads=A(obj?.VAST?.Ad||obj?.Ad); const units=[];
  for(const ad of ads){
    const adId=ad?.['@_id']||null; const wrapper=ad?.Wrapper; const inline=ad?.InLine||ad?.Inline;
    if(wrapper){
      units.push({type:'wrapper',adId,
        adTagURI:T(wrapper?.VASTAdTagURI),
        impressions:A(wrapper?.Impression).map(T),
        tracking:A(wrapper?.TrackingEvents?.Tracking).map(t=>({event:t?.['@_event']||'',url:T(t)})),
        clickTracking:A(wrapper?.VideoClicks?.ClickTracking).map(T),
        extensions:wrapper?.Extensions||null});
    }
    if(inline){
      const creatives=A(inline?.Creatives?.Creative);
      const linearLs=creatives.flatMap(c=>A(c?.Linear||c?.linear).map(L=>({L,cId:c?.['@_id']||null})));
      const media=linearLs.flatMap(({L})=>A(L?.MediaFiles?.MediaFile).map(m=>({
        url:T(m),type:(m?.['@_type']||'').toLowerCase(),delivery:(m?.['@_delivery']||'').toLowerCase(),
        width:+(m?.['@_width']||0),height:+(m?.['@_height']||0),bitrate:+(m?.['@_bitrate']||0)})));
      const clickThrough=linearLs.map(({L})=>T(L?.VideoClicks?.ClickThrough)).find(Boolean)||null;
      const clickTracking=linearLs.flatMap(({L})=>A(L?.VideoClicks?.ClickTracking).map(T));
      units.push({type:'inline',adId,
        impressions:A(inline?.Impression).map(T),
        tracking:creatives.flatMap(c=>A(c?.Linear?.TrackingEvents?.Tracking)).map(t=>({event:t?.['@_event']||'',url:T(t)})),
        clickThrough,clickTracking,media,extensions:inline?.Extensions||null,adSystem:T(inline?.AdSystem)||null});
    }
  }
  return units;
}
function merge(acc,u){
  acc.impressions.push(...A(u.impressions)); acc.tracking.push(...A(u.tracking));
  acc.clickTracking.push(...A(u.clickTracking)); if(!acc.clickThrough&&u.clickThrough) acc.clickThrough=u.clickThrough;
  acc.media.push(...A(u.media)); acc.extensions.push(u.extensions||null); acc.adIds.push(u.adId||null);
  if(u.adSystem) acc.adSystems.push(u.adSystem); return acc;
}
function pickBestMp4(media){
  const mp4s=media.filter(m=>m.type==='video/mp4'&&m.delivery!=='streaming');
  mp4s.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0)||(b.width*b.height)-(a.width*a.height));
  return mp4s[0]||null;
}
async function unwrap(url,ua,depth=0,maxDepth=8,acc){
  if(depth>maxDepth) throw new Error('Wrapper depth exceeded');
  const { data }=await httpGet(expandSafeMacros(url),ua,'text');
  const obj=parser.parse(data); const units=extractUnits(obj);
  if(!acc) acc={impressions:[],tracking:[],clickTracking:[],clickThrough:null,media:[],extensions:[],adIds:[],adSystems:[]};
  const wrappers=units.filter(u=>u.type==='wrapper'); const inlines=units.filter(u=>u.type==='inline');
  wrappers.forEach(w=>merge(acc,w));
  if(wrappers.length) return await unwrap(wrappers[0].adTagURI,ua,depth+1,maxDepth,acc);
  if(inlines.length){ merge(acc,inlines[0]); return {...acc,bestMp4:pickBestMp4(acc.media)}; }
  throw new Error('No Inline or Wrapper found');
}
module.exports={ unwrap, pickBestMp4 };
EOF

# lib/size.js
[ -f lib/size.js ] || cat > lib/size.js <<'EOF'
const { httpHead } = require('./fetch'); const { spawn } = require('child_process');

async function getMp4Size(url,ua){
  const h=await httpHead(url,ua); const len=h['content-length']?Number(h['content-length']):null;
  return { bytes: len, method: len?'head':'unknown' };
}
async function estimateHlsMp4Size(m3u8Url){
  return new Promise((res)=>{
    const ff=spawn('ffprobe',['-v','error','-show_entries','format=duration:stream=bit_rate','-of','json',m3u8Url]);
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
EOF

# server.js
[ -f server.js ] || cat > server.js <<'EOF'
require('dotenv').config();
const express=require('express'); const helmet=require('helmet'); const morgan=require('morgan'); const rate=require('express-rate-limit');
const { unwrap }=require('./lib/vast'); const { stringify }=require('csv-stringify/sync');
const { inferVendor }=require('./lib/vendors'); const { getMp4Size, estimateHlsMp4Size }=require('./lib/size');
const { spawn }=require('child_process');

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
app.get('/api/download-mp4',(req,res)=>{
  const { url, kind }=req.query; if(!url||!kind) return res.status(400).send('url and kind required');
  const ff=spawn('ffmpeg',['-y','-i',url,'-c','copy','-movflags','+faststart','-f','mp4','pipe:1']);
  res.setHeader('Content-Type','video/mp4');
  res.setHeader('Content-Disposition','attachment; filename="creative.mp4"');
  ff.stdout.pipe(res); ff.stderr.on('data',()=>{}); ff.on('error',e=>res.status(500).end(String(e)));
});

app.listen(process.env.PORT||8080,()=>console.log('API on',process.env.PORT||8080));
EOF

echo "Done."
echo "Start server: cd \"$APP_DIR\" && node server.js"

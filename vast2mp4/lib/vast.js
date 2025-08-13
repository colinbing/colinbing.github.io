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

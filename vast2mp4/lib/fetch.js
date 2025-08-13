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

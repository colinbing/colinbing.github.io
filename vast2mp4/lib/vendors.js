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

function normalizeVastUrl(raw){
  let u = String(raw || '').trim();
  // strip wrapping quotes
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) u = u.slice(1, -1);
  // common paste artifact: trailing quote
  if (u.endsWith('"') || u.endsWith("'")) u = u.slice(0, -1);
  // HTML entity decode for &amp;
  u = u.replace(/&amp;/gi, '&');
  return u;
}

function expandSafeMacros(raw){
  const url = normalizeVastUrl(raw);
  const cb = '12345678';                                // deterministic
  const ts = String(Math.floor(Date.now()/1000));       // epoch seconds

  return url
    // GAM-style bracket macros
    .replace(/\[CACHEBUSTER\]/gi, cb)
    .replace(/\[TIMESTAMP\]/gi, ts)
    .replace(/\[APIFRAMEWORKS\]/gi, '2,3')              // example: VPAID=2, OMID=3
    .replace(/\[OMIDPARTNER\]/gi, 'tagsafe')            // neutral string
    .replace(/\[BREAKPOSITION\]/gi, '')                 // empty ok
    // ${...} macros coming from ad server contexts
    .replace(/\$\{GDPR\}/gi, '0')
    .replace(/\$\{GDPR_CONSENT_[^}]+\}/gi, '')
    .replace(/\$\{US_PRIVACY\}/gi, '1---')
    .replace(/\$\{COPPA\}/gi, '0');
}

module.exports = { expandSafeMacros, normalizeVastUrl };

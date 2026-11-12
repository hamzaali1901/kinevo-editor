const fs = require('fs');
const vm = require('vm');

let h = fs.readFileSync('final-index.html', 'utf8');
const b = fs.readFileSync('uc-block.js', 'utf8');
const S = '/* ===== Urdu auto captions';
const E = '/* ===== end Urdu captions ===== */';

const s = h.indexOf(S);
if (s < 0) {
  const anchor = "function unlisten(){listening=false;if(rc)try{rc.stop()}catch(e){}pause();msg('')}";
  const n = h.split(anchor).length - 1;
  if (n !== 1) throw new Error('anchor count ' + n);
  h = h.replace(anchor, anchor + '\n' + b);
} else {
  const e = h.indexOf(E);
  if (e >= 0) {
    h = h.slice(0, s) + b + h.slice(e + E.length);
  } else {
    const next = h.indexOf('\n\nObject.assign(FL,{', s);
    if (next < 0) throw new Error('block end not found');
    h = h.slice(0, s) + b + h.slice(next);
  }
}

const scripts = [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (let i = 0; i < scripts.length; i++) new vm.Script(scripts[i], { filename: 'inline-' + i + '.js' });
if (!h.includes('ucLoadAsr') || !h.includes('ucBase')) throw new Error('sync incomplete');
fs.writeFileSync('final-index.html', h, 'utf8');
console.log(JSON.stringify({ bytes: h.length, scripts: scripts.length }, null, 2));

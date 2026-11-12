const fs = require('fs');
const vm = require('vm');

let html = fs.readFileSync('final-index.html', 'utf8');
const block = fs.readFileSync('uc-block.js', 'utf8');
const before = html.length;

function once(oldStr, newStr, label) {
  const n = html.split(oldStr).length - 1;
  if (n !== 1) throw new Error(label + ': expected 1 match, got ' + n);
  html = html.replace(oldStr, newStr);
}

if (!html.includes('/* ===== Urdu auto captions')) {
  once(
    "function unlisten(){listening=false;if(rc)try{rc.stop()}catch(e){}pause();msg('')}",
    "function unlisten(){listening=false;if(rc)try{rc.stop()}catch(e){}pause();msg('')}\n" + block + "\n",
    'insert uc block'
  );
}

once(
  "['🪄','BG Remove',()=>mode='bg'],['🗑️','Delete',del]];",
  "['🪄','BG Remove',()=>mode='bg'],['🗣️','Urdu Caps',()=>mode='uc'],['🗑️','Delete',del]];",
  'toolbar'
);

once(
  "if(!mode||(mode!='tx'&&mode!='vo'&&mode!='mu'&&mode!='ov'&&mode!='ta'&&!c))",
  "if(!mode||(mode!='tx'&&mode!='vo'&&mode!='mu'&&mode!='ov'&&mode!='ta'&&mode!='uc'&&!c))",
  'panel guard'
);

once(
  "else if(mode=='vo'){voPanel(p)}else if(mode=='vol')",
  "else if(mode=='vo'){voPanel(p)}else if(mode=='uc'){ucPanel(p)}else if(mode=='vol')",
  'panel dispatch'
);

once(
  "x.textAlign='center';x.fillStyle=t.c;x.strokeStyle=t.sc||'#000';",
  "x.textAlign='center';x.direction=t.rtl?'rtl':'ltr';x.fillStyle=t.c;x.strokeStyle=t.sc||'#000';",
  'rtl direction'
);

once(
  "const $=i=>document.getElementById(i),cv=$('cv'),x=cv.getContext('2d'),PX=40,eo=$('ov');",
  "const $=i=>document.getElementById(i),cv=$('cv'),x=cv.getContext('2d'),PX=40,eo=$('ov');x.direction='ltr';",
  'init direction'
);

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (let i = 0; i < scripts.length; i++) new vm.Script(scripts[i], { filename: 'inline-' + i + '.js' });

if (!html.includes('ucPanel') || !html.includes("mode=='uc'") || !html.includes("x.direction=t.rtl")) {
  throw new Error('captions patch incomplete');
}
fs.writeFileSync('final-index.html', html, 'utf8');
console.log(JSON.stringify({ before, after: html.length, delta: html.length - before, scripts: scripts.length }, null, 2));

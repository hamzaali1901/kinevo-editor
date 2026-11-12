const fs = require('fs');
const zlib = require('zlib');
const vm = require('vm');
const path = require('path');

const DIR = __dirname;
const SRC_HTML = 'C:/Users/rajah/AppData/Local/Temp/apk/assets/index.html';
const ORIGINAL_APK = path.join(DIR, 'original.apk');
const FIXED_HTML = path.join(DIR, 'assets-index-fixed.html');
const OUT_APK = path.join(DIR, 'rebuilt-unsigned.apk');

let html = fs.readFileSync(SRC_HTML, 'utf8');

const startMark = "const dl=()=>{";
const endMark = ";dl()}";
const start = html.indexOf(startMark);
if (start < 0) throw new Error('start mark not found');
const end = html.indexOf(endMark, start);
if (end < 0) throw new Error('end mark not found');
if (html.indexOf(startMark, start + 1) >= 0) throw new Error('multiple dl definitions found');

const replacement = `const dl=()=>{const a=document.createElement('a');a.href=_ru;a.download=name;document.body.appendChild(a);a.click();a.remove();$('sv2').textContent='Download started: '+name};
const saveNative=()=>new Promise((res,rej)=>{
if(!window.KinevoApp||typeof KinevoApp.begin!=='function')return rej(new Error('native bridge unavailable'));
try{KinevoApp.begin(name,blob.type||('video/'+ext))}catch(e){return rej(e)}
const CH=262144;let off=0;
const step=()=>{
if(off>=blob.size){try{KinevoApp.finish();res()}catch(e){rej(e)}return}
const end=Math.min(off+CH,blob.size),fr=new FileReader();
fr.onerror=()=>rej(fr.error||new Error('read failed'));
fr.onload=()=>{
try{const u8=new Uint8Array(fr.result),B=32768;let b='';for(let i=0;i<u8.length;i+=B)b+=String.fromCharCode.apply(null,u8.subarray(i,i+B));KinevoApp.chunk(btoa(b))}catch(e){return rej(e)}
off=end;setTimeout(step,0)};
fr.readAsArrayBuffer(blob.slice(off,end))};
step()});
const save=()=>{if(window._saving)return;window._saving=1;$('sv2').textContent='Saving to Gallery...';saveNative().then(()=>{$('sv2').textContent='✓ Saved to Gallery (Movies/Kinevo): '+name}).catch(e=>{console.error('save failed',e);$('sv2').textContent='Could not save to Gallery. Use Share.'}).finally(()=>{window._saving=0})};
const sh=async()=>{try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return}}catch(e){if(e&&e.name=='AbortError')return}save()};
$('sg').onclick=save;$('ssh').onclick=sh;eo.hidden=false;msg('');$('sv2').textContent='Saving to Gallery...';save()}`;

html = html.slice(0, start) + replacement + html.slice(end + endMark.length);

// Syntax-check every inline script block.
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (let i = 0; i < scripts.length; i++) {
  new vm.Script(scripts[i], { filename: `inline-script-${i}.js` });
}
if (!html.includes('KinevoApp.begin') || !html.includes('KinevoApp.chunk') || !html.includes('KinevoApp.finish')) {
  throw new Error('bridge calls missing after patch');
}
fs.writeFileSync(FIXED_HTML, html);

// ---- Minimal ZIP rewriter: replaces one entry, copies every other local record verbatim ----
const buf = fs.readFileSync(ORIGINAL_APK);
let eocd = -1;
for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
  if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
}
if (eocd < 0) throw new Error('EOCD not found');

const entryCount = buf.readUInt16LE(eocd + 10);
const cdSize = buf.readUInt32LE(eocd + 12);
const cdOffset = buf.readUInt32LE(eocd + 16);
if (cdOffset === 0xffffffff || entryCount === 0xffff) throw new Error('ZIP64 not supported');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const entries = [];
let p = cdOffset;
for (let i = 0; i < entryCount; i++) {
  if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central header at ' + p);
  const nameLen = buf.readUInt16LE(p + 28);
  const extraLen = buf.readUInt16LE(p + 30);
  const commentLen = buf.readUInt16LE(p + 32);
  const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
  const centralRaw = Buffer.from(buf.subarray(p, p + 46 + nameLen + extraLen + commentLen));
  const localOff = buf.readUInt32LE(p + 42);
  if (buf.readUInt32LE(localOff) !== 0x04034b50) throw new Error('bad local header for ' + name);
  const lFlags = buf.readUInt16LE(localOff + 6);
  const lNameLen = buf.readUInt16LE(localOff + 26);
  const lExtraLen = buf.readUInt16LE(localOff + 28);
  const dataStart = localOff + 30 + lNameLen + lExtraLen;
  const compSize = buf.readUInt32LE(p + 20);
  const data = buf.subarray(dataStart, dataStart + compSize);
  let descriptor = Buffer.alloc(0);
  if (lFlags & 8) {
    const dd = dataStart + compSize;
    descriptor = buf.readUInt32LE(dd) === 0x08074b50
      ? Buffer.from(buf.subarray(dd, dd + 16))
      : Buffer.from(buf.subarray(dd, dd + 12));
  }
  entries.push({
    name,
    centralRaw,
    localRaw: Buffer.from(buf.subarray(localOff, dataStart)),
    data: Buffer.from(data),
    descriptor,
    size: compSize,
    replaced: false,
  });
  p += 46 + nameLen + extraLen + commentLen;
}

const sigRe = /^META-INF\/(?:[^/]+\.(?:SF|RSA|DSA|EC)|MANIFEST\.MF)$/i;
let replaced = 0, dropped = 0;
const kept = [];
for (const e of entries) {
  if (sigRe.test(e.name)) { dropped++; continue; }
  if (e.name === 'assets/index.html') { e.replaced = true; replaced++; }
  kept.push(e);
}
if (replaced !== 1) throw new Error('expected exactly one assets/index.html, got ' + replaced);

const htmlBuf = Buffer.from(html, 'utf8');
const htmlDeflated = zlib.deflateRawSync(htmlBuf, { level: 9 });
const htmlCrc = crc32(htmlBuf);

const localParts = [];
const localOffsets = [];
let outOffset = 0;
for (const e of kept) {
  let local;
  if (e.replaced) {
    const nameBuf = Buffer.from('assets/index.html', 'utf8');
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0);
    h.writeUInt16LE(20, 4);
    h.writeUInt16LE(0x0800, 6);
    h.writeUInt16LE(8, 8);
    h.writeUInt16LE(e.localRaw.readUInt16LE(10), 10);
    h.writeUInt16LE(e.localRaw.readUInt16LE(12), 12);
    h.writeUInt32LE(htmlCrc, 14);
    h.writeUInt32LE(htmlDeflated.length, 18);
    h.writeUInt32LE(htmlBuf.length, 22);
    h.writeUInt16LE(nameBuf.length, 26);
    h.writeUInt16LE(0, 28);
    local = Buffer.concat([h, nameBuf, htmlDeflated]);
  } else {
    local = Buffer.concat([e.localRaw, e.data, e.descriptor]);
  }
  localOffsets.push(outOffset);
  localParts.push(local);
  outOffset += local.length;
}

const cdParts = [];
let cdNewSize = 0;
kept.forEach((e, i) => {
  const ch = Buffer.from(e.centralRaw);
  if (e.replaced) {
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt32LE(htmlCrc, 16);
    ch.writeUInt32LE(htmlDeflated.length, 20);
    ch.writeUInt32LE(htmlBuf.length, 24);
  }
  ch.writeUInt32LE(localOffsets[i], 42);
  cdParts.push(ch);
  cdNewSize += ch.length;
});

const eocdOut = Buffer.alloc(22);
eocdOut.writeUInt32LE(0x06054b50, 0);
eocdOut.writeUInt16LE(kept.length, 8);
eocdOut.writeUInt16LE(kept.length, 10);
eocdOut.writeUInt32LE(cdNewSize, 12);
eocdOut.writeUInt32LE(outOffset, 16);

const out = Buffer.concat([...localParts, ...cdParts, eocdOut]);
fs.writeFileSync(OUT_APK, out);

console.log(JSON.stringify({
  htmlBytes: htmlBuf.length,
  deflatedBytes: htmlDeflated.length,
  entriesIn: entries.length,
  entriesOut: kept.length,
  droppedSignatureEntries: dropped,
  replacedIndex: replaced,
  apkBytes: out.length,
}, null, 2));

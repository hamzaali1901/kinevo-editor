const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const DIR = __dirname;
const ORIGINAL = path.join(DIR, 'original.apk');
const OUT = path.join(DIR, 'rebuilt-unsigned.apk');
const ASSETS = path.join(DIR, 'apk-assets');

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

const buf = fs.readFileSync(ORIGINAL);
let eocd = -1;
for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
  if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
}
if (eocd < 0) throw new Error('EOCD not found');
const entryCount = buf.readUInt16LE(eocd + 10);
const cdOffset = buf.readUInt32LE(eocd + 16);
if (cdOffset === 0xffffffff || entryCount === 0xffff) throw new Error('ZIP64 not supported');

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
  const lNameLen = buf.readUInt16LE(localOff + 26);
  const lExtraLen = buf.readUInt16LE(localOff + 28);
  const dataStart = localOff + 30 + lNameLen + lExtraLen;
  const compSize = buf.readUInt32LE(p + 20);
  entries.push({
    name,
    centralRaw,
    localRaw: Buffer.from(buf.subarray(localOff, dataStart)),
    data: Buffer.from(buf.subarray(dataStart, dataStart + compSize)),
  });
  p += 46 + nameLen + extraLen + commentLen;
}

const replacements = new Map();
replacements.set('assets/index.html', Buffer.from(fs.readFileSync(path.join(ASSETS, 'index.html'))));
replacements.set('AndroidManifest.xml', Buffer.from(fs.readFileSync(path.join(DIR, 'axml', 'AndroidManifest.xml'))));
const dexPatch = path.join(DIR, 'dex', 'classes4-patched.dex');
if (fs.existsSync(dexPatch)) replacements.set('classes4.dex', fs.readFileSync(dexPatch));

const additions = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else {
      const rel = path.relative(ASSETS, full).split(path.sep).join('/');
      const name = 'assets/' + rel;
      if (name === 'assets/index.html') continue;
      additions.push({ name, data: fs.readFileSync(full) });
    }
  }
})(ASSETS);
additions.sort((a, b) => a.name.localeCompare(b.name));

const sigRe = /^META-INF\/(?:[^/]+\.(?:SF|RSA|DSA|EC)|MANIFEST\.MF)$/i;
const kept = entries.filter(e => !sigRe.test(e.name));
let replaced = 0;
for (const e of kept) {
  if (replacements.has(e.name)) { e.newData = replacements.get(e.name); replacements.delete(e.name); replaced++; }
}
if (replacements.size) throw new Error('missing entries: ' + [...replacements.keys()].join(', '));

const DOS_TIME = 0x6000, DOS_DATE = 0x5a21;
function buildLocal(name, data, method, level) {
  const nameBuf = Buffer.from(name, 'utf8');
  const body = method === 8 ? zlib.deflateRawSync(data, { level }) : data;
  const crc = crc32(data);
  const h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50, 0);
  h.writeUInt16LE(20, 4);
  h.writeUInt16LE(0x0800, 6);
  h.writeUInt16LE(method, 8);
  h.writeUInt16LE(DOS_TIME, 10);
  h.writeUInt16LE(DOS_DATE, 12);
  h.writeUInt32LE(crc, 14);
  h.writeUInt32LE(body.length, 18);
  h.writeUInt32LE(data.length, 22);
  h.writeUInt16LE(nameBuf.length, 26);
  h.writeUInt16LE(0, 28);
  return { local: Buffer.concat([h, nameBuf, body]), crc, comp: body.length, raw: data.length, method };
}

const all = kept.map(e => ({ name: e.name, old: e })).concat(additions.map(a => ({ name: a.name, add: a })));
const localParts = [], centralParts = [];
let offset = 0;
const stats = { replaced: 0, added: 0, totalIn: 0, totalOut: 0 };
for (const item of all) {
  let built, nameBuf, central;
  if (item.add) {
    const big = item.add.data.length > 4 * 1024 * 1024;
    built = buildLocal(item.name, item.add.data, 8, big ? 6 : 9);
    nameBuf = Buffer.from(item.name, 'utf8');
    central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(built.crc, 16);
    central.writeUInt32LE(built.comp, 20);
    central.writeUInt32LE(built.raw, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    central = Buffer.concat([central, nameBuf]);
    stats.added++;
    stats.totalIn += item.add.data.length;
    stats.totalOut += built.local.length;
  } else if (item.old.newData) {
    const data = item.old.newData;
    built = buildLocal(item.name, data, 8, 9);
    nameBuf = Buffer.from(item.name, 'utf8');
    central = Buffer.from(item.old.centralRaw);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(built.crc, 16);
    central.writeUInt32LE(built.comp, 20);
    central.writeUInt32LE(built.raw, 24);
    central.writeUInt32LE(offset, 42);
    stats.replaced++;
    stats.totalIn += data.length;
    stats.totalOut += built.local.length;
  } else {
    built = { local: Buffer.concat([item.old.localRaw, item.old.data]) };
    central = Buffer.from(item.old.centralRaw);
    central.writeUInt32LE(offset, 42);
  }
  localParts.push(built.local);
  centralParts.push(central);
  offset += built.local.length;
}

const cd = Buffer.concat(centralParts);
const eocdOut = Buffer.alloc(22);
eocdOut.writeUInt32LE(0x06054b50, 0);
eocdOut.writeUInt16LE(all.length, 8);
eocdOut.writeUInt16LE(all.length, 10);
eocdOut.writeUInt32LE(cd.length, 12);
eocdOut.writeUInt32LE(offset, 16);

const out = Buffer.concat([...localParts, cd, eocdOut]);
fs.writeFileSync(OUT, out);
console.log(JSON.stringify({ entriesIn: entryCount, entriesOut: all.length, ...stats, apkBytes: out.length }, null, 2));

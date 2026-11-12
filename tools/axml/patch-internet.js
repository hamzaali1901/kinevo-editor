const fs = require('fs');
const src = fs.readFileSync('AndroidManifest.xml');
const NEW = 'android.permission.INTERNET';

const poolChunk = 8;
const poolSize = src.readUInt32LE(12);
const poolHdr = src.readUInt16LE(10);
const count = src.readUInt32LE(16);
const styleCount = src.readUInt32LE(20);
const flags = src.readUInt32LE(24);
const stringsStart = src.readUInt32LE(28);
if (flags !== 0) throw new Error('expected UTF-16 pool, flags=' + flags);
if (styleCount !== 0) throw new Error('unexpected styles');

const dataStart = poolChunk + stringsStart;
const dataLen = poolSize - stringsStart;
const offs = [];
for (let i = 0; i < count; i++) offs.push(src.readUInt32LE(poolChunk + poolHdr + i * 4));
function str(i) {
  let p = dataStart + offs[i];
  const n = src.readUInt16LE(p); p += 2;
  let out = '';
  for (let k = 0; k < n; k++) { out += String.fromCharCode(src.readUInt16LE(p)); p += 2; }
  return out;
}
const strings = offs.map((_, i) => str(i));
if (strings.includes(NEW)) { console.log('already present'); process.exit(0); }
if (strings.length !== count) throw new Error('pool mismatch');
console.log('count before', count, 'pool', poolSize, 'stringsStart', stringsStart);

const newIdx = count;
const rawData = src.subarray(dataStart, dataStart + dataLen);
const enc = Buffer.from(NEW, 'utf16le');
const rec = Buffer.alloc(2 + enc.length + 2);
rec.writeUInt16LE(NEW.length, 0);
enc.copy(rec, 2);
const pad = (4 - (rec.length % 4)) % 4;
const strBlob = Buffer.concat([rec, Buffer.alloc(pad)]);

const newStringsStart = poolHdr + (count + 1) * 4;
const newPoolSize = newStringsStart + dataLen + strBlob.length;
const pool = Buffer.alloc(newPoolSize);
pool.writeUInt16LE(1, 0);
pool.writeUInt16LE(poolHdr, 2);
pool.writeUInt32LE(newPoolSize, 4);
pool.writeUInt32LE(count + 1, 8);
pool.writeUInt32LE(0, 12);
pool.writeUInt32LE(0, 16);
pool.writeUInt32LE(newStringsStart, 20);
pool.writeUInt32LE(0, 24);
offs.forEach((o, i) => pool.writeUInt32LE(o, poolHdr + i * 4));
pool.writeUInt32LE(dataLen, poolHdr + count * 4);
rawData.copy(pool, newStringsStart);
strBlob.copy(pool, newStringsStart + dataLen);
console.log('count after', count + 1, 'pool', newPoolSize, 'newIdx', newIdx);

const resmapStart = poolChunk + poolSize;
const resmapSize = src.readUInt32LE(resmapStart + 4);
const resmap = src.subarray(resmapStart, resmapStart + resmapSize);
const nodesStart = resmapStart + resmapSize;
const nodes = src.subarray(nodesStart);

// insert after the RECORD_AUDIO uses-permission node (last uses-permission)
let insAfter = -1;
for (let p = 0; p < nodes.length;) {
  const type = nodes.readUInt16LE(p);
  const size = nodes.readUInt32LE(p + 4);
  if (type === 0x0102) {
    const name = nodes.readInt32LE(p + 20);
    if (name === strings.indexOf('uses-permission')) insAfter = p + size;
  }
  p += size;
}
if (insAfter < 0) throw new Error('uses-permission node not found');
const tmplStart = insAfter - 56;
const tmpl = nodes.subarray(tmplStart, insAfter);
if (tmpl.readUInt16LE(0) !== 0x0102) throw new Error('template not element');
const node = Buffer.from(tmpl);
const q = 16 + node.readUInt16LE(24);
if (node.readUInt16LE(28) !== 1) throw new Error('unexpected attr count');
node.writeInt32LE(newIdx, q + 8);
node.writeUInt8(3, q + 15);
node.writeInt32LE(newIdx, q + 16);
console.log('inserting node after', nodesStart + insAfter, 'value idx', newIdx);

const nodeBuf = Buffer.concat([nodes.subarray(0, insAfter), node, nodes.subarray(insAfter)]);
const total = 8 + pool.length + resmap.length + nodeBuf.length;
const head = Buffer.alloc(8);
head.writeUInt16LE(3, 0);
head.writeUInt16LE(8, 2);
head.writeUInt32LE(total, 4);
const out = Buffer.concat([head, pool, resmap, nodeBuf]);
fs.writeFileSync('AndroidManifest.xml', out);
console.log('written', total, 'bytes (was', src.length + ')');

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'apk-assets');
const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist';
const HF = 'https://huggingface.co/onnx-community/whisper-tiny/resolve/main';

const files = [
  [`${CDN}/transformers.min.js`, 'runtime/transformers.min.js'],
  [`${CDN}/ort-wasm-simd-threaded.jsep.mjs`, 'runtime/ort/ort-wasm.js'],
  [`${CDN}/ort-wasm-simd-threaded.jsep.wasm`, 'runtime/ort/ort-wasm.wasm'],
  [`${HF}/config.json`, 'models/whisper-tiny/config.json'],
  [`${HF}/generation_config.json`, 'models/whisper-tiny/generation_config.json'],
  [`${HF}/preprocessor_config.json`, 'models/whisper-tiny/preprocessor_config.json'],
  [`${HF}/tokenizer.json`, 'models/whisper-tiny/tokenizer.json'],
  [`${HF}/tokenizer_config.json`, 'models/whisper-tiny/tokenizer_config.json'],
  [`${HF}/special_tokens_map.json`, 'models/whisper-tiny/special_tokens_map.json'],
  [`${HF}/added_tokens.json`, 'models/whisper-tiny/added_tokens.json'],
  [`${HF}/normalizer.json`, 'models/whisper-tiny/normalizer.json'],
  [`${HF}/vocab.json`, 'models/whisper-tiny/vocab.json'],
  [`${HF}/merges.txt`, 'models/whisper-tiny/merges.txt'],
  [`${HF}/onnx/encoder_model_quantized.onnx`, 'models/whisper-tiny/onnx/encoder_model_quantized.onnx'],
  [`${HF}/onnx/decoder_model_merged_quantized.onnx`, 'models/whisper-tiny/onnx/decoder_model_merged_quantized.onnx'],
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  console.log(`${(buf.length / 1048576).toFixed(1)} MB  ${path.relative(OUT, dest)}`);
}

(async () => {
  for (const [url, rel] of files) await download(url, path.join(OUT, rel));
  console.log('\nDone. Now copy your own original.apk to tools/original.apk and run: node tools/build-apk.js');
})().catch(e => { console.error(e.message); process.exit(1); });

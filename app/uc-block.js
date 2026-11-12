/* ===== Urdu auto captions: online Groq Whisper + offline Whisper Tiny ===== */
const UC_KEY='kinevo_groq_key',UC_ENG='kinevo_uc_engine',UC_MODEL='kinevo_uc_model';
let ucEngine=(()=>{try{return localStorage.getItem(UC_ENG)||'online'}catch(_){return 'online'}})();
let ucBusy=false,ucStopFlag=false,ucAbort=null,ucAsr=null,ucTF=null,ucDec=null;
let ucModel=(()=>{try{return localStorage.getItem(UC_MODEL)||'tiny'}catch(_){return 'tiny'}})();

function ucStatus(t){const e=$('ucSt');if(e){e.textContent=t;return true}return false}
function ucHasKey(){try{return !!localStorage.getItem(UC_KEY)}catch(_){return false}}

function ucPanel(p){
  const on=ucEngine==='online';
  p.innerHTML='<div style="font-weight:700;font-size:15px;margin:2px 0 6px">🗣 Urdu Auto Captions</div>'
    +'<div class=row><button class="ch'+(on?' on':'')+'" id=ucOn>⚡ Online (Groq)</button><button class="ch'+(!on?' on':'')+'" id=ucOff>📴 Offline</button></div>'
    +'<div class=row id=ucKeyRow style="'+(on?'':'display:none')+'"><input type=password id=ucKeyIn placeholder="Groq API key (gsk_...)" style="flex:1;min-width:0;padding:8px;border-radius:8px;border:0;background:#2a2c33;color:#fff"><button class=ch id=ucKeySv>Save key</button></div>'
    +'<div class=row id=ucModRow style="'+(on?'display:none':'')+'"><label style="font-size:12px;color:#9aa0ab;display:flex;align-items:center;gap:6px"><input type=checkbox id=ucBase'+(ucModel==='base'?' checked':'')+'> Better offline model (base, ~77 MB once)</label></div>'
    +'<div class=row><button class=ch id=ucGo style="background:#25f4ee;color:#000">🚀 Generate</button><button class=ch id=ucStop disabled>⏹ Stop</button><button class=ch id=ucClr>🧹 Clear</button></div>'
    +'<div id=ucSt style="font-size:12px;line-height:1.5;color:#9aa0ab;margin-top:4px"></div>';
  p.querySelector('#ucOn').onclick=()=>{ucEngine='online';try{localStorage.setItem(UC_ENG,'online')}catch(_){};ucPanel(p)};
  p.querySelector('#ucOff').onclick=()=>{ucEngine='offline';try{localStorage.setItem(UC_ENG,'offline')}catch(_){};ucPanel(p)};
  p.querySelector('#ucKeySv').onclick=()=>{
    const v=p.querySelector('#ucKeyIn').value.trim();
    if(!v)return msg('Paste a Groq API key first');
    try{localStorage.setItem(UC_KEY,v);msg('API key saved on this device')}catch(_){msg('Could not save key')}
    p.querySelector('#ucKeyIn').value='';ucStatus('Key saved. Tap Generate.');
  };
  p.querySelector('#ucBase').onchange=e=>{ucModel=e.target.checked?'base':'tiny';try{localStorage.setItem(UC_MODEL,ucModel)}catch(_){};ucAsr=null;ucStatus(ucModel==='base'?'Whisper Base will download (~77 MB) on first run.':'Using the built-in Whisper Tiny model.')};
  p.querySelector('#ucGo').onclick=()=>ucRun(p);
  p.querySelector('#ucStop').onclick=()=>{ucStopFlag=true;try{if(ucAbort)ucAbort.abort()}catch(_){};ucStatus('Stopping…')};
  p.querySelector('#ucClr').onclick=()=>{
    const n=texts.filter(t=>t.g==='uc').length;
    texts=texts.filter(t=>t.g!=='uc');
    if(sel&&sel.k==='t'&&sel.i>=texts.length)sel=null;
    render();dirty=true;ucStatus(n?('Removed '+n+' caption(s).'):'No auto captions to remove.');
  };
  ucStatus(on
    ?('Online: the audio is uploaded to Groq Whisper. '+(ucHasKey()?'Key saved ✓':'No key saved — free key at console.groq.com/keys'))
    :('Offline: on-device '+(ucModel==='base'?'Whisper Base':'Whisper Tiny')+'. No internet needed for transcription. Slower but private.'));
}

async function ucRun(p){
  if(ucBusy)return;
  if(!clips.length)return msg('Add a video first');
  const tot=total();
  if(tot<.5)return msg('Timeline is empty');
  let key='';
  if(ucEngine==='online'){
    try{key=localStorage.getItem(UC_KEY)||''}catch(_){}
    if(!key)return ucStatus('Enter a Groq API key above and tap Save key.');
  }
  ucBusy=true;ucStopFlag=false;
  try{ucAbort=new AbortController()}catch(_){ucAbort=null}
  const go=p.querySelector('#ucGo'),st=p.querySelector('#ucStop');
  if(go){go.disabled=true;go.textContent='⏳ Working…'}
  if(st)st.disabled=false;
  const t0=performance.now();
  try{
    const caps=ucEngine==='online'?await ucOnline(tot,key):await ucOffline(tot);
    if(ucStopFlag){ucStatus('Stopped.');return}
    const n=ucInsert(caps);
    render();dirty=true;
    ucStatus(n?(('✓ '+n+' caption(s) added in '+Math.round((performance.now()-t0)/1000)+'s. Edit or delete them with the Text tool.'))
              :'No speech detected. Try Online mode or a louder clip.');
  }catch(e){
    console.error('urdu captions failed',e);
    if(ucStopFlag)ucStatus('Stopped.');
    else ucStatus('⚠️ '+((e&&e.message)||e));
  }finally{
    ucBusy=false;ucAbort=null;
    if(ucDec){ucDec.close();ucDec=null}
    if(go){go.disabled=false;go.textContent='🚀 Generate'}
    if(st)st.disabled=true;
  }
}

function ucNewDecoder(){
  const ctx=new AudioContext(),cache=new Map();
  return{ctx,close:()=>{try{ctx.close()}catch(_){}},dec:async f=>{
    if(!f)return null;
    if(!cache.has(f))cache.set(f,ctx.decodeAudioData(await f.arrayBuffer()).catch(()=>null));
    return cache.get(f)}};
}
async function ucRenderRange(t0,t1,dec){
  const SR=16000,len=Math.max(1,Math.ceil((t1-t0)*SR));
  const oc=new OfflineAudioContext(1,len,SR);
  const put=(b,gain,when,off,dur)=>{
    try{
      const n=oc.createBufferSource(),g=oc.createGain();
      n.buffer=b;g.gain.value=gain;n.connect(g).connect(oc.destination);
      n.start(when,Math.max(0,Math.min(off,b.duration-.001)),Math.max(.01,Math.min(dur,b.duration-off)));
    }catch(_){}
  };
  let s0=0;
  for(const c of clips){
    const d=dur(c);
    const cs=Math.max(t0,s0),ce=Math.min(t1,s0+d);
    if(ce>cs&&!(c.rv||c.fz)&&c.vol>0){
      const b=await dec(c.s.file);
      if(b){
        const n=oc.createBufferSource(),g=oc.createGain();
        n.buffer=b;g.gain.value=c.vol;n.connect(g).connect(oc.destination);
        n.playbackRate.value=c.sp||1;
        const off=c.a+(cs-s0)*(c.sp||1), dd=(ce-cs)*(c.sp||1);
        const oo=Math.max(0,Math.min(off,b.duration-.001));
        const d2=Math.max(.01,Math.min(dd,b.duration-oo));
        try{n.start(cs-t0,oo,d2)}catch(_){}
      }
    }
    s0+=d;
  }
  for(const v of vos){
    if(!v.file)continue;
    const b=await dec(v.file);
    if(!b)continue;
    const vs=Math.max(0,v.s||0),ve=vs+b.duration;
    const cs=Math.max(t0,vs),ce=Math.min(t1,ve);
    if(ce>cs)put(b,1,cs-t0,cs-vs,ce-cs);
  }
  return oc.startRendering().then(r=>{
    const o=new Float32Array(r.length);o.set(r.getChannelData(0));return o;
  });
}
function ucFindCut(a,SR,fromS,toS){
  const step=Math.max(1,Math.round(SR*.05)),lo=Math.round(fromS*SR),hi=Math.min(a.length,Math.round(toS*SR));
  let best=null;
  for(let i=Math.max(0,lo);i+step<=hi;i+=step){
    let s=0;for(let k=0;k<step;k++){const v=a[i+k];s+=v*v}
    if(!best||s<best.s)best={i,s};
  }
  return best?best.i/SR:toS;
}
function ucWav(f32,SR){
  const n=f32.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
  const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){
    const s=Math.max(-1,Math.min(1,f32[i]));
    v.setInt16(44+i*2,s<0?s*32768:s*32767,true);
  }
  return new Blob([buf],{type:'audio/wav'});
}
function ucSplitLong(segs,max){
  max=max||42;
  const out=[];
  for(const s of segs){
    if(!s||!s.t)continue;
    const words=String(s.t).replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
    if(!words.length)continue;
    const lines=[];let cur='';
    for(const w of words){
      const c2=cur?cur+' '+w:w;
      if(c2.length>max&&cur){lines.push(cur);cur=w}else cur=c2;
    }
    if(cur)lines.push(cur);
    const dur2=Math.max(.8,(s.e||0)-(s.s||0)),totLen=lines.reduce((a,l)=>a+l.length,0)||1;
    let t=s.s||0;
    lines.forEach((l,i)=>{
      const d=dur2*(l.length/totLen),e=i===lines.length-1?(s.e||t+d):t+d;
      out.push({t:l,s:t,e:Math.max(e,t+.3)});t=e;
    });
  }
  return out;
}
function ucSegmentsFrom(j,off){
  const words=j&&j.words;
  if(Array.isArray(words)&&words.length){
    const g=[];let cur=null;
    for(const w of words){
      let s=w.word!=null?w.word:w.text;
      if(s==null)continue;
      s=String(s).trim();if(!s)continue;
      const ws=(+w.start||0)+off,we=(w.end!=null?+w.end:ws-off+.3)+off;
      if(!cur){cur={t:s,s:ws,e:we}}
      else{
        const line=cur.t+' '+s;
        if(ws-cur.e>.8||line.length>42){g.push(cur);cur={t:s,s:ws,e:we}}
        else{cur.t=line;cur.e=we}
      }
    }
    if(cur)g.push(cur);
    return g;
  }
  const segs=(j&&j.segments)||[];
  return ucSplitLong(segs.map(s=>({t:String(s.text||'').trim(),s:(+s.start||0)+off,e:(+s.end||0)+off})));
}
function ucMerge(caps){
  const lim=total();
  const o=caps.filter(c=>c&&c.t&&c.e>c.s).sort((a,b)=>a.s-b.s);
  for(let i=0;i<o.length;i++){
    o[i].s=Math.max(0,o[i].s);o[i].e=Math.min(lim,o[i].e);
    if(i&&o[i].s<o[i-1].e)o[i-1].e=Math.max(o[i-1].s+.3,o[i].s-.02);
  }
  return o.filter(c=>c.e-c.s>=.25);
}
function ucInsert(caps){
  const lim=total();let n=0;
  for(const c of caps){
    const t=(c.t||'').trim();if(!t)continue;
    const s=Math.min(Math.max(0,c.s),Math.max(0,lim-.3)),e=Math.min(lim,Math.max(s+.3,c.e));
    if(e-s<.2)continue;
    texts.push({t,s,e:Math.max(e,s+.4),c:'#ffffff',z:44,rtl:/[\u0600-\u06FF]/.test(t)?1:0,bg:'rgba(0,0,0,.55)',sw:0,py:.86,g:'uc'});
    if(++n>=3000)break;
  }
  return n;
}
async function ucGroqChunk(blob,key){
  const fd=new FormData();
  fd.append('file',blob,'audio.wav');
  fd.append('model','whisper-large-v3-turbo');
  fd.append('language','ur');
  fd.append('response_format','verbose_json');
  fd.append('temperature','0');
  fd.append('timestamp_granularities[]','word');
  let last=null;
  for(let attempt=0;attempt<3;attempt++){
    if(ucStopFlag)throw new Error('Stopped');
    let r=null;
    try{
      r=await fetch('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body:fd,signal:ucAbort?ucAbort.signal:undefined});
    }catch(e){
      if(ucStopFlag)throw new Error('Stopped');
      throw new Error('Network error — internet connection check karein ('+(e.message||e)+')');
    }
    if(r.ok)return await r.json();
    let detail='';try{const j=await r.json();detail=(j.error&&(j.error.message||j.error.code))||''}catch(_){}
    if(r.status===401||r.status===403)throw new Error('Groq API key is invalid ('+r.status+'). Save a valid key.');
    if(r.status===413)throw new Error('Audio chunk too large for Groq (413).');
    if(r.status===429){
      last=new Error('Groq rate limit (429). Try again in a minute.');
      const ra=+(r.headers.get('retry-after')||0);
      await new Promise(res=>setTimeout(res,(ra||3*(attempt+1))*1000));
      continue;
    }
    throw new Error('Groq error '+r.status+(detail?' — '+detail:''));
  }
  throw last||new Error('Groq request failed');
}
async function ucOnline(tot,key){
  ucDec=ucNewDecoder();
  const SR=16000,CH=480,PAD=12;
  let at=0,caps=[],part=0;
  while(at<tot-.2&&!ucStopFlag){
    const hard=Math.min(tot,at+CH);
    const rendEnd=Math.min(tot,hard+PAD);
    ucStatus('Rendering audio… '+Math.round(at)+'s / '+Math.round(tot)+'s');
    let a=await ucRenderRange(at,rendEnd,ucDec.dec);
    let end=hard;
    if(hard<tot-1){
      const cut=ucFindCut(a,SR,CH-4,Math.min(CH+9,(rendEnd-at)-.2));
      const lim=Math.max(1,Math.min(a.length,Math.floor(cut*SR)));
      a=a.subarray(0,lim);end=at+a.length/SR;
    }
    const durChunk=a.length/SR;
    if(durChunk<.3)break;
    ucStatus('Uploading '+Math.round(durChunk)+'s of audio (part '+(part+1)+')…');
    const j=await ucGroqChunk(ucWav(a,SR),key);
    caps.push(...ucSegmentsFrom(j,at));
    at+=durChunk;part++;
    if(at<tot-.2)await new Promise(r=>setTimeout(r,500));
  }
  return ucMerge(caps);
}

async function ucLoadTF(){
  if(ucTF)return ucTF;
  ucStatus('Loading offline engine…');
  const T=await import('./runtime/transformers.min.js');
  T.env.allowLocalModels=true;
  T.env.allowRemoteModels=false;
  T.env.localModelPath=new URL('./models/',location.href).href;
  T.env.backends.onnx.wasm.wasmPaths={
    mjs:new URL('./runtime/ort/ort-wasm.js',location.href).href,
    wasm:new URL('./runtime/ort/ort-wasm.wasm',location.href).href
  };
  T.env.backends.onnx.wasm.numThreads=1;
  ucTF=T;return T;
}
async function ucLoadAsr(){
  if(ucAsr)return ucAsr;
  const T=await ucLoadTF();
  const base=ucModel==='base';
  T.env.allowLocalModels=!base;
  T.env.allowRemoteModels=base;
  const name=base?'onnx-community/whisper-base':'whisper-tiny';
  ucStatus(base?'Downloading model files (~77 MB, one time)…':'Loading built-in Whisper Tiny…');
  let lastPct=-1;
  ucAsr=await T.pipeline('automatic-speech-recognition',name,{dtype:'q8',device:'wasm',progress_callback:p=>{
    if(base&&p&&p.status==='progress'&&p.file&&p.total){
      const pct=Math.round(100*p.loaded/p.total);
      if(pct!==lastPct){lastPct=pct;ucStatus('Downloading '+p.file+' — '+pct+'%')}
    }
  }});
  return ucAsr;
}
async function ucOffline(tot){
  const asr=await ucLoadAsr();
  ucDec=ucNewDecoder();
  const SEG=300;let caps=[];
  for(let at=0;at<tot-.2&&!ucStopFlag;at+=SEG){
    const end=Math.min(tot,at+SEG);
    ucStatus('Offline transcribing… '+Math.round(at)+'s / '+Math.round(tot)+'s (slow)');
    const a=await ucRenderRange(at,end,ucDec.dec);
    const out=await asr(a,{language:'ur',task:'transcribe',return_timestamps:true,chunk_length_s:30,stride_length_s:5});
    const chunks=(out&&out.chunks)||[];
    if(chunks.length){
      caps.push(...ucSplitLong(chunks.map(c=>({t:String(c.text||'').trim(),s:at+((c.timestamp&&c.timestamp[0])||0),e:at+((c.timestamp&&c.timestamp[1])||((c.timestamp&&c.timestamp[0])||0)+3)}))));
    }else if(out&&out.text){
      caps.push(...ucSplitLong([{t:out.text.trim(),s:at,e:end}]));
    }
    if(!ucStopFlag&&end<tot-.2)await new Promise(r=>setTimeout(r,0));
  }
  return ucMerge(caps);
}
/* ===== end Urdu captions ===== */

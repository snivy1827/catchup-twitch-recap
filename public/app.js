const $=id=>document.getElementById(id);const viewer=document.body.dataset.viewer==='true';
const time=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const set=(id,value)=>{if($(id))$(id).textContent=value;};
let last='';
async function api(url,body){const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d;}
function renderRecap(r){
 set('mode',r.mode==='offline'?'OFFLINE · SCRIPTED FIXTURE':'LIVE · VISUAL RECAP');set('current',r.state);set('updated',`Observed through ${time(r.analyzedUntil)} · ${r.events.length} recorded events`);
 if(viewer)set('notice',r.mode==='offline'?'Demonstration uses synthetic artwork and scripted observations. No AI analysis.':'Sampled visual observations. Audio is not analyzed in v0.1.');
 set('gap-note',`${r.gaps.length} sampling/analysis gaps recorded.`);
 const key=JSON.stringify(r);if(key===last)return;last=key;
 const cards=$('cards');cards.replaceChildren();
 for(const e of r.events.slice(-3).reverse()){
   const c=document.createElement('article');c.className='card';const f=r.frames.find(f=>e.evidenceFrameIds.includes(f.id));
   if(f && /^data:image\/(jpeg|png|svg\+xml);base64,/.test(f.image)){const img=document.createElement('img');img.src=f.image;img.alt=`Evidence at ${time(f.sec)}`;c.append(img);}
   const t=document.createElement('time');t.textContent=time(e.endSec);const h=document.createElement('h3');h.textContent=e.summary;const p=document.createElement('p');p.textContent=e.uncertainty||'Supported by sampled frames; intervening action may be missing.';c.append(t,h,p);cards.append(c);
 }
 const chapters=$('chapters');chapters.replaceChildren();
 if(!r.chapters.length){const p=document.createElement('p');p.className='muted';p.textContent='A chapter is saved every ten observed minutes. Recent events appear above.';chapters.append(p);}
 for(const c of r.chapters){const d=document.createElement('div');d.className='chapter';const t=document.createElement('time');t.textContent=`${time(c.startSec)} — ${time(c.endSec)}`;const p=document.createElement('span');p.textContent=c.summary;d.append(t,p);chapters.append(d);}
 if($('timeline')){$('timeline').replaceChildren();for(const e of r.events){const p=document.createElement('p');p.textContent=`${time(e.endSec)} · ${e.summary}`;$('timeline').append(p);}}
}
async function refresh(){try{renderRecap(await api('/api/recap'));if(!viewer){const s=await api('/api/status');set('status',s.status[0].toUpperCase()+s.status.slice(1));set('clock',`${time(s.elapsed)} elapsed`);set('cost',`$${s.spent.toFixed(4)}`);set('limit',`/ $${s.budget.toFixed(2)}`);set('calls',s.calls);set('gaps',s.gaps);$('budget').max=s.budget||1;$('budget').value=s.spent+s.reserved;set('connection',s.mode==='offline'?'Local demo · no API spend':s.busy?'AI is analyzing…':'Visual sampling enabled when running');set('live-status',`OBS: ${s.connections.obs}\nAI: ${s.connections.ai}\nTwitch: ${s.connections.twitch}`);$('live-status').style.whiteSpace='pre-line';set('errors',s.errors.map(e=>`${e.at} ${e.message}`).join('\n')||'No errors.');$('step').disabled=s.mode!=='offline';}}catch(e){set('notice',e.message);}}
function click(id,fn){if($(id))$(id).onclick=async()=>{const b=$(id);b.disabled=true;try{await fn();await refresh();}catch(e){set('notice',e.message);}finally{b.disabled=false;}};}
if(!viewer){
 for(const action of ['start','pause','end','step'])click(action,()=>api('/api/action',{action}));
 click('new',()=>api('/api/action',{action:'new',mode:$('new-mode').value}));
 click('simulate',async()=>{const r=await api('/api/simulate',{id:crypto.randomUUID(),user:'demo-viewer'});set('reply',r.message||'Cooldown active. No extra AI call or chat message.');});
 click('obs',async()=>{const r=await api('/api/obs',{});$('sources').replaceChildren();for(const source of r.sources){const o=document.createElement('option');o.value=source;o.textContent=source;$('sources').append(o);}});
 click('source',()=>api('/api/source',{source:$('sources').value}));click('twitch',()=>api('/api/twitch',{}));
 let zh=false;$('language').onclick=()=>{zh=!zh;document.querySelectorAll('[data-zh]').forEach(e=>{e.dataset.en??=e.textContent;e.textContent=zh?e.dataset.zh:e.dataset.en;});};
}
refresh();setInterval(refresh,2000);

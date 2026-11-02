import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { fresh, Gate, applyObservation, publicRecap, chatText, reserve } from './core.mjs';
import { fixtureFrame, fixtureObservation } from './fixture.mjs';
import { OBS } from './obs.mjs';
import { analyze } from './vision.mjs';
import { Twitch } from './twitch.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=process.env.CATCHUP_DATA_DIR || path.join(root,'data');fs.mkdirSync(dataDir,{recursive:true});
const stateFile=path.join(dataDir,'session.json');
const env=process.env;const port=Number(env.PORT||3000);
const numeric=(k,d)=>{const n=Number(env[k]??d);if(!Number.isFinite(n)||n<0)throw Error(`Invalid ${k}`);return n;};
const budget=numeric('SESSION_BUDGET_USD',1), inputPrice=numeric('INPUT_USD_PER_MILLION',.75),outputPrice=numeric('OUTPUT_USD_PER_MILLION',4.5), delay=numeric('PUBLISH_DELAY_SECONDS',30);
const publicUrl=env.PUBLIC_RECAP_URL||'';
if(publicUrl && (!/^https:\/\//.test(publicUrl)||publicUrl.length>180)) throw Error('PUBLIC_RECAP_URL must be HTTPS and <=180 characters');
let s=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):fresh(env.MODE==='live'?'live':'offline');
s.status='paused';s.spent+=s.reserved;s.reserved=0;
const save=()=>{fs.writeFileSync(stateFile+'.tmp',JSON.stringify(s));fs.renameSync(stateFile+'.tmp',stateFile);};save();
const cookie=randomBytes(32).toString('hex');let gate=new Gate(),simGate=new Gate(),batch=[],busy=false,captureBusy=false,lastCapture=0,oauthState=null;
let connections={obs:'Not connected',ai:'Not tested',twitch:'Not connected'};
const obs=new OBS(env.OBS_URL||'ws://127.0.0.1:4455',env.OBS_PASSWORD||'');let source=env.OBS_SOURCE||'';
let twitch;
const error=e=>{s.errors.push({at:new Date().toISOString(),message:e.message});s.errors=s.errors.slice(-20);save();};
const recap=()=>publicRecap(s,delay);
const command=(id,user)=>gate.accept(id,user)?chatText(recap(),publicUrl):null;
const tokenFile=path.join(dataDir,'twitch-private.json');
const storeToken=async cfg=>fs.writeFileSync(tokenFile,JSON.stringify({token:cfg.token,refreshToken:cfg.refreshToken}),{mode:0o600});
async function connectTwitch(tokens) {
  twitch?.stop();twitch=new Twitch({clientId:env.TWITCH_CLIENT_ID,secret:env.TWITCH_CLIENT_SECRET,...tokens},command,status=>{connections.twitch=status;},storeToken);
  await twitch.start();
}
function advanceFixture() {
  s.elapsed+=60;const f=fixtureFrame(s.fixtureStep,s.elapsed);
  applyObservation(s,fixtureObservation(s.fixtureStep,[f]),[f]);s.fixtureStep++;save();
}
async function analyzeBatch(frames) {
  if(busy) return;busy=true;
  const amount=((frames.length*3000+4000)*inputPrice+1200*outputPrice)/1e6;
  try {
    if(!env.OPENAI_API_KEY) throw Error('Set OPENAI_API_KEY in .env before starting live analysis');
    if(!reserve(s,budget,amount)) {s.status='paused';throw Error('Budget reached. New analysis paused. Existing recap remains available.');}
    s.calls++;save();
    let result;
    try {result=await analyze(frames,s.state,{key:env.OPENAI_API_KEY,model:env.OPENAI_MODEL||'gpt-5.4-mini'});}
    catch(e) {s.reserved-=amount;s.spent+=amount;throw e;}
    s.reserved-=amount;
    const u=result.usage;
    s.spent+=u && Number.isFinite(u.input_tokens)&&Number.isFinite(u.output_tokens)?(u.input_tokens*inputPrice+u.output_tokens*outputPrice)/1e6:amount;
    fs.appendFileSync(path.join(dataDir,'usage.jsonl'),JSON.stringify({at:new Date().toISOString(),sessionId:s.id,model:env.OPENAI_MODEL||'gpt-5.4-mini',usage:u??null,estimatedIfMissing:!u})+'\n');save();
    if(result.status!=='completed') throw Error('AI output incomplete; usage was charged');
    if(s.status==='running') applyObservation(s,JSON.parse(result.text),frames);
    connections.ai='Analyzed successfully';
  } catch(e) {connections.ai=e.message;s.gaps.push({startSec:frames[0].sec,endSec:frames.at(-1).sec,reason:'Analysis unavailable'});error(e);if([401,403,429].includes(e.status))s.status='paused';}
  finally {busy=false;save();}
}
async function tick() {
  if(s.status!=='running')return;
  if(s.mode==='offline') {if(Date.now()-lastCapture>=3000){lastCapture=Date.now();advanceFixture();}return;}
  s.elapsed=Math.floor((Date.now()-s.startedAt)/1000);
  if(Date.now()-lastCapture<10000||captureBusy)return;
  lastCapture=Date.now();
  if(busy) {s.gaps.push({startSec:s.elapsed-10,endSec:s.elapsed,reason:'Analyzer busy; sample skipped'});save();return;}
  captureBusy=true;
  try {batch.push(await obs.capture(source,s.elapsed));connections.obs='Connected';if(batch.length>=6){const frames=batch;batch=[];void analyzeBatch(frames);}}
  catch(e){connections.obs=e.message;s.gaps.push({startSec:s.elapsed-10,endSec:s.elapsed,reason:'Capture unavailable'});error(e);}
  finally {captureBusy=false;save();}
}
const timer=setInterval(()=>void tick().catch(error),1000);timer.unref();
const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req){let b='';for await(const chunk of req){b+=chunk;if(b.length>16000)throw Error('Request too large');}return b?JSON.parse(b):{};}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
  const host=req.headers.host;
  if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(host))return json(res,{error:'Invalid host'},403);
  const url=new URL(req.url,`http://${host}`);
  try {
    if(req.method==='POST') {
      if(req.headers.origin!==`http://${host}`||!req.headers.cookie?.split('; ').includes(`catchup=${cookie}`))return json(res,{error:'Local authorization required'},403);
      const b=await body(req);
      if(url.pathname==='/api/action') {
        if(b.action==='new') {if(busy||captureBusy)throw Error('Wait for the in-flight task');fs.writeFileSync(path.join(dataDir,`archive-${s.id}.json`),JSON.stringify(s));s=fresh(b.mode==='live'?'live':'offline');gate=new Gate();simGate=new Gate();batch=[];}
        else if(b.action==='start') {if(s.mode==='live'&&(!env.OPENAI_API_KEY||!source))throw Error('Configure OPENAI_API_KEY and select an OBS source first');s.status='running';s.startedAt=Date.now()-s.elapsed*1000;lastCapture=0;}
        else if(b.action==='pause'||b.action==='end'){s.status=b.action==='end'?'ended':'paused';batch=[];}
        else if(b.action==='step'){if(s.mode!=='offline')throw Error('Only available in offline mode');advanceFixture();}
        else throw Error('Unknown action');save();return json(res,{ok:true});
      }
      if(url.pathname==='/api/simulate')return json(res,{message:simGate.accept(String(b.id||randomBytes(8).toString('hex')),String(b.user||'demo-viewer'))?chatText(recap(),publicUrl):null});
      if(url.pathname==='/api/obs') {const sources=await obs.sources();connections.obs='Connected';return json(res,{sources});}
      if(url.pathname==='/api/source'){if(s.status==='running')throw Error('Pause before changing source');if(typeof b.source!=='string'||b.source.length>200)throw Error('Invalid source');source=b.source;return json(res,{ok:true});}
      if(url.pathname==='/api/twitch') {if(!fs.existsSync(tokenFile))throw Error('Use Connect Twitch to authorize first');await connectTwitch(JSON.parse(fs.readFileSync(tokenFile,'utf8')));return json(res,{ok:true});}
      return json(res,{error:'Not found'},404);
    }
    if(req.method!=='GET')return json(res,{error:'Method not allowed'},405);
    if(url.pathname==='/auth/twitch') {
      if(!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET)throw Error('Set Twitch Client ID and Client Secret in .env');
      oauthState={value:randomBytes(32).toString('hex'),until:Date.now()+300000};
      const auth=new URL('https://id.twitch.tv/oauth2/authorize');auth.search=new URLSearchParams({client_id:env.TWITCH_CLIENT_ID,redirect_uri:env.TWITCH_REDIRECT_URI||'http://localhost:3000/auth/twitch/callback',response_type:'code',scope:'user:read:chat user:write:chat',state:oauthState.value}).toString();
      res.writeHead(302,{Location:auth.href,'Set-Cookie':`catchup=${cookie}; HttpOnly; SameSite=Lax; Path=/`});return res.end();
    }
    if(url.pathname==='/auth/twitch/callback') {
      if(!oauthState||oauthState.until<Date.now()||url.searchParams.get('state')!==oauthState.value||!req.headers.cookie?.includes(`catchup=${cookie}`))throw Error('OAuth state expired or invalid');oauthState=null;
      if(!url.searchParams.get('code'))throw Error('Twitch authorization declined');
      const r=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',signal:AbortSignal.timeout(10000),body:new URLSearchParams({client_id:env.TWITCH_CLIENT_ID,client_secret:env.TWITCH_CLIENT_SECRET,code:url.searchParams.get('code'),grant_type:'authorization_code',redirect_uri:env.TWITCH_REDIRECT_URI||'http://localhost:3000/auth/twitch/callback'})});
      if(!r.ok)throw Error(`OAuth exchange HTTP ${r.status}`);
      const t=await r.json();const tokens={token:t.access_token,refreshToken:t.refresh_token};await storeToken(tokens);await connectTwitch(tokens);res.writeHead(302,{Location:'/'});return res.end();
    }
    if(url.pathname==='/api/recap')return json(res,recap());
    if(url.pathname==='/api/status')return json(res,{mode:s.mode,status:s.status,elapsed:s.elapsed,calls:s.calls,spent:s.spent,reserved:s.reserved,budget,busy,source,connections,errors:s.errors,gaps:s.gaps.length});
    if(url.pathname==='/api/export')return json(res,recap());
    const files={'/':'index.html','/recap':'recap.html','/app.js':'app.js','/style.css':'style.css'};
    const file=files[url.pathname];if(!file)return json(res,{error:'Not found'},404);
    if(file==='index.html')res.setHeader('Set-Cookie',`catchup=${cookie}; HttpOnly; SameSite=Lax; Path=/`);
    res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(root,'public',file)));
  } catch(e) {error(e);json(res,{error:e.message},400);}
});
server.listen(port,'127.0.0.1',()=>console.log(`CatchUp ready: http://localhost:${port} (local only; ${s.mode})`));
function stop(){s.status='paused';save();twitch?.stop();obs.close();server.close();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);

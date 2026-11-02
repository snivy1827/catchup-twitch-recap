import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OBS} from '../src/obs.mjs';
import {Twitch} from '../src/twitch.mjs';
const hash=s=>createHash('sha256').update(s).digest('base64');
test('OBS adapter authenticates with challenge and captures selected scaled source (mock protocol)',async()=>{
 const original=globalThis.WebSocket;let requests=[];
 class FakeWS{
  constructor(){queueMicrotask(()=>this.onmessage({data:JSON.stringify({op:0,d:{authentication:{salt:'salt',challenge:'challenge'}}})}));}
  send(raw){const m=JSON.parse(raw);requests.push(m);if(m.op===1){assert.equal(m.d.authentication,hash(hash('passwordsalt')+'challenge'));queueMicrotask(()=>this.onmessage({data:JSON.stringify({op:2,d:{}})}));}
   if(m.op===6)queueMicrotask(()=>this.onmessage({data:JSON.stringify({op:7,d:{requestId:m.d.requestId,requestStatus:{result:true},responseData:m.d.requestType==='GetInputList'?{inputs:[{inputName:'Game'}]}:{imageData:'data:image/jpg;base64,AA=='}}})}));}
  close(){this.onclose?.();}
 }
 globalThis.WebSocket=FakeWS;const obs=new OBS('ws://127.0.0.1:4455','password');
 try{assert.deepEqual(await obs.sources(),['Game']);const f=await obs.capture('Game',10);assert.equal(f.sec,10);assert.match(f.image,/^data:image\/jpeg;/);assert.equal(requests.at(-1).d.requestData.imageWidth,960);assert.equal(requests.at(-1).d.requestData.sourceName,'Game');}
 finally{obs.close();globalThis.WebSocket=original;}
});
test('Twitch adapter validates scopes, subscribes and checks chat send failure (mock services)',async()=>{
 const originalWS=globalThis.WebSocket,originalFetch=globalThis.fetch;const calls=[],statuses=[];let ws;
 globalThis.WebSocket=class {constructor(){ws=this;}close(){this.onclose?.();}};
 globalThis.fetch=async(url,opts)=>{
  calls.push({url,opts});if(url.includes('/validate'))return {ok:true,json:async()=>({client_id:'client',user_id:'123',scopes:['user:read:chat','user:write:chat']})};
  return {ok:true,json:async()=>url.endsWith('/chat/messages')?{data:[{is_sent:false,drop_reason:{code:'automod_held'}}]}:{data:[{status:'enabled'}]}};
 };
 const twitch=new Twitch({clientId:'client',token:'fake'},async()=> 'Cached recap',s=>statuses.push(s),async()=>{});
 try{
  await twitch.start();await ws.onmessage({data:JSON.stringify({metadata:{message_type:'session_welcome'},payload:{session:{id:'session',keepalive_timeout_seconds:10}}})});
  const sub=JSON.parse(calls.at(-1).opts.body);assert.equal(sub.transport.method,'websocket');assert.equal(sub.condition.user_id,'123');assert.ok(statuses.includes('Connected'));
  await ws.onmessage({data:JSON.stringify({metadata:{message_type:'notification',message_id:'delivery'},payload:{event:{chatter_user_id:'viewer',message:{text:'!recap'}}}})});
  assert.match(statuses.at(-1),/automod_held/);assert.equal(JSON.parse(calls.at(-1).opts.body).message,'Cached recap');assert.equal(twitch.stats.failed,1);assert.equal(twitch.stats.sent,0);
 }finally{twitch.stop();globalThis.WebSocket=originalWS;globalThis.fetch=originalFetch;}
});

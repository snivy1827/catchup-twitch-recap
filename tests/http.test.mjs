import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('offline HTTP workflow, CSRF boundary, cooldown, export and restart persistence',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'catchup-test-'));const port=31347;const base=`http://localhost:${port}`;
 let proc;const start=async()=>{
   proc=spawn(process.execPath,['src/server.mjs'],{env:{...process.env,PORT:String(port),MODE:'offline',CATCHUP_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
   await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server start timeout')),8000);proc.stdout.once('data',()=>{clearTimeout(timeout);resolve();});proc.once('exit',code=>{clearTimeout(timeout);reject(Error(`Server exited ${code}`));});});
 };
 const stop=async()=>{const p=proc;await new Promise(resolve=>{p.once('exit',resolve);p.kill();});proc=null;};
 try{
   await start();const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/CatchUp/);const cookie=page.headers.get('set-cookie').split(';')[0];
   const post=(url,b,origin=base)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(b)});
   assert.equal((await post('/api/action',{action:'step'},'https://evil.example')).status,403);
   assert.equal((await post('/api/action',{action:'step'})).status,200);
   const r=await(await fetch(base+'/api/recap')).json();assert.equal(r.events.length,1);assert.equal(r.analyzedUntil,60);assert.match(r.frames[0].image,/data:image/);
   const reply=await(await post('/api/simulate',{id:'a',user:'viewer'})).json();assert.match(reply.message,/CatchUp/);
   assert.equal((await(await post('/api/simulate',{id:'b',user:'viewer'})).json()).message,null);
   assert.equal((await(await fetch(base+'/api/status')).json()).calls,0);
   assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/src/server.mjs')).status,404);
   const exported=await(await fetch(base+'/api/export')).json();assert.equal(exported.events.length,1);assert.ok(!('spent'in exported));
   await stop();await start();assert.equal((await(await fetch(base+'/api/recap')).json()).events.length,1);
 }finally{if(proc)await stop();await rm(dir,{recursive:true,force:true});}
});

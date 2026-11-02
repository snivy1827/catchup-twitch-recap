import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh, Gate, reserve, applyObservation, publicRecap, chatText} from '../src/core.mjs';
import {fixtureFrame,fixtureObservation} from '../src/fixture.mjs';
import {analyze} from '../src/vision.mjs';
test('duplicate delivery, global cooldown and per-viewer cooldown are independent',()=>{
 const g=new Gate();assert.equal(g.accept('1','a',0),true);assert.equal(g.accept('1','a',130000),false);
 assert.equal(g.accept('2','b',10000),false);assert.equal(g.accept('3','a',61000),false);
 assert.equal(g.accept('4','b',61000),true);assert.equal(g.accept('5','a',121000),true);
});
test('budget refuses concurrent overspend and survives JSON persistence',()=>{
 const s=fresh();assert.equal(reserve(s,1,.6),true);assert.equal(reserve(s,1,.5),false);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(reserve(restored,1,.5),false);
 assert.equal(reserve(restored,1,NaN),false);
});
test('unseen evidence is rejected without committing events',()=>{
 const s=fresh();const f=fixtureFrame(0,60);const o=fixtureObservation(0,[f]);o.events[0].evidenceFrameIds=['invented'];
 assert.throws(()=>applyObservation(s,o,[f]),/evidence/);assert.equal(s.events.length,0);
});
test('delay suppresses future events and images, chapters retain earlier events',()=>{
 const s=fresh('live');s.elapsed=620;
 for(let i=0;i<10;i++){const f=fixtureFrame(i,(i+1)*60);applyObservation(s,fixtureObservation(i,[f]),[f]);}
 const r=publicRecap(s,30);assert.equal(r.events.length,9);assert.equal(r.frames.length,9);assert.equal(r.chapters.length,0);
 assert.equal(s.chapters.length,1);assert.equal(s.events.length,10);assert.ok(chatText(r,'https://example.org/recap').length<=350);
});
test('vision sends ordered real images with strict schema and returns chargeable incomplete response',async()=>{
 const frames=[{id:'a',sec:10,image:'data:image/jpeg;base64,AA=='},{id:'b',sec:20,image:'data:image/jpeg;base64,BB=='}];
 const result=await analyze(frames,'Before',{key:'test-key',model:'gpt-5.4-mini'},async(url,opts)=>{
   assert.equal(url,'https://api.openai.com/v1/responses');const b=JSON.parse(opts.body);
   assert.equal(b.text.format.strict,true);assert.equal(b.store,false);assert.deepEqual(b.input[0].content.filter(c=>c.type==='input_image').map(c=>c.image_url),frames.map(f=>f.image));
   return {ok:true,json:async()=>({status:'incomplete',usage:{input_tokens:100,output_tokens:12},output:[]})};
 });assert.equal(result.status,'incomplete');assert.equal(result.usage.input_tokens,100);
});

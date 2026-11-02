// One explicitly requested live verification. No streaming or recording starts.
import fs from 'node:fs';
import { OBS } from '../src/obs.mjs';
import { analyze } from '../src/vision.mjs';
import { validateObservation } from '../src/core.mjs';
const e=process.env;
if(!e.OPENAI_API_KEY)throw Error('OPENAI_API_KEY is missing');
const source=e.OBS_SOURCE||'CatchUp TapTapLoot';
const dir='data/live-check';fs.mkdirSync(dir,{recursive:true});
const id=new Date().toISOString().replaceAll(':','-');
const reportFile=`${dir}/verification-${id}.json`;
const report={at:new Date().toISOString(),source,model:e.OPENAI_MODEL||'gpt-5.4-mini',status:'capturing',audioAnalyzed:false,sampleIntervalSeconds:2,frameCount:3};
const save=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
const obs=new OBS(e.OBS_URL||'ws://127.0.0.1:4455',e.OBS_PASSWORD);
try{
 const frames=[];
 for(let i=0;i<3;i++){
  if(i)await new Promise(r=>setTimeout(r,2000));
  const f=await obs.capture(source,i*2);frames.push(f);
  fs.writeFileSync(`${dir}/sample-${i}.jpg`,Buffer.from(f.image.split(',')[1],'base64'));
 }
 const inputPrice=Number(e.INPUT_USD_PER_MILLION||.75),outputPrice=Number(e.OUTPUT_USD_PER_MILLION||4.5);
 const estimate=((frames.length*3000+4000)*inputPrice+1200*outputPrice)/1e6;
 if(!Number.isFinite(estimate)||estimate<=0||estimate>Math.min(.05,Number(e.SESSION_BUDGET_USD||1)))throw Error('Verification exceeds its $0.05 maximum estimate');
 report.reservedEstimateUSD=estimate;report.status='requesting';save();
 console.log(`Captured 3 TapTapLoot frames; one AI request, reserved estimate $${estimate.toFixed(4)}.`);
 const r=await analyze(frames,'First observation. No microphone/audio is provided. Only summarize visible game state; do not invent prior progress.',{key:e.OPENAI_API_KEY,model:report.model});
 report.usage=r.usage||null;report.estimatedCostUSD=r.usage?(r.usage.input_tokens*inputPrice+r.usage.output_tokens*outputPrice)/1e6:estimate;report.responseStatus=r.status;save();
 if(r.status!=='completed')throw Error('AI response incomplete; see report for billed usage');
 report.observation=validateObservation(JSON.parse(r.text),frames);report.status='success';save();
 fs.writeFileSync(`${dir}/latest.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}catch(err){report.status='failed';report.error=err.message;save();console.error(err.message);process.exitCode=1;}
finally{obs.close();}

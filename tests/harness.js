import {closeDriver} from './driver.js';
const cases=[];
export function test(name,run) { cases.push({name,run}); }
export function assert(value,message='assertion failed') { if (!value) throw new Error(message); }
export function equal(actual,expected) { if(JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error(`expected ${JSON.stringify(expected)} received ${JSON.stringify(actual)}`); }
export const params=new URLSearchParams(location.search);
async function main() {
  const results=[];
  for(const path of params.getAll('module')) {
    try { await import(path); } catch(error) { results.push({name:path,ok:false,error:String(error.stack||error)}); }
  }
  for(const {name,run} of cases) {
    const started=performance.now();
    try { const detail=await run();results.push({name,ok:true,...(detail===undefined?{}:{detail})}); } catch(error) { results.push({name,ok:false,error:String(error.stack||error)}); }
    results.at(-1).durationMs=Math.round(performance.now()-started);
  }
  if(!results.length) results.push({name:'harness.empty',ok:false,error:'No tests registered'});
  closeDriver();
  const report={ok:results.every(r=>r.ok),passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,results};
  document.querySelector('#results').textContent=JSON.stringify(report);
  await fetch(params.get('result'),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(report)});
}
main();

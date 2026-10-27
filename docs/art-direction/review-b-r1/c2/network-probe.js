import {params} from '/tests/harness.js';
const info=await(await fetch(params.get('driver'))).json(),socket=new WebSocket(info.url),urls=new Map(),failures=[];
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
await new Promise(resolve=>{socket.onmessage=event=>{const r=JSON.parse(event.data);if(r.method==='Network.requestWillBeSent')urls.set(r.params.requestId,r.params.request.url);if(r.method==='Network.loadingFailed')failures.push({...r.params,url:urls.get(r.params.requestId)});if(r.id===1)resolve();};socket.send(JSON.stringify({id:1,method:'Network.enable'}));});
const fetcher=globalThis.fetch;
globalThis.fetch=(url,options)=>{if(String(url)===params.get('result')&&options?.method==='POST'){const report=JSON.parse(options.body);report.networkFailures=failures;options={...options,body:JSON.stringify(report)};socket.close();}return fetcher(url,options);};

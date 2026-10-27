import {params} from '/tests/harness.js';
const fetcher=globalThis.fetch;
globalThis.fetch=(url,options)=>{
 if(String(url)===params.get('result')&&options?.method==='POST'){
  const report=JSON.parse(options.body);report.originalResultBytes=new TextEncoder().encode(options.body).length;report.screenshotBytes=[];
  for(const result of report.results){if(result.detail?.screenshot){report.screenshotBytes.push({name:result.name,base64Length:result.detail.screenshot.length});delete result.detail.screenshot;}}
  return fetcher(url,{...options,body:JSON.stringify(report)});
 }
 return fetcher(url,options);
};

/** Bounded local diagnostics. Export is explicit; no transport/upload is created. */
export class CrashReporter {
 constructor({window,context,screenshot,limit}){
  if(!Number.isInteger(limit)||limit<1)throw new Error('crash.limit.invalid');Object.assign(this,{context,screenshot,limit});this.reports=[];this.controller=new AbortController();
  window?.addEventListener('error',event=>void this.capture(event.error??new Error(event.message)),{signal:this.controller.signal});
  window?.addEventListener('unhandledrejection',event=>void this.capture(event.reason),{signal:this.controller.signal});
 }
 async capture(error){
  const report={version:1,error:{name:String(error?.name??'Error'),message:String(error?.message??error),stack:String(error?.stack??'')},context:{available:false,code:'crash.context.unavailable'},screenshot:{available:false,code:'crash.screenshot.unavailable'}};
  try{report.context={...JSON.parse(JSON.stringify(await this.context())),available:true};}catch{}
  try{const data=await this.screenshot?.();if(typeof data==='string'&&data.startsWith('data:image/png;base64,'))report.screenshot={available:true,data};}catch{}
  this.reports.push(report);if(this.reports.length>this.limit)this.reports.shift();return report;
 }
 get latest(){return this.reports.at(-1)??null;}
 exportLatest(){return JSON.stringify(this.latest,null,2);}
 dispose(){this.controller.abort();}
}

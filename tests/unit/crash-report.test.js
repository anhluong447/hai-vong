import {test,assert,equal} from '/tests/harness.js';
test('a failed screenshot keeps the original crash snapshot trace and fingerprint in an explicit local package',async()=>{
 const {CrashReporter}=await import('/src/infrastructure/browser/CrashReporter.js'),reporter=new CrashReporter({limit:2,context:()=>({fingerprint:'known.revision',snapshot:{story:{waiting:'say'}},trace:{entries:[]}}),screenshot:async()=>{throw new Error('canvas unavailable');}}),report=await reporter.capture(new Error('original failure'));
 equal(report.error.message,'original failure');equal(report.context.fingerprint,'known.revision');equal(report.context.snapshot.story.waiting,'say');assert(!report.screenshot.available);equal(JSON.parse(reporter.exportLatest()).error.message,'original failure');reporter.dispose();
});
test('crash capture owns error listeners and bounded reports without depending on successful context serialization',async()=>{
 const {CrashReporter}=await import('/src/infrastructure/browser/CrashReporter.js'),target=new EventTarget(),reporter=new CrashReporter({window:target,limit:1,context:()=>{throw new Error('state unavailable');},screenshot:async()=>null});
 const pending=reporter.capture(new Error('first'));await pending;assert(!reporter.latest.context.available);const second=await reporter.capture(new Error('second'));equal(reporter.reports.length,1);equal(second.error.message,'second');reporter.dispose();target.dispatchEvent(new ErrorEvent('error',{error:new Error('detached')}));await Promise.resolve();await Promise.resolve();equal(reporter.reports.length,1);equal(reporter.latest.error.message,'second');
});

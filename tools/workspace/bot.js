import {runBot} from './BotRunner.js';
const params=new URLSearchParams(location.search);let report;
try{const {sources,limits}=await(await fetch(params.get('input'))).json();report=await runBot(sources,limits);}
catch(error){report={ok:false,errors:[{code:'bot.interrupted',sourceId:'bot',pointer:'/',relatedIds:[String(error?.message??error)]}],unexplored:[{reason:'interrupted'}]};}
document.querySelector('#report').textContent=JSON.stringify(report);
await fetch(params.get('result'),{method:'POST',body:JSON.stringify(report)});

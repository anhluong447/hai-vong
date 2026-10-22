import {test,assert} from '/tests/harness.js';
import {press,closeDriver} from '/tests/driver.js';
test('trusted Tab and Enter activate a native button through real browser defaults',async()=>{
 const first=document.createElement('button'),second=document.createElement('button');document.body.append(first,second);let activated=0;const events=[];for(const type of ['keydown','keypress','keyup','click'])second.addEventListener(type,e=>events.push({type,key:e.key,code:e.code,keyCode:e.keyCode,charCode:e.charCode,trusted:e.isTrusted}));second.addEventListener('click',()=>activated++);first.focus();
 try{await press({key:'Tab',code:'Tab',virtualKey:9});assert(document.activeElement===second);await press({key:'Enter',code:'Enter',virtualKey:13});assert(activated===1,JSON.stringify(events));}finally{closeDriver();first.remove();second.remove();}
});

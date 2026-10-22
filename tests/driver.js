/** Test-only native keyboard/screenshot driver using browser WebSocket + local CDP. */
let socket,ready,nextId=0;const pending=new Map();
async function connect(){
 if(ready)return ready;
 ready=(async()=>{
  let info;for(let i=0;i<60;i++){const response=await fetch(new URLSearchParams(location.search).get('driver'));if(response.ok){info=await response.json();break;}await new Promise(r=>setTimeout(r,50));}
  if(!info)throw new Error('driver.unavailable');
  socket=new WebSocket(info.url);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=()=>reject(new Error('driver.connect'));});
  socket.onmessage=event=>{const response=JSON.parse(event.data),item=pending.get(response.id);if(!item)return;clearTimeout(item.timer);pending.delete(response.id);response.error?item.reject(new Error(JSON.stringify(response.error))):item.resolve(response.result);};
  socket.onclose=()=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('driver.closed'));}pending.clear();};
 })();return ready;
}
export async function command(method,params={}){
 await connect();const id=++nextId;
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('driver.timeout:'+method));},6000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
}
export async function keyDown({key,code,virtualKey,modifiers=0,repeat=false,text=key==='Enter'?'\r':key.length===1?key:''}){return command('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey,modifiers,autoRepeat:repeat,text,unmodifiedText:text});}
export async function keyUp({key,code,virtualKey,modifiers=0}){return command('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey,modifiers});}
export async function press(key){await keyDown(key);await keyUp(key);}
export const insertText=text=>command('Input.insertText',{text});
export const screenshot=()=>command('Page.captureScreenshot',{format:'png'});
export function closeDriver(){socket?.close();socket=null;ready=null;}

import {test,assert,equal} from '/tests/harness.js';
import {DialoguePresentationView} from '/src/presentation/ui/DialoguePresentationView.js';
import {TextService} from '/src/domain/story/TextService.js';
import {command,press} from '/tests/driver.js';
test('large expanded dialogue preserves world feet and native keyboard controls',async()=>{
 const page=new DOMParser().parseFromString(await(await fetch('/index.html')).text(),'text/html'),root=document.importNode(page.querySelector('[data-game]'),true);document.body.append(root);let view;
 try{
  assert(root.querySelector('[data-role=dialogue-speaker]'),'speaker structure missing');
  const ui=await(await fetch('/content/ui/first3-art.json')).json(),vi=await(await fetch('/content/locales/vi.json')).json(),expanded=await(await fetch('/content/locales/test-expanded.json')).json();
  await command('Emulation.setDeviceMetricsOverride',{width:1280,height:1100,deviceScaleFactor:1,mobile:false});
  await new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='/styles/base.css';link.onload=resolve;link.onerror=reject;document.head.append(link);});
  for(const [key,value]of Object.entries(ui.tokens))root.style.setProperty(key,value);root.style.setProperty('--viewport-ratio','960/540');root.style.setProperty('--text-size','27px');
  const text=new TextService({vi,'en-XA':expanded},'en-XA'),format=key=>{const result=text.format(key);assert(result.ok,JSON.stringify(result));return result.value;};
  for(const node of root.querySelectorAll('[data-text]'))node.textContent=format(node.dataset.text);
  root.querySelector('[data-role=menu]').hidden=true;root.querySelector('[data-role=dialogue]').hidden=false;root.querySelector('[data-role=line]').textContent=format('first3.line.van-warning');
  const image=document.createElement('canvas');image.width=image.height=2;
  view=new DialoguePresentationView({root:root.querySelector('[data-role=dialogue-speaker]'),format,revision:'test',assets:{acquire:async()=>({ok:true,value:{get:()=>image,release(){}}})}});
  assert((await view.present({speakerId:'fixture',nameKey:'world.npc',expressionId:'neutral',portraitAssetId:'fixture.image'})).ok);
  await document.fonts.ready;
  const stage=root.querySelector('[data-role=stage]').getBoundingClientRect(),dialogue=root.querySelector('[data-role=dialogue]'),line=root.querySelector('[data-role=line]');
  assert(dialogue.getBoundingClientRect().top>=stage.bottom,'dialogue covered world feet');assert(line.scrollWidth<=line.clientWidth+1,'large line clipped horizontally');assert(dialogue.scrollWidth<=dialogue.clientWidth+1,'controls overflowed panel');
  let advanced=0;const advance=root.querySelector('[data-action=advance]');advance.addEventListener('click',()=>advanced++);advance.focus();await press({key:'Enter',code:'Enter',virtualKey:13});equal(advanced,1);await press({key:'Tab',code:'Tab',virtualKey:9});equal(document.activeElement.dataset.action,'auto');assert(root.querySelector('[data-role=dialogue-portrait]').tabIndex<0);
 }finally{view?.dispose();root.remove();await command('Emulation.clearDeviceMetricsOverride');}
});

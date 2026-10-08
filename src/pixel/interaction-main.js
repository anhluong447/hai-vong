import {PixelWorld} from './PixelWorld.js';
import {DialogueSprite,loadDialogueRegistry} from '../ui/DialogueSprite.js';
import {element as el,text,button} from '../ui/dom.js';
import {INTERACTION_SCENES as scenes} from './interaction-scenes.js';
const registry=await loadDialogueRegistry(),sprite=new DialogueSprite(registry),app=document.querySelector('#app');
const host=el('div',{class:'pixel-stage'}),notice=text('p','Đến gần nhân vật rồi nhấn E, hoặc bấm nhân vật để tự đi tới.','pixel-notice');notice.setAttribute('role','status');
const progress=el('div',{class:'interaction-progress','aria-label':'Các hội thoại đã thử'}),visited=new Set();let active=null,overlay=null;
const state={phase:'personal',day:1,people:[]};
const world=new PixelWorld(host,{mapId:'interaction',getState:()=>state,onNotice:message=>notice.textContent=message,onInteract:target=>open(target.scene)});
function updateProgress(){progress.replaceChildren(...Object.keys(scenes).map(id=>text('span',`${visited.has(id)?'✓ ':''}${registry.characters[id].name}`,visited.has(id)?'visited':'')));}
function close(){active=null;overlay?.remove();overlay=null;sprite.clear();world.setConversation(null);world.setBlocked(false);world.canvas.focus({preventScroll:true});}
function open(id){if(!scenes[id])return;active={id,key:'start',history:[]};world.setBlocked(true);show();}
function advance(key){if(!active)return;active.history.push(active.key);active.key=key;show();}
function show(){
 const scene=scenes[active.id],node=scene.nodes[active.key],character=registry.characters[node.speaker];
 world.setConversation(node.speaker==='khue'?null:node.speaker);sprite.set(node.speaker,node.expression);
 overlay?.remove();const controls=el('div',{class:'interaction-actions'});
 if(active.history.length)controls.append(button('← Lời trước',()=>{active.key=active.history.pop();show();}));
 if(node.choices)for(const choice of node.choices)controls.append(button(choice.label,()=>advance(choice.next),'primary'));
 else if(node.next)controls.append(button('Tiếp tục →',()=>advance(node.next),'primary'));
 else{visited.add(active.id);updateProgress();controls.append(button('Nói lại từ đầu',()=>open(active.id)),button('Kết thúc hội thoại',close,'primary'));}
 const content=el('section',{class:'pixel-dialog',role:'dialog','aria-modal':'true','aria-label':scene.title},[
  el('div',{class:'pixel-dialog-head'},[text('h2',character.name),button('Đóng · Esc',close)]),
  text('p',scene.title,'interaction-caption'),text('p',node.text,'dialogue-line'),controls]);
 const stage=el('div',{class:'dialogue-stage'},[sprite.node,content]);stage.style.setProperty('--speaker',character.color);
 overlay=el('div',{class:'pixel-overlay conversation interaction-dialog'},stage);app.append(overlay);controls.querySelector('button.primary')?.focus();
}
app.append(el('header',{class:'pixel-masthead'},[el('div',{},[text('div','HỒI ÂM / THỬ TƯƠNG TÁC','eyebrow'),text('h1','Buổi giao lưu tại CLB')]),el('nav',{class:'actions'},[el('a',{href:'pixel.html'},['Map vòng chơi']),el('a',{href:'tools/dialogue-sprite-lab.html'},['Xem sprite'])])]),
 text('p','Gặp đủ 9 nhân vật · chọn phản hồi · xem nét mặt thay đổi theo lời thoại. Đây là cảnh thử, không tiêu energy hay thay đổi save.','interaction-caption'),progress,host,notice,
 el('div',{class:'pixel-controls'},[text('p','WASD / ↑↓←→ · đi | E / Enter · nói chuyện | Enter · câu tiếp | Esc · đóng. Bấm NPC để tìm đường. Bàn ghi chép là cảnh riêng của Khuê.'),button('E · Tương tác',()=>world.interact())]));
const pad=el('div',{class:'pixel-pad','aria-label':'Điều hướng nhân vật'});for(const[dir,label]of[['up','↑'],['left','←'],['down','↓'],['right','→']]){const b=button(label,()=>{});b.setAttribute('aria-label',`Đi ${dir}`);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);world.move(dir);});for(const event of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>world.stop());pad.append(b);}app.querySelector('.pixel-controls').prepend(pad);
updateProgress();sprite.preload(Object.keys(registry.characters));
window.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){const node=scenes[active.id].nodes[active.key];if(node.next){e.preventDefault();advance(node.next);}}});
window.addEventListener('pagehide',()=>world.dispose());
window.pressInteraction=Object.freeze({get ready(){return world.ready;},get world(){return world.snapshot();},get moving(){return Boolean(world.walk||world.path.length);},screenPosition:(x,y)=>world.screenPosition(x,y),get dialogue(){return active?{scene:active.id,key:active.key,...scenes[active.id].nodes[active.key]}:null;},get completed(){return [...visited];},sprite});

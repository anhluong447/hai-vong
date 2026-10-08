import {test,assert as a} from './harness.js';
import {MAPS,findPath,pathToObject} from '../src/pixel/maps.js';
import {INTERACTION_SCENES} from '../src/pixel/interaction-scenes.js';
import {loadDialogueRegistry} from '../src/ui/DialogueSprite.js';
test('interaction scenes: every choice resolves, all nine identities and 24 expressions are reachable',async()=>{
 const registry=await loadDialogueRegistry(),seen=new Set();
 for(const[id,scene]of Object.entries(INTERACTION_SCENES)){
  const visited=new Set(),pending=['start'];let ends=0;
  while(pending.length){const key=pending.pop();if(visited.has(key))continue;visited.add(key);const node=scene.nodes[key];a.ok(node,`${id}/${key} missing node`);a.ok(registry.characters[node.speaker]?.expressions[node.expression],`${id}/${key} missing expression`);a.ok(node.text?.length>10);seen.add(`${node.speaker}/${node.expression}`);const next=node.choices?.map(c=>c.next)||(node.next?[node.next]:[]);if(!next.length)ends++;pending.push(...next);}
  a.equal(visited.size,Object.keys(scene.nodes).length,`${id} unreachable lines`);a.ok(ends>0);
 }
 a.equal(Object.keys(INTERACTION_SCENES).length,9);a.equal(seen.size,24);
});
test('interaction map real UI: walk to all actors, branch conversations, restore movement and render mobile',async()=>{
 const frame=document.createElement('iframe');frame.src='../interaction.html';frame.style.cssText='position:relative;left:0;width:1200px;height:950px';document.body.append(frame);
 const wait=fn=>new Promise((resolve,reject)=>{const start=Date.now();const poll=()=>{try{if(fn())return resolve();if(Date.now()-start>14000)return reject(new Error('Interaction map timeout'));setTimeout(poll,20);}catch(error){reject(error);}};poll();});
 let stage='loading';
 try{
  await wait(()=>frame.contentWindow.pressInteraction?.ready);const w=frame.contentWindow,d=w.document,api=w.pressInteraction,map=MAPS.interaction,canvas=d.querySelector('canvas');a.equal(api.world.mapId,'interaction');
  const click=label=>{const b=[...d.querySelectorAll('button')].find(b=>b.textContent===label);a.ok(b,`Missing button ${label}`);b.click();};
  const point=(x,y)=>{const p=api.screenPosition(x,y),r=canvas.getBoundingClientRect();canvas.dispatchEvent(new w.PointerEvent('pointerdown',{clientX:r.left+p.x,clientY:r.top+p.y,bubbles:true}));};
  async function walk(goal){for(let i=0;i<60;i++){const s=api.world;if(s.x===goal.x&&s.y===goal.y&&!api.moving)return;const path=findPath(map,s,goal,map.npcs);a.ok(path);const r=canvas.getBoundingClientRect(),visible=path.filter(p=>{const v=api.screenPosition(p.x,p.y);return v.x>8&&v.y>8&&v.x<r.width-8&&v.y<r.height-8;});a.ok(visible.length);const step=visible.at(-1);point(step.x,step.y);await wait(()=>!api.moving&&api.world.x===step.x&&api.world.y===step.y);}throw new Error('Unreachable waypoint');}
  async function talk(id){stage=`talk ${id}`;const target=[...map.objects,...map.npcs].find(o=>o.scene===id),path=pathToObject(map,api.world,target,map.npcs);a.ok(path);if(path.length)await walk(path.at(-1));point(target.x,target.y);await wait(()=>api.dialogue);}
  async function rendered(){await wait(()=>api.sprite.node.dataset.status==='ready'&&api.sprite.node.dataset.speaker===api.dialogue.speaker&&api.sprite.node.dataset.expression===api.dialogue.expression);a.equal(d.querySelector('.dialogue-line').textContent,api.dialogue.text);a.equal(d.querySelector('.pixel-dialog-head h2').textContent,api.sprite.registry.characters[api.dialogue.speaker].name);}
  for(const id of ['van','long','nhi','an','ngoc','groundskeeper','teacher','harbor-source','khue']){
   await talk(id);for(let guard=0;guard<12;guard++){await rendered();const node=api.dialogue;if(node.choices){click(node.choices[0].label);}else if(node.next){click('Tiếp tục →');}else{click('Kết thúc hội thoại');break;}}
   a.ok(!api.dialogue);a.ok(!d.querySelector('[role=dialog]'));a.equal(d.activeElement,canvas);
  }
  a.equal(api.completed.length,9);
  await talk('nhi');while(!api.dialogue.choices){await rendered();click('Tiếp tục →');}click('Để mình xem lại tư liệu trước.');await rendered();a.equal(api.dialogue.speaker,'khue');a.equal(api.dialogue.expression,'investigate');click('← Lời trước');await rendered();a.equal(api.dialogue.key,'decision');
  const position=api.world;canvas.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));await new Promise(resolve=>setTimeout(resolve,230));a.equal(api.world.x,position.x);a.equal(api.world.y,position.y);
  frame.style.width='390px';await new Promise(resolve=>setTimeout(resolve,60));a.ok(d.documentElement.scrollWidth<=w.innerWidth+1,'Mobile overflow');const portrait=d.querySelector('.dialogue-sprite').getBoundingClientRect();for(const b of d.querySelectorAll('.interaction-actions button'))a.ok(b.getBoundingClientRect().top>=portrait.bottom-1,'Portrait covers choice');
  w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));a.ok(!api.dialogue);a.ok(!d.body.textContent.includes('undefined'));
  // Start another physical route with the canvas partly below the mobile fold.
  w.scrollTo(0,0);const scroll=w.scrollY;await talk('ngoc');await rendered();a.equal(w.scrollY,scroll,'Focusing the map must not shift pointer coordinates');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 }catch(error){throw new Error(`${stage}: ${error.message}`);}finally{frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('pagehide'));frame.remove();}
});

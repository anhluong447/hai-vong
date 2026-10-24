/** Automation emits the same intents as manual reading; it never chooses or grants effects. */
export class DialogueControls {
 constructor({session,config,readAnchors,complete,reveal,advance,onStop=()=>{}}){Object.assign(this,{session,config,readAnchors,complete,reveal,advance,onStop});this.mode=null;this.elapsed=0;}
 toggle(mode){this.mode=this.mode===mode?null:mode;this.elapsed=0;}
 stop(){this.mode=null;this.elapsed=0;}
 safeBoundary(state){
  const cursor=state.story.cursor,chapter=this.session.bundle.catalog.get('story',cursor.chapterId).value;
  let node=chapter.nodes.find(n=>n.id===cursor.nodeId),index=node.commands.findIndex(c=>c.id===cursor.commandId)+1;
  const seen=new Set();
  while(node){const key=node.id+':'+index;if(seen.has(key))return false;seen.add(key);const command=node.commands[index];if(!command)return false;
   if(command.op==='jump'){node=chapter.nodes.find(n=>n.id===command.target);index=0;continue;}
   return ['say','choose','end'].includes(command.op);
  }return false;
 }
 update(delta){
  if(!this.mode||!Number.isFinite(delta)||delta<0)return;const state=this.session.snapshot(),cursor=state.story.cursor;
  if(state.story.waiting!=='say'||state.gameplay.hearing?.status==='active'){this.stop();return;}
  const anchor=`${cursor.chapterId}/${cursor.nodeId}/${cursor.commandId}`;
  if(this.mode==='skip'&&!this.readAnchors().includes(anchor)||!this.safeBoundary(state)){this.stop();this.onStop();return;}
  if(this.mode==='skip'){if(!this.complete())this.reveal();else this.advance();return;}
  if(!this.complete()){this.elapsed=0;return;}this.elapsed+=delta;if(this.elapsed>=this.config.autoDelay){this.elapsed=0;this.advance();}
 }
}

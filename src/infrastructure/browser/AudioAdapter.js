import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
import {validAudioState} from '../../contracts/PresentationSnapshot.js';
const bad=code=>failure(diagnostic(code,'audio','/'));
/** Cue intents survive autoplay denial. Nodes and resource leases have one owner. */
export class AudioAdapter {
 constructor({catalog,assets,revision,buses,createContext=()=>new AudioContext()}){
  Object.assign(this,{catalog,assets,revision,createContext});this.buses=Object.fromEntries(buses.map(b=>[b.id,{gain:b.gain,muted:false}]));this.nodes={};this.tracks=new Set();this.epochs=new Map();this.intents=new Map();this.controller=new AbortController();this.disposed=false;this.paused=false;
 }
 context(){if(!this.audioContext){this.audioContext=this.createContext();for(const id of Object.keys(this.buses)){const node=this.audioContext.createGain();node.connect(this.audioContext.destination);this.nodes[id]=node;this.setBus(id,this.buses[id]);}}return this.audioContext;}
 setBus(id,{gain=this.buses[id]?.gain,muted=this.buses[id]?.muted}={}){if(!this.buses[id]||!Number.isFinite(gain)||gain<0||gain>1||typeof muted!=='boolean')return bad('audio.bus.invalid');this.buses[id]={gain,muted};if(this.nodes[id])this.nodes[id].gain.setValueAtTime(muted?0:gain,this.audioContext.currentTime);return success(this.buses[id]);}
 normalize(cue,offset){if(!cue.loop)return Math.min(offset,this.catalog.get('assets',cue.assetId).value.duration);if(offset<cue.loopEnd)return offset;return cue.loopStart+(offset-cue.loopStart)%(cue.loopEnd-cue.loopStart);}
 async prepareOneShots(cueIds){
  this.oneShotEpoch=(this.oneShotEpoch??0)+1;const epoch=this.oneShotEpoch;
  const results=await Promise.all([...new Set(cueIds)].map(id=>this.prepare(id,0)));
  if(this.disposed||epoch!==this.oneShotEpoch||results.some(r=>!r.ok||r.value.cue.loop||!r.value.buffer)){
   for(const r of results)if(r.ok)r.value.lease.release();return bad('audio.oneshot.prepareFailed');
  }
  const token={epoch,items:new Map(results.map(r=>[r.value.cue.id,r.value])),released:false};this.oneShotTokens??=new Set();this.oneShotTokens.add(token);return success(token);
 }
 abortOneShots(token){if(!token||token.released)return;token.released=true;for(const item of token.items.values())item.lease.release();this.oneShotTokens?.delete(token);}
 commitOneShots(token){
  if(this.disposed||token?.released||token?.epoch!==this.oneShotEpoch){this.abortOneShots(token);return bad('audio.oneshot.stale');}
  this.stopOneShots();for(const item of this.oneShotBuffers?.values()??[])item.lease.release();this.oneShotBuffers=token.items;token.released=true;this.oneShotTokens.delete(token);return success(null);
 }
 stopOneShots(){for(const voice of [...this.oneShotVoices??[]])this.endOneShot(voice);}
 endOneShot(voice){if(!this.oneShotVoices?.delete(voice))return;voice.source.onended=null;voice.source.stop();voice.source.disconnect();voice.gain.disconnect();}
 playOneShot(cueId){
  const item=this.oneShotBuffers?.get(cueId);if(this.disposed||!item)return bad('audio.oneshot.unprepared');
  const context=this.context(),bus=this.buses[item.cue.bus];if(this.paused||context.state!=='running'||bus.muted||bus.gain===0)return success(false);
  this.oneShotVoices??=new Set();if(this.oneShotVoices.size>=4)this.endOneShot(this.oneShotVoices.values().next().value);
  const source=context.createBufferSource(),gain=context.createGain(),voice={source,gain};source.buffer=item.buffer;source.connect(gain);gain.connect(this.nodes[item.cue.bus]);gain.gain.setValueAtTime(item.cue.gain,context.currentTime);source.onended=()=>this.endOneShot(voice);this.oneShotVoices.add(voice);source.start();return success(true);
 }
 async prepare(cueId,offset){
  const cue=this.catalog.get('audio',cueId);if(this.disposed||!cue.ok||!this.buses[cue.value.bus]||!Number.isFinite(offset)||offset<0)return bad('audio.cue.invalid');
  const loaded=await this.assets.acquire([cue.value.assetId],{revision:this.revision,signal:this.controller.signal});if(!loaded.ok)return loaded;
  try{const raw=loaded.value.get(cue.value.assetId),buffer=raw?await this.context().decodeAudioData(raw.slice(0)):null;
   if(this.disposed){loaded.value.release();return bad('audio.cancelled');}
   return success({cue:cue.value,offset:this.normalize(cue.value,offset),buffer,lease:loaded.value,source:null,gain:null,startedAt:0,retiring:false});
  }catch{loaded.value.release();return bad('audio.decode.failed');}
 }
 async play(cueId,{offset=0}={}){
  const cue=this.catalog.get('audio',cueId);if(!cue.ok)return cue;if(!Number.isFinite(offset)||offset<0||this.disposed||!this.buses[cue.value.bus])return bad('audio.cue.invalid');const bus=cue.value.bus,epoch=(this.epochs.get(bus)??0)+1;this.epochs.set(bus,epoch);this.intents.set(bus,{cueId,offset});
  const prepared=await this.prepare(cueId,offset);if(!prepared.ok)return prepared;const item=prepared.value;
  if(this.disposed||this.epochs.get(bus)!==epoch){item.lease.release();return bad('audio.cancelled');}
  this.intents.delete(bus);
  for(const old of this.tracks)if(old.cue.bus===bus&&!old.retiring)this.retire(old);
  this.tracks.add(item);if(!this.paused&&this.context().state==='running')this.start(item);return success(this.snapshot());
 }
 start(item){if(item.source||!item.buffer||this.disposed)return;const context=this.context(),source=context.createBufferSource(),gain=context.createGain();source.buffer=item.buffer;source.loop=item.cue.loop;source.loopStart=item.cue.loopStart;source.loopEnd=item.cue.loopEnd;source.connect(gain);gain.connect(this.nodes[item.cue.bus]);gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(item.cue.gain,context.currentTime+item.cue.fadeIn);item.source=source;item.gain=gain;item.startedAt=context.currentTime;source.onended=()=>{if(item.source===source)this.release(item);};source.start(0,item.offset);}
 offset(item){return this.normalize(item.cue,item.offset+(item.source?this.context().currentTime-item.startedAt:0));}
 retire(item){item.retiring=true;if(!item.source){this.release(item);return;}const time=this.context().currentTime;item.gain.gain.cancelScheduledValues(time);item.gain.gain.setValueAtTime(item.gain.gain.value,time);item.gain.gain.linearRampToValueAtTime(0,time+item.cue.fadeOut);item.source.stop(time+item.cue.fadeOut);}
 stop(item){item.offset=this.offset(item);if(item.source){item.source.onended=null;item.source.stop();item.source.disconnect();item.gain.disconnect();item.source=null;item.gain=null;}}
 release(item){this.stop(item);item.lease.release();item.buffer=null;this.tracks.delete(item);}
 pause(){this.paused=true;this.stopOneShots();for(const item of [...this.tracks])if(item.retiring)this.release(item);else this.stop(item);}
 async unlock(){try{const context=this.context();await context.resume();if(context.state!=='running')return bad('audio.autoplay.denied');this.paused=false;for(const item of this.tracks)if(!item.retiring)this.start(item);return success(this.snapshot());}catch{return bad('audio.autoplay.denied');}}
 snapshot(){return {paused:this.paused,buses:structuredClone(this.buses),tracks:[...[...this.tracks].filter(i=>!i.retiring&&!this.intents.has(i.cue.bus)).map(i=>({cueId:i.cue.id,offset:this.offset(i)})),...structuredClone([...this.intents.values()])]};}
 async restore(state){
  if(!validAudioState(state,this))return bad('audio.state.invalid');
  const prepared=await Promise.all(state.tracks.map(t=>this.prepare(t.cueId,t.offset)));if(prepared.some(r=>!r.ok)){for(const result of prepared)if(result.ok)result.value.lease.release();return bad('audio.restore.failed');}
  for(const bus of Object.keys(this.buses))this.epochs.set(bus,(this.epochs.get(bus)??0)+1);this.intents.clear();for(const item of [...this.tracks])this.release(item);for(const [id,bus]of Object.entries(state.buses))this.setBus(id,bus);this.paused=state.paused;
  for(const result of prepared){const item=result.value;this.tracks.add(item);if(!this.paused&&this.context().state==='running')this.start(item);}return success(this.snapshot());
 }
 stats(){return {tracks:this.tracks.size,nodes:[...this.tracks].filter(i=>i.source).length,oneShots:this.oneShotVoices?.size??0,preparedOneShots:this.oneShotBuffers?.size??0};}
 async dispose(){this.disposed=true;this.oneShotEpoch=(this.oneShotEpoch??0)+1;this.controller.abort();this.intents.clear();this.stopOneShots();for(const token of [...this.oneShotTokens??[]])this.abortOneShots(token);for(const item of this.oneShotBuffers?.values()??[])item.lease.release();this.oneShotBuffers?.clear();for(const item of [...this.tracks])this.release(item);for(const node of Object.values(this.nodes))node.disconnect();if(this.audioContext&&this.audioContext.state!=='closed')await this.audioContext.close();}
}

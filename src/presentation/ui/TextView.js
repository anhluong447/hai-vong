import {diagnostic,failure,success} from '../../contracts/Diagnostic.js';
const elements={text:'span',strong:'strong',emphasis:'em'};
export class TextView {
 constructor(node,{text,speed}){this.node=node;this.text=text;this.speed=speed;this.state=null;this.segmenter=new Intl.Segmenter(text.locale,{granularity:'grapheme'});}
 show(key,params={}){const result=this.text.runs(key,params);if(!result.ok)return result;this.runs=result.value.map(run=>({...run,graphemes:[...this.segmenter.segment(run.value)].map(s=>s.segment)}));this.total=this.runs.reduce((sum,r)=>sum+r.graphemes.length,0);this.state={key,params:structuredClone(params),revealed:0};this.render();return success(this.snapshot());}
 update(delta){if(!this.state||!Number.isFinite(delta)||delta<0)return;this.state.revealed=Math.min(this.total,this.state.revealed+this.speed*delta);this.render();}
 reveal(){if(this.state){this.state.revealed=this.total;this.render();}}
 get complete(){return !!this.state&&this.state.revealed>=this.total;}
 render(){let remaining=Math.floor(this.state.revealed);const nodes=[];for(const run of this.runs){const child=this.node.ownerDocument.createElement(elements[run.kind]);child.textContent=run.graphemes.slice(0,remaining).join('');remaining=Math.max(0,remaining-run.graphemes.length);nodes.push(child);}this.node.replaceChildren(...nodes);}
 snapshot(){return structuredClone(this.state);}
 restore(state){if(!state||!Number.isFinite(state.revealed)||state.revealed<0)return failure(diagnostic('text.state.invalid','text','/'));const result=this.show(state.key,state.params);if(!result.ok)return result;this.state.revealed=Math.min(this.total,state.revealed);this.render();return success(this.snapshot());}
 configure({speed,locale}){const saved=this.snapshot();this.speed=speed;this.segmenter=new Intl.Segmenter(locale,{granularity:'grapheme'});if(saved)this.restore(saved);}
 async fontsReady(){await this.node.ownerDocument.fonts.ready;return this.node.getBoundingClientRect();}
 dispose(){this.state=null;this.node.replaceChildren();}
}

import {ResourcePanel} from './ResourcePanel.js';
export class AnimationPanel extends ResourcePanel {
 addLocomotion(){return this.updateSelected(clip=>{clip.locomotion=structuredClone(this.ui.templates.locomotion);});}
 addPlant(){return this.updateSelected(clip=>{const anchors=clip.frames.map(f=>{const asset=this.workspace.bundle.catalog.get('assets',f.assetId).value,rect=f.frameId?asset.frames.find(r=>r.id===f.frameId):asset;return {x:Math.min(clip.pivot.x,rect.width-1),y:clip.pivot.y-1};});clip.locomotion.plant={kneeY:Math.max(1,Math.floor(anchors[0].y*this.ui.templates.plantKneeRatio)),anchors};});}
 render(){super.render();const {data}=this.selected();if(!data.locomotion)this.root.insertBefore(this.button(this.ui.labels.addLocomotion,'add-locomotion',()=>this.addLocomotion()),this.fields);else if(!data.locomotion.plant)this.root.insertBefore(this.button(this.ui.labels.addPlant,'add-plant',()=>this.addPlant()),this.fields);this.previewRoot.append(this.button(this.ui.labels.preview,'preview',()=>void this.previewClip().then(result=>this.reportPreview(result))),this.button(this.ui.labels.step,'step',()=>{this.preview?.step(this.ui.preview.stepSeconds);}));}
 previewClip(){return this.startPreview('clip',this.resourceId);}
}

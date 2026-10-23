import {ResourcePanel} from './ResourcePanel.js';
export class AnimationPanel extends ResourcePanel {
 render(){super.render();this.previewRoot.append(this.button(this.ui.labels.preview,'preview',()=>void this.previewClip().then(result=>this.reportPreview(result))),this.button(this.ui.labels.step,'step',()=>{this.preview?.step(this.ui.preview.stepSeconds);}));}
 previewClip(){return this.startPreview('clip',this.resourceId);}
}

import {ResourcePanel} from './ResourcePanel.js';
export class AudioPanel extends ResourcePanel {
 render(){super.render();this.previewRoot.append(this.button(this.ui.labels.playCue,'preview',()=>void this.previewCue().then(result=>this.reportPreview(result))),this.button(this.ui.labels.stop,'stop',()=>void this.resetPreview()));}
 previewCue(){return this.startPreview('cue',this.resourceId);}
}

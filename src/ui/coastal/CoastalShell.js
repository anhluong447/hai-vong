import {element as el,text} from '../dom.js';
import {t} from '../../shared/text.js';
import {MotionScope} from './MotionScope.js';
import {CoastalHud} from './CoastalHud.js';
import {GameStage} from './GameStage.js';

export class CoastalShell {
  constructor(app,worldHost,{menu,map,interact}={}) {
    app.classList.add('coastal-app');
    this.stage=new GameStage(app);
    this.hud=new CoastalHud({onMap:map,onMenu:menu,onInteract:interact});
    this.hud.node.classList.add('pixel-hud');
    this.hud.interactionPrompt.hidden=true;
    this.notice=text('p','','pixel-notice');
    this.notice.setAttribute('role','status');
    this.notice.setAttribute('aria-live','polite');
    this.node=el('div',{class:'coastal-shell'},[worldHost,this.hud.node,this.notice]);
    this.stage.node.append(this.node);
    this.motion=new MotionScope(this.node);
  }
  update({date,phase,energy,maxEnergy,money,notice,location,locked,objective=''}) {
    this.notice.textContent=notice;
    this.notice.classList.remove('error');
    this.locked=locked;
    this.hud.update({weekday:date,phase,energy,maxEnergy,money,location,objective,promptVisible:false});
  }
  setLocation(value){this.hud.setLocation(value);}
  syncPrompt(world) {
    const target=world.ready&&!world.blocked&&!world.walk?world.nearest():null;
    if(!target){this.hud.setPrompt({visible:false});return;}
    const label=target.person?world.getState().people.find(person=>person.id===target.person)?.name:target.label;
    const sprite=target.sprite?world.sprite(target.sprite):null;
    const position={
      x:Math.max(140,Math.min(1532,((target.x+.5)*16-world.camera.x)*world.scale)),
      y:Math.max(170,Math.min(795,((target.y+1)*16-(sprite?.frameHeight||38)-world.camera.y)*world.scale-22))
    };
    this.hud.setPrompt({visible:true,position,label:t('ui.game.interact',{target:label||t('ui.coastal.dialogue')})});
  }
  dispose(){this.motion.dispose();this.hud.dispose();this.stage.dispose();}
}

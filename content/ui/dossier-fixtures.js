// Authoring/test-only. Runtime menu composition does not import this module.
import {t} from '../../src/shared/text.js';
export const dossierVariants=['concept','no-photo','long-title','many-history','empty-history','long-list','energy-zero','energy-full'];
export function dossierFixture(model,variant='concept'){
  const m=structuredClone(model);
  const base={description:t('fixture.dossier.description'),history:[],hint:t('fixture.dossier.hint'),actions:[]};
  const field={...base,id:'fixture-field',kind:'main',title:t('fixture.dossier.field'),
    history:[t('fixture.dossier.metTeam'),t('fixture.dossier.sawGate')],
    photo:{file:'ui/dossier-polish/field-photo.png',alt:t('menu.dossier.fieldPhoto')}};
  if(variant==='no-photo')field.photo=null;
  if(variant==='long-title')field.title=t('fixture.dossier.longTitle');
  if(variant==='empty-history')field.history=[];
  if(variant==='many-history')field.history=Array.from({length:24},(_,i)=>({text:t('fixture.dossier.history',{index:i+1}),completed:i<22}));
  m.quests=[{...base,id:'fixture-room',kind:'main',title:t('fixture.dossier.room')},field,
    {...base,id:'fixture-page',kind:'main',title:t('fixture.dossier.page')},
    {...base,id:'fixture-side',kind:'side',title:t('fixture.dossier.side')},
    ...m.quests.filter(q=>q.kind==='general')];
  if(variant==='long-list')m.quests.push(...Array.from({length:30},(_,i)=>({...base,id:`fixture-extra-${i}`,kind:'main',title:t('fixture.dossier.extra',{index:i+1})})));
  m.day=4;m.weekday=t('src.gameplay.engine.thu_nam');m.phase='club';m.phaseText=t('menu.v2.clubPhase');
  m.energy=variant==='energy-zero'?0:variant==='energy-full'?10:7;m.maxEnergy=10;
  return m;
}

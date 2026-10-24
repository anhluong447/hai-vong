import {diagnostic} from './Diagnostic.js';
/** Structure and references are shared; actual fixture replay uses GameSession. */
export function validatePlaytests({catalog,project,locales,sourceFor,pointerFor}){
 const errors=[],runtime=catalog.get('config',project.runtimeConfigId).value,balance=runtime&&catalog.get('balance',runtime.gameplayConfigId).value;
 for(const fixture of catalog.list('playtests')){
  const add=path=>errors.push(diagnostic('preview.fixture.invalid',sourceFor('playtests',fixture.id),pointerFor('playtests',fixture.id)+path,[fixture.id])),initial=fixture.initial,scene=catalog.get('scenes',initial.sceneId).value;
  if(!balance||initial.calendar.day>balance.calendar.totalDays||initial.energy>balance.energy.cap)add('/initial');
  if(!scene||!scene.spawns.some(spawn=>spawn.id===initial.spawnId))add('/initial/spawnId');
  if(locales[project.defaultLocale]?.[fixture.nameKey]?.params.length!==0)add('/nameKey');
  if(new Set(fixture.checkpoints.map(point=>point.id)).size!==fixture.checkpoints.length)add('/checkpoints');
  for(const [index,point]of fixture.checkpoints.entries())if(point.after>fixture.commands.length||!catalog.get('hearings',point.hearingId).ok)add('/checkpoints/'+index);
 }
 return errors;
}

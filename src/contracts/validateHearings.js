import {diagnostic} from './Diagnostic.js';
/** Shared hearing source rules, after structural schemas have established shapes. */
export function validateHearings({catalog,project,locales,sourceFor,pointerFor=()=>''}){
 const errors=[],add=(kind,id,code,path)=>errors.push(diagnostic(code,sourceFor(kind,id),pointerFor(kind,id)+path,[id]));
 const label=key=>typeof key==='string'&&locales[project.defaultLocale]?.[key]?.params.length===0,unique=values=>new Set(values).size===values.length;
 const runtime=catalog.get('config',project.runtimeConfigId).value,gameplay=runtime?.gameplayConfigId?catalog.get('balance',runtime.gameplayConfigId).value:null;
 if(runtime?.hearingBalanceId&&!catalog.get('hearingBalance',runtime.hearingBalanceId).ok)add('config',runtime.id,'hearing.balance.missing','/hearingBalanceId');
 for(const balance of catalog.list('hearingBalance')){
  const bad=path=>add('hearingBalance',balance.id,'hearing.balance.invalid',path),defense=balance.defense,mini=balance.minigame;
  if(defense.qualityScores.high.win<=defense.qualityScores.standard.win||defense.qualityScores.high.normal!==defense.qualityScores.standard.normal)bad('/defense/qualityScores');
  let next=1;for(const tier of defense.heartTiers){if(tier.min!==next||tier.max<tier.min)bad('/defense/heartTiers');next=tier.max+1;}if(next!==defense.maxGauge+1)bad('/defense/heartTiers');
  next=defense.minGauge;for(const band of balance.atmosphere){if(band.min!==next||band.max<band.min||!label(band.textKey)||!catalog.get('audio',band.cueId).ok)bad('/atmosphere');next=band.max+1;}if(next!==defense.maxGauge+1||!unique(balance.atmosphere.map(band=>band.id)))bad('/atmosphere');
  if(!unique(balance.evidenceTypes)||!unique(mini.lanes)||!unique(mini.modes)||!mini.modes.includes(mini.defaultMode)||balance.attack.mercyHearts>balance.attack.baseHearts)bad('/minigame');
  const ui=catalog.get('config',balance.uiId).value;
  if(!ui||ui.kind!=='hearing-ui'){bad('/uiId');continue;}
  const invalid=path=>add('config',ui.id,'hearing.ui.invalid',path),record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  const templates={title:['boss'],defenseStats:['gauge'],attackStats:['hearts','maxHearts','hp','maxHp'],miniStats:['hp','seconds','blocks'],finalStats:['seconds','taps'],card:['name','quality','type'],result:['result','points'],hint:['up','down','block','menu'],hintEasy:['up','down','menu']};
  const fields=['continue','pause','defeat','won','dismiss','recovery','retry','block','tap','field','player',...Object.keys(templates)];
  for(const name of fields){const entry=locales[project.defaultLocale]?.[ui.labels?.[name]],params=templates[name]??[];if(!entry||JSON.stringify([...entry.params].sort())!==JSON.stringify([...params].sort()))invalid('/labels/'+name);}
  for(const [field,ids]of [['qualityKeys',['high','standard']],['typeKeys',balance.evidenceTypes],['resultKeys',['win','normal','lose']],['laneKeys',mini.lanes],['modeKeys',mini.modes]])if(!record(ui[field])||ids.some(id=>!label(ui[field][id])))invalid('/'+field);
  if(!record(ui.tokens)||['--hearing-inset','--hearing-height','--hearing-field-height','--hearing-z','--menu-z'].some(key=>typeof ui.tokens?.[key]!=='string'||!ui.tokens[key].length))invalid('/tokens');
  const unit=value=>Number.isFinite(value)&&value>=0&&value<=1;
  if(!record(ui.field)||!unit(ui.field.sourceX)||!unit(ui.field.targetX)||ui.field.sourceX<=ui.field.targetX||!record(ui.field.laneY)||mini.lanes.some(id=>!unit(ui.field.laneY?.[id])))invalid('/field');
 }
 const defenseCards=new Map(catalog.list('quests').flatMap(quest=>quest.defenseEvidence.map(card=>[card.id,{...card,questId:quest.id}])));
 for(const definition of catalog.list('hearings')){
  const bad=path=>add('hearings',definition.id,'hearing.definition.invalid',path),balance=catalog.get('hearingBalance',definition.balanceId).value;
  if(!balance||!gameplay){bad('/balanceId');continue;}
  if(!label(definition.nameKey)||!label(definition.bossKey)||definition.lastDay<definition.firstDay||definition.lastDay>gameplay.calendar.totalDays)bad('/');
  const route=gameplay.requiredRoutes.find(route=>route.id===definition.requiredMainRouteId);if(!route){bad('/requiredMainRouteId');continue;}
  const mainIds=new Set(),include=id=>{if(mainIds.has(id))return;const quest=catalog.get('quests',id).value;if(!quest||quest.type!=='main')return;mainIds.add(id);quest.prerequisites.forEach(include);};route.mainQuestIds.forEach(include);
  const findings=new Set([...mainIds].flatMap(id=>catalog.get('quests',id).value.attackFindings.map(finding=>finding.id)));
  if(definition.mode==='defense'){
   const d=definition.defense;if(!d||definition.attack){bad('/defense');continue;}
   const attack=catalog.get('hearings',d.attackId).value;if(!attack||attack.mode!=='attack'||attack.balanceId!==definition.balanceId)bad('/defense/attackId');
   if(d.articleWindow.fromDay<1||d.articleWindow.toDay<d.articleWindow.fromDay||d.articleWindow.toDay>gameplay.calendar.totalDays)bad('/defense/articleWindow');
   if(!label(d.bailout.questionKey)||!unique(d.bailout.choices.map(choice=>choice.id))||d.bailout.choices.some(choice=>!label(choice.textKey))||!d.bailout.choices.some(choice=>choice.id===d.bailout.correctChoiceId))bad('/defense/bailout');
   if(!unique(d.questions.map(question=>question.id)))bad('/defense/questions');
   for(const [i,question]of d.questions.entries()){
    const path=`/defense/questions/${i}`,results=question.matches.map(match=>match.result);
    if(!label(question.textKey)||!unique(question.matches.map(match=>match.type+':'+(match.evidenceId??'')))||question.kind==='standard'&&(!results.includes('win')||!results.includes('normal'))||question.kind==='mitigation'&&(results.includes('win')||!results.includes('normal'))||question.kind==='unavoidable'&&results.some(result=>result!=='lose'))bad(path);
    for(const [j,match]of question.matches.entries())if(!balance.evidenceTypes.includes(match.type)||match.evidenceId&&(!defenseCards.has(match.evidenceId)||defenseCards.get(match.evidenceId).type!==match.type))bad(`${path}/matches/${j}`);
   }
  }else{
   const a=definition.attack;if(!a||definition.defense){bad('/attack');continue;}
   const flag=catalog.get('flags',a.victoryFlagId).value;if(!flag||flag.type!=='boolean'||flag.scope!=='run')bad('/attack/victoryFlagId');
   if(!label(a.confrontationKey)||!label(a.crashKey)||!label(a.finalKey)||!unique(a.rounds.map(round=>round.id)))bad('/attack');
   let hp=a.maxHp,confrontation=false;
   for(const [i,round]of a.rounds.entries()){
    const path=`/attack/rounds/${i}`,words=round.recap.filter(piece=>piece.kind==='word');
    if(!label(round.narrationKey)||round.recap.some(piece=>!label(piece.textKey))||!unique(words.map(word=>word.id))||words.some(word=>!word.id)||!words.some(word=>word.id===round.correctWordId)||round.questions.length!==4||!unique(round.questions.map(question=>question.id))||round.questions.some(question=>!label(question.textKey))||!round.questions.some(question=>question.id===round.correctQuestionId)||round.findingIds.some(id=>!findings.has(id)))bad(path);
    const phase=hp<a.maxHp*balance.attack.confrontationRatio?'confrontation':'narration';if(round.phase!==phase)bad(path+'/phase');if(phase==='confrontation')confrontation=true;hp-=round.damage;if(hp<0||hp===0&&i!==a.rounds.length-1)bad(path+'/damage');
   }
   if(hp!==0||!confrontation)bad('/attack/rounds');
   if(!unique(a.projectiles.map(projectile=>projectile.id)))bad('/attack/projectiles');
   for(const [i,projectile]of a.projectiles.entries())if(!label(projectile.textKey)||!balance.minigame.lanes.includes(projectile.laneId)||projectile.travel<=balance.minigame.hitWindow||projectile.at+projectile.travel+balance.minigame.hitWindow>balance.minigame.duration||i>0&&projectile.at<a.projectiles[i-1].at)bad(`/attack/projectiles/${i}`);
  }
 }
 return errors;
}

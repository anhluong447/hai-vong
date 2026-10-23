import {success} from '../../contracts/Diagnostic.js';
import {executeOnce} from '../story/executionLedger.js';
import {dayOfWeek} from './calendar.js';
import {effectiveStat} from './progression.js';
export function handoffArticle(current,quest,performerId,definitions){
 const state=structuredClone(current),article=quest.article,extra=Math.max(0,effectiveStat(state,performerId,article.surplusStat,definitions)-article.surplusThreshold);
 state.gameplay.publication.queued.push({id:article.id,questId:quest.id,performerId,handedOffDay:state.gameplay.calendar.day,handedOffPeriod:state.gameplay.calendar.period,attraction:Math.min(definitions.publication.attractionCap,article.attraction+extra*article.attractionPerSurplus),quality:article.exploitation*article.verification});
 return state;
}
export function publicationScore(article,quest,definition){return Math.min(definition.scoreCap,Math.round(definition.baseScore*(article.attraction/definition.attractionCap)**2*article.quality*definition.multipliers[quest.type]*(1+definition.packagingBonus)));}
export function publishDue(current,definitions){
 const calendar=current.gameplay.calendar,definition=definitions.publication;
 if(calendar.finished||dayOfWeek(calendar.day,definitions.balance)!==definition.weekday||calendar.period!==definition.period)return success({state:current,outcomes:[]});
 let state=current;const outcomes=[];
 for(const article of current.gameplay.publication.queued){
  const quest=definitions.quests.find(q=>q.id===article.questId),result=executeOnce(state,'article.publish/'+article.id,()=>{
   const next=structuredClone(state),score=publicationScore(article,quest,definition);next.gameplay.publication.queued=next.gameplay.publication.queued.filter(a=>a.id!==article.id);next.gameplay.publication.published[article.id]={...article,score,publishedDay:calendar.day};next.gameplay.audience+=score;
   return success({state:next,outcomes:[{type:'publication.published',articleId:article.id,score,publishedDay:calendar.day}]});
  });state=result.value.state;outcomes.push(...result.value.outcomes);
 }
 return success({state,outcomes});
}

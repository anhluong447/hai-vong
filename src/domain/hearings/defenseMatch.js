import {success} from '../../contracts/Diagnostic.js';
import {hearingFailure} from './common.js';
/** One interpretation shared by execution and saved response validation. */
export function defenseMatch(card,question,balance){
 if(card===null)return success({result:'lose',points:balance.defense.emptyLose});
 const match=question.matches.find(match=>match.type===card.type&&match.evidenceId===card.id)??question.matches.find(match=>match.type===card.type&&!match.evidenceId),result=match?.result??'lose';
 if(question.kind==='mitigation'&&result==='win'||question.kind==='unavoidable'&&result!=='lose')return hearingFailure('hearing.match.invalid');
 const points=result==='lose'?match?.losePoints??question.defaultLosePoints:balance.defense.qualityScores[card.quality]?.[result];
 return Number.isFinite(points)?success({result,points}):hearingFailure('hearing.quality.invalid');
}

import {diagnostic,failure,success} from '../contracts/Diagnostic.js';

/** Derive the current speaker from authored IDs, never translated dialogue text. */
export function resolveDialoguePresentation(state,bundle){
 if(state?.story?.waiting!=='say')return success(null);
 const cursor=state.story.cursor,chapter=bundle.catalog.get('story',cursor?.chapterId);
 const command=chapter.ok?chapter.value.nodes.find(node=>node.id===cursor?.nodeId)?.commands.find(item=>item.id===cursor?.commandId):null;
 const invalid=()=>failure(diagnostic('dialogue.presentation.invalid','snapshot','/story/cursor'));
 if(command?.op!=='say')return invalid();
 if(!command.speakerId)return command.expressionId?invalid():success(null);
 const speaker=bundle.catalog.get('actors',command.speakerId);if(!speaker.ok)return invalid();
 const actor=speaker.value,expressionId=command.expressionId??(actor.portraits?'neutral':null);
 if(expressionId&&!Object.hasOwn(actor.portraits??{},expressionId))return invalid();
 return success({speakerId:actor.id,nameKey:actor.nameKey,expressionId,portraitAssetId:expressionId?actor.portraits[expressionId]:null});
}

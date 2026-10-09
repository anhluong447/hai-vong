import {t} from './text.js';

/** Reject broken authoring references before creating a playable session. */
export function validateContent({roster,templates,questSteps,stats,maps,scenes}) {
  const fail = field => { throw new TypeError(t('content.invalid',{field})); };
  const unique = (items,field) => {
    if (items.some(id => typeof id !== 'string' || !id) || new Set(items).size !== items.length) fail(field);
  };
  unique(roster.map(person=>person[0]),'roster.id');
  const statKeys = Object.keys(stats);
  for (const [id,name,female,joinDay,values] of roster) {
    if (typeof name !== 'string' || typeof female !== 'boolean' || !Number.isInteger(joinDay) || joinDay<1 || !Array.isArray(values) || values.length!==statKeys.length || values.some(value=>!Number.isFinite(value)||value<0)) fail(id);
  }
  unique(templates.map(item=>item.key),'case.key');
  for (const item of templates) if (!statKeys.includes(item.need) || ['title','story','teaser'].some(key=>typeof item[key]!=='string') || !Number.isFinite(item.difficulty) || !Number.isFinite(item.attraction)) fail(item.key);
  unique(questSteps.map(step=>step[0]),'quest.step');
  for (const [id,label] of questSteps) if (!statKeys.includes(id) || typeof label!=='string') fail(id);
  for (const [id,map] of Object.entries(maps)) {
    if (map.id!==id || !Number.isInteger(map.width) || !Number.isInteger(map.height) || map.width<1 || map.height<1 || map.tiles.length!==map.height || map.tiles.some(row=>row.length!==map.width||row.some(tile=>!Number.isInteger(tile)||tile<0))) fail(id);
    const inside = point => point && Number.isInteger(point.x) && Number.isInteger(point.y) && point.x>=0 && point.y>=0 && point.x<map.width && point.y<map.height;
    if (!inside(map.spawn)) fail(`${id}.spawn`);
    unique([...map.objects,...map.npcs].map(item=>item.id),`${id}.objects`);
    for (const item of [...map.objects,...map.npcs]) if (!inside(item)) fail(`${id}.${item.id}`);
    for (const portal of map.portals) {
      const destination=maps[portal.to];
      if (!inside(portal) || !destination || !Number.isInteger(portal.spawn?.x) || !Number.isInteger(portal.spawn?.y) || portal.spawn.x<0 || portal.spawn.y<0 || portal.spawn.x>=destination.width || portal.spawn.y>=destination.height) fail(`${id}.portal`);
    }
  }
  const speakers = new Set([...roster.map(person=>person[0]),...Object.values(maps).flatMap(map=>map.npcs.map(npc=>npc.portraitId))]);
  for (const [id,scene] of Object.entries(scenes)) {
    if (typeof scene.title!=='string' || !scene.nodes?.start) fail(id);
    for (const [key,node] of Object.entries(scene.nodes)) {
      if (!speakers.has(node.speaker) || typeof node.text!=='string' || typeof node.expression!=='string') fail(`${id}.${key}`);
      for (const target of [node.next,...(node.choices??[]).map(choice=>choice.next)].filter(Boolean)) if (!scene.nodes[target]) fail(`${id}.${key}.${target}`);
      if (node.choices?.some(choice=>typeof choice.label!=='string')) fail(`${id}.${key}.choices`);
    }
  }
  return true;
}

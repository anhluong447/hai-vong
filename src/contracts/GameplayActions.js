/** Registered gameplay capabilities; authored costs/results belong in catalogs. */
export const GAMEPLAY_ACTIONS=Object.freeze(['calendar.finishSchool','calendar.requestHome','calendar.cancelHome','calendar.confirmHome','calendar.endNight','quest.listen','quest.start','quest.collect','quest.selectAssignee','quest.confirmAssignment','activity.perform','item.buy','item.use','equipment.equip','equipment.unequip']);
export const GAMEPLAY_EFFECT_HANDLERS=Object.freeze(['gameplay.activity','gameplay.command','gameplay.assign']);
export const SCRIPT_GAMEPLAY_FIELDS=Object.freeze({
 'calendar.finishSchool':[],
 'calendar.requestHome':['route','requestId'],
 'calendar.cancelHome':['requestId'],
 'calendar.confirmHome':['requestId'],
 'calendar.endNight':['choice'],
 'quest.listen':['questId'],
 'quest.start':['questId','performerId'],
 'quest.collect':['questId','stepId']
});
export const HOME_ROUTES=Object.freeze(['fast','walk']);
export const NIGHT_CHOICES=Object.freeze(['sleep','study','game']);

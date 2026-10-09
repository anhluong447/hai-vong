"""One-time consistency edits; archived after this migration."""
import json
from pathlib import Path
from refactor_content import read,write

raw=read('content/locales/vi.js')
catalog=json.loads(raw[raw.index('export default ')+15:].rstrip().removesuffix(';'))
catalog.update({'error.unknown_tab':'Unknown tab','error.unknown_map':'Unknown pixel map: {map}', 'error.dialogue_manifest':'Dialogue manifest: {status}','error.save_mode':'Unknown save mode: {mode}'})
write('content/locales/vi.js','// Player-facing text. Keys are stable; edit values without changing logic.\nexport default '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')

replacements={
 'src/presentation/gameplay-panels.js':{"p.skills.join(', ')":"p.skills.map(skillText).join(', ')"},
 'src/main.js':{"new Error('Unknown tab')":"new Error(t('error.unknown_tab'))"},
 'src/pixel/PixelWorld.js':{'new Error(`Unknown pixel map: ${mapId}`)':"new Error(t('error.unknown_map',{map:mapId}))"},
 'src/ui/DialogueSprite.js':{'new Error(`Dialogue manifest: ${response.status}`)':"new Error(t('error.dialogue_manifest',{status:response.status}))"},
 'src/infrastructure/GameplaySaveService.js':{'new RangeError(`Unknown save mode: ${mode}`)':"new RangeError(t('error.save_mode',{mode}))"},
}
for path,items in replacements.items():
 source=read(path)
 for old,new in items.items():
  assert old in source,(path,old)
  source=source.replace(old,new)
 if path=='src/ui/DialogueSprite.js':source="import {t} from '../shared/text.js';\n"+source
 write(path,source)

# Historical skill IDs are immutable migration data, independent of current translations.
write('content/gameplay/migrations.js',"export const LEGACY_SKILLS = Object.freeze({'hiệp đồng':'synergy'});\n")
source=read('src/domain/validateSave.js')
source="import {LEGACY_SKILLS} from '../../content/gameplay/migrations.js';\n"+source
source=source.replace("key === t('skill.synergy') ? 'synergy' : key",'LEGACY_SKILLS[key] ?? key')
source=source.replace("person.skills.some(key => typeof key !== 'string')", "person.skills.some(key => key !== 'synergy' && !(state.version === 1 && Object.hasOwn(LEGACY_SKILLS,key)))")
write('src/domain/validateSave.js',source)
write('content/maps/definitions.js',read('content/maps/definitions.js').replace('const terrainBlocked = new Set([5,6,7,8,12,13,15]);\n',''))

# Shells are translated by the same catalog as the game. Validate interaction packs too.
source=read('src/pixel/interaction-main.js')
source="import {validateContent} from '../shared/validateContent.js';\nimport {GAME_CONTENT} from '../../content/manifest.js';\nvalidateContent(GAME_CONTENT);\n"+source
write('src/pixel/interaction-main.js',source)
print('Completed content consistency edits')

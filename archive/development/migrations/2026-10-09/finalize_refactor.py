"""One-time migration finishing edits. Archived after execution."""
import json
import re
from pathlib import Path
from refactor_content import read, write

def edit(path, replacements):
    value = read(path)
    for old,new in replacements.items():
        if old not in value: raise ValueError(f'Missing replacement in {path}: {old}')
        value = value.replace(old,new)
    write(path,value)

def main():
    catalog_path = 'content/locales/vi.js'
    raw = read(catalog_path)
    catalog = json.loads(raw[raw.index('export default ')+15:].rstrip().removesuffix(';'))
    catalog.update({'ui.map_pixel':'Map pixel','ui.view_sprite':'Xem sprite','ui.menu_sandbox':'Menu sandbox','ui.banger':'BANGER','ui.energy_value':'Energy {energy}',
                    'page.index':'CLB Báo Chí · Map debug','page.sandbox':'CLB Báo Chí · Sandbox','page.gameplay':'Hải Vọng · Sandbox vòng chơi','page.pixel':'Hồi Âm · Pixel map test','page.interaction':'Hồi Âm · Map thử tương tác'})
    for path in Path('src').rglob('*.js'):
        source = path.read_text(encoding='utf-8')
        for text,key in [('Map pixel','ui.map_pixel'),('Xem sprite','ui.view_sprite'),('Menu sandbox','ui.menu_sandbox'),('BANGER','ui.banger')]:
            source = source.replace("'"+text+"'", "t('"+key+"')")
        source = source.replace('`Energy ${state.energy}`', "t('ui.energy_value',{energy:state.energy})")
        path.write_text(source,encoding='utf-8')
    write(catalog_path,'// Player-facing text. Keys are stable; edit values without changing logic.\nexport default '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')

    definitions = read('content/gameplay/definitions.js')
    definitions = re.sub(r'^export const DEFAULTS = .*?;\n', "export {DEFAULTS} from './balance.js';\n",definitions,flags=re.M)
    write('content/gameplay/definitions.js',definitions)
    config = read('src/core/config.js')
    start,end = config.index('export const DEFAULT_CONFIG'),config.index('export function validateConfig')
    write('content/sandbox/balance.js',config[start:end])
    write('src/core/config.js',config[:start]+"import {DEFAULT_CONFIG} from '../../content/sandbox/balance.js';\nexport {DEFAULT_CONFIG};\n\n"+config[end:])

    # Keep application orchestration independent of browser/storage implementations.
    storage = read('src/infrastructure/GameplaySaveService.js')
    start,end = storage.index('const phases ='),storage.index('export class GameplaySaveService')
    validator_header = "import {createSession} from './session.js';\nimport {STAT_NAMES} from '../../content/gameplay/definitions.js';\nimport {t} from '../shared/text.js';\n"
    write('src/domain/validateSave.js',validator_header+storage[start:end])
    header = "import {validateGameplaySave} from '../domain/validateSave.js';\nexport {validateGameplaySave};\nimport {t} from '../shared/text.js';\n" + storage[storage.index('export const GAMEPLAY_SAVE_KEYS'):start]
    write('src/infrastructure/GameplaySaveService.js',header+"const invalid = () => { throw new Error(t('save.invalid')); };\n"+storage[end:])
    edit('src/application/GameSession.js',{"../infrastructure/GameplaySaveService.js":"../domain/validateSave.js"})

    edit('src/domain/calendar.js',{'export const weekend':"import {CALENDAR} from '../../content/gameplay/balance.js';\nexport const weekend",'% 7 >= 5':'% CALENDAR.daysPerWeek >= CALENDAR.schoolDays','/ 7':'/ CALENDAR.daysPerWeek','% 7]':'% CALENDAR.daysPerWeek]'})
    edit('src/domain/people.js',{'export const joined':"import {FATIGUE} from '../../content/gameplay/balance.js';\nexport const joined",'Math.max(0.65,1 - p.fatigue / 250)':'Math.max(FATIGUE.minimumEfficiency,1 - p.fatigue / FATIGUE.divisor)'})
    edit('src/domain/session.js',{'const clone':"import {CALENDAR,LIMITS,PERSONAL,FATIGUE} from '../../content/gameplay/balance.js';\nconst clone",'cfg.days < 14 || cfg.days > 84 || cfg.days % 7 !== 0':'cfg.days < CALENDAR.minDays || cfg.days > CALENDAR.maxDays || cfg.days % CALENDAR.daysPerWeek !== 0','cfg.packaging > 0.08 || cfg.romancePenalty < 0.2 || cfg.romancePenalty > 0.3':'cfg.packaging > LIMITS.packaging || cfg.romancePenalty < LIMITS.minRomancePenalty || cfg.romancePenalty > LIMITS.maxRomancePenalty','money:300':'money:PERSONAL.initialMoney','p.bond-2':'p.bond-PERSONAL.betrayalBondLoss','Math.min(100,p.fatigue)':'Math.min(FATIGUE.cap,p.fatigue)','(s.day-1)%7===0':'(s.day-1)%CALENDAR.daysPerWeek===0'})
    edit('src/domain/journalism.js',{'export function addCases':"import {CALENDAR,RESEARCH,PUBLICATION,SUMMARY} from '../../content/gameplay/balance.js';\nexport function addCases",'s.day + 10':'s.day + RESEARCH.lifetime',"p.tools.includes(c.need) ? 1 : 0":"p.tools.includes(c.need) ? RESEARCH.toolBonus : 0","p.skills.includes('synergy') ? 0.5 : 0":"p.skills.includes('synergy') ? RESEARCH.synergyBonus : 0",'fit / 10':'fit / RESEARCH.statScale','(s.day - 1) % 7 !== 4':'(s.day - 1) % CALENDAR.daysPerWeek !== CALENDAR.publicationDay','Math.min(100000,Math.round(100000 * (d.attraction/10)**2':'Math.min(PUBLICATION.maxScore,Math.round(PUBLICATION.maxScore * (d.attraction/RESEARCH.statScale)**2',"d.branch === 'khue' ? 1.5 : 1":"d.branch === 'khue' ? PUBLICATION.khueMultiplier : 1",'candidates.slice(0,4)':'candidates.slice(0,PUBLICATION.slots)','Math.round(score/10000) : -2':'Math.round(score/PUBLICATION.reputationScale) : -PUBLICATION.emptyLoss','length * 5':'length * PUBLICATION.pressure','week(s.day) % 2 === 0':'week(s.day) % PUBLICATION.grantFrequency === 0','s.grants += 1 + (score >= 30000 ? 1 : 0)':'s.grants += PUBLICATION.baseGrants + (score >= PUBLICATION.grantThreshold ? 1 : 0)','Math.min(100,k.reduce':'Math.min(SUMMARY.max,k.reduce','Math.min(100,t.reduce':'Math.min(SUMMARY.max,t.reduce','s.config.days/7':'s.config.days/CALENDAR.daysPerWeek','*2) * 100':'*SUMMARY.teamArticlesPerWeek) * SUMMARY.max',') * 100':') * SUMMARY.max','total:0.4*K+0.6*T,good:K>=50 && T>=50 && 0.4*K+0.6*T>=60':'total:SUMMARY.khueWeight*K+SUMMARY.teamWeight*T,good:K>=SUMMARY.branchThreshold && T>=SUMMARY.branchThreshold && SUMMARY.khueWeight*K+SUMMARY.teamWeight*T>=SUMMARY.totalThreshold','pay(s,1)':'pay(s,RESEARCH.stepCost)','p.tools.includes(step[0])?1:0':'p.tools.includes(step[0])?RESEARCH.toolBonus:0',')/7)':')/RESEARCH.questDifficulty)','p.stats[step[0]]+=0.1; p.fatigue+=4':'p.stats[step[0]]+=RESEARCH.stepGrowth; p.fatigue+=RESEARCH.stepFatigue','q.steps.length===4':'q.steps.length===QUEST_STEPS.length','q.quality.reduce((a,b)=>a+b,0)/4,attraction:8':'q.quality.reduce((a,b)=>a+b,0)/QUEST_STEPS.length,attraction:RESEARCH.questAttraction'})
    edit('src/domain/personal.js',{'export function applyPersonalAction':"import {PERSONAL} from '../../content/gameplay/balance.js';\nexport function applyPersonalAction",'target.events===2':'target.events===PERSONAL.synergyEvents','p.fatigue+=10':'p.fatigue+=PERSONAL.jobFatigue','p.stats[action.stat]+=0.5; p.fatigue+=4':'p.stats[action.stat]+=PERSONAL.trainingGrowth; p.fatigue+=PERSONAL.trainingFatigue','p.fatigue-20':'p.fatigue-PERSONAL.restRecovery','p.bond>=3 && p.events>=2':'p.bond>=PERSONAL.dateBond && p.events>=PERSONAL.dateEvents','s.money>=50':'s.money>=PERSONAL.boostCost','s.money-=50':'s.money-=PERSONAL.boostCost','s.energy++':'s.energy+=PERSONAL.boostEnergy','p.stats[action.stat]+=0.5':'p.stats[action.stat]+=PERSONAL.upgradeGrowth'})

    for name in ['index','sandbox','gameplay','pixel','interaction']:
        path = name+'.html'
        source = read(path)
        source = re.sub(r'<title>.*?</title>',f'<title data-text="page.{name}"></title>',source)
        source = re.sub(r'<noscript>.*?</noscript>','<noscript><iframe src="content/fallback/vi.html"></iframe></noscript>',source)
        write(path,source)
    for path in ['src/main.js','src/gameplay/main.js','src/pixel/interaction-main.js']:
        source = read(path)
        relative = './shared/documentText.js' if path == 'src/main.js' else '../shared/documentText.js'
        write(path,"import {applyDocumentText} from '"+relative+"';\napplyDocumentText();\n"+source)
    print('Extracted balance and save validation; localized page shells')

if __name__ == '__main__': main()

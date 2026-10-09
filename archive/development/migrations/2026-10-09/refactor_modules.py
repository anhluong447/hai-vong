"""One-time module extraction; archived with the migration record after use."""
from pathlib import Path
import re
from refactor_content import read, write, expression_end

def functions(source):
    starts = list(re.finditer(r'^(?:export )?function (\w+)\(', source, re.M))
    result = {}
    for match in starts:
        body_match = re.search(r'\)\s*\{', source[match.end():])
        opening = match.end() + body_match.end() - 1
        end = expression_end(source, opening + 1) + 1
        result[match.group(1)] = (match.start(), end, source[match.start():end])
    return result

def export(value):
    return value if value.startswith('export ') else 'export ' + value

def main():
    engine = read('src/gameplay/engine.js')
    # Persist localization-independent log records. The UI formats them later.
    offset = 0
    while True:
        start = engine.find('note(s,t(', offset)
        if start < 0:
            break
        opening = start + len('note(s,t')
        # Locate balanced call parentheses, ignoring nested templates and strings.
        tail = engine[opening:]
        depth, i, quote = 0, 0, None
        from refactor_content import string_end, template
        while i < len(tail):
            if tail[i] in "'\"": i = string_end(tail, i); continue
            if tail[i] == '`': i = template(tail, i)[0]; continue
            if tail[i] == '(': depth += 1
            if tail[i] == ')':
                depth -= 1
                if depth == 0: break
            i += 1
        engine = engine[:start] + 'note(s,' + tail[1:i] + engine[opening+i+1:]
        offset = start + 7
    engine = engine.replace("function note(s,message) { s.log.push({day:s.day,phase:s.phase,message}); }", "function note(s,textKey,params = {}) { s.log.push({day:s.day,phase:s.phase,textKey,params}); }")
    engine = engine.replace('version:1,config:cfg', 'version:2,config:cfg')
    funcs = functions(engine)
    calendar = engine[engine.index('export const weekend'):engine.index('export const joined')]
    calendar += export(funcs['consumeSlot'][2]) + '\n'
    write('src/domain/calendar.js', "import {t} from '../shared/text.js';\n" + calendar)
    people = engine[engine.index('export const joined'):funcs['addCases'][0]]
    write('src/domain/people.js', people)
    shared_names = ['note','require','pay','researchAllowed','busy','available','queue','feedback']
    shared = "import {t} from '../shared/text.js';\nimport {person} from './people.js';\n"
    shared += '\n'.join(export(funcs[name][2]) for name in shared_names) + '\n'
    write('src/domain/actions.js', shared)
    journalism_names = ['addCases','addQuest','processWork','publish','summary']
    journalism = "import {t} from '../shared/text.js';\nimport {templates, QUEST_STEPS, STAT_NAMES} from '../../content/gameplay/definitions.js';\nimport {week,weekend} from './calendar.js';\nimport {person,effectiveStat} from './people.js';\nimport {note,require,pay,researchAllowed,busy,available,queue,feedback} from './actions.js';\n"
    journalism += '\n'.join(export(funcs[name][2]) for name in journalism_names) + '\n'
    transition = funcs['transition'][2]
    start, end = transition.index("else if (type === 'open')"), transition.index(" else if (type === 'endClub')")
    research = transition[start:end]
    research = research.removeprefix('else ')[:-1] # Final brace belongs to the if chain.
    journalism += "export function applyResearchAction(s,action) {\n const {type}=action;\n " + research + '}\n return s;\n}\n'
    transition = transition[:start] + "else if (['open','assign','quest','write'].includes(type)) { applyResearchAction(s,action); }" + transition[end:]
    start, end = transition.index("else if (type === 'activity')"), transition.index(" else if (type==='select')")
    personal = transition[start:end].removeprefix('else ')[:-1]
    personal_header = "import {t} from '../shared/text.js';\nimport {STAT_NAMES} from '../../content/gameplay/definitions.js';\nimport {person} from './people.js';\nimport {consumeSlot} from './calendar.js';\nimport {note,require,researchAllowed} from './actions.js';\n"
    write('src/domain/personal.js', personal_header + "export function applyPersonalAction(s,action) {\n const {type}=action;\n " + personal + '}\n return s;\n}\n')
    transition = transition[:start] + "else if (['activity','date','gift','tool','boost','upgrade'].includes(type)) { return applyPersonalAction(s,action); }" + transition[end:]
    write('src/domain/journalism.js', journalism)
    session_header = "import {t} from '../shared/text.js';\nimport {STAT_NAMES,DEFAULTS,roster,QUEST_STEPS} from '../../content/gameplay/definitions.js';\nimport {week,weekend,consumeSlot} from './calendar.js';\nimport {person} from './people.js';\nimport {addCases,addQuest,processWork,publish,applyResearchAction} from './journalism.js';\nimport {applyPersonalAction} from './personal.js';\nimport {note,require,busy,available,queue} from './actions.js';\nconst clone = value => structuredClone(value);\n"
    write('src/domain/session.js', session_header + funcs['createSession'][2] + '\n' + transition + '\n')
    write('src/gameplay/engine.js', "// Stable facade for browser pages, playtests and existing integrations.\nexport {createSession,transition} from '../domain/session.js';\nexport {joined,person,effectiveStat} from '../domain/people.js';\nexport {week,weekend,weekday} from '../domain/calendar.js';\nexport {summary} from '../domain/journalism.js';\nexport {STAT_NAMES,DEFAULTS,QUEST_STEPS} from '../../content/gameplay/definitions.js';\n")

    ui = read('src/gameplay/main.js').replace("import {t}", "import {t,eventText}")
    ui = ui.replace("state.log.at(-1)?.message", "(state.log.at(-1) ? eventText(state.log.at(-1)) : '')")
    ui = ui.replace('(l.message)', '(eventText(l))')
    # Separate read-only panels from session lifetime and modal orchestration.
    funcs = functions(ui)
    panel_names = ['casesPanel','questsPanel','teamPanel','editorPanel','reportsPanel','feedback']
    panels = "import {t,eventText} from '../shared/text.js';\nimport {joined,person,week,weekend,summary,STAT_NAMES,QUEST_STEPS,effectiveStat} from '../gameplay/engine.js';\nimport {element as el,text,button} from '../ui/dom.js';\n"
    panels += 'export function createGameplayPanels(context) {\n'
    for name in panel_names:
        value = funcs[name][2]
        opening = value.index('{')
        value = value[:opening+1] + '\n const {state,place,fmt,select,metric,dispatch,isFree}=context();\n' + value[opening+1:]
        panels += value + '\n'
    panels += 'return {' + ','.join(panel_names) + '};\n}\n'
    write('src/presentation/gameplay-panels.js', panels)
    for name in sorted(panel_names, key=lambda name: funcs[name][0], reverse=True):
        start, end, _ = funcs[name]
        ui = ui[:start] + ui[end:]
    ui = ui.replace("from './engine.js", "from '../gameplay/engine.js")
    ui = ui.replace("const pixelMode=location.pathname.endsWith('/pixel.html');", '')
    imports = '\n'.join(line for line in ui.splitlines() if line.startswith('import '))
    imports += "\nimport {createGameplayPanels} from './gameplay-panels.js';\nimport {GameplaySaveService} from '../infrastructure/GameplaySaveService.js';\nimport {GameSession} from '../application/GameSession.js';\n"
    body = '\n'.join(line for line in ui.splitlines() if not line.startswith('import '))
    body = body.replace("const KEY=pixelMode?'clb-bao-chi.pixel.v1':'clb-bao-chi.gameplay.v1';", "const saves=new GameplaySaveService({mode:pixelMode?'pixel':'gameplay',storage});\nconst session=new GameSession();")
    body = body.replace('let state=createSession()', 'let state=session.state')
    body = body.replace('state=transition(state,action)', 'state=session.execute(action)')
    body = body.replace('state=createSession(state.config)', 'state=session.reset(state.config)')
    body = body.replace('state=next;', 'state=session.replace(next);')
    save_start, save_end = body.index('function save()'), body.index('function exportSession()')
    old_save = body[save_start:save_end]
    old_save = old_save.replace('localStorage.setItem(KEY,JSON.stringify(pixelMode?{state,world:world.snapshot()}:state))', 'saves.save(state,pixelMode?world.snapshot():null)')
    begin = old_save.index('const payload=JSON.parse(')
    finish = old_save.index('if(!confirm(', begin)
    old_save = old_save[:begin] + 'const payload=saves.load();const candidate=payload.state;' + old_save[finish:]
    old_save = old_save.replace('state=candidate;', 'state=session.replace(candidate);')
    body = body[:save_start] + old_save + body[save_end:]
    insert = body.index('function dispatch(')
    body = body[:insert] + "const {casesPanel,questsPanel,teamPanel,editorPanel,reportsPanel,feedback}=createGameplayPanels(()=>({state,place,fmt,select,metric,dispatch,isFree}));\n" + body[insert:]
    write('src/presentation/gameplay-controller.js', imports + '\nexport async function mountGameplay({pixelMode=false,storage=globalThis.localStorage}={}) {\n' + body + '\n}\n')
    write('src/gameplay/main.js', "import {mountGameplay} from '../presentation/gameplay-controller.js';\n\nawait mountGameplay({pixelMode:location.pathname.endsWith('/pixel.html')});\n")
    print('Extracted domain systems and presentation panels')

if __name__ == '__main__': main()

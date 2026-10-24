# Story JSON v1

Authored sources use JSON, stable ASCII namespaced IDs and schemaVersion/contentVersion.
Start at `content/project.json`; its schema paths and pack paths are relative to that
file. Each pack lists `{kind,path,locale?}` documents relative to its manifest.
`foundation-demo` is a development pack. Production export must explicitly exclude it.

## Story

A chapter is `{id,entryNodeId,nodes:[{id,commands:[]}]}`. Every node and every command
has a stable ID; commands are unique across the chapter. Never use array index/line
number as save identity. Nodes end explicitly with `end`, `jump` or `choose`.
Commands after one of these terminals are invalid. Static unreachable nodes are errors;
state-dependent reachability requires the traversal bot in T12.

```json
{
  "id": "sample.chapter",
  "entryNodeId": "entry",
  "nodes": [
    {"id":"entry","commands":[
      {"id":"greeting","op":"say","textKey":"sample.greeting","params":{"name":"Khu?"}},
      {"id":"route","op":"choose","choices":[
        {"id":"yes","textKey":"sample.yes","target":"finish","condition":{"flag":"sample.ready","equals":false}}
      ]}
    ]},
    {"id":"finish","commands":[
      {"id":"mark","op":"setFlag","flagId":"sample.ready","value":true},
      {"id":"done","op":"end"}
    ]}
  ]
}
```

The referenced locale entry `sample.greeting` owns its value and `params:["name"]`;
`sample.yes` owns its value and `params:[]`. Names of parameters must match exactly.
The example is illustrative; runnable sources are in `content/dev/foundation/`.

Flags declare `{id,type,default,scope,values?,min?,max?}` with type boolean/integer/
string/enum and scope run/profile. Defaults and assignments are type/range checked.
Profile flags never substitute for per-run mandatory progression. New Game resets run
flags; slot import must not replace profile state without an explicit merge policy.

Other bounded opcodes: `setBackdrop` uses assetId; `showActor` actorId; `playCue` cueId;
`transition` sceneId; `jump` target; `emitEffect` effectId and params. An effect definition
is `{id,handlerId,paramsSchema}`; for example a registered `flag.set` handler can own
an effect with params `{flagId:"sample.ready",value:true}`. Handler capability must
exist in the application registry before that definition validates. No eval/JS callbacks.
T03 supplies generic runtime handlers; this document does not fabricate them as content.

## Shared validation

`validateProject({project,schemas,documents,capabilities?})` returns Result<ContentBundle>.
Each document carries `{sourceId,kind,data,locale?}`. Errors include `code`, `sourceId`,
JSON pointer and relatedIds. Catalog definitions are copied/frozen; failed resolution
returns `content.reference.missing` rather than a translated-label lookup or fallback.

Checked-in schemas use a focused vocabulary: type, enum, required, properties,
additionalProperties, items, minItems, minLength, minimum, maximum and pattern.
Unknown schema keywords fail closed. This is not a claim of full JSON Schema draft
compliance; new constructs require extending the shared validator and behavioral tests.
Gameplay/scenes/hearings receive their own schemas with the implementation task.

Run `python tools/check.py content` to validate the real project in a fresh browser;
`python tools/check.py unit` covers deliberate malformed fixtures and source roundtrips.
The editor will call this same validator. Never maintain a relaxed editor-only schema.

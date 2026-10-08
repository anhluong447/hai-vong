# Script format (`.vns`)

Chapters live in `content/chapters/<route>/<id>.vns` and are listed in
`content/manifest.json`. The format is deliberately close to the chapter
drafts in `Story/`, so writing a chapter and scripting it are almost the same job.

```text
@chapter title="Người mới ở cổng trường" season=autumn

@scene gate time=morning weather=fog
@ambience sea_wind
[Sương mù ven biển chưa tan.]
Hải Vọng đón tôi bằng một thứ mùi không lẫn vào đâu được...
(Chắc người nghĩ ra khẩu hiệu này chưa từng phải leo con dốc này.)
Khuê: "...Cũng được."
Long: (Cười toác mang tai) "Đi, đi chung lên dốc!"
```

## Lines

| Line | Meaning |
|---|---|
| `Tên: "Lời thoại"` | Dialogue. The name is resolved via `characters.json` (name, short name, aliases). |
| `Tên: (cử chỉ) "Lời thoại"` | Dialogue with a manner note shown next to the name. |
| `Tên hiển thị [id]: "..."` | Show any name but bind the line to a character, e.g. `Nam sinh lạ mặt [long]: "Ê!"`. |
| `(...)` | Khuê's inner thought. |
| `[...]` | Stage direction / sound / scene description, shown small and italic. |
| anything else | Narration. |
| `\| text` | Force narration (use it when a narration line contains `: "`). |
| `# ...` or `// ...` | Comment. `-----` and `=====` separators are ignored. |
| `== label` | A jump target. |

Both straight `"..."` and curly `“...”` quotes work.

## Stage & presentation

| Directive | Effect |
|---|---|
| `@scene <location> [time=] [weather=] [season=]` | Change location. Omitted values carry over from the previous scene; season defaults to the chapter's. Clears the cast. |
| `@show <id> [at=<mark>] [expr=<expression>]` | Put a character on stage at a mark defined by the location. |
| `@hide <id>` / `@hide *` | Remove one / everyone. |
| `@move <id> to=<mark> [speed=1.6]` | Walk a character to a mark (waits until they arrive). |
| `@face <id> to=player\|<id>\|<mark>\|<hotspot>` | Turn a character. |
| `@camera follow\|wide\|close` | Camera framing. Dialogue automatically frames the speaker over Khuê's shoulder. |
| `@card "Title" [sub="Subtitle"]` | Full-screen title card (chapter titles, time skips). |
| `@fade out\|in [ms=600]` | Fade to/from black. Dialogue remains readable over black. |
| `@wait <ms>` · `@shake` · `@toast "text"` | Pause, screen shake, small notification. |
| `@bgm <id>\|none` · `@ambience <id>\|none` · `@sfx <id>` | Audio. Ids map to files in `content/audio.json` or to built-in placeholders. |
| `@save` | Checkpoint: autosave here. Put one after every `@scene`. |

Values: `time` = dawn, morning, noon, afternoon, dusk, night ·
`weather` = clear, fog, rain, overcast · `season` = autumn, winter, spring, summer.

## Story systems (from the bible)

| Directive | Effect |
|---|---|
| `@bond <id> +2` | ĐỘ GẮN BÓ with a character (negative allowed). |
| `@cost <tag>` | Record a CÁI GIÁ that was paid, e.g. `safety`, `friendship`, `time`. |
| `@flag <name>` / `@flag <name>=<value>` / `@unflag <name>` | Story flags. |
| `@fragment <n>` | Collect Mảnh Thư number n. |
| `@notebook unlock\|ask\|answer <n>` | Notebook question state (Rule 3: whoever asks must be ready to be asked). |
| `@ending <route.kind> "Title"` | Unlock an ending in the profile (e.g. `van.true`) and show its card. |

## Choices

```text
@choice
  > [NÉ TRÁNH] "Đi lạc thôi." -> room0_avoid
  > [THẬT LÒNG] "Tôi tìm Phòng Số 0." -> room0_sincere
  > [MỈA MAI] "Tâm bạn sáng tới mức nào?" -> room0_wry
  > "Im lặng." -> room0_silent  if bond.van >= 2
@endchoice
```

The stance tag (`[NÉ TRÁNH]`, `[THẬT LÒNG]`, `[MỈA MAI]` or `avoid`/`sincere`/`wry`)
is counted automatically and shown to the player. An option without a tag is neutral.
`if <condition>` hides the option when false.

## Exploration

```text
@explore hint="Tìm lối lên gác mái"
  on board "Xem Bảng Vàng" -> look_board
  on long -> talk_long_first  if !flag.talkedLong
  on long -> talk_long_again
  exit attic_stairs "Lên gác mái" -> attic_door
@endexplore

== look_board
Bảng Vàng tháng 9...
@return
```

- The player walks freely; walking up to a hotspot shows its prompt, and pressing E triggers it.
- `on` runs the label as a *side visit*: it must end with `@return`, which comes back to the same exploration.
- `exit` leaves the exploration and continues from the label.
- Hotspot ids come from the location's 3D set (`src/infra/render/locations/*.js`).
  Characters on stage are hotspots automatically (`on long`). If the set does not
  define a hotspot yet, it is placed automatically so the scene stays playable.
- For the same hotspot, the first handler whose condition is true wins.

## Flow

| Directive | Effect |
|---|---|
| `@goto <label>` | Jump. |
| `@call <label>` / `@return` | Run a label and come back. |
| `@if <cond>` / `@elseif <cond>` / `@else` / `@endif` | Branch. |
| `@next <chapterId>` | Continue with another chapter from the manifest. |
| `@end` | End of the story path. |

## Conditions

```text
flag.metLong && bond.van >= 2
!flag.silence || stance.sincere > stance.avoid
cost.safety >= 1 && fragments == 10
notebook.9.answered
profile.routes >= 2          # hidden route unlock (Hy)
profile.ending.van.true
```

Roots: `flag`, `bond`, `stance`, `cost` (count of a tag), `costs` (total),
`fragment.<n>` / `fragments` (count), `notebook.<n>[.asked|.answered]`, and
`profile.endings | profile.routes | profile.route.<id> | profile.ending.<id>`,
which persist across playthroughs. Operators: `! && || == != > >= < <=` and parentheses.
Missing values count as `0` / `false`.

## Errors

Script errors are reported with the file and line numbers, both in the game (a red panel)
and by the test suite. The test suite also checks that every speaker name resolves to a
character, which catches narration lines accidentally read as dialogue.

## Writer workflow

1. Write or edit the `.vns` file.
2. Open `http://localhost:8080/?chapter=c01&label=room0_enter&debug` to jump straight
   to a label. The stage (location, cast, audio) is rebuilt automatically, and the debug panel
   shows flags, bonds and stances live. Toggle the panel with the `` ` `` key.
3. Open `http://localhost:8080/tests/` to validate every chapter.

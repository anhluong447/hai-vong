import { test, assert } from './harness.js';
import { parseScript, ScriptError } from '../src/core/script/ScriptParser.js';

const ops = (program) => program.instructions.map((i) => i.op);

test('parser: line kinds', () => {
  const p = parseScript([
    'Long: "Ê! Học sinh mới"',
    'Khuê: (Lẩm bẩm) "...Cũng được."',
    'Nam sinh lạ mặt [long]: “Cậu vào lớp nào?”',
    '(Nội tâm của Khuê.)',
    '[Âm thanh: BỐP!]',
    'Vị trí Top 1: Lục Thanh Vân – 9.6.',
    '| Người ta nói: "không"',
  ].join('\n'));
  const [a, b, c, d, e, f, g] = p.instructions;
  assert.deepEqual([a.kind, a.speaker, a.text], ['dialogue', 'Long', 'Ê! Học sinh mới']);
  assert.deepEqual([b.speaker, b.manner, b.text], ['Khuê', 'Lẩm bẩm', '...Cũng được.']);
  assert.deepEqual([c.speaker, c.speakerId, c.text], ['Nam sinh lạ mặt', 'long', 'Cậu vào lớp nào?']);
  assert.deepEqual([d.kind, d.text], ['thought', 'Nội tâm của Khuê.']);
  assert.deepEqual([e.kind, e.text], ['direction', 'Âm thanh: BỐP!']);
  assert.equal(f.kind, 'narration', 'colon without a quote is narration');
  assert.deepEqual([g.kind, g.text], ['narration', 'Người ta nói: "không"']);
});

test('parser: comments, separators and meta', () => {
  const p = parseScript('# comment\n// also\n-----\n=====\n@chapter title="Chap 1" season=autumn\nHello');
  assert.deepEqual(p.meta, { title: 'Chap 1', season: 'autumn' });
  assert.deepEqual(ops(p), ['say']);
});

test('parser: directives', () => {
  const p = parseScript([
    '@scene gate time=morning weather=fog',
    '@show long at=behind expr=smile',
    '@bond van +2',
    '@flag metLong',
    '@flag mood=3',
    '@notebook ask 9',
    '@card "Chap 1" sub="Người mới"',
    '@bgm none',
  ].join('\n'));
  const [scene, show, bond, flag, flag2, nb, card, bgm] = p.instructions;
  assert.deepEqual([scene.location, scene.time, scene.weather], ['gate', 'morning', 'fog']);
  assert.deepEqual([show.id, show.at, show.expr], ['long', 'behind', 'smile']);
  assert.deepEqual([bond.id, bond.delta], ['van', 2]);
  assert.deepEqual([flag.name, flag.value], ['metLong', true]);
  assert.deepEqual([flag2.name, flag2.value], ['mood', 3]);
  assert.deepEqual([nb.action, nb.n], ['ask', 9]);
  assert.deepEqual([card.title, card.sub], ['Chap 1', 'Người mới']);
  assert.equal(bgm.id, null);
});

test('parser: if / elseif / else compile to jumps', () => {
  const p = parseScript([
    '@if bond.van >= 2', 'A', '@elseif flag.x', 'B', '@else', 'C', '@endif', 'D',
  ].join('\n'));
  assert.deepEqual(ops(p), ['jumpUnless', 'say', 'jump', 'jumpUnless', 'say', 'jump', 'say', 'say']);
  const [j0, , j2, j3, , j5] = p.instructions;
  assert.equal(j0.target, 3);
  assert.equal(j3.target, 6);
  assert.equal(j2.target, 7);
  assert.equal(j5.target, 7);
});

test('parser: choice with stances and conditions', () => {
  const p = parseScript([
    '@choice',
    '  > [NÉ TRÁNH] "Đi lạc thôi." -> a',
    '  > [THẬT LÒNG] "Tôi tìm Phòng Số 0." -> b if bond.van > 0',
    '  > wry "Tâm sáng tới mức nào?" -> c',
    '  > "Im lặng." -> c',
    '@endchoice',
    '== a', 'x', '== b', 'y', '== c', 'z',
  ].join('\n'));
  const { options } = p.instructions[0];
  assert.deepEqual(options.map((o) => o.stance), ['avoid', 'sincere', 'wry', 'neutral']);
  assert.deepEqual(options.map((o) => o.target), ['a', 'b', 'c', 'c']);
  assert.equal(options[1].cond.type, 'cmp');
  assert.deepEqual(p.labels, { a: 1, b: 2, c: 3 });
});

test('parser: explore handlers', () => {
  const p = parseScript([
    '@explore hint="Tìm lối lên"',
    '  on plaque "Xem biển" -> look',
    '  exit door -> out if flag.ready',
    '@endexplore',
    '== look', '@return', '== out', 'Bye',
  ].join('\n'));
  const ex = p.instructions[0];
  assert.equal(ex.hint, 'Tìm lối lên');
  assert.deepEqual(ex.handlers.map((h) => [h.kind, h.hotspot, h.prompt, h.target]), [
    ['on', 'plaque', 'Xem biển', 'look'],
    ['exit', 'door', null, 'out'],
  ]);
});

test('parser: reports all errors with line numbers', () => {
  const err = assert.throws(() => parseScript([
    '@goto nowhere',
    '@bogus',
    '@bond van lots',
    '@if flag.a',
    '@choice',
    '  > [MAYBE] "x" -> y',
  ].join('\n'), { file: 'bad.vns' }));
  assert.ok(err instanceof ScriptError);
  const lines = err.errors.map((e) => e.line);
  assert.deepEqual(lines.sort(), [1, 2, 3, 4, 5, 6].sort());
  assert.ok(err.message.startsWith('bad.vns'));
});

test('parser: duplicate labels and unknown condition roots', () => {
  assert.throws(() => parseScript('== a\nx\n== a\ny'), /Duplicate label/);
  assert.throws(() => parseScript('@if bnod.van > 1\nx\n@endif'), /Unknown "bnod"/);
});

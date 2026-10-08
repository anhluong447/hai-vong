/**
 * Tiny, safe expression language for script conditions (no eval).
 *
 *   flag.metLong && bond.van >= 2
 *   !flag.silenceEvent || stance.sincere > stance.avoid
 *   profile.routes >= 2 && fragments == 10
 *
 * Grammar:
 *   or      := and ('||' and)*
 *   and     := unary ('&&' unary)*
 *   unary   := '!' unary | compare
 *   compare := primary (('=='|'!='|'>='|'<='|'>'|'<') primary)?
 *   primary := number | "string" | true | false | path | '(' or ')'
 */
export class ConditionError extends Error {}

const TOKEN_RE = /\s*(?:(\d+(?:\.\d+)?)|("(?:[^"\\]|\\.)*")|(&&|\|\||==|!=|>=|<=|>|<|!|\(|\))|([A-Za-z_]\w*(?:\.\w+)*))/y;
const COMPARATORS = new Set(['==', '!=', '>=', '<=', '>', '<']);

function tokenize(src) {
  const tokens = [];
  TOKEN_RE.lastIndex = 0;
  while (TOKEN_RE.lastIndex < src.length) {
    if (/^\s*$/.test(src.slice(TOKEN_RE.lastIndex))) break;
    const start = TOKEN_RE.lastIndex;
    const m = TOKEN_RE.exec(src);
    if (!m) throw new ConditionError(`Unexpected character at ${start} in "${src}"`);
    if (m[1] !== undefined) tokens.push({ kind: 'num', value: m[1] });
    else if (m[2] !== undefined) tokens.push({ kind: 'str', value: m[2] });
    else if (m[3] !== undefined) tokens.push({ kind: 'op', value: m[3] });
    else tokens.push({ kind: 'ident', value: m[4] });
  }
  return tokens;
}

/**
 * @param {string} src
 * @param {{ roots?: readonly string[] }} [options] allowed first path segments
 */
export function parseCondition(src, { roots } = {}) {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];

  const parseOr = () => {
    let left = parseAnd();
    while (peek()?.value === '||') { take(); left = { type: 'or', left, right: parseAnd() }; }
    return left;
  };
  const parseAnd = () => {
    let left = parseUnary();
    while (peek()?.value === '&&') { take(); left = { type: 'and', left, right: parseUnary() }; }
    return left;
  };
  const parseUnary = () => {
    if (peek()?.value === '!') { take(); return { type: 'not', expr: parseUnary() }; }
    return parseCompare();
  };
  const parseCompare = () => {
    const left = parsePrimary();
    const op = peek();
    if (op?.kind === 'op' && COMPARATORS.has(op.value)) {
      take();
      return { type: 'cmp', op: op.value, left, right: parsePrimary() };
    }
    return left;
  };
  const parsePrimary = () => {
    const t = take();
    if (!t) throw new ConditionError(`Unexpected end of condition "${src}"`);
    if (t.kind === 'num') return { type: 'lit', value: Number(t.value) };
    if (t.kind === 'str') return { type: 'lit', value: JSON.parse(t.value) };
    if (t.value === '(') {
      const expr = parseOr();
      if (take()?.value !== ')') throw new ConditionError(`Missing ")" in "${src}"`);
      return expr;
    }
    if (t.kind === 'ident') {
      if (t.value === 'true') return { type: 'lit', value: true };
      if (t.value === 'false') return { type: 'lit', value: false };
      const path = t.value.split('.');
      if (roots && !roots.includes(path[0])) {
        throw new ConditionError(`Unknown "${path[0]}" in "${src}" (expected one of: ${roots.join(', ')})`);
      }
      return { type: 'path', path };
    }
    throw new ConditionError(`Unexpected "${t.value}" in "${src}"`);
  };

  const ast = parseOr();
  if (i < tokens.length) throw new ConditionError(`Unexpected "${tokens[i].value}" in "${src}"`);
  return ast;
}

/**
 * @param {object} ast from parseCondition
 * @param {(path: string[]) => unknown} resolve maps a path to a value
 */
export function evaluate(ast, resolve) {
  switch (ast.type) {
    case 'lit': return ast.value;
    case 'path': return resolve(ast.path);
    case 'not': return !evaluate(ast.expr, resolve);
    case 'and': return Boolean(evaluate(ast.left, resolve)) && Boolean(evaluate(ast.right, resolve));
    case 'or': return Boolean(evaluate(ast.left, resolve)) || Boolean(evaluate(ast.right, resolve));
    case 'cmp': {
      const a = normalize(evaluate(ast.left, resolve));
      const b = normalize(evaluate(ast.right, resolve));
      switch (ast.op) {
        case '==': return a === b;
        case '!=': return a !== b;
        case '>=': return a >= b;
        case '<=': return a <= b;
        case '>': return a > b;
        case '<': return a < b;
      }
    }
  }
  throw new ConditionError(`Bad condition node "${ast.type}"`);
}

/** Missing values count as 0 and booleans as 0/1, so `bond.x > 0` works before any bond exists. */
function normalize(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

import { Parser, type Options } from 'acorn';
import * as acornLoose from 'acorn-loose';
import { tsPlugin } from 'acorn-typescript';

// acorn extended with a TypeScript-aware plugin
const TsParser = Parser.extend(tsPlugin() as unknown as Parameters<typeof Parser.extend>[0]);

const PARSE_OPTIONS: Options = { ecmaVersion: 'latest', sourceType: 'module' };

/**
 * Parses the script into an offset-accurate AST, preferring fidelity but never
 * throwing.
 *
 * Three tiers, fastest first:
 *
 *  1. Plain acorn. It is ~5x faster than the TS-aware parser and succeeds on
 *     plain-JS scripts (the common case for k6). Crucially, plain JS has no
 *     type positions, so there is no type-position literal to mis-flag — a file
 *     acorn accepts is genuinely JS. Any TypeScript syntax makes it throw, which
 *     just falls through to tier 2.
 *  2. The TS-aware parser (`acorn` + `acorn-typescript`). Handles type
 *     annotations and distinguishes type-position literals (`type K = 'AKIA…'`,
 *     `x: 'live' | 'test'`) from runtime values, so it won't flag a
 *     secret-shaped string that only appears in a type. It rejects the whole
 *     file on a construct `acorn-typescript` doesn't implement (e.g.
 *     `satisfies`) or on a mid-edit syntax error.
 *  3. `acorn-loose`. Recovers around bad tokens and always returns a best-effort
 *     tree with source-accurate offsets, so one unsupported construct or a
 *     transient syntax error no longer blanks every finding in the file. The
 *     loose tree is not TS-aware, so a type-position literal in a recovered file
 *     may be flagged; a low-confidence false positive in an already-unusual file
 *     is preferable to missing a secret.
 *
 * Returns null only if even the loose parse throws, which it is not expected to.
 */
function parseScript(script: string): AstNode | null {
  try {
    return Parser.parse(script, PARSE_OPTIONS) as unknown as AstNode;
  } catch {
    try {
      return TsParser.parse(script, PARSE_OPTIONS) as unknown as AstNode;
    } catch {
      try {
        return acornLoose.parse(script, PARSE_OPTIONS) as unknown as AstNode;
      } catch {
        return null;
      }
    }
  }
}

export interface StringLiteral {
  body: string;
  literalStart: number;
  literalEnd: number;
  contentStart: number;
  contentEnd: number;
  kind: 'string' | 'template';
  name?: string;
  embeddedOnly?: boolean;
}

interface AstNode {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
}

function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && typeof (value as AstNode).type === 'string';
}

/**
 * Depth-first walk that appends every string / template literal to `out`.
 *
 * A plain recursive function rather than a generator: on a large AST the
 * `yield*` delegation and per-node iterator allocation of a generator walk cost
 * more than the traversal itself. This visits the same nodes with none of that
 * overhead.
 */
function collectStringLiterals(node: unknown, parent: AstNode | null, out: StringLiteral[]): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectStringLiterals(item, parent, out);
    }
    return;
  }
  if (!isNode(node)) {
    return;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    out.push({
      body: node.value.trim(),
      literalStart: node.start,
      literalEnd: node.end,
      contentStart: node.start + 1,
      contentEnd: node.end - 1,
      kind: 'string',
      name: resolveAssignedName(node, parent),
    });
  } else if (node.type === 'TemplateLiteral' && Array.isArray(node.expressions)) {
    const quasis = node.quasis as Array<{ start: number; end: number; value: { cooked?: string | null } }>;
    if (node.expressions.length === 0) {
      const cooked = quasis[0]?.value.cooked ?? '';
      out.push({
        body: cooked.trim(),
        literalStart: node.start,
        literalEnd: node.end,
        contentStart: node.start + 1,
        contentEnd: node.end - 1,
        kind: 'template',
        name: resolveAssignedName(node, parent),
      });
    } else {
      for (const quasi of quasis) {
        const cooked = quasi.value.cooked ?? '';
        if (cooked.length === 0) {
          continue;
        }
        out.push({
          body: cooked.trim(),
          literalStart: quasi.start,
          literalEnd: quasi.end,
          contentStart: quasi.start,
          contentEnd: quasi.end,
          kind: 'template',
          embeddedOnly: true,
        });
      }
    }
  }

  for (const key of Object.keys(node)) {
    collectStringLiterals(node[key], node, out);
  }
}

function identifierName(id: unknown): string | undefined {
  return isNode(id) && id.type === 'Identifier' ? (id.name as string) : undefined;
}

/** Name of an object/class member key: `foo`, `'foo'` or `['foo']`. */
function memberName(key: unknown): string | undefined {
  if (!isNode(key)) {
    return undefined;
  }
  if (key.type === 'Identifier') {
    return key.name as string;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return undefined;
}

/** Name an assignment targets: `foo = …` or `obj.foo = …`. */
function assignmentTargetName(target: unknown): string | undefined {
  if (!isNode(target)) {
    return undefined;
  }
  if (target.type === 'Identifier') {
    return target.name as string;
  }
  if (target.type === 'MemberExpression') {
    return memberName(target.property);
  }
  return undefined;
}

function resolveAssignedName(node: AstNode, parent: AstNode | null): string | undefined {
  if (!parent) {
    return undefined;
  }
  switch (parent.type) {
    case 'VariableDeclarator':
      return parent.init === node ? identifierName(parent.id) : undefined;
    case 'Property':
    case 'PropertyDefinition':
      return parent.value === node ? memberName(parent.key) : undefined;
    case 'AssignmentExpression':
      return parent.right === node ? assignmentTargetName(parent.left) : undefined;
    default:
      return undefined;
  }
}

/**
 * Every string / template literal in the script, in source order, with its
 * decoded body and original offsets. An interpolated template yields one entry
 * per static chunk (`embeddedOnly`) rather than a single whole-value entry.
 */
export function iterateStringLiterals(script: string): StringLiteral[] {
  const ast = parseScript(script);
  if (!ast) {
    return [];
  }

  const literals: StringLiteral[] = [];
  collectStringLiterals(ast, null, literals);
  return literals;
}

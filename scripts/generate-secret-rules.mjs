// Compiles the secret scanner's TOML rule files into a plain TypeScript module.
//
// The rules are authored/vendored as TOML (`src/secret-scanner/rules/*.toml`)
// but the library must not carry a TOML parser at runtime, and neither rollup
// nor jest resolve `.toml` imports in this repo. So the TOML is parsed here,
// ahead of time, and emitted as data in `rules.generated.ts`, which is checked
// in and imported like any other module.
//
// Run with `yarn gen:secret-rules` after editing either TOML file.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';

const rulesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'secret-scanner', 'rules');
const outFile = path.join(rulesDir, 'rules.generated.ts');

const KEPT_FIELDS = ['id', 'description', 'regex', 'confidence', 'entropy', 'keywords'];

function loadRules(fileName) {
  const parsed = parseToml(readFileSync(path.join(rulesDir, fileName), 'utf8'));
  const rules = Array.isArray(parsed.rules) ? parsed.rules : [];
  return rules.map((rule) => {
    const kept = {};
    for (const field of KEPT_FIELDS) {
      if (rule[field] !== undefined) {
        kept[field] = rule[field];
      }
    }
    return kept;
  });
}

const customRules = loadRules('custom.toml');
const gitleaksRules = loadRules('gitleaks.toml');

const serialize = (rules) => JSON.stringify(rules, null, 2);

const output = `/* eslint-disable */
// GENERATED FILE — DO NOT EDIT.
// Produced by \`yarn gen:secret-rules\` from ./custom.toml and ./gitleaks.toml.
//
// GITLEAKS_RULES is derived from the gitleaks default configuration
// (https://github.com/gitleaks/gitleaks), Copyright (c) 2019 Zachary Rice,
// licensed under the MIT License. Full text: ./gitleaks-LICENSE

/** A secret-detection rule in gitleaks rule format, narrowed to the fields we use. */
export interface SecretRule {
  id: string;
  description?: string;
  regex?: string;
  confidence?: 'high' | 'medium' | 'low';
  entropy?: number;
  keywords?: string[];
}

/** Grafana's tuned patterns. Authoritative over the gitleaks long tail. */
export const CUSTOM_RULES: SecretRule[] = ${serialize(customRules)};

/** The vendored gitleaks long tail. */
export const GITLEAKS_RULES: SecretRule[] = ${serialize(gitleaksRules)};
`;

writeFileSync(outFile, output);
console.log(`Wrote ${path.relative(process.cwd(), outFile)}: ${customRules.length} custom, ${gitleaksRules.length} gitleaks rules.`);

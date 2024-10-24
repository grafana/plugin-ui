import { Monaco } from '@grafana/ui';
import { Operator, OperatorType, SQLCompletionItemProvider } from '../types';
import { MACROS } from './macros';
import { SQLMonarchLanguage } from './types';

export function getStandardSQLCompletionProvider(
  monaco: Monaco,
  language: SQLMonarchLanguage
): SQLCompletionItemProvider {
  const provider: SQLCompletionItemProvider = { triggerCharacters: ['.', ' ', '$', ',', '(', "'"] };
  if (language && Array.isArray(language.builtinFunctions)) {
    provider.supportedFunctions = () => language.builtinFunctions!.map((f) => ({ id: f, name: f }));
  }

  const operators: Operator[] = [];
  if (language?.comparisonOperators?.length) {
    operators.push(
      ...language.comparisonOperators.map((f) => ({
        id: f.toLocaleLowerCase(),
        operator: f,
        type: OperatorType.Comparison,
      }))
    );
  }

  // some languages in the monaco language registry don't specify logical operators, only operators. if so, suggest them instead
  language.logicalOperators = language.logicalOperators ?? language.operators;
  if (language?.logicalOperators?.length) {
    operators.push(
      ...language.logicalOperators.map((f) => ({ id: f.toLocaleLowerCase(), operator: f, type: OperatorType.Logical }))
    );
  }

  provider.supportedOperators = () => operators;

  provider.supportedMacros = () => MACROS;

  return provider;
}

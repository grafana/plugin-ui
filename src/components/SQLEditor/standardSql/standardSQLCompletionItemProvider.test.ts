import { Monaco } from '@grafana/ui';
import { getStandardSQLCompletionProvider } from './standardSQLCompletionItemProvider';
import { SQLMonarchLanguage } from './types';

describe('standardSQLCompletionItemProvider', () => {
  describe('should include completion items based on the provided custom language', () => {
    const language = {
      id: 'custom-grafana-sql-language',
      tokenizer: {},
      builtinFunctions: ['SUM', 'AVG'],
      logicalOperators: ['AND', 'OR'],
      comparisonOperators: ['=', '!='],
    };
    const completionProvider = getStandardSQLCompletionProvider({} as Monaco, language);
    it('should use functions from language', () => {
      expect(completionProvider.supportedFunctions?.().map((f) => f.name)).toEqual(language.builtinFunctions);
    });
    it('should combine operators', () => {
      expect(completionProvider.supportedOperators?.().map((o) => o.operator)).toEqual(
        language.comparisonOperators?.concat(language.logicalOperators)
      );
    });
  });

  describe('should include completion items based on the provided monaco registry language', () => {
    const language: SQLMonarchLanguage = {
      id: 'postgres',
      tokenizer: {},
      builtinFunctions: ['SUM', 'AVG'],
      operators: ['AND', 'OR'],
    };
    const completionProvider = getStandardSQLCompletionProvider({} as Monaco, language);
    it('should use functions from language', () => {
      expect(completionProvider.supportedFunctions?.().map((f) => f.name)).toEqual(language.builtinFunctions);
    });
    it('should combine operators', () => {
      expect(completionProvider.supportedOperators?.().map((o) => o.operator)).toEqual(language.operators);
    });
  });
});

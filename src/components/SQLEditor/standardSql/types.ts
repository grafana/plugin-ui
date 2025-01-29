import { type RegistryItem } from '@grafana/data';
import { type monacoTypes } from '@grafana/ui';
import {
  type CustomSuggestion,
  type MacroType,
  type OperatorType,
  type PositionContext,
  type StatementPosition,
  type SuggestionKind,
} from '../types';
import { type LinkedToken } from '../utils/LinkedToken';

export interface SuggestionsRegistryItem extends RegistryItem {
  id: SuggestionKind;
  suggestions: (position: PositionContext, m: typeof monacoTypes) => Promise<CustomSuggestion[]>;
}

export interface MacrosRegistryItem extends RegistryItem {
  type: MacroType;
  text: string;
  args: string[];
}

export interface FunctionsRegistryItem extends RegistryItem {}
export interface OperatorsRegistryItem extends RegistryItem {
  operator: string;
  type: OperatorType;
}

export type StatementPositionResolver = (
  currentToken: LinkedToken | null,
  previousKeyword: LinkedToken | null,
  previousNonWhiteSpace: LinkedToken | null,
  previousIsSlash: Boolean
) => Boolean;

export interface StatementPositionResolversRegistryItem extends RegistryItem {
  id: StatementPosition;
  resolve: StatementPositionResolver;
}

export type SuggestionsResolver = <T extends PositionContext = PositionContext>(
  positionContext: T
) => Promise<CustomSuggestion[]>;

export interface SQLMonarchLanguage extends monacoTypes.languages.IMonarchLanguage {
  keywords?: string[];
  builtinFunctions?: string[];

  /* Example: AND, OR, LIKE */
  logicalOperators?: string[];
  /* Example: >, <>, = */
  comparisonOperators?: string[];

  /** Used by basic languages in the monaco registry **/
  operators?: string[];
}

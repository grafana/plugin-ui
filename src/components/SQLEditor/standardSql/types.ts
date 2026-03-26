import { type RegistryItem } from '@grafana/data';
import { type monacoTypes } from '@grafana/ui';
import {
  type CustomSuggestion,
  type MacroType,
  type OperatorType,
  type PositionContext,
  type StatementPosition,
  type StatementPositionResolver,
  type SuggestionKind,
  type SuggestionsResolver,
} from '../types';

export type { SQLMonarchLanguage } from '../types';

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

export interface StatementPositionResolversRegistryItem extends RegistryItem {
  id: StatementPosition;
  resolve: StatementPositionResolver;
}

export type { StatementPositionResolver, SuggestionsResolver };

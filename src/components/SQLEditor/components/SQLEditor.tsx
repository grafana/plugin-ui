import { CodeEditor, type Monaco, type monacoTypes } from '@grafana/ui';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { getStatementPosition } from '../standardSql/getStatementPosition';
import { getStandardSuggestions } from '../standardSql/getStandardSuggestions';
import { initSuggestionsKindRegistry, type SuggestionKindRegistryItem } from '../standardSql/suggestionsKindRegistry';
import {
  CompletionItemInsertTextRule,
  CompletionItemKind,
  CompletionItemPriority,
  type CustomSuggestion,
  type PositionContext,
  type SQLCompletionItemProvider,
  type StatementPosition,
  SuggestionKind,
} from '../types';
import { getSuggestionKinds } from '../utils/getSuggestionKind';
import { linkedTokenBuilder } from '../utils/linkedTokenBuilder';
import { defaultTableNameParser, getTableToken } from '../utils/tokenUtils';
import { TRIGGER_SUGGEST } from '../utils/commands';
import { v4 } from 'uuid';
import { Registry } from '@grafana/data';
import {
  type FunctionsRegistryItem,
  type MacrosRegistryItem,
  type OperatorsRegistryItem,
  type SQLMonarchLanguage,
  type StatementPositionResolversRegistryItem,
  type SuggestionsRegistryItem,
} from '../standardSql/types';
import { initStandardSuggestions } from '../standardSql/standardSuggestionsRegistry';
import { initStatementPositionResolvers } from '../standardSql/statementPositionResolversRegistry';
import { sqlEditorLog } from '../utils/debugger';
import standardSQLLanguageDefinition from '../standardSql/definition';
import { getStandardSQLCompletionProvider } from '../standardSql/standardSQLCompletionItemProvider';
import { useLatestCallback } from '../hooks/useLatestCallback';

const STANDARD_SQL_LANGUAGE = 'sql';

export interface LanguageDefinition extends monacoTypes.languages.ILanguageExtensionPoint {
  loader?: (module: any) => Promise<{
    language: SQLMonarchLanguage;
    conf: monacoTypes.languages.LanguageConfiguration;
  }>;
  // Provides API for customizing the autocomplete
  completionProvider?: (m: Monaco, language: SQLMonarchLanguage) => SQLCompletionItemProvider;
  // Function that returns a formatted query
  formatter?: (q: string) => string;
}

interface SQLEditorProps {
  query: string;
  /**
   * Use for inspecting the query as it changes. I.e. for validation.
   */
  onChange?: (q: string, processQuery: boolean) => void;
  onBlur?: (text: string) => void;
  language?: LanguageDefinition;
  children?: (props: { formatQuery: () => void }) => React.ReactNode;
  width?: number;
  height?: number;
}

interface LanguageRegistries {
  functions: Registry<FunctionsRegistryItem>;
  operators: Registry<OperatorsRegistryItem>;
  suggestionKinds: Registry<SuggestionKindRegistryItem>;
  positionResolvers: Registry<StatementPositionResolversRegistryItem>;
  macros: Registry<MacrosRegistryItem>;
}

const LANGUAGES_CACHE = new Map<string, LanguageRegistries>();
const INSTANCE_CACHE = new Map<string, Registry<SuggestionsRegistryItem>>();

export const SQLEditor = ({
  children,
  onBlur,
  onChange,
  query,
  language = { id: STANDARD_SQL_LANGUAGE },
  width,
  height,
}: SQLEditorProps) => {
  const monacoRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null);
  const langUid = useRef<string>();
  const stableOnChange = useLatestCallback(onChange);

  // create unique language id for each SQLEditor instance
  const id = useMemo(() => {
    const uid = v4();
    const id = `${language.id}-${uid}`;
    langUid.current = id;
    return id;
  }, [language.id]);

  useEffect(() => {
    return () => {
      if (langUid.current) {
        INSTANCE_CACHE.delete(langUid.current);
      }
      sqlEditorLog(`Removing instance cache ${langUid.current}`, false, INSTANCE_CACHE);
    };
  }, []);

  const formatQuery = useCallback(() => {
    if (monacoRef.current) {
      monacoRef.current.getAction('editor.action.formatDocument').run();
    }
  }, []);

  const onSqlBlur = (text: string) => {
    stableOnChange && stableOnChange(text, false);
    onBlur && onBlur(text);
  };

  return (
    <div style={{ width }}>
      <CodeEditor
        height={height || '240px'}
        // -2px to compensate for borders width
        width={width ? `${width - 2}px` : undefined}
        language={id}
        value={query}
        onBlur={onSqlBlur}
        showMiniMap={false}
        showLineNumbers={true}
        // Using onEditorDidMount instead of onBeforeEditorMount to support Grafana < 8.2.x
        onEditorDidMount={(editor, m) => {
          monacoRef.current = editor;
          editor.onDidChangeModelContent((e) => {
            const text = editor.getValue();
            // Use ref to get the latest onChange callback, avoiding stale closures
            if (stableOnChange) {
              stableOnChange(text, false);
            }
          });

          editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => {
            const text = editor.getValue();
            // Use ref to get the latest onChange callback, avoiding stale closures
            if (stableOnChange) {
              stableOnChange(text, true);
            }
          });

          editor.onKeyUp((e) => {
            // keyCode 84 is . (DOT)
            if (e.keyCode === 84) {
              editor.trigger(TRIGGER_SUGGEST.id, TRIGGER_SUGGEST.id, {});
            }
          });
          registerLanguageAndSuggestions(m, language, id);
        }}
      />
      {children && children({ formatQuery })}
    </div>
  );
};

// There's three ways to define Monaco language:
// 1. Leave language.id empty or set it to 'sql'. This will load a standard sql language definition, including syntax highlighting and tokenization for
// common Grafana entities such as macros and template variables
// 2. Provide a custom language and load it via the async LanguageDefinition.loader callback
// 3. Specify a language.id that exists in the Monaco language registry. A custom completion item provider can still be provided.
// If not, the standard SQL completion item provider will be used. See available languages here: https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages
// If a custom language is specified, its LanguageDefinition will be merged with the LanguageDefinition for standard SQL. This allows the consumer to only
// override parts of the LanguageDefinition, such as for example the completion item provider.
const resolveLanguage = (monaco: Monaco, languageDefinitionProp: LanguageDefinition): LanguageDefinition => {
  if (languageDefinitionProp?.id !== STANDARD_SQL_LANGUAGE && !languageDefinitionProp.loader) {
    sqlEditorLog(`Loading language '${languageDefinitionProp?.id}' from Monaco registry`, false);
    const allLangs = monaco.languages.getLanguages();
    const custom = allLangs.find(({ id }) => id === languageDefinitionProp?.id);
    if (!custom) {
      throw Error(`Unknown Monaco language ${languageDefinitionProp?.id}`);
    }

    return { completionProvider: getStandardSQLCompletionProvider, ...custom, ...languageDefinitionProp };
  }

  return {
    ...standardSQLLanguageDefinition,
    ...languageDefinitionProp,
  };
};

export const registerLanguageAndSuggestions = async (monaco: Monaco, l: LanguageDefinition, lid: string) => {
  const languageDefinition = resolveLanguage(monaco, l);
  if (!languageDefinition.loader) {
    return;
  }
  const { language, conf } = await languageDefinition.loader(monaco);
  monaco.languages.register({ id: lid });
  monaco.languages.setMonarchTokensProvider(lid, { ...language });
  monaco.languages.setLanguageConfiguration(lid, { ...conf });

  if (languageDefinition.formatter) {
    monaco.languages.registerDocumentFormattingEditProvider(lid, {
      provideDocumentFormattingEdits: (model) => {
        const formatted = l.formatter?.(model.getValue());
        return [
          {
            range: model.getFullModelRange(),
            text: formatted || '',
          },
        ];
      },
    });
  }

  if (languageDefinition.completionProvider) {
    const customProvider = languageDefinition.completionProvider(monaco, language);
    extendStandardRegistries(l.id, lid, customProvider);
    const languageSuggestionsRegistries = LANGUAGES_CACHE.get(l.id)!;
    const instanceSuggestionsRegistry = INSTANCE_CACHE.get(lid)!;

    const completionProvider: monacoTypes.languages.CompletionItemProvider['provideCompletionItems'] = async (
      model,
      position,
      context,
      token
    ) => {
      const currentToken = linkedTokenBuilder(monaco, model, position, lid);
      const statementPosition = getStatementPosition(currentToken, languageSuggestionsRegistries.positionResolvers);
      const kind = getSuggestionKinds(statementPosition, languageSuggestionsRegistries.suggestionKinds);

      sqlEditorLog('Statement position', false, statementPosition);
      sqlEditorLog('Suggestion kinds', false, kind);

      const ctx: PositionContext = {
        position,
        currentToken,
        statementPosition,
        kind,
        range: monaco.Range.fromPositions(position),
      };

      const stdSuggestions = await getStandardSuggestions(monaco, currentToken, kind, ctx, instanceSuggestionsRegistry);

      return {
        suggestions: stdSuggestions,
      };
    };

    monaco.languages.registerCompletionItemProvider(lid, {
      ...customProvider,
      provideCompletionItems: completionProvider,
    });
  }
};

function extendStandardRegistries(id: string, lid: string, customProvider: SQLCompletionItemProvider) {
  if (!LANGUAGES_CACHE.has(id)) {
    initializeLanguageRegistries(id);
  }

  const languageRegistries = LANGUAGES_CACHE.get(id)!;

  if (!INSTANCE_CACHE.has(lid)) {
    INSTANCE_CACHE.set(
      lid,
      new Registry(
        initStandardSuggestions(languageRegistries.functions, languageRegistries.operators, languageRegistries.macros)
      )
    );
  }

  const instanceSuggestionsRegistry = INSTANCE_CACHE.get(lid)!;

  if (customProvider.supportedFunctions) {
    for (const func of customProvider.supportedFunctions()) {
      const exists = languageRegistries.functions.getIfExists(func.id);
      if (!exists) {
        languageRegistries.functions.register(func);
      }
    }
  }

  if (customProvider.supportedOperators) {
    for (const op of customProvider.supportedOperators()) {
      const exists = languageRegistries.operators.getIfExists(op.id);
      if (!exists) {
        languageRegistries.operators.register({ ...op, name: op.id });
      }
    }
  }

  if (customProvider.supportedMacros) {
    for (const macro of customProvider.supportedMacros()) {
      const exists = languageRegistries.macros.getIfExists(macro.id);
      if (!exists) {
        languageRegistries.macros.register({ ...macro, name: macro.id });
      }
    }
  }

  if (customProvider.customStatementPlacement) {
    for (const placement of customProvider.customStatementPlacement()) {
      const exists = languageRegistries.positionResolvers.getIfExists(placement.id);
      if (!exists) {
        languageRegistries.positionResolvers.register({
          ...placement,
          id: placement.id as StatementPosition,
          name: placement.id,
        });
        languageRegistries.suggestionKinds.register({
          id: placement.id as StatementPosition,
          name: placement.id,
          kind: [],
        });
      } else {
        // Allow extension to the built-in placement resolvers
        const origResolve = exists.resolve;
        exists.resolve = (...args) => {
          const ext = placement.resolve(...args);
          if (placement.overrideDefault) {
            return ext;
          }
          const orig = origResolve(...args);
          return orig || ext;
        };
      }
    }
  }

  if (customProvider.customSuggestionKinds) {
    for (const kind of customProvider.customSuggestionKinds()) {
      kind.applyTo?.forEach((applyTo) => {
        const exists = languageRegistries.suggestionKinds.getIfExists(applyTo);
        if (exists) {
          // avoid duplicates
          if (exists.kind.indexOf(kind.id as SuggestionKind) === -1) {
            exists.kind.push(kind.id as SuggestionKind);
          }
        }
      });

      if (kind.overrideDefault) {
        const stbBehavior = instanceSuggestionsRegistry.get(kind.id);
        if (stbBehavior !== undefined) {
          stbBehavior.suggestions = kind.suggestionsResolver;
          continue;
        }
      }

      instanceSuggestionsRegistry.register({
        id: kind.id as SuggestionKind,
        name: kind.id,
        suggestions: kind.suggestionsResolver,
      });
    }
  }

  if (customProvider.schemas) {
    const stbBehavior = instanceSuggestionsRegistry.get(SuggestionKind.Schemas);
    const s = stbBehavior.suggestions;
    stbBehavior.suggestions = async (ctx, m) => {
      const standardSchemas = await s(ctx, m);
      if (!customProvider.schemas) {
        return [...standardSchemas];
      }
      const customSchemas = await customProvider.schemas.resolve();
      const customSchemaCompletionItems = customSchemas.map((x) => ({
        label: x.name,
        insertText: `${x.completion ?? x.name}.`,
        command: TRIGGER_SUGGEST,
        kind: CompletionItemKind.Module, // it's nice to differentiate schemas from tables
        sortText: CompletionItemPriority.High,
      }));
      return [...standardSchemas, ...customSchemaCompletionItems];
    };
  }

  if (customProvider.tables) {
    const stbBehavior = instanceSuggestionsRegistry.get(SuggestionKind.Tables);
    const s = stbBehavior.suggestions;
    stbBehavior.suggestions = async (ctx, m) => {
      const o = await s(ctx, m);
      const tableToken = getTableToken(ctx.currentToken);
      const tableNameParser = customProvider.tables?.parseName ?? defaultTableNameParser;

      const tableIdentifier = tableNameParser(tableToken);

      const oo = ((await customProvider.tables?.resolve?.(tableIdentifier)) ?? []).map((x) => ({
        label: x.name,
        // if no custom completion is provided it's safe to move cursor further in the statement
        insertText: `${x.completion ?? x.name}${x.completion === x.name ? ' $0' : ''}`,
        insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
        command: TRIGGER_SUGGEST,
        kind: CompletionItemKind.Field,
        sortText: CompletionItemPriority.MediumHigh,
      }));
      return [...o, ...oo];
    };
  }

  if (customProvider.columns) {
    const stbBehavior = instanceSuggestionsRegistry.get(SuggestionKind.Columns);
    const s = stbBehavior.suggestions;
    stbBehavior.suggestions = async (ctx, m) => {
      const o = await s(ctx, m);
      const tableToken = getTableToken(ctx.currentToken);
      let tableIdentifier;
      const tableNameParser = customProvider.tables?.parseName ?? defaultTableNameParser;

      if (tableToken && tableToken.value) {
        tableIdentifier = tableNameParser(tableToken);
      }

      let oo: CustomSuggestion[] = [];
      if (tableIdentifier) {
        const columns = await customProvider.columns?.resolve!(tableIdentifier);
        oo = columns
          ? columns.map<CustomSuggestion>((x) => ({
              label: x.name,
              insertText: x.completion ?? x.name,
              kind: CompletionItemKind.Field,
              sortText: CompletionItemPriority.High,
              detail: x.type,
              documentation: x.description,
            }))
          : [];
      }
      return [...o, ...oo];
    };
  }
}

/**
 * Initializes language specific registries that are treated as singletons
 */
function initializeLanguageRegistries(id: string) {
  if (!LANGUAGES_CACHE.has(id)) {
    LANGUAGES_CACHE.set(id, {
      functions: new Registry(),
      operators: new Registry(),
      suggestionKinds: new Registry(initSuggestionsKindRegistry),
      positionResolvers: new Registry(initStatementPositionResolvers),
      macros: new Registry(),
    });
  }

  return LANGUAGES_CACHE.get(id)!;
}

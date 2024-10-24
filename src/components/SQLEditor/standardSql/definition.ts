import { LanguageDefinition } from '../components/SQLEditor';
import { getStandardSQLCompletionProvider } from './standardSQLCompletionItemProvider';

const standardSQLLanguageDefinition: LanguageDefinition = {
  id: 'standardSql',
  extensions: ['.sql'],
  aliases: ['sql'],
  mimetypes: [],
  loader: () => import('./language'),

  completionProvider: getStandardSQLCompletionProvider,
};

export default standardSQLLanguageDefinition;

import { e2e } from '@grafana/e2e';
import { selectors } from '../selectors';

const e2eSelectors = e2e.getSelectors(selectors.components);

const selectDropdown = (container: Cypress.Chainable<JQuery<HTMLElement>>, text: string) => {
    container.within(() => {
        e2e.components.Select.input().first().should('be.empty').focus().type(`${text}{enter}`);
    });
};
  
export const fillQuery = (query: string, overrideFormat?: 'Table' | 'Time Series' | 'Logs') => {
    e2eSelectors.QueryEditor.CodeEditor.input()
        .scrollIntoView()
        .type(Cypress.platform === 'darwin' ? '{cmd}a' : '{ctrl}a')
        .type('{backspace}')
        .type(query)
        .type(Cypress.platform === 'darwin' ? '{cmd}s' : '{ctrl}s');
    if (overrideFormat) {
        selectDropdown(e2eSelectors.QueryEditor.FormatAs.label(), overrideFormat);
    }
    e2e().wait(3000);
};


  
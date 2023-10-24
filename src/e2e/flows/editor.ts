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

export interface QueryOpts {
    name: string;
    query: string;
    title?: string;
    timeRange: {
        from: string;
        to: string;
        zone?: string;
    };
    viewport?: Cypress.ViewportPreset;
}

export const runQuery = (opts: QueryOpts, pre?: () => void, post?: () => void) => {
    if (pre !== undefined) {
        pre();
    }
    if (opts.viewport !== undefined) {
        cy.viewport(opts.viewport);
    }
    e2e.flows.login();
    e2e.flows.addDashboard({timeRange: opts.timeRange});
    e2e.flows.addPanel({
      dataSourceName: `E2E Datasource for ${opts.name}`,
      panelTitle: opts.title || 'Query',
      saveDashboard: false,
      queriesForm: () => fillQuery(opts.query),
    });
    if (post !== undefined) {
        post();
    }
}
  
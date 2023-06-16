import { e2e } from '@grafana/e2e';

// workaround for missing selector
export const migrateSetting = (item: 'Variables' | 'Annotations', kind: 'templating' | 'annotations') => {
    const orig = e2e.pages.Dashboard.Settings.General.sectionItems;
    // @ts-ignore
    e2e.pages.Dashboard.Settings.General.sectionItems = (value: string | undefined) => {
      if (value === item) {
        const link = cy.get(`.dashboard-settings__nav-item[href*="${kind}"]`)
        return link;
      }
      return orig;
    }
}

// workaround for missing selector
export const migrateRunButton = () => {
  e2e.components.RefreshPicker.runButton = () => {
    return cy.get('[data-testid="data-testid RefreshPicker run button"]').last();
  }
}

import { e2e } from '@grafana/e2e';

export const selectListOption = (container: Cypress.Chainable<JQuery<HTMLElement>>, value: string) => {
  container.within(() => e2e().get('[class$="-input-suffix"]').click());
  e2e.components.Select.option().should('be.visible').contains(value).click();
};

const openDashboardSettings = (sectionName = 'Variables') => {
  e2e.components.PageToolbar.item('Dashboard settings').click();
  cy.get('.dashboard-settings__aside').within(() => {
    cy.contains(sectionName).should('be.visible').click();
  });
};

export const openOptions = (): any =>
  e2e.components.PanelEditor.toggleVizPicker().click()

export const selectDashboardTimeRange = (start_time: string, end_time: string) => {
  e2e.components.TimePicker.openButton().click();
  e2e.components.TimePicker.absoluteTimeRangeTitle().click();
  e2e.components.TimePicker.fromField().clear().type(start_time);
  e2e.components.TimePicker.toField().clear().type(end_time);
  e2e.components.TimePicker.applyTimeRange().click();
};

export const addAnnotations = (datasourceName: string, validate?: () => void) => {
  // Dashboard settings
  openDashboardSettings('Annotations');
  // Dashboard annotations
  if (e2e.pages.Dashboard.Settings.Annotations.List.addAnnotationCTAV2) {
    e2e.pages.Dashboard.Settings.Annotations.List.addAnnotationCTAV2().click();
  } else {
    e2e.pages.Dashboard.Settings.Annotations.List.addAnnotationCTA().click();
  }
  e2e.pages.Dashboard.Settings.Annotations.Settings.name().clear().type('Annotations');

  selectListOption(e2e.components.DataSourcePicker.container(), datasourceName);
  
  if ( validate !== undefined ) {
    validate();
  }
  // Back from settings to dashboard
  e2e.components.BackButton.backArrow().should('be.visible').click({ force: true });
};

export const addVariables = (variableName: string, variableValue: string) => {
  // Dashboard settings
  openDashboardSettings('Variables');
  // Dashboard variables

  if (e2e.pages.Dashboard.Settings.Variables.List.addVariableCTAV2) {
    e2e.pages.Dashboard.Settings.Variables.List.addVariableCTAV2().click();
  } else {
    e2e.pages.Dashboard.Settings.Variables.List.addVariableCTA().click();
  }
  selectListOption(e2e.pages.Dashboard.Settings.Variables.Edit.General.generalTypeSelect(), 'Constant');
  e2e.pages.Dashboard.Settings.Variables.Edit.General.generalNameInput().clear().type(`{selectall}${variableName}`);

  e2e.pages.Dashboard.Settings.Variables.Edit.ConstantVariable.constantOptionsQueryInput().type(variableValue);
  // Back from settings to dashboard
  e2e.components.BackButton.backArrow().should('be.visible').click({ force: true });
};
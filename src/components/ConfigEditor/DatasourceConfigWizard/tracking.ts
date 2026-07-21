import { reportInteraction } from '@grafana/runtime';

export const trackConfigWizardSectionChange = (config_section = 'default') => {
  reportInteraction('grafana_dsconfig_section_visited', { config_section });
};

export const trackConfigWizardSubmitEvent = () => {
  reportInteraction('grafana_dsconfig_submitted', {});
};

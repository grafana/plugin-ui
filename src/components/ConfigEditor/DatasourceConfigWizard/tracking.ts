import { config, reportInteraction } from '@grafana/runtime';

export const trackConfigWizardSectionChange = (config_section = 'default', plugin_id = 'unknown') => {
  reportInteraction('grafana_dsconfig_section_visited', {
    config_section,
    plugin_id,
    grafana_version: config.buildInfo.version,
  });
};

type trackConfigWizardSubmitEventProps = { success?: boolean };

export const trackConfigWizardSubmitEvent = (props: trackConfigWizardSubmitEventProps) => {
  reportInteraction('grafana_dsconfig_submitted', {
    ...props,
    grafana_version: config.buildInfo.version,
  });
};

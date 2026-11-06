import React from 'react';
import { type DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { type FixtureDataSourceOptions, type FixtureSecureJsonData } from '../types';
import { ConfigGallery } from './gallery/ConfigGallery';

type Props = DataSourcePluginOptionsEditorProps<FixtureDataSourceOptions, FixtureSecureJsonData>;

/**
 * Config editor for the fixture data source. It renders the full gallery of
 * `@grafana/plugin-ui` ConfigEditor-family components so the e2e suite can
 * assert each one mounts (and does not hit its error boundary) inside real
 * Grafana.
 */
export function ConfigEditor(props: Props) {
  return (
    <div data-testid="config-editor">
      <ConfigGallery {...props} />
    </div>
  );
}

import React from 'react';
import { type DataSourcePluginOptionsEditorProps } from '@grafana/data';
import {
  AdvancedHttpSettings,
  Auth,
  AuthMethod,
  ConfigDescriptionLink,
  DatasourceConfigWizard,
  ConfigSection,
  ConfigSubSection,
  ConnectionSettings,
  CustomHeadersSettings,
  DataSourceDescription,
  SecureSocksProxyToggle,
  TLSSettings,
} from '@grafana/plugin-ui';
import { type FixtureDataSourceOptions, type FixtureSecureJsonData } from '../../types';
import { GalleryItem } from './GalleryItem';
import { noop, toDataSourceSettings } from './mocks';

type Props = DataSourcePluginOptionsEditorProps<FixtureDataSourceOptions, FixtureSecureJsonData>;

/**
 * Renders every `@grafana/plugin-ui` ConfigEditor-family component, each wrapped
 * in a `<GalleryItem>` keyed by its exact export name.
 */
export function ConfigGallery({ options, onOptionsChange }: Props) {
  const settings = toDataSourceSettings(
    options.jsonData as Record<string, unknown>,
    options.secureJsonFields as Record<string, boolean> | undefined
  );

  return (
    <div data-testid="config-gallery">
      <GalleryItem id="DataSourceDescription">
        <DataSourceDescription
          dataSourceName="Plugin UI Fixture"
          docsLink="https://grafana.com/developers/plugin-tools/"
          hasRequiredFields={false}
        />
      </GalleryItem>

      <GalleryItem id="ConfigSection">
        <ConfigSection title="Connection" description="A config section rendered from the library">
          <GalleryItem id="ConfigSubSection">
            <ConfigSubSection title="Advanced" isCollapsible>
              <span>subsection body</span>
            </ConfigSubSection>
          </GalleryItem>
        </ConfigSection>
      </GalleryItem>

      <GalleryItem id="ConfigDescriptionLink">
        <ConfigDescriptionLink
          description="Configure the fixture data source."
          suffix="fixture"
          feature="the fixture data source"
        />
      </GalleryItem>

      <GalleryItem id="Auth">
        <Auth selectedMethod={AuthMethod.NoAuth} onAuthMethodSelect={noop} />
      </GalleryItem>

      <GalleryItem id="TLSSettings">
        <TLSSettings
          readOnly={false}
          selfSignedCertificate={{
            enabled: false,
            onToggle: noop,
            certificateConfigured: false,
            onCertificateChange: noop,
            onCertificateReset: noop,
          }}
          TLSClientAuth={{
            enabled: false,
            onToggle: noop,
            serverName: '',
            clientCertificateConfigured: false,
            clientKeyConfigured: false,
            onServerNameChange: noop,
            onClientCertificateChange: noop,
            onClientKeyChange: noop,
            onClientCertificateReset: noop,
            onClientKeyReset: noop,
          }}
          skipTLSVerification={{ enabled: false, onToggle: noop }}
        />
      </GalleryItem>

      <GalleryItem id="ConnectionSettings">
        <ConnectionSettings config={options} onChange={(config: any) => onOptionsChange(config)} />
      </GalleryItem>

      <GalleryItem id="AdvancedHttpSettings">
        <AdvancedHttpSettings config={options} onChange={(config: any) => onOptionsChange(config)} />
      </GalleryItem>

      <GalleryItem id="SecureSocksProxyToggle">
        <SecureSocksProxyToggle dataSourceConfig={settings} onChange={noop} labelWidth={26} />
      </GalleryItem>

      <GalleryItem id="CustomHeadersSettings">
        <CustomHeadersSettings dataSourceConfig={settings} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="DatasourceConfigWizard">
        <DatasourceConfigWizard
          key={`grafana-pluginuifixture-datasource`}
          schema={{
            schemaVersion: 'v1',
            pluginType: 'grafana-pluginuifixture-datasource',
            pluginName: 'Plugin UI Fixture',
            fields: [
              {
                id: 'root_url',
                key: 'url',
                valueType: 'string',
                target: 'root',
              },
            ],
          }}
          dsUid="story-datasource"
          dsName={'Plugin UI Fixture'}
          onSuccess={(status: any, message: any) => console.log('onSuccess', status, message)}
          onSaving={(saving: any) => console.log('onSaving', saving)}
          onRetest={() => console.log('onRetest')}
        />
      </GalleryItem>
    </div>
  );
}

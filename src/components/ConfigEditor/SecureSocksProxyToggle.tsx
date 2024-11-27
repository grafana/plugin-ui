import React from 'react';
import { InlineLabel as OriginalInlineLabel, InlineField, InlineSwitch } from '@grafana/ui';
import { config } from '@grafana/runtime';
import { DataSourceSettings } from '@grafana/data';

type Props = Omit<React.ComponentProps<typeof OriginalInlineLabel>, 'children'> & {
  dataSourceConfig: DataSourceSettings<any, any>;
  onChange: (config: DataSourceSettings) => void;
  labelWidth: number;
};

export const SecureSocksProxyToggle = ({ labelWidth = 10, ...props }: Props) => {
  const { dataSourceConfig, onChange } = props;
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...dataSourceConfig,
      jsonData: {
        ...dataSourceConfig.jsonData,
        enableSecureSocksProxy: e.target.checked,
      },
    });
  };

  return (
    (config as any).secureSocksDSProxyEnabled && (
      <div>
        <div className="gf-form">
          <div className="gf-form gf-form-inline">
            <InlineField
              htmlFor="secureSocksProxyEnabled"
              label="Secure Socks Proxy Enabled"
              labelWidth={labelWidth}
              tooltip={
                <>
                  Proxy the datasource connection through the secure socks proxy to a different network. To learn more
                  about configuring the datasource connection proxy,{' '}
                  <a
                    href="https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/proxy/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    click here.
                  </a>
                </>
              }
            >
              <InlineSwitch
                id="secureSocksProxyEnabled"
                value={dataSourceConfig.jsonData.enableSecureSocksProxy}
                onChange={handleSwitchChange}
              />
            </InlineField>
          </div>
        </div>
      </div>
    )
  );
};

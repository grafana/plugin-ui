import React, { type ReactNode } from 'react';
import { css, cx } from '@emotion/css';
import { InlineField, Input, type PopoverContent } from '@grafana/ui';
import { ConfigSection } from '../ConfigSection';
import { type Config, type OnChangeHandler } from '../types';

export type Props<C extends Config = Config> = {
  config: C;
  onChange: OnChangeHandler<C>;
  description?: ReactNode;
  urlPlaceholder?: string;
  urlTooltip?: PopoverContent;
  urlLabel?: string;
  className?: string;
};

export const ConnectionSettings: <C extends Config = Config>(props: Props<C>) => JSX.Element = ({
  config,
  onChange,
  description,
  urlPlaceholder,
  urlTooltip,
  urlLabel,
  className,
}) => {
  const isValidUrl =
    config.url !== undefined &&
    /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(config.url);

  const styles = {
    container: css({
      maxWidth: 578,
    }),
  };

  return (
    <>
      <ConfigSection title="Connection" description={description} className={cx(styles.container, className)}>
        <InlineField
          htmlFor="connection-url"
          label={urlLabel || 'URL'}
          labelWidth={24}
          tooltip={
            urlTooltip || (
              <>
                Specify a complete HTTP URL
                <br />
                (for example https://example.com:8080)
              </>
            )
          }
          grow
          disabled={config.readOnly}
          required
          invalid={!isValidUrl && !config.readOnly}
          error={isValidUrl ? '' : 'Please enter a valid URL'}
          interactive
        >
          <Input
            id="connection-url"
            aria-label="Data source connection URL"
            onChange={(event) =>
              onChange({
                ...config,
                url: event.currentTarget.value,
              })
            }
            value={config.url || ''}
            placeholder={urlPlaceholder || 'URL'}
          />
        </InlineField>
      </ConfigSection>
    </>
  );
};

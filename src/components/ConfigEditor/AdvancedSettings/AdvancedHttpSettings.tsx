import React from 'react';
import { css, cx } from '@emotion/css';
import { InlineField, Input, TagsInput } from '@grafana/ui';
import { ConfigSubSection } from '../ConfigSection';
import { Config, OnChangeHandler } from '../types';

export type Props<C extends Config = Config> = {
  config: C;
  onChange: OnChangeHandler<C>;
  className?: string;
};

export const AdvancedHttpSettings: <C extends Config = Config>(props: Props<C>) => JSX.Element = ({
  config,
  onChange,
  className,
}) => {
  const onCookiesChange = (cookies: string[]) => {
    onChange({
      ...config,
      jsonData: {
        ...config.jsonData,
        keepCookies: cookies,
      },
    });
  };

  const onTimeoutChange = (event: React.FormEvent<HTMLInputElement>) => {
    onChange({
      ...config,
      jsonData: {
        ...config.jsonData,
        timeout: parseInt(event.currentTarget.value, 10),
      },
    });
  };

  const styles = {
    container: css({
      maxWidth: 578,
    }),
  };

  return (
    <ConfigSubSection title="Advanced HTTP settings" className={cx(styles.container, className)}>
      <InlineField
        htmlFor="advanced-http-cookies"
        label="Allowed cookies"
        labelWidth={24}
        tooltip="Grafana proxy deletes forwarded cookies by default. Specify cookies by name that should be forwarded to the data source."
        disabled={config.readOnly}
        grow
      >
        <TagsInput
          id="advanced-http-cookies"
          placeholder="New cookie (hit enter to add)"
          tags={config.jsonData.keepCookies}
          onChange={onCookiesChange}
        />
      </InlineField>

      <InlineField
        htmlFor="advanced-http-timeout"
        label="Timeout"
        labelWidth={24}
        tooltip="HTTP request timeout in seconds"
        disabled={config.readOnly}
        grow
      >
        <Input
          id="advanced-http-timeout"
          type="number"
          min={0}
          placeholder="Timeout in seconds"
          aria-label="Timeout in seconds"
          value={config.jsonData.timeout}
          onChange={onTimeoutChange}
        />
      </InlineField>
    </ConfigSubSection>
  );
};

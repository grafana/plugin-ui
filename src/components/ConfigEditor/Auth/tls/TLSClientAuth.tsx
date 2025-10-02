import { cx } from '@emotion/css';
import { InlineField, Input, SecretTextArea } from '@grafana/ui';
import { TLSSettingsSection } from './TLSSettingsSection';
import { useCommonStyles } from '../styles';

export type Props = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  serverName: string;
  clientCertificateConfigured: boolean;
  clientKeyConfigured: boolean;
  onServerNameChange: (serverName: string) => void;
  onClientCertificateChange: (clientCertificate: string) => void;
  onClientKeyChange: (clientKey: string) => void;
  onClientCertificateReset: () => void;
  onClientKeyReset: () => void;
  tooltips?: {
    serverNameLabel?: string;
    certificateLabel?: string;
    keyLabel?: string;
  };
  readOnly: boolean;
};

export const TLSClientAuth = ({
  enabled,
  serverName,
  clientCertificateConfigured,
  clientKeyConfigured,
  onToggle,
  onServerNameChange,
  onClientCertificateChange,
  onClientKeyChange,
  onClientCertificateReset,
  onClientKeyReset,
  tooltips,
  readOnly,
}: Props) => {
  const commonStyles = useCommonStyles();

  return (
    <TLSSettingsSection
      enabled={enabled}
      label="TLS Client Authentication"
      tooltipText="Validate using TLS client authentication, in which the server authenticates the client"
      onToggle={(newEnabled) => onToggle(newEnabled)}
      readOnly={readOnly}
    >
      <InlineField
        label="ServerName"
        labelWidth={24}
        tooltip={tooltips?.serverNameLabel ?? 'A Servername is used to verify the hostname on the returned certificate'}
        required
        htmlFor="client-auth-servername-input"
        interactive
        grow
        className={commonStyles.inlineFieldNoMarginRight}
        disabled={readOnly}
      >
        <Input
          id="client-auth-servername-input"
          placeholder="domain.example.com"
          value={serverName}
          onChange={(e) => onServerNameChange(e.currentTarget.value)}
          required
        />
      </InlineField>
      <InlineField
        label="Client Certificate"
        labelWidth={24}
        tooltip={
          tooltips?.certificateLabel ??
          'The client certificate can be generated from a Certificate Authority or be self-signed'
        }
        required
        htmlFor="client-auth-client-certificate-input"
        interactive
        grow
        className={cx(commonStyles.inlineFieldNoMarginRight, commonStyles.inlineFieldWithSecret)}
        disabled={readOnly}
      >
        <SecretTextArea
          id="client-auth-client-certificate-input"
          isConfigured={clientCertificateConfigured}
          onChange={(e) => onClientCertificateChange(e.currentTarget.value)}
          onReset={readOnly ? () => {} : onClientCertificateReset}
          placeholder="Begins with --- BEGIN CERTIFICATE ---"
          rows={6}
          required
        />
      </InlineField>
      <InlineField
        label="Client Key"
        labelWidth={24}
        tooltip={tooltips?.keyLabel ?? 'The client key can be generated from a Certificate Authority or be self-signed'}
        required
        htmlFor="client-auth-client-key-input"
        interactive
        grow
        className={cx(commonStyles.inlineFieldNoMarginRight, commonStyles.inlineFieldWithSecret)}
        disabled={readOnly}
      >
        <SecretTextArea
          id="client-auth-client-key-input"
          isConfigured={clientKeyConfigured}
          onChange={(e) => onClientKeyChange(e.currentTarget.value)}
          onReset={readOnly ? () => {} : onClientKeyReset}
          placeholder={`Begins with --- RSA PRIVATE KEY CERTIFICATE ---`}
          rows={6}
          required
        />
      </InlineField>
    </TLSSettingsSection>
  );
};

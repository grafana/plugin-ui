import React from "react";
import { cx } from "@emotion/css";
import { InlineField, Input } from "@grafana/ui";
import { InlineLabel } from "../../ConfigEditor";
import { SecretTextArea } from "../../../unreleasedComponents/SecretTextarea";
import { TLSSettingsSection } from "./TLSSettingsSection";
import { useCommonStyles } from "../styles";

export type Props = {
  enabled: boolean;
  serverName: string;
  clientCertificateConfigured: boolean;
  clientKeyConfigured: boolean;
  onToggle: (enabled: boolean) => void;
  onServerNameChange: (serverName: string) => void;
  onClientCertificateChange: (clientCertificate: string) => void;
  onClientKeyChange: (clientKey: string) => void;
  onClientCertificateReset: () => void;
  onClientKeyReset: () => void;
};

export const TLSClientAuth: React.FC<Props> = ({
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
}) => {
  const commonStyles = useCommonStyles();

  return (
    <TLSSettingsSection
      enabled={enabled}
      label="TLS Client Authentication"
      tooltipText="Validate using TLS client authentication, in which the server authenticates the client."
      onToggle={(newEnabled) => onToggle(newEnabled)}
    >
      <InlineField
        label={
          <InlineLabel
            width={24}
            tooltip="A Servername is used to verify the hostname on the returned certificate."
            required
            htmlFor="client-auth-servername-input"
          >
            ServerName
          </InlineLabel>
        }
        grow
        className={commonStyles.inlineFieldNoMarginRight}
      >
        <Input
          id="client-auth-servername-input"
          placeholder="domain.example.com"
          value={serverName}
          onChange={(e) => onServerNameChange(e.currentTarget.value)}
        />
      </InlineField>
      <InlineField
        label={
          <InlineLabel
            width={24}
            tooltip="The client certificate can be generated from a Certificate Authority or be self-signed."
            required
            htmlFor="client-auth-client-certificate-input"
          >
            Client Certificate
          </InlineLabel>
        }
        grow
        className={cx(
          commonStyles.inlineFieldNoMarginRight,
          commonStyles.inlineFieldWithSecret
        )}
      >
        <SecretTextArea
          id="client-auth-client-certificate-input"
          isConfigured={clientCertificateConfigured}
          onChange={(e) => onClientCertificateChange(e.currentTarget.value)}
          onReset={onClientCertificateReset}
          placeholder="Begins with --- BEGIN CERTIFICATE ---"
          rows={6}
        />
      </InlineField>
      <InlineField
        label={
          <InlineLabel
            width={24}
            tooltip="The client key can be generated from a Certificate Authority or be self-signed. Learn how X authenticates client certificates <link to any docs from the data source>."
            required
            htmlFor="client-auth-client-key-input"
          >
            Client Key
          </InlineLabel>
        }
        grow
        className={cx(
          commonStyles.inlineFieldNoMarginRight,
          commonStyles.inlineFieldWithSecret
        )}
      >
        <SecretTextArea
          id="client-auth-client-key-input"
          isConfigured={clientKeyConfigured}
          onChange={(e) => onClientKeyChange(e.currentTarget.value)}
          onReset={onClientKeyReset}
          placeholder={`Begins with --- RSA PRIVATE KEY CERTIFICATE ---`}
          rows={6}
        />
      </InlineField>
    </TLSSettingsSection>
  );
};

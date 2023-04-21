import React from "react";
import { css } from "@emotion/css";
import { SelfSignedCertificate } from "./SelfSignedCertificate";
import { TLSClientAuth as TLSClientAuthComponent } from "./TLSClientAuth";
import { SkipTLSVerification } from "./SkipTLSVerification";
import { ConfigSection } from "../../ConfigEditor";

export type Props = {
  selfSignedCertificate: {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    certificateConfigured: boolean;
    onCertificateChange: (certificate: string) => void;
    onCertificateReset: () => void;
  };
  TLSClientAuth: {
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
  };
  skipTLSVerification: {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
  };
};

export const TLSSettings: React.FC<Props> = ({
  selfSignedCertificate,
  TLSClientAuth,
  skipTLSVerification,
}) => {
  const styles = {
    container: css({
      marginTop: 24,
    }),
  };

  return (
    <ConfigSection
      className={styles.container}
      title="TLS settings"
      description="Additional security measures that can be applied on top of authentication"
      kind="sub-section"
    >
      <SelfSignedCertificate {...selfSignedCertificate} />
      <TLSClientAuthComponent {...TLSClientAuth} />
      <SkipTLSVerification {...skipTLSVerification} />
    </ConfigSection>
  );
};

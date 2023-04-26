import React from "react";
import { css } from "@emotion/css";
import { useTheme2 } from "@grafana/ui";
import {
  SelfSignedCertificate,
  Props as SelfSignedCertificateProps,
} from "./SelfSignedCertificate";
import {
  TLSClientAuth as TLSClientAuthComponent,
  Props as TLSClientAuthProps,
} from "./TLSClientAuth";
import {
  SkipTLSVerification,
  Props as SkipTLSVerificationProps,
} from "./SkipTLSVerification";
import { ConfigSection } from "../../ConfigEditor";

export type Props = {
  selfSignedCertificate: SelfSignedCertificateProps;
  TLSClientAuth: TLSClientAuthProps;
  skipTLSVerification: SkipTLSVerificationProps;
};

export const TLSSettings: React.FC<Props> = ({
  selfSignedCertificate,
  TLSClientAuth,
  skipTLSVerification,
}) => {
  const { spacing } = useTheme2();

  const styles = {
    container: css({
      marginTop: spacing(3),
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

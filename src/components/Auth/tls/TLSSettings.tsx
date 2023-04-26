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
import { ConfigSubSection } from "../../ConfigEditor";

export type Props = {
  selfSignedCertificate: Omit<SelfSignedCertificateProps, "readOnly">;
  TLSClientAuth: Omit<TLSClientAuthProps, "readOnly">;
  skipTLSVerification: Omit<SkipTLSVerificationProps, "readOnly">;
  readOnly: boolean;
};

export const TLSSettings: React.FC<Props> = ({
  selfSignedCertificate,
  TLSClientAuth,
  skipTLSVerification,
  readOnly,
}) => {
  const { spacing } = useTheme2();

  const styles = {
    container: css({
      marginTop: spacing(3),
    }),
  };

  return (
    <ConfigSubSection
      className={styles.container}
      title="TLS settings"
      description="Additional security measures that can be applied on top of authentication"
    >
      <SelfSignedCertificate {...selfSignedCertificate} readOnly={readOnly} />
      <TLSClientAuthComponent {...TLSClientAuth} readOnly={readOnly} />
      <SkipTLSVerification {...skipTLSVerification} readOnly={readOnly} />
    </ConfigSubSection>
  );
};

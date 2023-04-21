import React from "react";
import { css } from "@emotion/css";
import { useTheme2 } from "@grafana/ui";
import { AuthMethod, CustomMethod, CustomMethodId } from "./types";
import { AuthMethodSettings } from "./auth-method/AuthMethodSettings";
import { TLSSettings, Props as TLSSettingsProps } from "./tls/TLSSettings";
import { Props as BasicAuthProps } from "./auth-method/BasicAuth";
import {
  CustomHeaders,
  Props as CustomHeadersProps,
} from "./custom-headers/CustomHeaders";

export type Props = {
  selectedMethod: AuthMethod | CustomMethodId;
  mostCommonMethod?: AuthMethod | CustomMethodId;
  visibleMethods?: (AuthMethod | CustomMethodId)[];
  customMethods?: CustomMethod[];
  onAuthMethodSelect: (authType: AuthMethod | CustomMethodId) => void;
  basicAuth?: BasicAuthProps;
  TLS?: TLSSettingsProps;
  customHeaders?: CustomHeadersProps;
};

export const Auth: React.FC<Props> = ({
  selectedMethod,
  mostCommonMethod,
  visibleMethods: visibleMethodsFromProps,
  customMethods,
  onAuthMethodSelect,
  basicAuth,
  TLS,
  customHeaders,
}) => {
  const { colors } = useTheme2();

  const visibleMethods: (
    | AuthMethod
    | CustomMethodId
  )[] = visibleMethodsFromProps ?? [
    AuthMethod.BasicAuth,
    AuthMethod.CrossSiteCredentials,
    AuthMethod.OAuthForward,
    AuthMethod.NoAuth,
    ...(customMethods?.map((m) => m.id) ?? []),
  ];

  const styles = {
    container: css({
      margin: "24px 0",
      maxWidth: 578,
    }),
    selectedMethodFields: css({
      marginTop: 12,
    }),
    authMethods: css({
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "16px 16px 12px",
      border: `1px solid ${colors.background.secondary}`,
    }),
  };

  return (
    <div className={styles.container}>
      <h3>Authentication</h3>
      <AuthMethodSettings
        selectedMethod={selectedMethod}
        mostCommonMethod={mostCommonMethod}
        customMethods={customMethods}
        visibleMethods={visibleMethods}
        onAuthMethodSelect={onAuthMethodSelect}
        basicAuth={basicAuth}
      />
      {TLS && <TLSSettings {...TLS} />}
      {customHeaders && <CustomHeaders {...customHeaders} />}
    </div>
  );
};

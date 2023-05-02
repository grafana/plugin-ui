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
import { ConfigSection } from "../ConfigEditor";

export type Props = {
  selectedMethod: AuthMethod | CustomMethodId;
  mostCommonMethod?: AuthMethod | CustomMethodId;
  visibleMethods?: (AuthMethod | CustomMethodId)[];
  customMethods?: CustomMethod[];
  onAuthMethodSelect: (authType: AuthMethod | CustomMethodId) => void;
  basicAuth?: Omit<BasicAuthProps, "readOnly">;
  TLS?: Omit<TLSSettingsProps, "readOnly">;
  customHeaders?: Omit<CustomHeadersProps, "readOnly">;
  readOnly?: boolean;
};

export const Auth: React.FC<Props> = ({
  selectedMethod,
  mostCommonMethod,
  visibleMethods,
  customMethods,
  onAuthMethodSelect,
  basicAuth,
  TLS,
  customHeaders,
  readOnly = false,
}) => {
  const { spacing } = useTheme2();

  const styles = {
    container: css({
      margin: spacing(2, 0),
      maxWidth: 578,
    }),
  };

  return (
    <div className={styles.container}>
      <ConfigSection title="Authentication">
        <AuthMethodSettings
          selectedMethod={selectedMethod}
          mostCommonMethod={mostCommonMethod}
          customMethods={customMethods}
          visibleMethods={visibleMethods}
          onAuthMethodSelect={onAuthMethodSelect}
          basicAuth={basicAuth}
          readOnly={readOnly}
        />
        {TLS && <TLSSettings {...TLS} readOnly={readOnly} />}
        {customHeaders && (
          <CustomHeaders {...customHeaders} readOnly={readOnly} />
        )}
      </ConfigSection>
    </div>
  );
};

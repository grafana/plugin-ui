import React, { useMemo } from "react";
import { css } from "@emotion/css";
import { useTheme2 } from "@grafana/ui";
import { SelectableValue } from "@grafana/data";
import { AuthMethodSelector } from "./AuthMethodSelector";
import { BasicAuth, Props as BasicAuthProps } from "./BasicAuth";
import { ConfigSection } from "../../ConfigEditor";
import { AuthMethod, CustomMethod, CustomMethodId } from "../types";

const defaultOptions: Record<AuthMethod, SelectableValue<AuthMethod>> = {
  [AuthMethod.BasicAuth]: {
    label: "Basic authentication",
    value: AuthMethod.BasicAuth,
    description:
      "Authenticate with your data source username and password that can be found here.",
  },
  [AuthMethod.CrossSiteCredentials]: {
    label: "Enable cross-site access control requests",
    value: AuthMethod.CrossSiteCredentials,
    description:
      "Allow cross-site Access-Control requests with your existing credentials and cookies. This enables the server to authenticate the user and perform authorized requests on their behalf on other domains.",
  },
  [AuthMethod.OAuthForward]: {
    label: "Forward OAuth Identity",
    value: AuthMethod.OAuthForward,
    description:
      "Forward the OAuth access token (and if available: the OIDC ID token) of the user querying to the data source.",
  },
  [AuthMethod.NoAuth]: {
    label: "No Authentication",
    value: AuthMethod.NoAuth,
    description: "Data source is available without authentication",
  },
};

type Props = {
  selectedMethod: AuthMethod | CustomMethodId;
  mostCommonMethod?: AuthMethod | CustomMethodId;
  visibleMethods: (AuthMethod | CustomMethodId)[];
  customMethods?: CustomMethod[];
  onAuthMethodSelect: (authType: AuthMethod | CustomMethodId) => void;
  basicAuth?: BasicAuthProps;
};

export const AuthMethodSettings: React.FC<Props> = ({
  selectedMethod,
  mostCommonMethod,
  visibleMethods,
  customMethods,
  onAuthMethodSelect,
  basicAuth = defaultProps.basic(),
}) => {
  const { colors } = useTheme2();
  const isSingleMethodMode = visibleMethods.length === 1;

  const preparedOptions = useMemo(() => {
    const customOptions =
      customMethods?.reduce<
        Record<CustomMethodId, SelectableValue<CustomMethodId>>
      >((acc, method) => {
        acc[method.id] = {
          label: method.label,
          value: method.id,
          description: method.description,
        };
        return acc;
      }, {}) ?? [];

    const allOptions: Record<
      AuthMethod | CustomMethodId,
      SelectableValue<AuthMethod | CustomMethodId>
    > = {
      ...customOptions,
      ...defaultOptions,
    };

    return visibleMethods
      .filter((method) => Boolean(allOptions[method]))
      .map((method) => {
        const option = allOptions[method];
        if (method === mostCommonMethod && !isSingleMethodMode) {
          return {
            ...option,
            label: `${option.label} (most common)`,
          };
        }
        return option;
      });
  }, [mostCommonMethod]);

  let selected = selectedMethod;
  if (isSingleMethodMode) {
    selected = visibleMethods[0];
  } else if (selectedMethod === AuthMethod.NoAuth && mostCommonMethod) {
    selected = mostCommonMethod;
  }

  let title = isSingleMethodMode
    ? preparedOptions[0].label
    : "Authentication methods";

  let description = isSingleMethodMode
    ? preparedOptions[0].description
    : "Choose an authentication method to access the data source";

  const styles = {
    selectedMethodFields: css({
      marginTop: 12,
    }),
    authMethods: css({
      marginTop: 20,
      padding: isSingleMethodMode ? 0 : "16px 16px 12px",
      border: isSingleMethodMode
        ? "none"
        : `1px solid ${colors.background.secondary}`,
    }),
  };

  return (
    <ConfigSection
      title={title ?? ""}
      description={description ?? ""}
      kind="sub-section"
    >
      <div className={styles.authMethods}>
        {!isSingleMethodMode && (
          <AuthMethodSelector
            selectedMethod={selected}
            options={preparedOptions}
            onChange={onAuthMethodSelect}
          />
        )}
        <div className={styles.selectedMethodFields}>
          {selected === AuthMethod.BasicAuth && <BasicAuth {...basicAuth} />}
          {selected.startsWith("custom-") &&
            (customMethods?.find((m) => m.id === selected)?.component ?? null)}
        </div>
      </div>
    </ConfigSection>
  );
};

const defaultProps = {
  basic(): BasicAuthProps {
    return {
      passwordConfigured: false,
      onUserChange: () => {},
      onPasswordChange: () => {},
      onPasswordReset: () => {},
    };
  },
};

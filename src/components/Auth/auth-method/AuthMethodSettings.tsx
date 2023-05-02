import React, { ReactElement, useMemo, useState } from "react";
import { css } from "@emotion/css";
import { useTheme2, Select } from "@grafana/ui";
import { SelectableValue } from "@grafana/data";
import { BasicAuth, Props as BasicAuthProps } from "./BasicAuth";
import { ConfigSubSection } from "../../ConfigEditor";
import { AuthMethod, CustomMethod, CustomMethodId } from "../types";

const defaultOptions: Record<AuthMethod, SelectableValue<AuthMethod>> = {
  [AuthMethod.BasicAuth]: {
    label: "Basic authentication",
    value: AuthMethod.BasicAuth,
    description: "Authenticate with your data source username and password",
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
      "Forward the OAuth access token (and if available: the OIDC ID token) of the user querying to the data source",
  },
  [AuthMethod.NoAuth]: {
    label: "No Authentication",
    value: AuthMethod.NoAuth,
    description: "Data source is available without authentication",
  },
};

export type Props = {
  selectedMethod: AuthMethod | CustomMethodId;
  mostCommonMethod?: AuthMethod | CustomMethodId;
  visibleMethods?: (AuthMethod | CustomMethodId)[];
  customMethods?: CustomMethod[];
  onAuthMethodSelect: (authType: AuthMethod | CustomMethodId) => void;
  basicAuth?: Omit<BasicAuthProps, "readOnly">;
  readOnly: boolean;
};

export const AuthMethodSettings: React.FC<Props> = ({
  selectedMethod,
  mostCommonMethod,
  visibleMethods: visibleMethodsFromProps,
  customMethods,
  onAuthMethodSelect,
  basicAuth,
  readOnly,
}) => {
  const [authMethodChanged, setAuthMethodChanged] = useState(false);
  const { colors, spacing } = useTheme2();
  const visibleMethods: (
    | AuthMethod
    | CustomMethodId
  )[] = visibleMethodsFromProps ?? [
    AuthMethod.BasicAuth,
    AuthMethod.OAuthForward,
    AuthMethod.NoAuth,
    ...(customMethods?.map((m) => m.id) ?? []),
  ];
  const hasSelect = visibleMethods.length > 1;

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
        if (method === mostCommonMethod && hasSelect) {
          return {
            ...option,
            label: `${option.label} (most common)`,
          };
        }
        return option;
      });
  }, [visibleMethods, customMethods, mostCommonMethod]);

  let selected = selectedMethod;
  if (!hasSelect) {
    selected = visibleMethods[0];
  } else if (
    selectedMethod === AuthMethod.NoAuth &&
    mostCommonMethod &&
    !authMethodChanged
  ) {
    selected = mostCommonMethod;
  }

  let AuthFieldsComponent: ReactElement | null = null;
  if (selected === AuthMethod.BasicAuth && basicAuth) {
    AuthFieldsComponent = <BasicAuth {...basicAuth} readOnly={readOnly} />;
  } else if (selected.startsWith("custom-")) {
    AuthFieldsComponent =
      customMethods?.find((m) => m.id === selected)?.component ?? null;
  }

  const title = hasSelect
    ? "Authentication methods"
    : preparedOptions[0].label ?? "";

  const description = hasSelect
    ? "Choose an authentication method to access the data source"
    : preparedOptions[0].description ?? "";

  const styles = {
    authMethods: css({
      marginTop: spacing(2.5),
      ...(hasSelect && {
        padding: spacing(2),
        border: `1px solid ${colors.border.weak}`,
      }),
    }),
    selectedMethodFields: css({
      marginTop: spacing(1.5),
    }),
  };

  return (
    <ConfigSubSection title={title} description={description}>
      <div className={styles.authMethods}>
        {hasSelect && (
          <Select
            options={preparedOptions}
            value={selected}
            onChange={(option) => {
              setAuthMethodChanged(true);
              onAuthMethodSelect(option.value!);
            }}
            disabled={readOnly}
          />
        )}
        {AuthFieldsComponent && (
          <div className={styles.selectedMethodFields}>
            {AuthFieldsComponent}
          </div>
        )}
      </div>
    </ConfigSubSection>
  );
};

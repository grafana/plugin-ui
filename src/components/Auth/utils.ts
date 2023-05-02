import { DataSourceSettings } from "@grafana/data";
import { Props as AuthProps } from "./Auth";
import { AuthMethod, Header, CustomMethodId } from "./types";

const headerNamePrefix = "httpHeaderName";
const headerValuePrefix = "httpHeaderValue";

type onChangeHandler = (config: DataSourceSettings) => void;

export function convertLegacyAuthProps({
  config,
  onChange,
}: {
  config: DataSourceSettings;
  onChange: onChangeHandler;
}): AuthProps {
  const props: AuthProps = {
    selectedMethod: getSelectedMethod(config),
    onAuthMethodSelect: getOnAuthMethodSelectHandler(config, onChange),
    basicAuth: getBasicAuthProps(config, onChange),
    TLS: getTLSProps(config, onChange),
    customHeaders: getCustomHeaders(config, onChange),
    readOnly: config.readOnly,
  };

  return props;
}

export function getSelectedMethod(
  config: DataSourceSettings<any, any>
): AuthMethod {
  if (config.basicAuth) {
    return AuthMethod.BasicAuth;
  }
  if (config.withCredentials) {
    return AuthMethod.CrossSiteCredentials;
  }
  if (config.jsonData.oauthPassThru) {
    return AuthMethod.OAuthForward;
  }
  return AuthMethod.NoAuth;
}

export function getOnAuthMethodSelectHandler(
  config: DataSourceSettings<any, any>,
  onChange: onChangeHandler
): (method: AuthMethod | CustomMethodId) => void {
  return (method: AuthMethod | CustomMethodId) => {
    onChange({
      ...config,
      basicAuth: method === AuthMethod.BasicAuth,
      withCredentials: method === AuthMethod.CrossSiteCredentials,
      jsonData: {
        ...config.jsonData,
        oauthPassThru: method === AuthMethod.OAuthForward,
      },
    });
  };
}

export function getBasicAuthProps(
  config: DataSourceSettings<any, any>,
  onChange: (config: DataSourceSettings<any, any>) => void
): AuthProps["basicAuth"] {
  return {
    user: config.basicAuthUser,
    passwordConfigured: config.secureJsonFields.basicAuthPassword,
    onUserChange: (user: string) =>
      onChange({ ...config, basicAuthUser: user }),
    onPasswordChange: (password: string) =>
      onChange({
        ...config,
        secureJsonData: {
          ...config.secureJsonData,
          basicAuthPassword: password,
        },
      }),
    onPasswordReset: () =>
      onChange({
        ...config,
        secureJsonData: { ...config.secureJsonData, basicAuthPassword: "" },
        secureJsonFields: {
          ...config.secureJsonFields,
          basicAuthPassword: false,
        },
      }),
  };
}

export function getTLSProps(
  config: DataSourceSettings<any, any>,
  onChange: onChangeHandler
): AuthProps["TLS"] {
  return {
    selfSignedCertificate: {
      enabled: Boolean(config.jsonData.tlsAuthWithCACert),
      certificateConfigured: config.secureJsonFields.tlsCACert,
      onToggle: (enabled) =>
        onChange({
          ...config,
          jsonData: { ...config.jsonData, tlsAuthWithCACert: enabled },
        }),
      onCertificateChange: (certificate) =>
        onChange({
          ...config,
          secureJsonData: { ...config.secureJsonData, tlsCACert: certificate },
        }),
      onCertificateReset: () =>
        onChange({
          ...config,
          secureJsonData: { ...config.secureJsonData, tlsCACert: "" },
          secureJsonFields: { ...config.secureJsonFields, tlsCACert: false },
        }),
    },
    TLSClientAuth: {
      enabled: config.jsonData.tlsAuth,
      serverName: config.jsonData.serverName,
      clientCertificateConfigured: config.secureJsonFields.tlsClientCert,
      clientKeyConfigured: config.secureJsonFields.tlsClientKey,
      onToggle: (enabled) =>
        onChange({
          ...config,
          jsonData: { ...config.jsonData, tlsAuth: enabled },
        }),
      onServerNameChange: (serverName) =>
        onChange({
          ...config,
          jsonData: { ...config.jsonData, serverName },
        }),
      onClientCertificateChange: (clientCertificate) =>
        onChange({
          ...config,
          secureJsonData: {
            ...config.secureJsonData,
            tlsClientCert: clientCertificate,
          },
        }),
      onClientCertificateReset: () =>
        onChange({
          ...config,
          secureJsonData: {
            ...config.secureJsonData,
            tlsClientCert: "",
          },
          secureJsonFields: {
            ...config.secureJsonFields,
            tlsClientCert: false,
          },
        }),
      onClientKeyChange: (clientKey) =>
        onChange({
          ...config,
          secureJsonData: {
            ...config.secureJsonData,
            tlsClientKey: clientKey,
          },
        }),
      onClientKeyReset: () =>
        onChange({
          ...config,
          secureJsonData: {
            ...config.secureJsonData,
            tlsClientKey: "",
          },
          secureJsonFields: {
            ...config.secureJsonFields,
            tlsClientKey: false,
          },
        }),
    },
    skipTLSVerification: {
      enabled: config.jsonData.tlsSkipVerify,
      onToggle: (enabled) =>
        onChange({
          ...config,
          jsonData: { ...config.jsonData, tlsSkipVerify: enabled },
        }),
    },
  };
}

export function getCustomHeaders(
  config: DataSourceSettings<any, any>,
  onChange: onChangeHandler
): AuthProps["customHeaders"] {
  const headers: Header[] = Object.keys(config.jsonData)
    .filter((key) => key.startsWith(headerNamePrefix))
    .sort()
    .map((key) => {
      const index = key.slice(headerNamePrefix.length);
      return {
        name: config.jsonData[key],
        configured:
          config.secureJsonFields[`${headerValuePrefix}${index}`] ?? false,
      };
    });

  return {
    headers,
    onChange: (headers) => {
      const newJsonData = Object.fromEntries(
        Object.entries(config.jsonData).filter(
          ([key]) => !key.startsWith(headerNamePrefix)
        )
      );
      const newSecureJsonData = Object.fromEntries(
        Object.entries(config.secureJsonData || {}).filter(
          ([key]) => !key.startsWith(headerValuePrefix)
        )
      );
      const newSecureJsonFields = Object.fromEntries(
        Object.entries(config.secureJsonFields).filter(
          ([key]) => !key.startsWith(headerValuePrefix)
        )
      );

      headers.forEach((header, index) => {
        newJsonData[`${headerNamePrefix}${index + 1}`] = header.name;
        if (header.configured) {
          newSecureJsonFields[`${headerValuePrefix}${index + 1}`] = true;
        } else {
          newSecureJsonData[`${headerValuePrefix}${index + 1}`] = header.value;
        }
      });

      onChange({
        ...config,
        jsonData: newJsonData,
        secureJsonData: newSecureJsonData,
        secureJsonFields: newSecureJsonFields,
      });
    },
  };
}

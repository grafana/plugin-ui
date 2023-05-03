import { DataSourceSettings } from "@grafana/data";
import {
  getSelectedMethod,
  getOnAuthMethodSelectHandler,
  getBasicAuthProps,
  getTLSProps,
  getCustomHeaders,
  convertLegacyAuthProps,
} from "./utils";
import { Props as AuthProps } from "./Auth";
import { AuthMethod } from "./types";

describe("utils", () => {
  describe("convertLegacyAuthProps", () => {
    it("should convert legacy props to new props correctly", () => {
      const config = ({
        basicAuth: true,
        basicAuthUser: "test-user",
        jsonData: {
          tlsAuthWithCACert: false,
          tlsAuth: false,
          serverName: "test.server.name",
          tlsSkipVerify: true,
          httpHeaderName1: "X-Name1",
          httpHeaderName2: "X-Name2",
        },
        secureJsonFields: {
          tlsCACert: false,
          tlsClientCert: false,
          tlsClientKey: false,
          basicAuthPassword: false,
          httpHeaderValue1: false,
          httpHeaderValue2: true,
        },
        readOnly: true,
      } as unknown) as DataSourceSettings<any, any>;
      const onChange = jest.fn();
      const newProps = convertLegacyAuthProps({ config, onChange });
      const expected: AuthProps = {
        selectedMethod: AuthMethod.BasicAuth,
        onAuthMethodSelect: expect.any(Function),
        basicAuth: {
          user: "test-user",
          passwordConfigured: false,
          onUserChange: expect.any(Function),
          onPasswordChange: expect.any(Function),
          onPasswordReset: expect.any(Function),
        },
        TLS: {
          selfSignedCertificate: {
            enabled: false,
            onToggle: expect.any(Function),
            certificateConfigured: false,
            onCertificateChange: expect.any(Function),
            onCertificateReset: expect.any(Function),
          },
          TLSClientAuth: {
            enabled: false,
            onToggle: expect.any(Function),
            serverName: "test.server.name",
            clientCertificateConfigured: false,
            clientKeyConfigured: false,
            onServerNameChange: expect.any(Function),
            onClientCertificateChange: expect.any(Function),
            onClientCertificateReset: expect.any(Function),
            onClientKeyChange: expect.any(Function),
            onClientKeyReset: expect.any(Function),
          },
          skipTLSVerification: {
            enabled: true,
            onToggle: expect.any(Function),
          },
        },
        customHeaders: {
          headers: [
            { name: "X-Name1", configured: false },
            { name: "X-Name2", configured: true },
          ],
          onChange: expect.any(Function),
        },
        readOnly: true,
      };

      expect(newProps).toStrictEqual(expected);
    });
  });

  describe("getSelectedMethod", () => {
    it("should return basic auth selected method", () => {
      const res = getSelectedMethod({ basicAuth: true } as DataSourceSettings);
      expect(res).toBe(AuthMethod.BasicAuth);
    });

    it("should return cross site credentials selected method", () => {
      const res = getSelectedMethod({
        withCredentials: true,
      } as DataSourceSettings);
      expect(res).toBe(AuthMethod.CrossSiteCredentials);
    });

    it("should return OAuth forward selected method", () => {
      const res = getSelectedMethod({
        jsonData: { oauthPassThru: true },
      } as DataSourceSettings<any>);
      expect(res).toBe(AuthMethod.OAuthForward);
    });

    it("should return no auth selected method", () => {
      const res = getSelectedMethod({
        jsonData: {},
      } as DataSourceSettings<any>);
      expect(res).toBe(AuthMethod.NoAuth);
    });
  });

  describe("getOnAuthMethodSelectHandler", () => {
    let config: DataSourceSettings<any, any>;
    let onChange: jest.Mock<any, any>;

    beforeEach(() => {
      onChange = jest.fn();
      config = {} as DataSourceSettings;
    });
    it("should return correct onAuthMethodSelect handler", () => {
      const onAuthMethodSelect = getOnAuthMethodSelectHandler(config, onChange);

      expect(onAuthMethodSelect).toStrictEqual(expect.any(Function));
    });

    it("should behave correctly when basic auth method is selected", () => {
      const onAuthMethodSelect = getOnAuthMethodSelectHandler(config, onChange);

      onAuthMethodSelect(AuthMethod.BasicAuth);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuth: true,
        withCredentials: false,
        jsonData: { oauthPassThru: false },
      });
    });
    it("should behave correctly cross site credentials method is selected", () => {
      const onAuthMethodSelect = getOnAuthMethodSelectHandler(config, onChange);

      onAuthMethodSelect(AuthMethod.CrossSiteCredentials);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuth: false,
        withCredentials: true,
        jsonData: { oauthPassThru: false },
      });
    });
    it("should behave correctly when OAuth forward method is selected", () => {
      const onAuthMethodSelect = getOnAuthMethodSelectHandler(config, onChange);

      onAuthMethodSelect(AuthMethod.OAuthForward);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuth: false,
        withCredentials: false,
        jsonData: { oauthPassThru: true },
      });
    });
    it("should behave correctly when no-auth method is selected", () => {
      const onAuthMethodSelect = getOnAuthMethodSelectHandler(config, onChange);

      onAuthMethodSelect(AuthMethod.NoAuth);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuth: false,
        withCredentials: false,
        jsonData: { oauthPassThru: false },
      });
    });
    it("should behave correctly when custom auth method is selected", () => {
      const onAuthMethodSelect = getOnAuthMethodSelectHandler(config, onChange);

      onAuthMethodSelect("custom-method");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuth: false,
        withCredentials: false,
        jsonData: { oauthPassThru: false },
      });
    });
  });

  describe("getBasicAuthProps", () => {
    let config: DataSourceSettings<any, any>;
    let onChange: jest.Mock<any, any>;

    beforeEach(() => {
      config = ({
        basicAuthUser: "test-user",
        secureJsonFields: {
          basicAuthPassword: false,
        },
      } as unknown) as DataSourceSettings<any, any>;
      onChange = jest.fn();
    });

    it("should return correct basic auth props", () => {
      const basicAuth = getBasicAuthProps(config, onChange);

      expect(basicAuth).toStrictEqual({
        user: "test-user",
        passwordConfigured: false,
        onUserChange: expect.any(Function),
        onPasswordChange: expect.any(Function),
        onPasswordReset: expect.any(Function),
      });
    });

    it("should call `onUserChange` correctly", () => {
      const basicAuth = getBasicAuthProps(config, onChange);

      basicAuth?.onUserChange("test-user2");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuthUser: "test-user2",
        secureJsonFields: {
          basicAuthPassword: false,
        },
      });
    });

    it("should call `onPasswordChange` correctly", () => {
      const basicAuth = getBasicAuthProps(config, onChange);

      basicAuth?.onPasswordChange("test-password");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuthUser: "test-user",
        secureJsonFields: {
          basicAuthPassword: false,
        },
        secureJsonData: {
          basicAuthPassword: "test-password",
        },
      });
    });

    it("should call `onPasswordReset` correctly", () => {
      const basicAuth = getBasicAuthProps(config, onChange);

      basicAuth?.onPasswordReset();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        basicAuthUser: "test-user",
        secureJsonFields: {
          basicAuthPassword: false,
        },
        secureJsonData: {
          basicAuthPassword: "",
        },
      });
    });
  });

  describe("getTLSProps", () => {
    let config: DataSourceSettings<any, any>;
    let onChange: jest.Mock<any, any>;

    beforeEach(() => {
      config = ({
        jsonData: {
          tlsAuthWithCACert: false,
          tlsAuth: false,
          serverName: "test.server.name",
          tlsSkipVerify: false,
        },
        secureJsonFields: {
          tlsCACert: false,
          tlsClientCert: false,
          tlsClientKey: false,
        },
      } as unknown) as DataSourceSettings<any, any>;
      onChange = jest.fn();
    });

    it("should return correct TLS settings", () => {
      const tls = getTLSProps(config, onChange);

      expect(tls).toStrictEqual({
        selfSignedCertificate: {
          enabled: false,
          onToggle: expect.any(Function),
          certificateConfigured: false,
          onCertificateChange: expect.any(Function),
          onCertificateReset: expect.any(Function),
        },
        TLSClientAuth: {
          enabled: false,
          onToggle: expect.any(Function),
          serverName: "test.server.name",
          clientCertificateConfigured: false,
          clientKeyConfigured: false,
          onServerNameChange: expect.any(Function),
          onClientCertificateChange: expect.any(Function),
          onClientCertificateReset: expect.any(Function),
          onClientKeyChange: expect.any(Function),
          onClientKeyReset: expect.any(Function),
        },
        skipTLSVerification: {
          enabled: false,
          onToggle: expect.any(Function),
        },
      });
    });

    it("should call `selfSignedCertificate.onToggle` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.selfSignedCertificate.onToggle(true);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        jsonData: {
          ...config.jsonData,
          tlsAuthWithCACert: true,
        },
      });
    });

    it("should call `selfSignedCertificate.onCertificateChange` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.selfSignedCertificate.onCertificateChange("test-cert");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        secureJsonData: {
          ...config.secureJsonData,
          tlsCACert: "test-cert",
        },
      });
    });

    it("should call `selfSignedCertificate.onCertificateReset` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.selfSignedCertificate.onCertificateReset();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        secureJsonData: { ...config.secureJsonData, tlsCACert: "" },
        secureJsonFields: { ...config.secureJsonFields, tlsCACert: false },
      });
    });

    it("should call `TLSClientAuth.onToggle` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.TLSClientAuth.onToggle(true);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        jsonData: { ...config.jsonData, tlsAuth: true },
      });
    });

    it("should call `TLSClientAuth.onServerNameChange` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.TLSClientAuth.onServerNameChange("new.server.name");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        jsonData: { ...config.jsonData, serverName: "new.server.name" },
      });
    });

    it("should call `TLSClientAuth.onClientCertificateChange` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.TLSClientAuth.onClientCertificateChange("client-cert");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        secureJsonData: {
          ...config.secureJsonData,
          tlsClientCert: "client-cert",
        },
      });
    });

    it("should call `TLSClientAuth.onClientCertificateReset` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.TLSClientAuth.onClientCertificateReset();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        secureJsonData: {
          ...config.secureJsonData,
          tlsClientCert: "",
        },
        secureJsonFields: {
          ...config.secureJsonFields,
          tlsClientCert: false,
        },
      });
    });

    it("should call `TLSClientAuth.onClientKeyChange` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.TLSClientAuth.onClientKeyChange("client-key");

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        secureJsonData: {
          ...config.secureJsonData,
          tlsClientKey: "client-key",
        },
      });
    });

    it("should call `TLSClientAuth.onClientKeyReset` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.TLSClientAuth.onClientKeyReset();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        secureJsonData: {
          ...config.secureJsonData,
          tlsClientKey: "",
        },
        secureJsonFields: {
          ...config.secureJsonFields,
          tlsClientKey: false,
        },
      });
    });

    it("should call `skipTLSVerification.onToggle` correctly", () => {
      const tls = getTLSProps(config, onChange);

      tls?.skipTLSVerification.onToggle(true);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        ...config,
        jsonData: { ...config.jsonData, tlsSkipVerify: true },
      });
    });
  });

  describe("getCustomHeaders", () => {
    let config: DataSourceSettings<any, any>;
    let onChange: jest.Mock<any, any>;

    beforeEach(() => {
      config = ({
        jsonData: {
          httpHeaderName1: "X-Name1",
          httpHeaderName2: "X-Name2",
        },
        secureJsonFields: {
          httpHeaderValue1: false,
          httpHeaderValue2: true,
        },
      } as unknown) as DataSourceSettings<any, any>;
      onChange = jest.fn();
    });

    it("should return correct custom headers settings", () => {
      const customHeaders = getCustomHeaders(config, onChange);

      expect(customHeaders).toStrictEqual({
        headers: [
          { name: "X-Name1", configured: false },
          { name: "X-Name2", configured: true },
        ],
        onChange: expect.any(Function),
      });
    });

    it("should call `onChange` correctly", () => {
      const customHeaders = getCustomHeaders(config, onChange);

      customHeaders?.onChange([
        { name: "X-Name111", value: "Value1", configured: false },
        { name: "X-Name2", value: "Value2", configured: true },
        { name: "X-Name3", value: "", configured: false },
      ]);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        jsonData: {
          httpHeaderName1: "X-Name111",
          httpHeaderName2: "X-Name2",
          httpHeaderName3: "X-Name3",
        },
        secureJsonData: {
          httpHeaderValue1: "Value1",
          httpHeaderValue3: "",
        },
        secureJsonFields: {
          httpHeaderValue2: true,
        },
      });
    });
  });
});

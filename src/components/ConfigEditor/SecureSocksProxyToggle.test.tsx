import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { SecureSocksProxyToggle } from "./SecureSocksProxyToggle";
import  * as compat  from "../../utils/compatibility";
import { config } from "@grafana/runtime";

describe("<SecureSocksProxyToggle />", () => {
  const dataSourceConfig = {
    id: 4,
    uid: "x",
    orgId: 1,
    name: "gdev-influxdb",
    type: "influxdb",
    typeName: "Influxdb",
    typeLogoUrl: "",
    access: "direct",
    url: "http://localhost:8086",
    password: "",
    user: "grafana",
    database: "site",
    basicAuth: false,
    basicAuthUser: "",
    basicAuthPassword: "",
    withCredentials: false,
    isDefault: false,
    jsonData: {
      enableSecureSocksProxy: false,
    },
    secureJsonData: {
      password: true,
    },
    secureJsonFields: {},
    readOnly: true,
  };

  const labelWidth = 10;

  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when compatibility check fails", () => {
    jest.spyOn(compat, "hasCompatibility").mockReturnValue(false);

    const { container } = render(
      <SecureSocksProxyToggle
        dataSourceConfig={dataSourceConfig}
        onChange={onChange}
        labelWidth={labelWidth}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should not render when secureSocksDSProxyEnabled is disabled in config", () => {
    jest.spyOn(compat, "hasCompatibility").mockReturnValue(true);
    jest.spyOn(config as any, "secureSocksDSProxyEnabled").mockReturnValue(false);

    const { container } = render(
      <SecureSocksProxyToggle
        dataSourceConfig={dataSourceConfig}
        onChange={onChange}
        labelWidth={labelWidth}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render and switch json data when enabled in config", () => {
    jest.spyOn(compat, "hasCompatibility").mockReturnValue(true);
    jest.spyOn(config as any, "secureSocksDSProxyEnabled").mockReturnValue(true);

    const { getByLabelText } = render(
      <SecureSocksProxyToggle
        dataSourceConfig={dataSourceConfig}
        onChange={onChange}
        labelWidth={labelWidth}
      />
    );

    const switchElement = getByLabelText("Secure Socks Proxy Enabled") as HTMLInputElement;
    expect(switchElement).toBeInTheDocument();
    expect(switchElement.checked).toBe(false);

    fireEvent.click(switchElement);

    expect(onChange).toHaveBeenCalledWith({
      ...dataSourceConfig,
      jsonData: {
        ...dataSourceConfig.jsonData,
        enableSecureSocksProxy: true,
      },
    });
  });
});
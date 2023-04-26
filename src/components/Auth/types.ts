import { ReactElement } from "react";

export enum AuthMethod {
  NoAuth = "NoAuth",
  BasicAuth = "BasicAuth",
  OAuthForward = "OAuthForward",
  CrossSiteCredentials = "CrossSiteCredentials",
}

export type CustomMethodId = `custom-${string}`;

export type CustomMethod = {
  id: CustomMethodId;
  label: string;
  description: string;
  component: ReactElement;
};

export type Header = {
  name: string;
  configured: boolean;
};

export type HeaderWithValue = Header & { value: string };

export type LocalHeader = HeaderWithValue & { id: string };

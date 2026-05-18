export type DatasourceResponse = Record<string, unknown> & {
  name: string;
  id: number;
  uid: string;
  access?: 'proxy' | 'direct';
  type?: string;
  typeLogoUrl?: string;
  url?: string;
  withCredentials?: boolean;
  basicAuth?: boolean;
  basicAuthUser?: string;
  user?: string;
  database?: string;
  jsonData?: Record<string, unknown>;
  secureJsonFields?: Record<string, boolean>;
  readOnly?: boolean;
};

export type DatasourceConfigPayload = {
  rootFields: Record<string, unknown>;
  jsonData: Record<string, unknown>;
  secureJsonData: Record<string, string>;
  secureJsonFields: Record<string, boolean>;
};

export type FormValues = Record<string, unknown>;

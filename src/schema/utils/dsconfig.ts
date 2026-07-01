export const ROOT_CONFIG_FIELDS = [
  'name',
  'type',
  'id',
  'uid',
  'access',
  'url',
  'basicAuth',
  'basicAuthUser',
  'user',
  'isDefault',
  'database',
  'withCredentials',
] as const;

type DatasourceConfig = Record<any, any>;

export const buildCreateDatasourcePayload = (input: DatasourceConfig): DatasourceConfig => {
  const body: DatasourceConfig = { name: input.name, type: input.type, access: 'proxy' };
  if (input.jsonData !== undefined) {
    body.jsonData = { ...(input.jsonData as DatasourceConfig) };
  }
  normalizeDatasourceConfig(body, input, { inferAuthMethod: true });
  return body;
};

export const buildCloneDatasourcePayload = (source: DatasourceConfig, name: string): DatasourceConfig => {
  return { ...source, name, access: source.access ?? 'proxy', isDefault: false };
};

export const buildUpdateDatasourcePayload = (
  existing: DatasourceConfig,
  input: DatasourceConfig
): { body: DatasourceConfig; hasChanges: boolean } => {
  const body: DatasourceConfig = {
    name: existing.name,
    type: existing.type,
    access: existing.access,
    url: existing.url,
    database: existing.database,
    basicAuth: existing.basicAuth,
    basicAuthUser: existing.basicAuthUser,
    isDefault: existing.isDefault,
    user: existing.user,
    withCredentials: existing.withCredentials,
    jsonData: existing.jsonData,
  };
  let hasChanges = false;
  const UPDATE_COMPARABLE_FIELDS = ['name', 'url', 'database', 'isDefault', 'basicAuth'] as const;
  for (const key of UPDATE_COMPARABLE_FIELDS) {
    if (input[key] !== undefined && input[key] !== existing[key]) {
      body[key] = input[key];
      hasChanges = true;
    }
  }

  if (input.jsonData !== undefined) {
    body.jsonData = { ...((existing.jsonData ?? {}) as DatasourceConfig), ...(input.jsonData as DatasourceConfig) };
    hasChanges = true;
    hasChanges = normalizeDatasourceConfig(body, input) || hasChanges;
  }

  return { body, hasChanges };
};

const normalizeDatasourceConfig = (
  body: DatasourceConfig,
  input: DatasourceConfig,
  options: { inferAuthMethod?: boolean } = {}
): boolean => {
  const changed = hoistRootConfigFields(body, input);
  if (options.inferAuthMethod) {
    applyInferredAuthMethod(body, input);
  }
  return changed;
};

const hoistRootConfigFields = (body: DatasourceConfig, input: DatasourceConfig): boolean => {
  const jsonData = (body.jsonData as DatasourceConfig | undefined) ?? {};
  let changed = false;

  for (const key of ROOT_CONFIG_FIELDS) {
    if (jsonData[key] === undefined) {
      continue;
    }

    if (input[key] === undefined) {
      body[key] = jsonData[key];
      changed = true;
    }

    delete jsonData[key];
  }

  body.jsonData = jsonData;
  return changed;
};

const applyInferredAuthMethod = (body: DatasourceConfig, input: DatasourceConfig): void => {
  const jsonData = (body.jsonData as DatasourceConfig | undefined) ?? {};

  if (jsonData.authMethod !== undefined) {
    body.jsonData = jsonData;
    return;
  }

  if (jsonData.oauthPassThru === true) {
    jsonData.authMethod = 'forward_oauth';
  } else if (body.basicAuth === true || input.basicAuth === true) {
    jsonData.authMethod = 'basic';
  }

  body.jsonData = jsonData;
};

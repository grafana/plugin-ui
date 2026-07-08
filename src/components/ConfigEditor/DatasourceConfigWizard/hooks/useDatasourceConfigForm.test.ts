import { renderHook, act, waitFor } from '@testing-library/react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { useDatasourceConfigForm } from './useDatasourceConfigForm';

// ------------------------------------------------------------------
// A representative schema that exercises every interpreter concern:
// required fields, a virtual selector with computed read + effects,
// a managed-by (hidden) field, dependsOn visibility, disabledWhen,
// and an optional group.
// ------------------------------------------------------------------
const buildSchema = (): DatasourceConfigSchema => ({
  schemaVersion: 'v1',
  pluginType: 'test',
  pluginName: 'Test',
  fields: [
    { id: 'root_url', key: 'url', valueType: 'string', target: 'root', required: true, ui: { component: 'input' } },
    {
      id: 'virtual_authMethod',
      key: 'authMethod',
      valueType: 'string',
      kind: 'virtual',
      defaultValue: 'NoAuth',
      ui: { component: 'select' },
      storage: { type: 'computed', read: "basicAuth == true ? 'BasicAuth' : 'NoAuth'" },
      effects: [
        { when: "value == 'BasicAuth'", set: { root_basicAuth: true } },
        { when: "value == 'NoAuth'", set: { root_basicAuth: false } },
      ],
    },
    {
      id: 'root_basicAuth',
      key: 'basicAuth',
      valueType: 'boolean',
      target: 'root',
      defaultValue: false,
      tags: ['managed-by:virtual_authMethod'],
    },
    {
      id: 'root_basicAuthUser',
      key: 'basicAuthUser',
      valueType: 'string',
      target: 'root',
      dependsOn: "virtual_authMethod == 'BasicAuth'",
      requiredWhen: 'root_basicAuth == true',
      ui: { component: 'input' },
    },
    {
      id: 'jsonData_advanced',
      key: 'advanced',
      valueType: 'boolean',
      target: 'jsonData',
      defaultValue: false,
      ui: { component: 'switch' },
    },
    {
      id: 'jsonData_advancedField',
      key: 'advancedField',
      valueType: 'string',
      target: 'jsonData',
      dependsOn: 'jsonData_advanced == true',
      disabledWhen: 'jsonData_advanced == false',
      ui: { component: 'input' },
    },
    { id: 'virtual_noUi', key: 'noUi', valueType: 'string', kind: 'virtual' },
  ],
  groups: [
    { id: 'connection', title: 'Connection', order: 1, fieldRefs: ['root_url'] },
    { id: 'authentication', title: 'Auth', order: 2, fieldRefs: ['virtual_authMethod', 'root_basicAuthUser'] },
    {
      id: 'advanced',
      title: 'Advanced',
      order: 3,
      optional: true,
      fieldRefs: ['jsonData_advanced', 'jsonData_advancedField'],
    },
  ],
});

type DsResponse = Record<string, unknown>;

const setGet = (impl: () => Promise<unknown>) => setBackendSrv({ get: impl } as unknown as BackendSrv);

async function renderForm(dsResponse: DsResponse | (() => Promise<never>)) {
  // Stable schema reference across re-renders (identity matters for the hook's memos/effects).
  const schema = buildSchema();
  if (typeof dsResponse === 'function') {
    setGet(dsResponse);
  } else {
    setGet(async () => ({ name: 'ds', id: 1, uid: 'uid', jsonData: {}, secureJsonFields: {}, ...dsResponse }));
  }
  const onSuccess = jest.fn();
  const view = renderHook(() => useDatasourceConfigForm({ schema, dsUid: 'uid', onSuccess }));
  await waitFor(() => expect(view.result.current.initializing).toBe(false));
  return view;
}

describe('useDatasourceConfigForm', () => {
  describe('initialization', () => {
    it('loads existing values (root/jsonData) and computes virtual fields', async () => {
      const { result } = await renderForm({ url: 'http://x', basicAuth: true, jsonData: { advanced: true } });
      expect(result.current.watchedValues.url).toBe('http://x');
      expect(result.current.watchedValues.basicAuth).toBe(true);
      expect(result.current.watchedValues.advanced).toBe(true);
      // virtual_authMethod computed.read resolves from basicAuth === true
      expect(result.current.watchedValues.authMethod).toBe('BasicAuth');
    });

    it('prepends a synthetic _required group and sorts real groups by order', async () => {
      const { result } = await renderForm({});
      const ids = result.current.resolvedGroups.map((g) => g.group.id);
      expect(ids[0]).toBe('_required');
      expect(ids.slice(1)).toEqual(['connection', 'authentication', 'advanced']);
    });

    it('detects a read-only datasource', async () => {
      const { result } = await renderForm({ readOnly: true });
      expect(result.current.readOnly).toBe(true);
    });

    it('surfaces a fetch error', async () => {
      const { result } = await renderForm(async () => {
        throw new Error('load failed');
      });
      expect(result.current.fetchError).toBe('load failed');
    });
  });

  describe('isFieldVisible', () => {
    it('hides virtual fields without ui and managed-by fields', async () => {
      const { result } = await renderForm({});
      const f = (id: string) => result.current.fieldById.get(id) as ConfigField;
      expect(result.current.isFieldVisible(f('root_url'))).toBe(true);
      expect(result.current.isFieldVisible(f('virtual_authMethod'))).toBe(true);
      expect(result.current.isFieldVisible(f('virtual_noUi'))).toBe(false);
      expect(result.current.isFieldVisible(f('root_basicAuth'))).toBe(false);
    });

    it('evaluates dependsOn against current values', async () => {
      const { result } = await renderForm({});
      const f = (id: string) => result.current.fieldById.get(id) as ConfigField;
      // authMethod defaults to NoAuth -> basicAuthUser hidden
      expect(result.current.isFieldVisible(f('root_basicAuthUser'))).toBe(false);
      expect(result.current.isFieldVisible(f('jsonData_advancedField'))).toBe(false);
    });
  });

  describe('isFieldDisabled', () => {
    it('applies disabledWhen', async () => {
      const { result } = await renderForm({});
      const advancedField = result.current.fieldById.get('jsonData_advancedField') as ConfigField;
      // advanced defaults to false -> advancedField disabled
      expect(result.current.isFieldDisabled(advancedField)).toBe(true);
    });
  });

  describe('isGroupValid', () => {
    it('is invalid when a visible required field is empty', async () => {
      const { result } = await renderForm({});
      const connection = result.current.resolvedGroups.find((g) => g.group.id === 'connection')!;
      expect(result.current.isGroupValid(connection)).toBe(false);
    });

    it('is valid once the required field has a value', async () => {
      const { result } = await renderForm({ url: 'http://x' });
      const connection = result.current.resolvedGroups.find((g) => g.group.id === 'connection')!;
      expect(result.current.isGroupValid(connection)).toBe(true);
    });
  });

  describe('groupHasData', () => {
    it('is false when a group only holds default/empty values', async () => {
      const { result } = await renderForm({});
      const advanced = result.current.resolvedGroups.find((g) => g.group.id === 'advanced')!;
      expect(result.current.groupHasData(advanced)).toBe(false);
    });

    it('is true when a group holds a non-default value', async () => {
      const { result } = await renderForm({ jsonData: { advanced: true } });
      const advanced = result.current.resolvedGroups.find((g) => g.group.id === 'advanced')!;
      expect(result.current.groupHasData(advanced)).toBe(true);
    });
  });

  describe('effects', () => {
    it('applies field effects when the source value changes', async () => {
      const { result } = await renderForm({});
      expect(result.current.watchedValues.basicAuth).toBe(false);

      act(() => result.current.setValue('authMethod', 'BasicAuth'));

      // Effect sets root_basicAuth (formKey "basicAuth") to true...
      await waitFor(() => expect(result.current.watchedValues.basicAuth).toBe(true));
      // ...which in turn makes the dependent basicAuthUser field visible.
      const user = result.current.fieldById.get('root_basicAuthUser') as ConfigField;
      expect(result.current.isFieldVisible(user)).toBe(true);
    });
  });
});

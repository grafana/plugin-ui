import type { ConfigField } from '../../../../schema/schema';
import { resolveFieldInputKind } from './fieldUtils';

const field = (partial: Partial<ConfigField> & { id: string; key: string }): ConfigField => ({
  valueType: 'string',
  ...partial,
});

// Convenience: most cases don't care about setValue, so default it to present.
const kind = (partial: Partial<ConfigField> & { id: string; key: string }, hasSetValue = true) =>
  resolveFieldInputKind(field(partial), hasSetValue);

describe('resolveFieldInputKind', () => {
  describe('per-kind resolution', () => {
    it('defaults a plain string field to text', () => {
      expect(kind({ id: 'a', key: 'a' })).toBe('text');
    });

    it('resolves textarea from ui.component', () => {
      expect(kind({ id: 'a', key: 'a', ui: { component: 'textarea' } })).toBe('textarea');
    });

    it('resolves boolean from valueType', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'boolean' })).toBe('boolean');
    });

    it('resolves number from valueType', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'number' })).toBe('number');
    });

    it('resolves select from ui.component', () => {
      expect(kind({ id: 'a', key: 'a', ui: { component: 'select' } })).toBe('select');
    });

    it('resolves radio from ui.component', () => {
      expect(kind({ id: 'a', key: 'a', ui: { component: 'radio' } })).toBe('radio');
    });

    it('resolves secure from target secureJsonData', () => {
      expect(kind({ id: 'a', key: 'a', target: 'secureJsonData' })).toBe('secure');
    });

    it('resolves fileUpload when component + fileMapping + setValue are present', () => {
      expect(kind({ id: 'a', key: 'a', ui: { component: 'fileUpload', fileMapping: { k: 'jsonData.k' } } })).toBe(
        'fileUpload'
      );
    });

    it('resolves indexedPair from storage.type', () => {
      expect(
        kind({
          id: 'a',
          key: 'httpHeaders',
          valueType: 'array',
          item: { valueType: 'string' },
          storage: {
            type: 'indexedPair',
            key: { target: 'jsonData', pattern: 'httpHeaderName{index}' },
            value: { target: 'jsonData', pattern: 'httpHeaderValue{index}' },
          },
        })
      ).toBe('indexedPair');
    });

    it('resolves stringArray for an array of strings', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'array', item: { valueType: 'string' } })).toBe('stringArray');
    });

    it('resolves objectArray for an array of objects with item fields', () => {
      expect(
        kind({
          id: 'a',
          key: 'a',
          valueType: 'array',
          item: { valueType: 'object', fields: [field({ id: 'x', key: 'x' })] },
        })
      ).toBe('objectArray');
    });

    it.each(['object', 'map'] as const)('resolves complex for valueType %s', (valueType) => {
      expect(kind({ id: 'a', key: 'a', valueType })).toBe('complex');
    });

    it('resolves complex for an array of objects without item fields', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'array', item: { valueType: 'object' } })).toBe('complex');
    });

    it('resolves complex for an array of maps', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'array', item: { valueType: 'map' } })).toBe('complex');
    });
  });

  describe('priority ordering', () => {
    it('fileUpload wins over secure when setValue is present', () => {
      const f: Partial<ConfigField> & { id: string; key: string } = {
        id: 'a',
        key: 'a',
        target: 'secureJsonData',
        ui: { component: 'fileUpload', fileMapping: { k: 'jsonData.k' } },
      };
      expect(kind(f, true)).toBe('fileUpload');
      expect(kind(f, false)).toBe('secure');
    });

    it('falls through fileUpload when fileMapping is absent', () => {
      expect(kind({ id: 'a', key: 'a', ui: { component: 'fileUpload' } })).toBe('text');
    });

    it('secure wins over an explicit radio component', () => {
      expect(kind({ id: 'a', key: 'a', target: 'secureJsonData', ui: { component: 'radio' } })).toBe('secure');
    });

    it('radio/select win over the type-derived default', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'number', ui: { component: 'radio' } })).toBe('radio');
      expect(kind({ id: 'a', key: 'a', valueType: 'boolean', ui: { component: 'select' } })).toBe('select');
    });

    it('boolean/number win over an explicit textarea component', () => {
      expect(kind({ id: 'a', key: 'a', valueType: 'boolean', ui: { component: 'textarea' } })).toBe('boolean');
      expect(kind({ id: 'a', key: 'a', valueType: 'number', ui: { component: 'textarea' } })).toBe('number');
    });

    it('indexedPair wins over the generic string-array branch', () => {
      expect(
        kind({
          id: 'a',
          key: 'httpHeaders',
          valueType: 'array',
          item: { valueType: 'string' },
          storage: {
            type: 'indexedPair',
            key: { target: 'jsonData', pattern: 'n{index}' },
            value: { target: 'jsonData', pattern: 'v{index}' },
          },
        })
      ).toBe('indexedPair');
    });
  });
});

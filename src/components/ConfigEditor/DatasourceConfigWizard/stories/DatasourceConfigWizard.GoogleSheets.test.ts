/**
 * Tests for Google Sheets schema field visibility, effects, and group resolution.
 *
 * These validate that the correct fields render in each auth mode
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import {
  resolveGroups,
  formKey,
  parseDependsOn,
  evaluateDependsOn,
  getWatchedValue,
  computeVirtualFieldValues,
  evaluateComputedRead,
} from '../config';
import { evaluateEffectCondition } from '../fieldUtils';
import googleSheetsSchemaJson from '../../../../schema/registry/grafana-googlesheets-datasource.schema.json';

const schema = googleSheetsSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Helpers
// ============================================================

/** Build a fieldById map from the schema. */
function buildFieldMap(): Map<string, ConfigField> {
  const m = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    m.set(f.id, f);
  }
  return m;
}

/** Check if a field is visible given current form values (mirrors useDatasourceConfigForm.isFieldVisible). */
function isVisible(field: ConfigField, values: Record<string, unknown>, fieldById: Map<string, ConfigField>): boolean {
  if (field.kind === 'virtual' && !field.ui) {
    return false;
  }
  if (field.tags?.some((t) => t.startsWith('managed-by:'))) {
    return false;
  }
  if (!field.dependsOn) {
    return true;
  }
  const parsed = parseDependsOn(field.dependsOn);
  if (!parsed) {
    return true;
  }
  const depField = fieldById.get(parsed.field);
  const depKey = depField ? formKey(depField) : parsed.field;
  return evaluateDependsOn(parsed, getWatchedValue(values, depKey));
}

/** Get visible field IDs for given form values. */
function visibleFieldIds(values: Record<string, unknown>): string[] {
  const fieldById = buildFieldMap();
  return schema.fields.filter((f) => isVisible(f, values, fieldById)).map((f) => f.id);
}

/** Apply matching effects from a source field given its current value. */
function applyEffects(
  field: ConfigField,
  fieldValue: unknown,
  values: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...values };
  const fieldById = buildFieldMap();
  if (!field.effects) {
    return result;
  }
  for (const eff of field.effects) {
    if (evaluateEffectCondition(eff.when, fieldValue)) {
      for (const [targetId, val] of Object.entries(eff.set)) {
        const targetField = fieldById.get(targetId);
        const key = targetField ? formKey(targetField) : targetId;
        result[key] = val;
      }
      break;
    }
  }
  return result;
}

// ============================================================
// Schema structure
// ============================================================

describe('Google Sheets schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(10);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['auth', 'sheets-defaults']);
  });

  it('auth group references all auth-related fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.authenticationType');
    expect(auth.group.fieldRefs).toContain('virtual.jwtUpload');
    expect(auth.group.fieldRefs).toContain('virtual.privateKeyMode');
    expect(auth.group.fieldRefs).toContain('secureJsonData.privateKey');
    expect(auth.group.fieldRefs).toContain('jsonData.privateKeyPath');
    expect(auth.group.fieldRefs).toContain('secureJsonData.apiKey');
  });

  it('authenticationType is required with default jwt', () => {
    const authField = schema.fields.find((f) => f.id === 'jsonData.authenticationType')!;
    expect(authField.required).toBe(true);
    expect(authField.defaultValue).toBe('jwt');
  });

  it('authenticationType uses select component', () => {
    const authField = schema.fields.find((f) => f.id === 'jsonData.authenticationType')!;
    expect(authField.ui?.component).toBe('select');
    expect(authField.ui?.options?.map((o) => o.value)).toEqual(['jwt', 'key', 'gce']);
  });

  it('defaultSheetID has no dependsOn (always visible)', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.defaultSheetID')!;
    expect(f.dependsOn).toBeUndefined();
  });
});

// ============================================================
// Effects: authenticationType → jwtUpload
// ============================================================

describe('authenticationType effects', () => {
  const authField = schema.fields.find((f) => f.id === 'jsonData.authenticationType')!;

  it('sets jwtUpload to "upload" when JWT selected', () => {
    const values = applyEffects(authField, 'jwt', { authenticationType: 'jwt' });
    expect(values['jwtUpload']).toBe('upload');
  });

  it('sets jwtUpload to "manual" when GCE selected', () => {
    const values = applyEffects(authField, 'gce', { authenticationType: 'gce' });
    expect(values['jwtUpload']).toBe('manual');
  });

  it('clears jwtUpload when API Key selected', () => {
    const values = applyEffects(authField, 'key', { authenticationType: 'key' });
    expect(values['jwtUpload']).toBe('');
  });
});

// ============================================================
// JWT upload mode: only fileUpload + defaultSheetID visible
// ============================================================

describe('JWT upload mode', () => {
  // jwtUpload effect sets privateKeyMode to '' when not manual
  const values: Record<string, unknown> = {
    authenticationType: 'jwt',
    jwtUpload: 'upload',
    privateKeyMode: '',
  };

  it('shows authenticationType', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.authenticationType');
  });

  it('shows jwtUpload (fileUpload component)', () => {
    expect(visibleFieldIds(values)).toContain('virtual.jwtUpload');
  });

  it('hides manual JWT fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.defaultProject');
    expect(ids).not.toContain('jsonData.clientEmail');
    expect(ids).not.toContain('jsonData.tokenUri');
    expect(ids).not.toContain('virtual.privateKeyMode');
    expect(ids).not.toContain('secureJsonData.privateKey');
    expect(ids).not.toContain('jsonData.privateKeyPath');
  });

  it('hides apiKey', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.apiKey');
  });

  it('shows defaultSheetID', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultSheetID');
  });
});

// ============================================================
// JWT paste mode: same as upload
// ============================================================

describe('JWT paste mode', () => {
  const values: Record<string, unknown> = {
    authenticationType: 'jwt',
    jwtUpload: 'paste',
    privateKeyMode: '',
  };

  it('shows jwtUpload', () => {
    expect(visibleFieldIds(values)).toContain('virtual.jwtUpload');
  });

  it('hides manual JWT fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.defaultProject');
    expect(ids).not.toContain('jsonData.clientEmail');
    expect(ids).not.toContain('jsonData.tokenUri');
    expect(ids).not.toContain('virtual.privateKeyMode');
    expect(ids).not.toContain('secureJsonData.privateKey');
    expect(ids).not.toContain('jsonData.privateKeyPath');
  });
});

// ============================================================
// JWT manual mode: manual fields visible
// ============================================================

describe('JWT manual mode — paste private key (default)', () => {
  // jwtUpload effect sets privateKeyMode to 'paste' when manual
  const values: Record<string, unknown> = {
    authenticationType: 'jwt',
    jwtUpload: 'manual',
    privateKeyMode: 'paste',
  };

  it('shows jwtUpload (for mode toggle buttons)', () => {
    expect(visibleFieldIds(values)).toContain('virtual.jwtUpload');
  });

  it('shows manual JWT fields + privateKey', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.defaultProject');
    expect(ids).toContain('jsonData.clientEmail');
    expect(ids).toContain('jsonData.tokenUri');
    expect(ids).toContain('virtual.privateKeyMode');
    expect(ids).toContain('secureJsonData.privateKey');
  });

  it('hides privateKeyPath', () => {
    expect(visibleFieldIds(values)).not.toContain('jsonData.privateKeyPath');
  });

  it('hides apiKey', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.apiKey');
  });

  it('shows defaultSheetID', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultSheetID');
  });
});

// ============================================================
// JWT manual mode: private key path variant
// ============================================================

describe('JWT manual mode — private key path', () => {
  const values: Record<string, unknown> = {
    authenticationType: 'jwt',
    jwtUpload: 'manual',
    privateKeyMode: 'path',
  };

  it('shows privateKeyPath', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.privateKeyPath');
  });

  it('hides privateKey', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.privateKey');
  });

  it('still shows other manual fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.defaultProject');
    expect(ids).toContain('jsonData.clientEmail');
    expect(ids).toContain('jsonData.tokenUri');
    expect(ids).toContain('virtual.privateKeyMode');
  });
});

// ============================================================
// API Key mode
// ============================================================

describe('API Key mode', () => {
  const values: Record<string, unknown> = {
    authenticationType: 'key',
    jwtUpload: '',
    privateKeyMode: '',
  };

  it('shows apiKey', () => {
    expect(visibleFieldIds(values)).toContain('secureJsonData.apiKey');
  });

  it('hides jwtUpload', () => {
    expect(visibleFieldIds(values)).not.toContain('virtual.jwtUpload');
  });

  it('hides all JWT manual fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.defaultProject');
    expect(ids).not.toContain('jsonData.clientEmail');
    expect(ids).not.toContain('jsonData.tokenUri');
    expect(ids).not.toContain('virtual.privateKeyMode');
    expect(ids).not.toContain('secureJsonData.privateKey');
    expect(ids).not.toContain('jsonData.privateKeyPath');
  });

  it('shows defaultSheetID', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultSheetID');
  });
});

// ============================================================
// GCE mode
// ============================================================

describe('GCE mode', () => {
  // GCE effect sets jwtUpload to 'manual', which in turn sets privateKeyMode to 'paste'
  const values: Record<string, unknown> = {
    authenticationType: 'gce',
    jwtUpload: 'manual',
    privateKeyMode: 'paste',
  };

  it('hides jwtUpload (dependsOn authenticationType == jwt)', () => {
    expect(visibleFieldIds(values)).not.toContain('virtual.jwtUpload');
  });

  it('shows defaultProject', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultProject');
  });

  it('shows clientEmail, tokenUri, privateKeyMode, privateKey (jwtUpload == manual)', () => {
    // These depend on jwtUpload == 'manual', which GCE effect sets.
    // In GCE mode the real plugin only shows defaultProject, but in the schema
    // these are technically visible. This is acceptable — the wizard shows them
    // but they're not required for GCE, so the user can ignore them.
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.clientEmail');
    expect(ids).toContain('jsonData.tokenUri');
    expect(ids).toContain('virtual.privateKeyMode');
    expect(ids).toContain('secureJsonData.privateKey');
  });

  it('hides apiKey', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.apiKey');
  });

  it('shows defaultSheetID', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultSheetID');
  });
});

// ============================================================
// fileMapping structure
// ============================================================

describe('JWT fileMapping', () => {
  const jwtUploadField = schema.fields.find((f) => f.id === 'virtual.jwtUpload')!;

  it('maps project_id to defaultProject', () => {
    expect(jwtUploadField.ui?.fileMapping?.['project_id']).toBe('jsonData.defaultProject');
  });

  it('maps client_email to clientEmail', () => {
    expect(jwtUploadField.ui?.fileMapping?.['client_email']).toBe('jsonData.clientEmail');
  });

  it('maps token_uri to tokenUri', () => {
    expect(jwtUploadField.ui?.fileMapping?.['token_uri']).toBe('jsonData.tokenUri');
  });

  it('maps private_key to privateKey', () => {
    expect(jwtUploadField.ui?.fileMapping?.['private_key']).toBe('secureJsonData.privateKey');
  });

  it('accepts .json files', () => {
    expect(jwtUploadField.ui?.accept).toEqual(['.json']);
  });
});

// ============================================================
// privateKey field
// ============================================================

describe('privateKeyMode field', () => {
  const pkMode = schema.fields.find((f) => f.id === 'virtual.privateKeyMode')!;

  it('is a virtual radio field', () => {
    expect(pkMode.kind).toBe('virtual');
    expect(pkMode.ui?.component).toBe('radio');
  });

  it('defaults to paste', () => {
    expect(pkMode.defaultValue).toBe('paste');
  });

  it('has two options: paste and path', () => {
    expect(pkMode.ui?.options?.map((o) => o.value)).toEqual(['paste', 'path']);
  });

  it('depends on jwtUpload == manual', () => {
    expect(pkMode.dependsOn).toBe("virtual.jwtUpload == 'manual'");
  });
});

describe('privateKey field', () => {
  const pk = schema.fields.find((f) => f.id === 'secureJsonData.privateKey')!;

  it('is a secure token field', () => {
    expect(pk.semanticType).toBe('token');
    expect(pk.target).toBe('secureJsonData');
  });

  it('depends on privateKeyMode == paste', () => {
    expect(pk.dependsOn).toBe("virtual.privateKeyMode == 'paste'");
  });
});

describe('privateKeyPath field', () => {
  const pkPath = schema.fields.find((f) => f.id === 'jsonData.privateKeyPath')!;

  it('depends on privateKeyMode == path', () => {
    expect(pkPath.dependsOn).toBe("virtual.privateKeyMode == 'path'");
  });

  it('has placeholder', () => {
    expect(pkPath.ui?.placeholder).toContain('/etc/secrets/');
  });
});

// ============================================================
// jwtUpload effects on privateKeyMode
// ============================================================

describe('jwtUpload effects on privateKeyMode', () => {
  const jwtUploadField = schema.fields.find((f) => f.id === 'virtual.jwtUpload')!;

  it('does NOT set privateKeyMode when manual (computed.read handles it)', () => {
    const values = applyEffects(jwtUploadField, 'manual', { privateKeyMode: 'path' });
    // No effect matches for 'manual', so existing value is preserved
    expect(values['privateKeyMode']).toBe('path');
  });

  it('clears privateKeyMode when upload', () => {
    const values = applyEffects(jwtUploadField, 'upload', { privateKeyMode: 'paste' });
    expect(values['privateKeyMode']).toBe('');
  });

  it('clears privateKeyMode when paste', () => {
    const values = applyEffects(jwtUploadField, 'paste', { privateKeyMode: 'paste' });
    expect(values['privateKeyMode']).toBe('');
  });
});

describe('jwtUpload computed.read', () => {
  it('resolves to manual when clientEmail exists', () => {
    const vals = { clientEmail: 'test@test.iam.gserviceaccount.com' };
    const result = evaluateComputedRead("jsonData.clientEmail ? 'manual' : 'upload'", vals, schema.fields);
    expect(result).toBe('manual');
  });

  it('resolves to upload when clientEmail is absent', () => {
    const result = evaluateComputedRead("jsonData.clientEmail ? 'manual' : 'upload'", {}, schema.fields);
    expect(result).toBe('upload');
  });
});

// ============================================================
// computeVirtualFieldValues — load-time derivation
// ============================================================

describe('computeVirtualFieldValues at load time', () => {
  it('derives privateKeyMode=path when privateKeyPath is set', () => {
    const existingValues: Record<string, unknown> = {
      authenticationType: 'jwt',
      defaultProject: 'my-proj',
      clientEmail: 'test@test.iam.gserviceaccount.com',
      tokenUri: 'https://oauth2.googleapis.com/token',
      privateKeyPath: '/etc/secrets/gce.pem',
    };
    const virtuals = computeVirtualFieldValues(schema, existingValues);
    expect(virtuals['privateKeyMode']).toBe('path');
  });

  it('derives privateKeyMode=paste when privateKeyPath is not set', () => {
    const existingValues: Record<string, unknown> = {
      authenticationType: 'jwt',
      defaultProject: 'my-proj',
      clientEmail: 'test@test.iam.gserviceaccount.com',
      tokenUri: 'https://oauth2.googleapis.com/token',
    };
    const virtuals = computeVirtualFieldValues(schema, existingValues);
    expect(virtuals['privateKeyMode']).toBe('paste');
  });

  it('evaluateComputedRead resolves field by id to formKey', () => {
    const vals = { privateKeyPath: '/etc/secrets/gce.pem' };
    const result = evaluateComputedRead("jsonData.privateKeyPath ? 'path' : 'paste'", vals, schema.fields);
    expect(result).toBe('path');
  });

  it('evaluateComputedRead falls back to paste for missing privateKeyPath', () => {
    const result = evaluateComputedRead("jsonData.privateKeyPath ? 'path' : 'paste'", {}, schema.fields);
    expect(result).toBe('paste');
  });
});

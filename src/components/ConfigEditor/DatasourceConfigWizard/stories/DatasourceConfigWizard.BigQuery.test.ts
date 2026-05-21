/**
 * Tests for Google BigQuery schema field visibility, effects, and group resolution.
 *
 * These validate that the correct fields render in each auth mode
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import {
  resolveGroups,
  resolveRequiredFieldsGroup,
  formKey,
  getWatchedValue,
  computeVirtualFieldValues,
  evaluateComputedRead,
} from '../config';
import { evaluateCelExpression } from '../cel';
import { evaluateEffectCondition } from '../fieldUtils';
import bigQuerySchemaJson from '../../../../schema/registry/grafana-bigquery-datasource.schema.json';

const schema = bigQuerySchemaJson as unknown as DatasourceConfigSchema;

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

/** Build a CEL context from flat form values and field definitions (mirrors useDatasourceConfigForm). */
function buildCelContext(values: Record<string, unknown>): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  const fieldById = buildFieldMap();
  for (const f of fieldById.values()) {
    const fk = formKey(f);
    const val = getWatchedValue(values, fk);
    if (val !== undefined) {
      const parts = f.id.split('.');
      let current = ctx as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current) || typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = val;
    }
  }
  return ctx;
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
  // Use CEL evaluator for compound expressions (&&, ||)
  const celCtx = buildCelContext(values);
  return evaluateCelExpression(field.dependsOn, celCtx);
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

describe('BigQuery schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(18);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['auth', 'impersonation', 'additional']);
  });

  it('auth group references all auth-related fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.authenticationType');
    expect(auth.group.fieldRefs).toContain('virtual.jwtUpload');
    expect(auth.group.fieldRefs).toContain('virtual.privateKeyMode');
    expect(auth.group.fieldRefs).toContain('secureJsonData.privateKey');
    expect(auth.group.fieldRefs).toContain('jsonData.privateKeyPath');
    expect(auth.group.fieldRefs).toContain('jsonData.defaultProjectNonJwt');
  });

  it('impersonation group has impersonation fields', () => {
    const groups = resolveGroups(schema);
    const imp = groups.find((g) => g.group.id === 'impersonation')!;
    expect(imp.group.fieldRefs).toContain('jsonData.usingImpersonation');
    expect(imp.group.fieldRefs).toContain('jsonData.serviceAccountToImpersonate');
  });

  it('authenticationType is required with default jwt', () => {
    const authField = schema.fields.find((f) => f.id === 'jsonData.authenticationType')!;
    expect(authField.required).toBe(true);
    expect(authField.defaultValue).toBe('jwt');
  });

  it('authenticationType uses select component', () => {
    const authField = schema.fields.find((f) => f.id === 'jsonData.authenticationType')!;
    expect(authField.ui?.component).toBe('select');
    expect(authField.ui?.options?.map((o) => o.value)).toEqual(['jwt', 'gce', 'forwardOAuthIdentity']);
  });
});

// ============================================================
// Effects: authenticationType
// ============================================================

describe('authenticationType effects', () => {
  const authField = schema.fields.find((f) => f.id === 'jsonData.authenticationType')!;

  it('sets jwtUpload to "upload" and oauthPassThru to false when JWT selected', () => {
    const values = applyEffects(authField, 'jwt', { authenticationType: 'jwt' });
    expect(values['jwtUpload']).toBe('upload');
    expect(values['oauthPassThru']).toBe(false);
  });

  it('sets jwtUpload to "manual" and oauthPassThru to false when GCE selected', () => {
    const values = applyEffects(authField, 'gce', { authenticationType: 'gce' });
    expect(values['jwtUpload']).toBe('manual');
    expect(values['oauthPassThru']).toBe(false);
  });

  it('clears jwtUpload and sets oauthPassThru to true when Forward OAuth selected', () => {
    const values = applyEffects(authField, 'forwardOAuthIdentity', { authenticationType: 'forwardOAuthIdentity' });
    expect(values['jwtUpload']).toBe('');
    expect(values['oauthPassThru']).toBe(true);
  });
});

// ============================================================
// JWT upload mode: only fileUpload visible
// ============================================================

describe('JWT upload mode', () => {
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

  it('shows impersonation toggle (JWT mode)', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.usingImpersonation');
  });

  it('shows additional settings (processingLocation, etc)', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.processingLocation');
    expect(ids).toContain('jsonData.serviceEndpoint');
    expect(ids).toContain('jsonData.MaxBytesBilled');
  });
});

// ============================================================
// JWT manual mode — paste private key
// ============================================================

describe('JWT manual mode — paste private key (default)', () => {
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
});

// ============================================================
// JWT manual mode — private key path
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
// GCE mode
// ============================================================

describe('GCE mode', () => {
  const values: Record<string, unknown> = {
    authenticationType: 'gce',
    jwtUpload: 'manual',
    privateKeyMode: 'paste',
  };

  it('hides jwtUpload (dependsOn authenticationType == jwt)', () => {
    expect(visibleFieldIds(values)).not.toContain('virtual.jwtUpload');
  });

  it('shows default project field', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultProjectNonJwt');
  });

  it('shows impersonation toggle', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.usingImpersonation');
  });

  it('shows additional settings', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.processingLocation');
    expect(ids).toContain('jsonData.serviceEndpoint');
    expect(ids).toContain('jsonData.MaxBytesBilled');
  });
});

// ============================================================
// Forward OAuth Identity mode
// ============================================================

describe('Forward OAuth Identity mode', () => {
  const values: Record<string, unknown> = {
    authenticationType: 'forwardOAuthIdentity',
    jwtUpload: '',
    privateKeyMode: '',
  };

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

  it('shows default project field', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultProjectNonJwt');
  });

  it('hides impersonation toggle (Forward OAuth has no impersonation)', () => {
    expect(visibleFieldIds(values)).not.toContain('jsonData.usingImpersonation');
  });

  it('shows additional settings', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.processingLocation');
    expect(ids).toContain('jsonData.serviceEndpoint');
    expect(ids).toContain('jsonData.MaxBytesBilled');
  });
});

// ============================================================
// Service account impersonation
// ============================================================

describe('Service account impersonation', () => {
  it('shows serviceAccountToImpersonate when impersonation enabled (GCE)', () => {
    const values: Record<string, unknown> = {
      authenticationType: 'gce',
      usingImpersonation: true,
    };
    expect(visibleFieldIds(values)).toContain('jsonData.serviceAccountToImpersonate');
  });

  it('shows serviceAccountToImpersonate when impersonation enabled (JWT)', () => {
    const values: Record<string, unknown> = {
      authenticationType: 'jwt',
      usingImpersonation: true,
    };
    expect(visibleFieldIds(values)).toContain('jsonData.serviceAccountToImpersonate');
  });

  it('hides serviceAccountToImpersonate when impersonation disabled', () => {
    const values: Record<string, unknown> = {
      authenticationType: 'gce',
      usingImpersonation: false,
    };
    expect(visibleFieldIds(values)).not.toContain('jsonData.serviceAccountToImpersonate');
  });

  it('hides serviceAccountToImpersonate when usingImpersonation absent', () => {
    const values: Record<string, unknown> = {
      authenticationType: 'jwt',
    };
    expect(visibleFieldIds(values)).not.toContain('jsonData.serviceAccountToImpersonate');
  });

  it('hides serviceAccountToImpersonate for Forward OAuth even if impersonation is true', () => {
    const values: Record<string, unknown> = {
      authenticationType: 'forwardOAuthIdentity',
      usingImpersonation: true,
    };
    expect(visibleFieldIds(values)).not.toContain('jsonData.serviceAccountToImpersonate');
  });
});

// ============================================================
// Wizard mode: _required (General) group
// ============================================================

describe('Wizard _required group includes impersonation fields', () => {
  const requiredGroup = resolveRequiredFieldsGroup(schema);

  it('_required group exists', () => {
    expect(requiredGroup).not.toBeNull();
  });

  it('includes usingImpersonation (depends on required authenticationType)', () => {
    expect(requiredGroup!.group.fieldRefs).toContain('jsonData.usingImpersonation');
  });

  it('includes serviceAccountToImpersonate (depends on required authenticationType)', () => {
    expect(requiredGroup!.group.fieldRefs).toContain('jsonData.serviceAccountToImpersonate');
  });

  it('includes all auth group fields', () => {
    expect(requiredGroup!.group.fieldRefs).toContain('jsonData.authenticationType');
    expect(requiredGroup!.group.fieldRefs).toContain('virtual.jwtUpload');
    expect(requiredGroup!.group.fieldRefs).toContain('jsonData.defaultProject');
    expect(requiredGroup!.group.fieldRefs).toContain('secureJsonData.privateKey');
  });
});

// ============================================================
// Managed-by tags (hidden fields)
// ============================================================

describe('Managed-by tags', () => {
  it('oauthPassThru is hidden (managed-by authenticationType)', () => {
    const values: Record<string, unknown> = {
      authenticationType: 'forwardOAuthIdentity',
    };
    expect(visibleFieldIds(values)).not.toContain('jsonData.oauthPassThru');
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
// privateKeyMode field
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

describe('jwtUpload has no effects on privateKeyMode', () => {
  const jwtUploadField = schema.fields.find((f) => f.id === 'virtual.jwtUpload')!;

  it('has no effects (privateKeyMode is derived from computed.read only)', () => {
    expect(jwtUploadField.effects).toBeUndefined();
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
      privateKeyPath: '/etc/secrets/bigquery.pem',
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
    const vals = { privateKeyPath: '/etc/secrets/bigquery.pem' };
    const result = evaluateComputedRead("jsonData.privateKeyPath ? 'path' : 'paste'", vals, schema.fields);
    expect(result).toBe('path');
  });

  it('evaluateComputedRead falls back to paste for missing privateKeyPath', () => {
    const result = evaluateComputedRead("jsonData.privateKeyPath ? 'path' : 'paste'", {}, schema.fields);
    expect(result).toBe('paste');
  });

  it('derives jwtUpload=manual when clientEmail exists', () => {
    const vals = { clientEmail: 'test@test.iam.gserviceaccount.com' };
    const result = evaluateComputedRead("jsonData.clientEmail ? 'manual' : 'upload'", vals, schema.fields);
    expect(result).toBe('manual');
  });

  it('derives jwtUpload=upload when clientEmail is absent', () => {
    const result = evaluateComputedRead("jsonData.clientEmail ? 'manual' : 'upload'", {}, schema.fields);
    expect(result).toBe('upload');
  });
});

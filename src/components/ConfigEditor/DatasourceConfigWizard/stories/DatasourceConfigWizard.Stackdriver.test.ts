/**
 * Tests for Google Cloud Monitoring (Stackdriver) schema field visibility, effects, and group resolution.
 *
 * These validate that the correct fields render in each auth mode
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import {
  resolveGroups,
  resolveRequiredFieldsGroup,
  formKey,
  getWatchedValue,
  computeVirtualFieldValues,
} from '../../../../datasource/schema/config';
import { evaluateCelExpression } from '../../../../datasource/schema/cel';
import { evaluateEffectCondition } from '../fieldUtils';
import stackdriverSchemaJson from '../../../../datasource/schema/datasources/stackdriver.schema.json';

const schema = stackdriverSchemaJson as unknown as DatasourceConfigSchema;

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

describe('Stackdriver schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(11);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['auth', 'impersonation']);
  });

  it('auth group references all auth-related fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.authenticationType');
    expect(auth.group.fieldRefs).toContain('virtual.jwtUpload');
    expect(auth.group.fieldRefs).toContain('virtual.privateKeyMode');
    expect(auth.group.fieldRefs).toContain('secureJsonData.privateKey');
    expect(auth.group.fieldRefs).toContain('jsonData.privateKeyPath');
    expect(auth.group.fieldRefs).toContain('jsonData.defaultProjectGce');
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
    expect(authField.ui?.options?.map((o) => o.value)).toEqual(['jwt', 'gce']);
  });
});

// ============================================================
// Effects: authenticationType
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

  it('hides GCE default project', () => {
    expect(visibleFieldIds(values)).not.toContain('jsonData.defaultProjectGce');
  });

  it('shows impersonation toggle', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.usingImpersonation');
  });
});

// ============================================================
// JWT manual mode -- paste private key
// ============================================================

describe('JWT manual mode -- paste private key (default)', () => {
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

  it('hides GCE default project', () => {
    expect(visibleFieldIds(values)).not.toContain('jsonData.defaultProjectGce');
  });
});

// ============================================================
// JWT manual mode -- private key path
// ============================================================

describe('JWT manual mode -- private key path', () => {
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

  it('shows GCE default project field', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.defaultProjectGce');
  });

  it('hides JWT project field', () => {
    expect(visibleFieldIds(values)).not.toContain('jsonData.defaultProject');
  });

  it('shows impersonation toggle', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.usingImpersonation');
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
});

// ============================================================
// Wizard mode: _required (General) group
// ============================================================

describe('Wizard _required group includes auth fields', () => {
  const requiredGroup = resolveRequiredFieldsGroup(schema);

  it('_required group exists', () => {
    expect(requiredGroup).not.toBeNull();
  });

  it('includes all auth group fields', () => {
    expect(requiredGroup!.group.fieldRefs).toContain('jsonData.authenticationType');
    expect(requiredGroup!.group.fieldRefs).toContain('virtual.jwtUpload');
    expect(requiredGroup!.group.fieldRefs).toContain('jsonData.defaultProject');
    expect(requiredGroup!.group.fieldRefs).toContain('secureJsonData.privateKey');
  });

  it('does not include optional impersonation fields', () => {
    // impersonation group is optional, so not merged into _required
    expect(requiredGroup!.group.fieldRefs).not.toContain('jsonData.usingImpersonation');
    expect(requiredGroup!.group.fieldRefs).not.toContain('jsonData.serviceAccountToImpersonate');
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

  it('depends on jwt auth + jwtUpload == manual', () => {
    expect(pkMode.dependsOn).toBe("jsonData.authenticationType == 'jwt' && virtual.jwtUpload == 'manual'");
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

  it('has a placeholder with example path', () => {
    expect(pkPath.ui?.placeholder).toContain('/etc/secrets/');
  });
});

// ============================================================
// Computed virtual field values
// ============================================================

describe('computeVirtualFieldValues', () => {
  it('resolves jwtUpload to "manual" when clientEmail is set', () => {
    const computed = computeVirtualFieldValues(schema, {
      authenticationType: 'jwt',
      clientEmail: 'test@project.iam.gserviceaccount.com',
    });
    expect(computed['jwtUpload']).toBe('manual');
  });

  it('resolves jwtUpload to "upload" when clientEmail is empty', () => {
    const computed = computeVirtualFieldValues(schema, {
      authenticationType: 'jwt',
    });
    expect(computed['jwtUpload']).toBe('upload');
  });

  it('resolves privateKeyMode to "path" when privateKeyPath is set', () => {
    const computed = computeVirtualFieldValues(schema, {
      authenticationType: 'jwt',
      clientEmail: 'test@project.iam.gserviceaccount.com',
      privateKeyPath: '/etc/secrets/gce.pem',
    });
    expect(computed['privateKeyMode']).toBe('path');
  });

  it('resolves privateKeyMode to "paste" when privateKeyPath is empty', () => {
    const computed = computeVirtualFieldValues(schema, {
      authenticationType: 'jwt',
      clientEmail: 'test@project.iam.gserviceaccount.com',
    });
    expect(computed['privateKeyMode']).toBe('paste');
  });
});

import type { ConfigField } from '../../../../schema/schema';
import type { FormFieldRef } from './SecureFieldInput';

export type { FormFieldRef };

/**
 * Normalized props passed to every field input component.
 *
 * The registry in `FieldInput.tsx` resolves a schema field to one of these
 * components and renders it with this single shape, so each input can be
 * developed and tested in isolation.
 */
export type FieldInputProps = {
  field: ConfigField;
  formField: FormFieldRef;
  disabled?: boolean;
  errorMessage?: string;
  setValue?: (name: string, value: unknown) => void;
};

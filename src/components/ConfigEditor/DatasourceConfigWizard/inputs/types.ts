import type { ConfigField } from '../../../../schema/schema';

/**
 * Reference to a single form field's value and change handlers.
 *
 * This mirrors the object react-hook-form's `<Controller>` passes to its
 * `render` prop (minus `ref`). It lives here — rather than inside a specific
 * input component — because it's the shared contract across all inputs.
 */
export type FormFieldRef = {
  onChange: (v: unknown) => void;
  onBlur: () => void;
  value: unknown;
  name: string;
};

/**
 * Input prop conventions
 * ----------------------
 * Input components in this folder deliberately use one of two shapes:
 *
 * 1. `FieldInputProps` (below) — for RHF-connected inputs dispatched by the
 *    `FieldInput` registry. They receive a `formField` ref (value + onChange +
 *    onBlur + name) plus schema context.
 *
 * 2. Plain `value` + `onChange` — for pure leaf editors (`StringArrayInput`,
 *    `IndexedPairEditor`, `ObjectArrayEditor`). Decoupled from RHF so they are
 *    trivially unit-testable; the parent wires them to a `<Controller>`.
 */
export type FieldInputProps = {
  field: ConfigField;
  formField: FormFieldRef;
  disabled?: boolean;
  errorMessage?: string;
  setValue?: (name: string, value: unknown) => void;
};

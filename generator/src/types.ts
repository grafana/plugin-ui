export const stringType = {
  key: 'string',
  name: 'string',
  props: [
    'key',
    'label',
    'placeholder',
    'secure'
  ]
}

export const boolType = {
  key: 'bool',
  name: 'boolean',
  props: [
    'key',
    'label',
  ]
}

export const selectType = {
  key: 'select',
  name: 'select',
  props: [
    'key',
    'label',
    'placeholder',
    'options'
  ]
}

export const types = [
  stringType,
  boolType,
  selectType
]

export interface NameValue {
  name: string;
  value: string;
}

export interface KeyValue {
  key: string;
  value: string;
}

export interface ValueLabel {
  value: string;
  label: string;
}

export interface KeyValues {
  [key: string]: any;
}

export interface Type {
  key?: string;
  name: string;
  props: string[];
  values?: KeyValues
  options?: ValueLabel[]
}
export const stringType = {
  key: 'string',
  name: 'string',
  props: [
    'key',
    'label',
    'placeholder'
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

export const types = [
  stringType,
  boolType
]

export interface NameValue {
  name: string;
  value: string;
}

export interface KeyValues {
  [key: string]: string;
}

export interface Type {
  key?: string;
  name: string;
  props: string[];
  values?: KeyValues
}
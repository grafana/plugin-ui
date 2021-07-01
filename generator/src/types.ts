export const stringType = {
  key: 'string',
  name: 'string',
  props: [
    'key',
    'label',
    'placeholder',
    'tooltip',
    'secure',
    'showIf'
  ]
}

export const numberType = {
  key: 'number',
  name: 'number',
  props: [
    'key',
    'label',
    'placeholder',
    'tooltip'
  ]
}

export const boolType = {
  key: 'bool',
  name: 'boolean',
  props: [
    'key',
    'label',
    'tooltip'
  ]
}

export const selectType = {
  key: 'select',
  name: 'select',
  props: [
    'key',
    'label',
    'placeholder',
    'tooltip',
    'options'
  ]
}

export const types = [
  stringType,
  boolType,
  numberType,
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

export interface ShowIf {
  key: string
  oper: string
  value: string
}

export interface Type {
  key?: string;
  name: string;
  props: string[];
  values?: KeyValues
  options?: ValueLabel[]
  showIf?: ShowIf[]
}
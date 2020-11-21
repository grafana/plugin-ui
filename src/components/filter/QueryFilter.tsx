import React, { PureComponent } from 'react';
import { KeyValue, SelectableValue } from '@grafana/data';
import { QueryFilterGroup } from './QueryFilterGroup';

export enum FilterConjunction {
  AND = 'AND',
  OR = 'OR',
  NONE = 'NONE',
}

export interface FilterHeader {
  conjunction: FilterConjunction;
}


export interface FilterGroup<T> extends FilterHeader {
  filters: Filter<T>[];
}

export type Filter<T> = FilterGroup<T> | FilterEntry<T>;

export interface FilterEntry<T> extends FilterHeader {
  key: SelectableValue<T>;
  op: string;
  value: SelectableValue<T>;
  matches?: T;
}


interface Props<T> {
  getOptions: () => Promise<Filter<T>[]>;
  filter: FilterGroup<T>;
  onChange: (group: FilterGroup<T>) => void;
}

interface State<T> extends FilterGroup<T> {}

export function getConjunctions(): Array<SelectableValue<FilterConjunction>> {
  return Object.keys(FilterConjunction)
    .filter(conjunction => conjunction !== 'NONE')
    .map((conjunction: string) => {
      return {
        label: conjunction,
        value: FilterConjunction[conjunction],
      };
    });
}

export class QueryFilter<T> extends PureComponent<Props<T>, State<T>> {
  constructor(props: Props<T>) {
    super(props);
    this.state = {
      ...this.props.filter,
      conjunction: FilterConjunction.NONE,
    };
  }

  onChange = (group: FilterGroup<T>) => {
    this.props.onChange(group);
  };

  render() {
    return <QueryFilterGroup id={-1} getOptions={this.props.getOptions} group={this.state} onChange={this.onChange} />;
  }
}

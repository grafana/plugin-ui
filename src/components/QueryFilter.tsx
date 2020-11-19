import React, { PureComponent } from 'react';
import { DynatraceFilterConjunction, DynatraceQueryFilterGroup, DimensionDef } from '../types';
import { KeyValue, SelectableValue } from '@grafana/data';
import { QueryFilterGroup } from './QueryFilterGroup';

interface Props {
  getOptions: () => Promise<KeyValue<DimensionDef>>;
  value: DynatraceQueryFilterGroup;
  onChange: (group: DynatraceQueryFilterGroup) => void;
}

interface State extends DynatraceQueryFilterGroup {}

export function getConjunctions(): Array<SelectableValue<DynatraceFilterConjunction>> {
  return Object.keys(DynatraceFilterConjunction)
    .filter(conjunction => conjunction !== 'NONE')
    .map((conjunction: string) => {
      return {
        label: conjunction,
        value: DynatraceFilterConjunction[conjunction],
      };
    });
}

export class QueryFilter extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      ...this.props.value,
      conjunction: DynatraceFilterConjunction.NONE,
    };
  }

  onChange = (group: DynatraceQueryFilterGroup) => {
    this.props.onChange(group);
  };

  render() {
    return <QueryFilterGroup id={-1} getOptions={this.props.getOptions} value={this.state} onChange={this.onChange} />;
  }
}

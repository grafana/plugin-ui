import { concat } from 'lodash';
import React, { PureComponent } from 'react';
import {
  DynatraceQueryFilter,
  DynatraceFilterConjunction,
  DynatraceQueryFilterGroup,
  DynatraceQueryFilterEntry,
  DimensionDef,
} from '../types';
import { getConjunctions } from './QueryFilter';
import { QueryFilterEntry } from './QueryFilterEntry';
import { SelectableValue, KeyValue } from '@grafana/data';
import { Segment, SegmentAsync } from '@grafana/ui';

const removeGroup = '--- Remove Group ---';
const removeOption: Array<SelectableValue<string[]>> = [{ label: removeGroup, value: [] }];
const filterGroup = '( Filter Group )';

interface Props {
  id: number;
  getOptions: () => Promise<KeyValue<DimensionDef>>;
  value: DynatraceQueryFilterGroup;
  onChange: (entry: DynatraceQueryFilterGroup) => void;
}

interface State extends DynatraceQueryFilterGroup {}

export class QueryFilterGroup extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = this.props.value;
  }

  static New(filters?: DynatraceQueryFilter[]): DynatraceQueryFilterGroup {
    return {
      conjunction: DynatraceFilterConjunction.AND,
      filters: filters ?? [],
    };
  }

  onChange = (state: State) => {
    this.setState(state);
    this.props.onChange(state);
  };

  onChangeFilter = (filter: DynatraceQueryFilter, index: number) => {
    this.onChange({
      ...this.state,
      filters: this.state.filters.map((value, i) => (i === index ? filter : value)),
    });
  };

  onRemove = (index: number) => {
    this.onChange({
      ...this.state,
      filters: this.state.filters.filter((f, i) => i !== index),
    });
  };

  onAdd = (entry: DynatraceQueryFilter) => {
    // On initial add, we don't have a valid filter value, so don't notify anyone
    // quite yet, until we've selected a reasonable value to filter on.
    this.setState({ filters: [...this.state.filters, entry] });
  };

  onChangeFilterConjunction = (conjunction: DynatraceFilterConjunction, index: number) => {
    this.onChange({
      ...this.state,
      filters: this.state.filters.map((f, i) => (i === index ? { ...f, conjunction } : f)),
    });
  };

  getOptions(options: KeyValue<DimensionDef>): Array<SelectableValue<DynatraceQueryFilter>> {
    const groupEntry: SelectableValue<DynatraceQueryFilterGroup> = {
      label: filterGroup,
      value: QueryFilterGroup.New(),
    };
    return concat(
      [groupEntry],
      Object.values(options).map((d: DimensionDef) => {
        return { label: d.name, value: QueryFilterEntry.New(d.key, d.name, options) };
      })
    );
  }

  clickableSegment(children: JSX.Element): JSX.Element {
    return <a className="gf-form-label query-part">{children}</a>;
  }

  renderEntry(filter: DynatraceQueryFilterEntry, i: number) {
    return (
      <React.Fragment key={Math.random().toString(8)}>
        <QueryFilterEntry
          key={Math.random().toString(8)}
          id={i}
          getOptions={this.props.getOptions}
          value={filter}
          onChange={e => this.onChangeFilter(e, i)}
          onRemove={() => this.onRemove(i)}
        />
      </React.Fragment>
    );
  }

  renderGroup(filter: DynatraceQueryFilterGroup, i: number) {
    let conjunction: JSX.Element = <></>;
    // The first item in a list never has a conjunction
    if (i !== 0) {
      conjunction = (
        <Segment
          key={Math.random().toString(8)}
          value={filter.conjunction}
          options={getConjunctions()}
          onChange={e => e.value && this.onChangeFilterConjunction(e.value, i)}
        />
      );
    }
    return (
      <React.Fragment key={Math.random().toString(8)}>
        {conjunction}
        <Segment
          key={Math.random().toString(8)}
          Component={this.clickableSegment(<>(</>)}
          options={removeOption}
          onChange={() => this.onRemove(i)}
        />
        <QueryFilterGroup
          key={Math.random().toString(8)}
          id={i}
          getOptions={this.props.getOptions}
          value={filter}
          onChange={e => this.onChangeFilter({ ...e, filters: e.filters }, i)}
        />
        <Segment
          key={Math.random().toString(8)}
          Component={this.clickableSegment(<>)</>)}
          options={removeOption}
          onChange={() => this.onRemove(i)}
        />
      </React.Fragment>
    );
  }

  renderState(): JSX.Element[] {
    const { filters } = this.state;
    return filters
      .filter(
        (filter: DynatraceQueryFilter) => 'value' in filter || ('filters' in filter && Array.isArray(filter['filters']))
      )
      .map((filter, i) => {
        if ('value' in filter) {
          return this.renderEntry(filter, i);
        } else {
          return this.renderGroup(filter, i);
        }
      });
  }

  render() {
    return (
      <>
        {this.renderState()}
        <SegmentAsync
          Component={this.clickableSegment(<i className="fa fa-plus" />)}
          loadOptions={async () => {
            const options = await this.props.getOptions();
            return this.getOptions(options);
          }}
          onChange={e => e.value && this.onAdd(e.value)}
        />
      </>
    );
  }
}

import { concat } from 'lodash';
import React, { PureComponent } from 'react';
import { getConjunctions, FilterGroup, FilterEntry, Filter, FilterConjunction } from './QueryFilter';
import { QueryFilterEntry } from './QueryFilterEntry';
import { SelectableValue, KeyValue } from '@grafana/data';
import { Segment, SegmentAsync } from '@grafana/ui';

const removeGroup = '--- Remove Group ---';
const removeOption: Array<SelectableValue<string[]>> = [{ label: removeGroup, value: [] }];
const filterGroup = '( Filter Group )';

interface Props<T> {
  id: number;
  getOptions: () => Promise<Filter<T>[]>;
  group: FilterGroup<T>;
  onChange: (entry: FilterGroup<T>) => void;
}

export class QueryFilterGroup<T> extends PureComponent<Props<T>> {
  constructor(props: Props<T>) {
    super(props);
  }

  static New<T>(filters?: Filter<T>[]): FilterGroup<T> {
    return {
      conjunction: FilterConjunction.AND,
      filters: filters ?? [],
    };
  }

  onChangeFilter = (filter: Filter<T>, index: number) => {
    const { onChange, group } = this.props;
    onChange({
      ...group,
      filters: group.filters.map((value, i) => (i === index ? filter : value)),
    });
  };

  onRemove = (index: number) => {
    const { onChange, group } = this.props;
    onChange({
      ...group,
      filters: group.filters.filter((_, i) => i !== index),
    });
  };

  onAdd = (filter: Filter<T>) => {
    const { onChange, group } = this.props;
    // On initial add, we don't have a valid filter value, so don't notify anyone
    // quite yet, until we've selected a reasonable value to filter on.
    onChange({ ...group,  filters: [...group.filters, filter] });
  };

  onChangeFilterConjunction = (conjunction: FilterConjunction, index: number) => {
    const { onChange, group } = this.props;
    onChange({
      ...group,
      filters: group.filters.map((f, i) => (i === index ? { ...f, conjunction } : f)),
    });
  };

  clickableSegment(children: JSX.Element): JSX.Element {
    return <a className="gf-form-label query-part">{children}</a>;
  }

  renderEntry(filter: FilterEntry<T>, i: number) {
    return (
      <React.Fragment key={Math.random().toString(8)}>
        <QueryFilterEntry
          key={Math.random().toString(8)}
          id={i}
          getOptions={this.props.getOptions}
          filter={filter}
          onChange={e => this.onChangeFilter(e, i)}
          onRemove={() => this.onRemove(i)}
        />
      </React.Fragment>
    );
  }

  renderGroup(filter: FilterGroup<T>, i: number) {
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
          group={filter}
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
    const { group } = this.props;
    return group.filters
      .filter(
        (filter: Filter<T>) => 'value' in filter || ('filters' in filter && Array.isArray(filter['filters']))
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
          loadOptions={this.props.getOptions}
          onChange={this.onAdd}
        />
      </>
    );
  }
}

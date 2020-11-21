import React, { PureComponent } from 'react';
import { SelectableValue, KeyValue, stringToJsRegex } from '@grafana/data';
import { FilterEntry, Filter, FilterConjunction } from './QueryFilter';
import { Segment, SegmentAsync } from '@grafana/ui';
import { getConjunctions } from './QueryFilter';
import _ from 'lodash';

const removeText = '--- Remove ---';

interface Props<T> {
  id: number;
  getOptions: () => Promise<Filter<T>[]>;
  entry: FilterEntry<T>;
  onChange: (event: FilterEntry<T>) => void;
  onRemove: () => void;
}

const processRegex = (regex: string, items: Array<SelectableValue<string>>): string[] => {
  const r: RegExp = stringToJsRegex(regex);
  return items.reduce((result: string[], curr: SelectableValue<string>) => {
    if (curr.value && curr.value.match(r)) {
      result.push(curr.value);
    }
    return result;
  }, []);
};

export class QueryFilterEntry<T> extends PureComponent<Props<T>> {
  ops: Array<SelectableValue<string>>;
  constructor(props: Props<T>) {
    super(props);
    this.ops = [
      { label: '=', value: '=' },
      { label: '!=', value: '!=' },
    ];

    const { entry } = this.props;
    if (entry.value.label?.match(/^\/.*\/$/)) {
      this.ops.push({ label: '=~', value: '=~' });
      this.ops.push({ label: '!~', value: '!~' });
    }
  }

  onChangeFilterKey = async (key: SelectableValue<T>) => {
    const { onChange, entry } = this.props;

    if (key.label === removeText) {
      this.props.onRemove();
    } 

    onChange({ ...entry, key });
  };

  onChangeFilterOp = (op: string) => {
    const { onChange, entry } = this.props;

    let matches: SelectableValue<T>[] = [];
    // By default, handle =~, but if it changes to either of the regex filters, handle them here.
    // if (op === '=~' || op === '!~') {
    //   matches = processRegex(filter.value.label!, this.filterValues(filter.value.options, false)).map(match => {
    //     return (
    //       options[key.displayName].values.find((n: T) => n.displayName === match) ||
    //       emptyDimensionDef.values[0]
    //     );
    //   });
    // }
    onChange({ ...entry, op, value: { ...entry.value, matches } });
  };

  onChangeFilterValue = (value: SelectableValue<T>) => {
    let { onChange, entry } = this.props;
    // const val = sv.value || '';

    // const entry: DynatraceName | undefined = options[key.displayName].values.find(
    //   (n: DynatraceName) => n.displayName === val
    // );

    // let value: any = { name: entry?.name || key.name, displayName: val, type: sv.type };
    // if (val.match(/^\/.*\/$/)) {
    //   op = '=~';
    //   // We have a regex. Go through the list of dimensions and match appropriate entries
    //   value = {
    //     name: '',
    //     displayName: val,
    //     matches: processRegex(val, this.filterValues(val, false)).map(match => {
    //       return (
    //         options[key.displayName].values.find((n: DynatraceName) => n.displayName === match) ||
    //         emptyDimensionDef.values[0]
    //       );
    //     }),
    //   };
    // }
    onChange({ ...entry, value });
  };

  onChangeFilterConjunction = (conjunction: FilterConjunction) => {
    let { onChange, entry } = this.props;
    onChange({ ...entry, conjunction });
  };

  filterKeys = async (): Promise<SelectableValue<T>[]> => {
    return;
  };

  filterValues = (key: string, includeRemove = true): Promise<SelectableValue<T>[]> => {
    return;
  };

  render() {
    const { entry } = this.props;
    let conjunction = <></>;
    // The first element in the list never has a conjunction.
    if (this.props.id !== 0) {
      conjunction = (
        <Segment
          value={entry.conjunction}
          options={getConjunctions()}
          onChange={e => e.value && this.onChangeFilterConjunction(e.value)}
        />
      );
    }
    return (
      <>
        {conjunction}
        <SegmentAsync
          value={entry.key}
          loadOptions={this.filterKeys}
          onChange={this.onChangeFilterKey}
        />
        <Segment value={entry.op} options={this.ops} onChange={e => e.value && this.onChangeFilterOp(e.value)} />
        <SegmentAsync
          value={entry.value}
          loadOptions={this.filterValues}
          allowCustomValue
          onChange={this.onChangeFilterValue}
        />
      </>
    );
  }
}

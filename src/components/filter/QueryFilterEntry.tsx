import React, { PureComponent } from 'react';
import { DynatraceQueryFilterEntry, DynatraceFilterConjunction, DimensionDef, DynatraceName } from '../types';
import { SelectableValue, KeyValue, stringToJsRegex } from '@grafana/data';
import { Segment, SegmentAsync } from '@grafana/ui';
import { getConjunctions } from './QueryFilter';
import _ from 'lodash';

const removeText = '--- Remove ---';

interface Props {
  id: number;
  getOptions: () => Promise<KeyValue<DimensionDef>>;
  value: DynatraceQueryFilterEntry;
  onChange: (event: DynatraceQueryFilterEntry) => void;
  onRemove: () => void;
}

export interface State extends DynatraceQueryFilterEntry {
  options: KeyValue<DimensionDef>;
}

const emptyDimensionDef: DimensionDef = {
  index: -1,
  name: '',
  key: '',
  type: '',
  values: [
    {
      name: '',
      displayName: '',
    },
  ],
  tags: [
    {
      name: '',
      displayName: '',
    },
  ],
  healthState: {
    name: '',
    displayName: '',
  },
  mzNames: [
    {
      name: '',
      displayName: '',
    },
  ],
};

const processRegex = (regex: string, items: Array<SelectableValue<string>>): string[] => {
  const r: RegExp = stringToJsRegex(regex);
  return items.reduce((result: string[], curr: SelectableValue<string>) => {
    if (curr.value && curr.value.match(r)) {
      result.push(curr.value);
    }
    return result;
  }, []);
};

export class QueryFilterEntry extends PureComponent<Props, State> {
  ops: Array<SelectableValue<string>>;
  constructor(props: Props) {
    super(props);
    this.state = {
      ...this.props.value,
      options: {},
    };
    this.ops = [
      { label: '=', value: '=' },
      { label: '!=', value: '!=' },
    ];

    const filter = this.props.value;
    if (typeof filter.value === 'string') {
      filter.value = { name: filter.value, displayName: filter.value };
    }
    if (filter.value.displayName.match(/^\/.*\/$/)) {
      this.ops.push({ label: '=~', value: '=~' });
      this.ops.push({ label: '!~', value: '!~' });
    }

    this.props.getOptions().then(options => {
      this.setState({
        ...this.state,
        options,
      });
    });
  }

  static New(
    name: string,
    displayName: string,
    options: KeyValue<DimensionDef>,
    conj?: DynatraceFilterConjunction
  ): DynatraceQueryFilterEntry {
    const state = {
      key: { name, displayName },
      op: '=',
      value: { name: '', displayName: `Select <${displayName}>` },
      options,
    };
    const conjunction = conj || DynatraceFilterConjunction.OR;
    return { ...state, conjunction };
  }

  static condition = (s: { key: string; op: string; value: string }): string => {
    return s.op === '=' ? `eq(${s.key},${s.value})` : `ne(${s.key},${s.value})`;
  };

  onChange = (state: State) => {
    this.setState(state);
    this.props.onChange(state);
  };

  onChangeFilterKey = (displayName: string) => {
    if (displayName === removeText) {
      this.props.onRemove();
    } else {
      this.props.getOptions().then(options => {
        const name = options[displayName];
        this.setState({
          ...this.state,
          key: { name: name.key, displayName: name.name },
          value: { name: '', displayName: `Select <${name.name}>` },
          options,
        });
      });
    }
  };

  onChangeFilterOp = (op: string) => {
    const { key, value, options } = this.state;

    let matches: DynatraceName[] = [];
    // By default, handle =~, but if it changes to either of the regex filters, handle them here.
    if (op === '=~' || op === '!~') {
      matches = processRegex(value.displayName, this.filterValues(value.displayName, false)).map(match => {
        return (
          options[key.displayName].values.find((n: DynatraceName) => n.displayName === match) ||
          emptyDimensionDef.values[0]
        );
      });
    }
    this.onChange({ ...this.state, op, value: { ...value, matches } });
  };

  onChangeFilterValue = (sv: SelectableValue<string>) => {
    let { key, op, options } = this.state;
    const val = sv.value || '';

    const entry: DynatraceName | undefined = options[key.displayName].values.find(
      (n: DynatraceName) => n.displayName === val
    );

    let value: any = { name: entry?.name || key.name, displayName: val, type: sv.type };
    if (val.match(/^\/.*\/$/)) {
      op = '=~';
      // We have a regex. Go through the list of dimensions and match appropriate entries
      value = {
        name: '',
        displayName: val,
        matches: processRegex(val, this.filterValues(val, false)).map(match => {
          return (
            options[key.displayName].values.find((n: DynatraceName) => n.displayName === match) ||
            emptyDimensionDef.values[0]
          );
        }),
      };
    }
    this.onChange({ ...this.state, op, value });
  };

  onChangeFilterConjunction = (conjunction: DynatraceFilterConjunction) => {
    this.onChange({ ...this.state, conjunction });
  };

  selectableFilterValues = (names: DynatraceName[], typeIn?: string): Array<SelectableValue<string>> => {
    if (!names) {
      return [];
    }
    return names.map((value: DynatraceName) => {
      const type = value.type || typeIn || 'Dimension';
      return { label: value.displayName, value: value.displayName, type };
    });
  };

  filterKeys = async (): Promise<Array<SelectableValue<string>>> => {
    const options = _.merge({ [removeText]: [] }, await this.props.getOptions());
    return Object.keys(options).map(label => {
      return { label, value: label };
    });
  };

  filterValues = (key: string, includeRemove = true): Array<SelectableValue<string>> => {
    const { options } = this.state;
    const o: KeyValue<DimensionDef> = includeRemove ? _.merge({ [removeText]: [] }, options) : options;
    if (!o[key]) {
      o[key] = emptyDimensionDef;
    }

    return this.selectableFilterValues(o[key].values, 'Dimension').concat([
      {
        label: 'Tags',
        value: 'Tags',
        options: this.selectableFilterValues(o[key].tags, 'tag'),
      },
      {
        label: 'Health Status',
        value: 'Health Status',
        options: [
          { label: 'HEALTHY', value: 'HEALTHY', type: 'healthState' },
          { label: 'UNHEALTHY', value: 'UNHEALTHY', type: 'healthState' },
        ],
      },
      {
        label: 'Management Zone',
        value: 'Management Zone',
        options: this.selectableFilterValues(o[key].mzNames, 'mzName'),
      },
    ]);
  };

  render() {
    let conjunction = <></>;
    // The first element in the list never has a conjunction.
    if (this.props.id !== 0) {
      conjunction = (
        <Segment
          value={this.state.conjunction}
          options={getConjunctions()}
          onChange={e => e.value && this.onChangeFilterConjunction(e.value)}
        />
      );
    }
    return (
      <>
        {conjunction}
        <SegmentAsync
          value={this.state.key.displayName}
          loadOptions={() => this.filterKeys()}
          onChange={e => e.value && this.onChangeFilterKey(e.value)}
        />
        <Segment value={this.state.op} options={this.ops} onChange={e => e.value && this.onChangeFilterOp(e.value)} />
        <Segment
          value={this.state.value.displayName}
          options={this.filterValues(this.state.key.displayName)}
          allowCustomValue
          onChange={e => e && this.onChangeFilterValue(e)}
        />
      </>
    );
  }
}

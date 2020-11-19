import React, { ReactElement, PureComponent, CSSProperties } from 'react';
import { SelectableValue } from '@grafana/data';
import _ from 'lodash';

export interface ListSelectProps<T> {
  value?: SelectableValue<T>;
  options?: Promise<Array<SelectableValue<T>>> | Array<SelectableValue<T>>;
  onChange: (e: T) => void;
  style?: CSSProperties;
  component?: ReactElement;
  className?: string;
}

export abstract class ListSelect<T extends SelectableValue<T>> extends PureComponent<ListSelectProps<T>> {
  state = {
    options: [],
    value: this.props.value ? this.props.value.label : undefined,
  };

  onClickListItem = (item: SelectableValue<T>) => {
    if (item.value) {
      this.setState({ ...this.state, value: item.label });
      this.props.onChange(item.value);
    }
  };

  generateItem = (item: SelectableValue<T>): ReactElement => {
    const description = item.description ? (
      <div className="gf-form-select-box__desc-option__desc">{item.description}</div>
    ) : (
      <></>
    );
    return (
      <li key={item.label} className="gf-form-select-box__option" role={'menuitem'}>
        <a onClick={e => this.onClickListItem(item)}>
          <div className="gf-form-select-box__desc-option__body">
            {item.label}
            {description}
          </div>
        </a>
      </li>
    );
  };

  componentWillMount() {
    const opts = Promise.resolve(this.props.options);

    opts.then(items => {
      this.setState({ ...this.state, options: items && items.map(item => this.generateItem(item)) });
    });
  }

  abstract render();
}

export class FunctionEditor<T> extends ListSelect<T> {
  render() {
    return (
      <span className={`gf-form dropdown ${this.props.className || ''}`} style={this.props.style || {}}>
        <a className={`gf-form-label query-part pointer dropdown-toggle`} data-toggle="dropdown">
          {this.props.component || this.state.value}
        </a>
        {this.props.children && this.props.children.toString ? this.props.children : <></>}
        <ul className="dropdown-menu" role="menu">
          {this.state.options}
        </ul>
      </span>
    );
  }
}

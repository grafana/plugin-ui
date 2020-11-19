import React, { MouseEvent, KeyboardEvent } from 'react';
import { SelectableValue } from '@grafana/data';
import { ListSelect } from './FunctionEditor';
import { Input } from '@grafana/ui';
// See: https://github.com/grafana/grafana/issues/26512
import {} from '@emotion/core';

export class FunctionParameter<T> extends ListSelect<T> {
  state = {
    ...this.state,
    editable: false,
  };

  onClick = (ev: MouseEvent<HTMLAnchorElement>) => {
    this.setState({
      editable: true,
    });
  };

  onChange = (value: string) => {
    this.setState({
      value,
    });
  };

  onBlur = () => {
    this.setState({
      editable: false,
    });

    this.props.onChange(this.state.value);
  };

  onKeyUp = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.keyCode === 13 || ev.keyCode === 27) {
      this.onBlur();
    }
  };

  onClickListItem = (item: SelectableValue<T>) => {
    if (item.value) {
      this.setState({ ...this.state, value: item.label });
      this.props.onChange(item.value);
    }

    this.setState({
      editable: false,
    });
  };

  /**
   * Currently unused. But useful for inline editing. To use just replace the input
   * with {this.control}. Changed due to feedback from the UX team, but useful to keep
   * for future reference.
   */
  get control() {
    if (this.state.editable) {
      return (
        <>
          <a key={`a-->${this.state.editable}`} onBlur={this.onBlur}>
            <input
              key={`input-->${this.state.editable}`}
              type="text"
              style={{ marginTop: '-3px', fontSize: 'inherit' }}
              ref={input => input && input.focus()}
              value={this.state.value}
              size={5}
              onKeyUp={this.onKeyUp}
              onChange={e => this.onChange(e.target.value)}
            />
            <span hidden>{this.state.value}</span>
          </a>
        </>
      );
    } else {
      return (
        <>
          <a key={`a-->${this.state.editable}`} onClick={this.onClick} onBlur={this.onBlur}>
            <span>{this.state.value}</span>
          </a>
        </>
      );
    }
  }

  render() {
    return (
      <Input
        css=""
        key={`input-->${this.state.editable}`}
        type="text"
        value={this.state.value}
        onKeyUp={this.onKeyUp}
        onBlur={this.onBlur}
        onChange={(e: React.FormEvent<HTMLInputElement>) => this.onChange(e.target['value'])}
      />
    );
  }
}

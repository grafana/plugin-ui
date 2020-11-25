import React, { PureComponent } from 'react';

type Props = {
  label?: string;
  className?: string;
};

export class QueryEditorRow extends PureComponent<Props> {
  className: string;
  constructor(props: Props) {
    super(props);
    this.className = this.props.className || 'width-8';
  }

  render() {
    const label = this.props.label ? (
      <label className={`gf-form-label query-keyword ${this.props.className}`}>{this.props.label}</label>
    ) : (
      <div></div>
    );
    return (
      <div style={{ display: 'flex' }}>
        <div className={'gf-form-inline'}>
          {label}
          {this.props.children}
        </div>
        <div className={'gf-form gf-form--grow'}>
          <div className={'gf-form-label gf-form-label--grow'}></div>
        </div>
      </div>
    );
  }
}

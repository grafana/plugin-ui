import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { Alert } from '@grafana/ui';

/** Lightweight error boundary scoped to datasource config widgets — won't crash the host UI. */
export class DatasourceErrorBoundary extends Component<
  { children: ReactNode; dsName?: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DatasourceConfigWizard] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Alert severity="warning" title="Configuration wizard unavailable">
          Could not load the configuration wizard
          {this.props.dsName ? ` for ${this.props.dsName}` : ''}. Use the Settings link to configure this datasource
          manually.
        </Alert>
      );
    }
    return this.props.children;
  }
}

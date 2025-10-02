import { type PropsWithChildren, type ReactNode, Component } from 'react';

type Props = PropsWithChildren<{
  fallBackComponent?: ReactNode;
}>;

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const FallBack = this.props.fallBackComponent || <div>Error</div>;
      return FallBack;
    }

    return this.props.children;
  }
}

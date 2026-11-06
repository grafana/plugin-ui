import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface GalleryItemProps {
  id: string;
  children: ReactNode;
}

interface GalleryItemState {
  message: string | null;
}

/**
 * Error boundary that wraps a single `@grafana/plugin-ui` export so the e2e
 * suite can probe every component in isolation.
 *
 * - Always renders `<div data-testid={id}>` so a test can assert the cell mounted.
 * - If the wrapped component throws while rendering, an inner
 *   `<div data-testid={`${id}-error`}>` is rendered with the error message
 *   instead of the children, so a single broken component does not cascade and
 *   take down the rest of the gallery.
 *
 * The wrapper is given a tiny min size so an empty/`null`-rendering child (e.g.
 * `SecureSocksProxyToggle` when the feature flag is off) still has a non-empty
 * bounding box for Playwright's visibility assertions.
 */
export class GalleryItem extends Component<GalleryItemProps, GalleryItemState> {
  state: GalleryItemState = { message: null };

  static getDerivedStateFromError(error: unknown): GalleryItemState {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the failure in the browser console for easier debugging of a
    // failing e2e probe without breaking the rest of the page.
    console.error(`GalleryItem "${this.props.id}" threw during render:`, error, info.componentStack);
  }

  render(): ReactNode {
    const { id, children } = this.props;
    const { message } = this.state;

    return (
      <div data-testid={id} style={{ minHeight: '2px', minWidth: '2px' }}>
        {message !== null ? <div data-testid={`${id}-error`}>{message}</div> : children}
      </div>
    );
  }
}

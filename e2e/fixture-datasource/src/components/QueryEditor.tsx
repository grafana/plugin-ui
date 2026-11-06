import React from 'react';
import { type QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { type FixtureDataSourceOptions, type FixtureQuery } from '../types';
import { QueryGallery } from './gallery/QueryGallery';

type Props = QueryEditorProps<DataSource, FixtureQuery, FixtureDataSourceOptions>;

/**
 * Query editor for the fixture data source. It renders the full gallery of
 * `@grafana/plugin-ui` QueryEditor-family components so the e2e suite can assert
 * each one mounts (and does not hit its error boundary) inside real Grafana.
 */
export function QueryEditor(_props: Props) {
  return (
    <div data-testid="query-editor">
      <QueryGallery />
    </div>
  );
}

import React from 'react';
import { DataSourcePicker, SQLEditor, SqlQueryEditor } from '@grafana/plugin-ui';
import { GalleryItem } from '../GalleryItem';
import { fakeQuery, fakeSqlDatasource, noop } from '../mocks';

/**
 * The "heavy" components that expect real Grafana runtime context
 * (datasource service, Monaco, a SQL datasource). They mount best-effort here;
 * in a real Grafana instance most render fully, and any runtime failure is
 * isolated by the surrounding `<GalleryItem>` error boundary.
 */
export function HeavyGallery() {
  return (
    <div data-testid="heavy-gallery">
      <GalleryItem id="SqlQueryEditor">
        <SqlQueryEditor datasource={fakeSqlDatasource} query={fakeQuery} onChange={noop} onRunQuery={noop} />
      </GalleryItem>

      <GalleryItem id="SQLEditor">
        <SQLEditor query="SELECT 1" onChange={noop} />
      </GalleryItem>

      <GalleryItem id="DataSourcePicker">
        <DataSourcePicker current={null} onChange={noop} />
      </GalleryItem>
    </div>
  );
}

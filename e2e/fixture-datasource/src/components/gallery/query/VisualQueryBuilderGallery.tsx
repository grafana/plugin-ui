import React from 'react';
import {
  GroupByRow,
  LabelFilters,
  OperationExplainedBox,
  OperationList,
  OperationListExplained,
  OperationsEditorRow,
  QueryBuilderHints,
  QueryEditorMode,
  QueryEditorModeToggle,
  QueryHeaderSwitch,
  QueryOptionGroup,
  RawQuery,
} from '@grafana/plugin-ui';
import { GalleryItem } from '../GalleryItem';
import { fakeDataSource, fakeLanguage, fakeQueryModeller, fakeSqlExpression, fakeVisualQuery, noop } from '../mocks';

/**
 * Visual-query-builder family. Several of these need a query modeller / query /
 * datasource; we provide minimal best-effort stubs. Where a component genuinely
 * needs richer runtime context it is isolated by its `<GalleryItem>` boundary.
 */
export function VisualQueryBuilderGallery() {
  return (
    <div data-testid="visual-query-builder-gallery">
      <GalleryItem id="LabelFilters">
        <LabelFilters
          labelsFilters={[]}
          onChange={noop}
          onGetLabelNames={async () => []}
          onGetLabelValues={async () => []}
        />
      </GalleryItem>

      <GalleryItem id="OperationExplainedBox">
        <OperationExplainedBox title="Explain" stepNumber={1}>
          <span>explanation body</span>
        </OperationExplainedBox>
      </GalleryItem>

      <GalleryItem id="OperationList">
        <OperationList
          query={fakeVisualQuery}
          datasource={fakeDataSource}
          queryModeller={fakeQueryModeller}
          onChange={noop}
          onRunQuery={noop}
        />
      </GalleryItem>

      <GalleryItem id="OperationListExplained">
        <OperationListExplained
          query={fakeVisualQuery}
          queryModeller={fakeQueryModeller}
          stepNumber={1}
          language={fakeLanguage}
        />
      </GalleryItem>

      <GalleryItem id="OperationsEditorRow">
        <OperationsEditorRow>
          <span>operations editor row</span>
        </OperationsEditorRow>
      </GalleryItem>

      <GalleryItem id="QueryBuilderHints">
        <QueryBuilderHints
          query={fakeVisualQuery}
          datasource={fakeDataSource}
          queryModeller={fakeQueryModeller}
          buildVisualQueryFromString={() => ({ query: fakeVisualQuery })}
          buildDataQueryFromQueryString={() => ({ refId: 'A' })}
          buildQueryStringFromDataQuery={() => ''}
          onChange={noop}
        />
      </GalleryItem>

      <GalleryItem id="QueryEditorModeToggle">
        <QueryEditorModeToggle mode={QueryEditorMode.Builder} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="QueryHeaderSwitch">
        <QueryHeaderSwitch label="Header switch" value={false} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="QueryOptionGroup">
        <QueryOptionGroup title="Options" collapsedInfo={['info']}>
          <span>option group body</span>
        </QueryOptionGroup>
      </GalleryItem>

      <GalleryItem id="RawQuery">
        <RawQuery query="SELECT 1" language={fakeLanguage} />
      </GalleryItem>

      <GalleryItem id="GroupByRow">
        <GroupByRow sql={fakeSqlExpression} onSqlChange={noop} columns={[]} />
      </GalleryItem>
    </div>
  );
}

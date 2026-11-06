import React from 'react';
import { CatalogSelector, DatasetSelector, TableSelector } from '@grafana/plugin-ui';
import { GalleryItem } from '../GalleryItem';
import { fakeDb, fakeQuery, noop } from '../mocks';

/** Resource selectors that fetch datasets/catalogs/tables through a `DB`. */
export function SelectorsGallery() {
  return (
    <div data-testid="selectors-gallery">
      <GalleryItem id="DatasetSelector">
        <DatasetSelector db={fakeDb} value={null} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="CatalogSelector">
        <CatalogSelector db={fakeDb} value={null} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="TableSelector">
        <TableSelector db={fakeDb} value={null} query={fakeQuery} onChange={noop} />
      </GalleryItem>
    </div>
  );
}

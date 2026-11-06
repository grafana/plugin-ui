import React from 'react';
import { HeavyGallery } from './query/HeavyGallery';
import { MiscGallery } from './query/MiscGallery';
import { PrimitivesGallery } from './query/PrimitivesGallery';
import { SelectorsGallery } from './query/SelectorsGallery';
import { VisualQueryBuilderGallery } from './query/VisualQueryBuilderGallery';

/**
 * Renders every `@grafana/plugin-ui` QueryEditor-family export, grouped into
 * small sub-galleries. Each leaf component is wrapped in a `<GalleryItem>` keyed
 * by its exact export name.
 */
export function QueryGallery() {
  return (
    <div data-testid="query-gallery">
      <PrimitivesGallery />
      <SelectorsGallery />
      <VisualQueryBuilderGallery />
      <MiscGallery />
      <HeavyGallery />
    </div>
  );
}

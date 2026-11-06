import React from 'react';
import { type VariableSuggestion } from '@grafana/data';
import {
  type DataLinkConfig,
  DataLink,
  DataLinks,
  DatePicker,
  DatePickerWithInput,
  DebounceInput,
  QueryEditorRow,
  Segment,
} from '@grafana/plugin-ui';
import { GalleryItem } from '../GalleryItem';
import { noop } from '../mocks';

const dataLinkValue: DataLinkConfig = { field: 'trace', label: 'Trace', matcherRegex: '', url: '' };
const suggestions: VariableSuggestion[] = [];

/** Miscellaneous top-level components exported directly from the library root. */
export function MiscGallery() {
  return (
    <div data-testid="misc-gallery">
      <GalleryItem id="QueryEditorRow">
        <QueryEditorRow label="Row">
          <span>query editor row body</span>
        </QueryEditorRow>
      </GalleryItem>

      <GalleryItem id="Segment">
        <Segment<string>
          value="a"
          options={[
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
          ]}
          onDebounce={noop}
        />
      </GalleryItem>

      <GalleryItem id="DebounceInput">
        <DebounceInput value="" onDebounce={noop} placeholder="debounced" />
      </GalleryItem>

      <GalleryItem id="DatePicker">
        <DatePicker isOpen value={new Date()} onChange={noop} onClose={noop} />
      </GalleryItem>

      <GalleryItem id="DatePickerWithInput">
        <DatePickerWithInput value={new Date()} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="DataLinks">
        <DataLinks value={[dataLinkValue]} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="DataLink">
        <DataLink value={dataLinkValue} onChange={noop} onDelete={noop} suggestions={suggestions} />
      </GalleryItem>
    </div>
  );
}

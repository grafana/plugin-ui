import React from 'react';
import { Input } from '@grafana/ui';
import {
  AccessoryButton,
  EditorField,
  EditorFieldGroup,
  EditorHeader,
  EditorList,
  EditorRow,
  EditorRows,
  EditorStack,
  EditorSwitch,
  FlexItem,
  InlineSelect,
  InputGroup,
  RunQueryButton,
  RunQueryButtons,
  Space,
} from '@grafana/plugin-ui';
import { GalleryItem } from '../GalleryItem';
import { emptyOptions, fakeQuery, noop } from '../mocks';

/** Layout / building-block primitives from `@grafana/plugin-ui`'s QueryEditor. */
export function PrimitivesGallery() {
  return (
    <div data-testid="primitives-gallery">
      <GalleryItem id="EditorRows">
        <EditorRows>
          <GalleryItem id="EditorHeader">
            <EditorHeader>
              <span>header</span>
            </EditorHeader>
          </GalleryItem>

          <GalleryItem id="EditorRow">
            <EditorRow>
              <GalleryItem id="EditorFieldGroup">
                <EditorFieldGroup>
                  <GalleryItem id="EditorField">
                    <EditorField label="Field" width={30}>
                      <Input id="primitives-editor-field" placeholder="value" />
                    </EditorField>
                  </GalleryItem>
                </EditorFieldGroup>
              </GalleryItem>
            </EditorRow>
          </GalleryItem>
        </EditorRows>
      </GalleryItem>

      <GalleryItem id="EditorStack">
        <EditorStack gap={1}>
          <GalleryItem id="AccessoryButton">
            <AccessoryButton aria-label="accessory" icon="plus" variant="secondary" onClick={noop} />
          </GalleryItem>

          <GalleryItem id="FlexItem">
            <FlexItem grow={1} />
          </GalleryItem>
        </EditorStack>
      </GalleryItem>

      <GalleryItem id="EditorSwitch">
        <EditorSwitch value={false} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="InlineSelect">
        <InlineSelect label="Inline" value={null} options={emptyOptions} onChange={noop} />
      </GalleryItem>

      <GalleryItem id="InputGroup">
        <InputGroup>
          <Input id="input-group-a" placeholder="a" />
          <Input id="input-group-b" placeholder="b" />
        </InputGroup>
      </GalleryItem>

      <GalleryItem id="EditorList">
        <EditorList items={[]} onChange={noop} renderItem={() => <Input id="editor-list-item" placeholder="item" />} />
      </GalleryItem>

      <GalleryItem id="Space">
        <Space v={1} h={1} />
      </GalleryItem>

      <GalleryItem id="RunQueryButton">
        <RunQueryButton onClick={noop} dataTestId="primitives-run-query" />
      </GalleryItem>

      <GalleryItem id="RunQueryButtons">
        <RunQueryButtons enableRun onRunQuery={noop} onCancelQuery={noop} query={fakeQuery} />
      </GalleryItem>
    </div>
  );
}

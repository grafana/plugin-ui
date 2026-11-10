import React from 'react';
import { ClipboardButton, Input, Modal, Stack, Text } from '@grafana/ui';

import type { SecretReference } from '../react/index';

interface SecretReferenceModalProps {
  reference: SecretReference | null;
  onDismiss: () => void;
  snippet?: string;
  title?: string;
  description?: NonNullable<React.ReactNode>;
}

const DEFAULT_TITLE = 'Reference your secret';

/**
 * Shown after a secret is created for a finding that couldn't be rewritten in
 * place. Purely presentational — render it off `scanner.reference.pending`.
 */
export function SecretReferenceModal({
  reference,
  onDismiss,
  snippet,
  title = DEFAULT_TITLE,
  description,
}: SecretReferenceModalProps) {
  if (reference === null) {
    return null;
  }

  const text = snippet ?? reference.reference;
  const defaultDescription = (
    <Text variant="body">
      The secret <code>{reference.secretName}</code> was created, but this value could not be replaced automatically.
      Copy the reference below and use it in place of the hardcoded value.
    </Text>
  );

  return (
    <Modal title={title} isOpen onDismiss={onDismiss}>
      <Stack direction="column" gap={2}>
        {description ?? defaultDescription}

        <Input readOnly value={text} />
      </Stack>

      <Modal.ButtonRow>
        <ClipboardButton icon="copy" variant="primary" getText={() => text}>
          Copy reference
        </ClipboardButton>
      </Modal.ButtonRow>
    </Modal>
  );
}

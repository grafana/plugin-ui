import React, { useState } from 'react';
import { Button } from '@grafana/ui';

import { k6SecretRewriter, scanText } from '../core/index';
import type { SecretReference } from '../react/index';
import { SecretReferenceModal } from './SecretReferenceModal';

export default {
  title: 'Secret scanner/SecretReferenceModal',
  component: SecretReferenceModal,
};

const SECRET_NAME = 'aws-key-secret';

const [finding] = scanText('Log in with API key AKIAIOSFODNN7EXAMPLE then open the dashboard');

const reference: SecretReference = {
  finding: finding!,
  secretName: SECRET_NAME,
  reference: k6SecretRewriter.reference(SECRET_NAME),
};

export const Open = () => <SecretReferenceModal reference={reference} onDismiss={() => {}} />;

export const CustomSnippet = () => (
  <SecretReferenceModal reference={reference} onDismiss={() => {}} snippet={`env.get("${SECRET_NAME}")`} />
);

export const Dismissible = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show reference</Button>
      <SecretReferenceModal reference={open ? reference : null} onDismiss={() => setOpen(false)} />
    </>
  );
};

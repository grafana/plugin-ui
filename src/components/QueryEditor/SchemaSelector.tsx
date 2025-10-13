import { useState, useEffect } from 'react';
import { Select } from '@grafana/ui';
import { type SelectableValue } from '@grafana/data';
import { type DB } from './types';

export interface SchemaSelectorProps {
  db: DB;
  inputId?: string;
  catalog?: string;
  value: string | null;
  onChange: (schema: string | null) => void;
}

export const SchemaSelector = ({ db, inputId, catalog, value, onChange }: SchemaSelectorProps) => {
  const [schemas, setSchemas] = useState<Array<SelectableValue<string>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSchemas = async () => {
    if (!db.schemas || !catalog) {
      setSchemas([]);
      return;
    }

    setIsLoading(true);
    try {
      const schemaList = await db.schemas(catalog);
      const schemaOptions = schemaList.map((schema: string) => ({
        label: schema,
        value: schema,
      }));
      setSchemas(schemaOptions);
    } catch (error) {
      console.error('Error loading schemas:', error);
      setSchemas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchemas();
  }, [db, catalog, loadSchemas]);

  const handleChange = (selectable: SelectableValue<string>) => {
    onChange(selectable?.value || null);
  };

  const selectedValue = schemas.find((schema) => schema.value === value) || null;

  const isDisabled = isLoading || !catalog;

  return (
    <Select
      inputId={inputId}
      options={schemas}
      value={selectedValue}
      onChange={handleChange}
      isLoading={isLoading}
      placeholder="Select schema"
      isClearable
      allowCustomValue
      disabled={isDisabled}
      menuShouldPortal={true}
    />
  );
};

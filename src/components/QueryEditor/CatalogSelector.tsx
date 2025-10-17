import { useState, useEffect, useCallback } from 'react';
import { Select } from '@grafana/ui';
import { type SelectableValue } from '@grafana/data';
import { type DB } from './types';

export interface CatalogSelectorProps {
  db: DB;
  inputId?: string;
  value: string | null;
  onChange: (catalog: string | null) => void;
}

export const CatalogSelector = ({ db, inputId, value, onChange }: CatalogSelectorProps) => {
  const [catalogs, setCatalogs] = useState<Array<SelectableValue<string>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCatalogs = useCallback(async () => {
    if (!db.catalogs) {
      return;
    }

    setIsLoading(true);
    try {
      const catalogList = await db.catalogs();
      const catalogOptions = catalogList.map((catalog) => ({
        label: catalog,
        value: catalog,
      }));
      setCatalogs(catalogOptions);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      setCatalogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadCatalogs();
  }, [db, loadCatalogs]);

  const handleChange = (selectable: SelectableValue<string>) => {
    onChange(selectable?.value || null);
  };

  const selectedValue = catalogs.find((catalog) => catalog.value === value) || null;

  return (
    <Select
      inputId={inputId}
      options={catalogs}
      value={selectedValue}
      onChange={handleChange}
      isLoading={isLoading}
      placeholder="Select catalog"
      isClearable
      allowCustomValue
      menuShouldPortal={true}
    />
  );
};

import { css } from '@emotion/css';
import { Button, useTheme2 } from '@grafana/ui';
import { type GrafanaTheme2, VariableOrigin, DataLinkBuiltInVars } from '@grafana/data';
import { type DataLinkConfig } from './types';
import { DataLink } from './DataLink';

const getStyles = (theme: GrafanaTheme2) => ({
  infoText: css`
    padding-bottom: ${theme.v1.spacing.md};
    color: ${theme.v1.colors.textWeak};
  `,
  dataLink: css`
    margin-bottom: ${theme.v1.spacing.sm};
  `,
});

type Props = {
  value?: DataLinkConfig[];
  onChange: (value: DataLinkConfig[]) => void;
};
export const DataLinks = (props: Props) => {
  const { value, onChange } = props;
  const theme = useTheme2();
  const styles = getStyles(theme);

  return (
    <>
      <h3 className="page-heading">Data links</h3>

      <div className={styles.infoText}>
        Add links to existing fields. Links will be shown in log row details next to the field value.
      </div>

      <div className="gf-form-group">
        {value &&
          value.map((field, index) => {
            return (
              <DataLink
                className={styles.dataLink}
                key={index}
                value={field}
                onChange={(newField) => {
                  const newDataLinks = [...value];
                  newDataLinks.splice(index, 1, newField);
                  onChange(newDataLinks);
                }}
                onDelete={() => {
                  const newDataLinks = [...value];
                  newDataLinks.splice(index, 1);
                  onChange(newDataLinks);
                }}
                suggestions={[
                  {
                    value: DataLinkBuiltInVars.valueRaw,
                    label: 'Raw value',
                    documentation: 'Raw value of the field',
                    origin: VariableOrigin.Value,
                  },
                ]}
              />
            );
          })}
        <div>
          <Button
            variant={'secondary'}
            className={css`
              margin-right: 10px;
            `}
            icon="plus"
            onClick={(event) => {
              event.preventDefault();
              const newDataLinks = [...(value || []), { field: '', label: '', matcherRegex: '', url: '' }];
              onChange(newDataLinks);
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </>
  );
};

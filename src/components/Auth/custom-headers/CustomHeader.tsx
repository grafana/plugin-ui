import React from "react";
import { css, cx } from "@emotion/css";
import { InlineFieldRow, InlineField, Input, IconButton } from "@grafana/ui";
import { SecretInput } from "../../../unreleasedComponents/SecretInput";
import type { LocalHeader } from "../types";
import { useCommonStyles } from "../styles";

type Props = {
  header: LocalHeader;
  onChange: (header: LocalHeader) => void;
  onBlur: () => void;
  onDelete: () => void;
};

export const CustomHeader: React.FC<Props> = ({
  header,
  onChange,
  onBlur,
  onDelete,
}) => {
  const commonStyles = useCommonStyles();
  const styles = {
    container: css({
      alignItems: "center",
    }),
    input: css({
      minWidth: "100%",
    }),
    headerNameField: css({
      width: "40%",
      marginRight: 0,
      paddingRight: 8,
    }),
    headerValueField: css({
      width: "45%",
      marginRight: 0,
    }),
    removeHeaderBtn: css({
      margin: `0 0 3px 10px`,
    }),
  };

  return (
    <>
      <InlineFieldRow className={styles.container}>
        <InlineField
          label="Header"
          labelWidth={9}
          grow
          className={styles.headerNameField}
          htmlFor={`custom-header-${header.id}-name-input`}
        >
          <Input
            id={`custom-header-${header.id}-name-input`}
            placeholder="X-Custom-Header"
            value={header.name}
            width={12}
            onChange={(e) =>
              onChange({ ...header, name: e.currentTarget.value })
            }
            onBlur={onBlur}
            className={styles.input}
          />
        </InlineField>
        <InlineField
          label="Value"
          labelWidth={9}
          grow
          className={cx(
            commonStyles.inlineFieldWithSecret,
            styles.headerValueField
          )}
          htmlFor={`custom-header-${header.id}-value-input`}
        >
          <SecretInput
            id={`custom-header-${header.id}-value-input`}
            isConfigured={header.configured}
            placeholder="Header value"
            value={header.value}
            width={12}
            onChange={(e) =>
              onChange({ ...header, value: e.currentTarget.value })
            }
            onReset={() =>
              onChange({ ...header, configured: false, value: "" })
            }
            onBlur={onBlur}
            className={styles.input}
          />
        </InlineField>
        <IconButton
          name="trash-alt"
          tooltip="Remove header"
          tooltipPlacement="top"
          className={styles.removeHeaderBtn}
          onClick={onDelete}
          type="button"
        />
      </InlineFieldRow>
    </>
  );
};

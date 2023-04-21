import React, { useState } from "react";
import { css } from "@emotion/css";
import { Button, useTheme2 } from "@grafana/ui";
import { CustomHeader } from "./CustomHeader";
import { ConfigSection } from "../../ConfigEditor";
import type { Header, LocalHeader } from "../types";

export type Props = {
  headers: Header[];
  onChange: (headers: Header[]) => void;
};

export const CustomHeaders: React.FC<Props> = ({
  headers: headersFromProps,
  onChange,
}) => {
  const { typography } = useTheme2();
  const [headers, setHeaders] = useState<LocalHeader[]>(
    headersFromProps.map((header) => ({
      ...header,
      id: uniqueId(),
    }))
  );

  const onHeaderAdd = () => {
    setHeaders([
      ...headers,
      { id: uniqueId(), name: "", value: "", configured: false },
    ]);
  };

  const onHeaderChange = (id: string, header: LocalHeader) => {
    setHeaders(headers.map((h) => (h.id === id ? { ...header } : h)));
  };

  const onHeaderDelete = (id: string) => {
    const index = headers.findIndex((h) => h.id === id);
    if (index === -1) {
      return;
    }
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
    onChange(newHeaders);
  };

  const onBlur = () =>
    onChange(
      headers.map(({ name, value, configured }) => ({
        name,
        value,
        configured,
      }))
    );

  const styles = {
    container: css({
      marginTop: 24,
    }),
    collapsible: css({
      ...typography.h6,
      fontWeight: typography.fontWeightRegular,
    }),
    collapsibleContent: css({
      paddingTop: 0,
    }),
    addHeaderButton: css({
      marginTop: 12,
    }),
  };

  return (
    <div className={styles.container}>
      <ConfigSection
        title="HTTP headers"
        description="Pass along additional context and metadata about the request/response."
        isCollapsible
        isOpen={headers.length > 0}
        kind="sub-section"
      >
        <div>
          {headers.map((header) => (
            <CustomHeader
              key={header.id}
              header={header}
              onChange={(header) => onHeaderChange(header.id, header)}
              onDelete={() => onHeaderDelete(header.id)}
              onBlur={onBlur}
            />
          ))}
        </div>
        <div className={styles.addHeaderButton}>
          <Button
            icon="plus"
            variant="secondary"
            fill="outline"
            onClick={onHeaderAdd}
          >
            {headers.length === 0 ? "Add header" : "Add another header"}
          </Button>
        </div>
      </ConfigSection>
    </div>
  );
};

function uniqueId(): string {
  return Math.random().toString(16).slice(2);
}

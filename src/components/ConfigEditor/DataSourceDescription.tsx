import React from "react";
import { css } from "@emotion/css";
import { useTheme2 } from "@grafana/ui";

type Props = {
  dataSourceName: string;
  docsLink: string;
  hasRequiredFields?: boolean;
};

export const DataSourceDescription: React.FC<Props> = ({
  dataSourceName,
  docsLink,
  hasRequiredFields = true,
}) => {
  const theme = useTheme2();
  const styles = {
    text: css`
      font-size: 14px;
      a {
        color: ${theme.colors.primary.text};
        text-decoration: underline;
        :hover {
          text-decoration: none;
        }
      }
    `,
    asterisk: css`
      color: ${theme.colors.error.main};
    `,
  };

  return (
    <>
      <p className={styles.text}>
        Before you can use the {dataSourceName} data source, you must configure
        it below or in the config file.
        <br />
        For detailed instructions,{" "}
        <a href={docsLink} target="_blank" rel="noreferrer">
          view the documentation
        </a>
        .
      </p>
      {hasRequiredFields && (
        <p className={styles.text}>
          <em>
            Fields marked in <span className={styles.asterisk}>*</span> are
            required
          </em>
        </p>
      )}
    </>
  );
};
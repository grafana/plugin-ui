import React from "react";
import { cx } from "@emotion/css";
import { InlineField, Input, PopoverContent } from "@grafana/ui";
import { InlineLabel } from "../../ConfigEditor";
import { SecretInput } from "../../../unreleasedComponents/SecretInput";
import { useCommonStyles } from "../styles";

export type Props = {
  user?: string;
  passwordConfigured: boolean;
  userTooltip?: PopoverContent;
  passwordTooltip?: PopoverContent;
  onUserChange: (user: string) => void;
  onPasswordChange: (password: string) => void;
  onPasswordReset: () => void;
};

export const BasicAuth: React.FC<Props> = ({
  user,
  passwordConfigured,
  userTooltip = "The username of the data source account",
  passwordTooltip = "The password of the data source account",
  onUserChange,
  onPasswordChange,
  onPasswordReset,
}) => {
  const commonStyles = useCommonStyles();
  return (
    <>
      <InlineField
        className={commonStyles.inlineFieldNoMarginRight}
        label={
          <InlineLabel
            width={24}
            tooltip={userTooltip}
            required
            htmlFor="basic-auth-user-input"
          >
            User
          </InlineLabel>
        }
        grow
        interactive
      >
        <Input
          id="basic-auth-user-input"
          placeholder="User"
          value={user}
          onChange={(e) => onUserChange(e.currentTarget.value)}
          required
        />
      </InlineField>
      <InlineField
        className={cx(
          commonStyles.inlineFieldNoMarginRight,
          commonStyles.inlineFieldWithSecret
        )}
        label={
          <InlineLabel
            width={24}
            tooltip={passwordTooltip}
            required
            htmlFor="basic-auth-password-input"
          >
            Password
          </InlineLabel>
        }
        grow
        interactive
      >
        <SecretInput
          id="basic-auth-password-input"
          isConfigured={passwordConfigured}
          onReset={onPasswordReset}
          placeholder="Password"
          onChange={(e) => onPasswordChange(e.currentTarget.value)}
          required
        />
      </InlineField>
    </>
  );
};
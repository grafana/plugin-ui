import React from "react";
import { Select } from "@grafana/ui";
import { SelectableValue } from "@grafana/data";
import { AuthMethod, CustomMethodId } from "../types";

type Props = {
  options: SelectableValue<AuthMethod | CustomMethodId>[];
  selectedMethod: AuthMethod | CustomMethodId;
  onChange: (authMethod: AuthMethod | CustomMethodId) => void;
};

export const AuthMethodSelector: React.FC<Props> = ({
  options,
  selectedMethod,
  onChange,
}) => {
  return (
    <Select
      options={options}
      value={selectedMethod}
      onChange={(option) => onChange(option.value!)}
    />
  );
};

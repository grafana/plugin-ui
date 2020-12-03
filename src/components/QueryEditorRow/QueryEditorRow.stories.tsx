import React from "react";
import { QueryEditorRow } from "./QueryEditorRow";
import { Chance } from "chance";

export default {
  title: "Layout/QueryEditorRow",
  component: QueryEditorRow,
};

export const basic = () => <QueryEditorRow label={Chance().sentence()} />;

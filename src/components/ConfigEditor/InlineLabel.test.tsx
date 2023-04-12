import React from "react";
import { InlineLabel } from "./InlineLabel";
import { render } from "@testing-library/react";

describe("<DataSourceDescription />", () => {
  it("should not render * by default", () => {
    const { getByText } = render(<InlineLabel>Label text</InlineLabel>);

    expect(() => getByText("*", { exact: false })).toThrow();
  });

  it("should render * when `required` prop is `true`", () => {
    const { getByText } = render(
      <InlineLabel required>Label text</InlineLabel>
    );

    expect(getByText("*", { exact: false })).toBeInTheDocument();
  });
});

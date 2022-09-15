"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataLinks = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const css_1 = require("@emotion/css");
const ui_1 = require("@grafana/ui");
const data_1 = require("@grafana/data");
const DataLink_1 = require("./DataLink");
const getStyles = ((theme) => ({
    infoText: (0, css_1.css) `
    padding-bottom: ${theme.v1.spacing.md};
    color: ${theme.v1.colors.textWeak};
  `,
    dataLink: (0, css_1.css) `
    margin-bottom: ${theme.v1.spacing.sm};
  `,
}));
const DataLinks = (props) => {
    const { value, onChange } = props;
    const theme = (0, ui_1.useTheme2)();
    const styles = getStyles(theme);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("h3", { className: 'page-heading' }, "Data links"),
        react_1.default.createElement("div", { className: styles.infoText }, "Add links to existing fields. Links will be shown in log row details next to the field value."),
        react_1.default.createElement("div", { className: 'gf-form-group' },
            value &&
                value.map((field, index) => {
                    return (react_1.default.createElement(DataLink_1.DataLink, { className: styles.dataLink, key: index, value: field, onChange: (newField) => {
                            const newDataLinks = [...value];
                            newDataLinks.splice(index, 1, newField);
                            onChange(newDataLinks);
                        }, onDelete: () => {
                            const newDataLinks = [...value];
                            newDataLinks.splice(index, 1);
                            onChange(newDataLinks);
                        }, suggestions: [
                            {
                                value: data_1.DataLinkBuiltInVars.valueRaw,
                                label: 'Raw value',
                                documentation: 'Raw value of the field',
                                origin: data_1.VariableOrigin.Value,
                            },
                        ] }));
                }),
            react_1.default.createElement("div", null,
                react_1.default.createElement(ui_1.Button, { variant: 'secondary', className: (0, css_1.css) `
              margin-right: 10px;
            `, icon: 'plus', onClick: (event) => {
                        event.preventDefault();
                        const newDataLinks = [
                            ...(value || []),
                            { field: '', label: '', matcherRegex: '', url: '' },
                        ];
                        onChange(newDataLinks);
                    } }, "Add")))));
};
exports.DataLinks = DataLinks;
//# sourceMappingURL=DataLinks.js.map
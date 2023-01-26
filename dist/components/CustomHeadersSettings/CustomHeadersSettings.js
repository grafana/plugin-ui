"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomHeadersSettings = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const css_1 = require("@emotion/css");
const lodash_1 = require("lodash");
const ui_1 = require("@grafana/ui");
const getCustomHeaderRowStyles = (0, ui_1.stylesFactory)(() => {
    return {
        layout: (0, css_1.css) `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      > * {
        margin-left: 4px;
        margin-bottom: 0;
        height: 100%;
        &:first-child,
        &:last-child {
          margin-left: 0;
        }
      }
    `,
    };
});
const CustomHeaderRow = ({ header, onBlur, onChange, onRemove, onReset, }) => {
    const styles = getCustomHeaderRowStyles();
    return (react_1.default.createElement("div", { className: styles.layout },
        react_1.default.createElement(ui_1.LegacyForms.FormField, { label: "Header", name: "name", placeholder: "X-Custom-Header", labelWidth: 5, value: header.name || "", onChange: (e) => onChange(Object.assign(Object.assign({}, header), { name: e.target.value })), onBlur: onBlur }),
        react_1.default.createElement(ui_1.LegacyForms.SecretFormField, { label: "Value", "aria-label": "Value", name: "value", isConfigured: header.configured, value: header.value, labelWidth: 5, inputWidth: header.configured ? 11 : 12, placeholder: "Header Value", onReset: () => onReset(header.id), onChange: (e) => onChange(Object.assign(Object.assign({}, header), { value: e.target.value })), onBlur: onBlur }),
        react_1.default.createElement(ui_1.Button, { type: "button", "aria-label": "Remove header", variant: "secondary", size: "xs", onClick: (_e) => onRemove(header.id) },
            react_1.default.createElement(ui_1.Icon, { name: "trash-alt" }))));
};
CustomHeaderRow.displayName = "CustomHeaderRow";
class CustomHeadersSettings extends react_1.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            headers: [],
        };
        this.updateSettings = () => {
            const { headers } = this.state;
            // we remove every httpHeaderName* field
            const newJsonData = Object.fromEntries(Object.entries(this.props.dataSourceConfig.jsonData).filter(([key, val]) => !key.startsWith("httpHeaderName")));
            // we remove every httpHeaderValue* field
            const newSecureJsonData = Object.fromEntries(Object.entries(this.props.dataSourceConfig.secureJsonData || {}).filter(([key, val]) => !key.startsWith("httpHeaderValue")));
            // then we add the current httpHeader-fields
            for (const [index, header] of headers.entries()) {
                newJsonData[`httpHeaderName${index + 1}`] = header.name;
                if (!header.configured) {
                    newSecureJsonData[`httpHeaderValue${index + 1}`] = header.value;
                }
            }
            this.props.onChange(Object.assign(Object.assign({}, this.props.dataSourceConfig), { jsonData: newJsonData, secureJsonData: newSecureJsonData }));
        };
        this.onHeaderAdd = () => {
            this.setState((prevState) => {
                return {
                    headers: [
                        ...prevState.headers,
                        { id: (0, lodash_1.uniqueId)(), name: "", value: "", configured: false },
                    ],
                };
            });
        };
        this.onHeaderChange = (headerIndex, value) => {
            this.setState(({ headers }) => {
                return {
                    headers: headers.map((item, index) => {
                        if (headerIndex !== index) {
                            return item;
                        }
                        return Object.assign({}, value);
                    }),
                };
            });
        };
        this.onHeaderReset = (headerId) => {
            this.setState(({ headers }) => {
                return {
                    headers: headers.map((h, i) => {
                        if (h.id !== headerId) {
                            return h;
                        }
                        return Object.assign(Object.assign({}, h), { value: "", configured: false });
                    }),
                };
            });
        };
        this.onHeaderRemove = (headerId) => {
            this.setState(({ headers }) => ({
                headers: headers.filter((h) => h.id !== headerId),
            }), this.updateSettings);
        };
        const { jsonData, secureJsonData, secureJsonFields, } = this.props.dataSourceConfig;
        this.state = {
            headers: Object.keys(jsonData)
                .sort()
                .filter((key) => key.startsWith("httpHeaderName"))
                .map((key, index) => {
                return {
                    id: (0, lodash_1.uniqueId)(),
                    name: jsonData[key],
                    value: secureJsonData !== undefined ? secureJsonData[key] : "",
                    configured: (secureJsonFields &&
                        secureJsonFields[`httpHeaderValue${index + 1}`]) ||
                        false,
                };
            }),
        };
    }
    render() {
        const { headers } = this.state;
        return (react_1.default.createElement("div", { className: "gf-form-group" },
            react_1.default.createElement("div", { className: "gf-form" },
                react_1.default.createElement("h6", null, "Custom HTTP Headers")),
            react_1.default.createElement("div", null, headers.map((header, i) => (react_1.default.createElement(CustomHeaderRow, { key: header.id, header: header, onChange: (h) => {
                    this.onHeaderChange(i, h);
                }, onBlur: this.updateSettings, onRemove: this.onHeaderRemove, onReset: this.onHeaderReset })))),
            react_1.default.createElement("div", { className: "gf-form" },
                react_1.default.createElement(ui_1.Button, { variant: "secondary", icon: "plus", type: "button", onClick: (e) => {
                        this.onHeaderAdd();
                    } }, "Add header"))));
    }
}
exports.CustomHeadersSettings = CustomHeadersSettings;
exports.default = CustomHeadersSettings;
//# sourceMappingURL=CustomHeadersSettings.js.map
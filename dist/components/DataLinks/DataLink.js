"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataLink = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const css_1 = require("@emotion/css");
const ui_1 = require("@grafana/ui");
const { FormField, Switch } = ui_1.LegacyForms;
const react_use_1 = require("react-use");
const DataSourcePicker_1 = require("../DataSourcePicker/DataSourcePicker");
const getStyles = (0, ui_1.stylesFactory)(() => ({
    firstRow: (0, css_1.css) `
    display: flex;
  `,
    nameField: (0, css_1.css) `
    flex: 2;
  `,
    regexField: (0, css_1.css) `
    flex: 3;
  `,
    row: (0, css_1.css) `
    display: flex;
    align-items: baseline;
  `,
}));
const DataLink = (props) => {
    const { value, onChange, onDelete, suggestions, className } = props;
    const styles = getStyles();
    const [showInternalLink, setShowInternalLink] = useInternalLink(value.datasourceUid);
    const handleChange = (field) => (event) => {
        onChange(Object.assign(Object.assign({}, value), { [field]: event.currentTarget.value }));
    };
    return (react_1.default.createElement("div", { className: className },
        react_1.default.createElement("div", { className: styles.firstRow + ' gf-form' },
            react_1.default.createElement(FormField, { className: styles.nameField, labelWidth: 6, 
                // A bit of a hack to prevent using default value for the width from FormField
                inputWidth: null, label: "Field", type: "text", value: value.field, tooltip: 'Can be exact field name or a regex pattern that will match on the field name.', onChange: handleChange('field') }),
            react_1.default.createElement(ui_1.Button, { variant: 'destructive', title: "Remove field", icon: "times", onClick: event => {
                    event.preventDefault();
                    onDelete();
                } })),
        react_1.default.createElement("div", { className: "gf-form" },
            react_1.default.createElement(FormField, { className: styles.nameField, inputWidth: null, label: "Label", type: "text", value: value.label, onChange: handleChange('label'), tooltip: 'Use to provide a meaningful label to the data matched in the regex' }),
            react_1.default.createElement(FormField, { className: styles.regexField, inputWidth: null, label: "Regex", type: "text", value: value.matcherRegex, onChange: handleChange('matcherRegex'), tooltip: 'Use to parse and capture some part of the log message. You can use the captured groups in the template.' })),
        react_1.default.createElement("div", { className: "gf-form" },
            react_1.default.createElement(FormField, { label: showInternalLink ? 'Query' : 'URL', labelWidth: 6, inputEl: react_1.default.createElement(ui_1.DataLinkInput, { placeholder: showInternalLink ? '${__value.raw}' : 'http://example.com/${__value.raw}', value: value.url || '', onChange: newValue => onChange(Object.assign(Object.assign({}, value), { url: newValue })), suggestions: suggestions }), className: (0, css_1.css) `
            width: 100%;
          ` })),
        react_1.default.createElement("div", { className: styles.row },
            react_1.default.createElement(Switch, { labelClass: 'width-6', label: "Internal link", checked: showInternalLink, onChange: () => {
                    if (showInternalLink) {
                        onChange(Object.assign(Object.assign({}, value), { datasourceUid: undefined }));
                    }
                    setShowInternalLink(!showInternalLink);
                } }),
            showInternalLink && (react_1.default.createElement(DataSourcePicker_1.DataSourcePicker
            // Uid and value should be always set in the db and so in the items.
            , { 
                // Uid and value should be always set in the db and so in the items.
                onChange: ds => {
                    onChange(Object.assign(Object.assign({}, value), { datasourceUid: ds.uid }));
                }, current: value.datasourceUid })))));
};
exports.DataLink = DataLink;
function useInternalLink(datasourceUid) {
    const [showInternalLink, setShowInternalLink] = (0, react_1.useState)(!!datasourceUid);
    const previousUid = (0, react_use_1.usePrevious)(datasourceUid);
    // Force internal link visibility change if uid changed outside of this component.
    (0, react_1.useEffect)(() => {
        if (!previousUid && datasourceUid && !showInternalLink) {
            setShowInternalLink(true);
        }
        if (previousUid && !datasourceUid && showInternalLink) {
            setShowInternalLink(false);
        }
    }, [previousUid, datasourceUid, showInternalLink]);
    return [showInternalLink, setShowInternalLink];
}
//# sourceMappingURL=DataLink.js.map
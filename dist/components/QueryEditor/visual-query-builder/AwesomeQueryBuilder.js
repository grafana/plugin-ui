"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raqbConfig = exports.settings = exports.widgets = exports.emptyInitTree = exports.emptyInitValue = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const react_1 = tslib_1.__importDefault(require("react"));
const react_awesome_query_builder_1 = require("react-awesome-query-builder");
const data_1 = require("@grafana/data");
const ui_1 = require("@grafana/ui");
const buttonLabels = {
    add: 'Add',
    remove: 'Remove',
};
exports.emptyInitValue = {
    id: react_awesome_query_builder_1.Utils.uuid(),
    type: 'group',
    children1: {
        [react_awesome_query_builder_1.Utils.uuid()]: {
            type: 'rule',
            properties: {
                field: null,
                operator: null,
                value: [],
                valueSrc: [],
            },
        },
    },
};
exports.emptyInitTree = {
    id: react_awesome_query_builder_1.Utils.uuid(),
    type: 'group',
    children1: {
        [react_awesome_query_builder_1.Utils.uuid()]: {
            type: 'rule',
            properties: {
                field: null,
                operator: null,
                value: [],
                valueSrc: [],
            },
        },
    },
};
exports.widgets = Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.widgets), { text: Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.widgets.text), { factory: function TextInput(props) {
            return (react_1.default.createElement(ui_1.Input, { value: (props === null || props === void 0 ? void 0 : props.value) || '', placeholder: props === null || props === void 0 ? void 0 : props.placeholder, onChange: (e) => props === null || props === void 0 ? void 0 : props.setValue(e.currentTarget.value) }));
        } }), number: Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.widgets.number), { factory: function NumberInput(props) {
            return (react_1.default.createElement(ui_1.Input, { value: props === null || props === void 0 ? void 0 : props.value, placeholder: props === null || props === void 0 ? void 0 : props.placeholder, type: "number", onChange: (e) => props === null || props === void 0 ? void 0 : props.setValue(Number.parseInt(e.currentTarget.value, 10)) }));
        } }), datetime: Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.widgets.datetime), { factory: function DateTimeInput(props) {
            return (react_1.default.createElement(ui_1.DateTimePicker, { onChange: (e) => {
                    props === null || props === void 0 ? void 0 : props.setValue(e.format(react_awesome_query_builder_1.BasicConfig.widgets.datetime.valueFormat));
                }, date: (0, data_1.dateTime)(props === null || props === void 0 ? void 0 : props.value).utc() }));
        } }) });
exports.settings = Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.settings), { canRegroup: false, maxNesting: 1, canReorder: false, showNot: false, addRuleLabel: buttonLabels.add, deleteLabel: buttonLabels.remove, renderConjs: function Conjunctions(conjProps) {
        return (react_1.default.createElement(ui_1.Select, { id: conjProps === null || conjProps === void 0 ? void 0 : conjProps.id, "aria-label": "Conjunction", menuShouldPortal: true, options: (conjProps === null || conjProps === void 0 ? void 0 : conjProps.conjunctionOptions) ? Object.keys(conjProps === null || conjProps === void 0 ? void 0 : conjProps.conjunctionOptions).map(data_1.toOption) : undefined, value: conjProps === null || conjProps === void 0 ? void 0 : conjProps.selectedConjunction, onChange: (val) => conjProps === null || conjProps === void 0 ? void 0 : conjProps.setConjunction(val.value) }));
    }, renderField: function Field(fieldProps) {
        var _a;
        const fields = ((_a = fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.config) === null || _a === void 0 ? void 0 : _a.fields) || {};
        return (react_1.default.createElement(ui_1.Select, { id: fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.id, width: 25, "aria-label": "Field", menuShouldPortal: true, options: fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.items.map((f) => {
                var _a, _b;
                // @ts-ignore
                const icon = (_b = (_a = fields[f.key].mainWidgetProps) === null || _a === void 0 ? void 0 : _a.customProps) === null || _b === void 0 ? void 0 : _b.icon;
                return {
                    label: f.label,
                    value: f.key,
                    icon,
                };
            }), value: fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.selectedKey, onChange: (val) => {
                fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.setField(val.label);
            } }));
    }, renderButton: function RAQBButton(buttonProps) {
        return (react_1.default.createElement(ui_1.Button, { type: "button", title: `${buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label} filter`, onClick: buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.onClick, variant: "secondary", size: "md", icon: (buttonProps === null || buttonProps === void 0 ? void 0 : buttonProps.label) === buttonLabels.add ? 'plus' : 'times' }));
    }, renderOperator: function Operator(operatorProps) {
        return (react_1.default.createElement(ui_1.Select, { options: operatorProps === null || operatorProps === void 0 ? void 0 : operatorProps.items.map((op) => ({ label: op.label, value: op.key })), "aria-label": "Operator", menuShouldPortal: true, value: operatorProps === null || operatorProps === void 0 ? void 0 : operatorProps.selectedKey, onChange: (val) => {
                operatorProps === null || operatorProps === void 0 ? void 0 : operatorProps.setField(val.value || '');
            } }));
    } });
// eslint-ignore
const customOperators = getCustomOperators(react_awesome_query_builder_1.BasicConfig);
const textWidget = react_awesome_query_builder_1.BasicConfig.types.text.widgets.text;
const opers = [...(textWidget.operators || []), "select_any_in" /* Op.IN */, "select_not_any_in" /* Op.NOT_IN */];
const customTextWidget = Object.assign(Object.assign({}, textWidget), { operators: opers });
const customTypes = Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.types), { text: Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.types.text), { widgets: Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig.types.text.widgets), { text: customTextWidget }) }) });
exports.raqbConfig = Object.assign(Object.assign({}, react_awesome_query_builder_1.BasicConfig), { widgets: exports.widgets,
    settings: exports.settings, operators: customOperators, types: customTypes });
function getCustomOperators(config) {
    const supportedOperators = tslib_1.__rest(config.operators, []);
    const noop = () => '';
    // IN operator expects array, override IN formatter for multi-value variables
    const sqlFormatInOp = supportedOperators["select_any_in" /* Op.IN */].sqlFormatOp || noop;
    const customSqlInFormatter = (field, op, value, valueSrc, valueType, opDef, operatorOptions, fieldDef) => {
        return sqlFormatInOp(field, op, splitIfString(value), valueSrc, valueType, opDef, operatorOptions, fieldDef);
    };
    // NOT IN operator expects array, override NOT IN formatter for multi-value variables
    const sqlFormatNotInOp = supportedOperators["select_not_any_in" /* Op.NOT_IN */].sqlFormatOp || noop;
    const customSqlNotInFormatter = (field, op, value, valueSrc, valueType, opDef, operatorOptions, fieldDef) => {
        return sqlFormatNotInOp(field, op, splitIfString(value), valueSrc, valueType, opDef, operatorOptions, fieldDef);
    };
    const customOperators = Object.assign(Object.assign({}, supportedOperators), { ["select_any_in" /* Op.IN */]: Object.assign(Object.assign({}, supportedOperators["select_any_in" /* Op.IN */]), { sqlFormatOp: customSqlInFormatter }), ["select_not_any_in" /* Op.NOT_IN */]: Object.assign(Object.assign({}, supportedOperators["select_not_any_in" /* Op.NOT_IN */]), { sqlFormatOp: customSqlNotInFormatter }) });
    return customOperators;
}
// value: string | List<string> but AQB uses a different version of Immutable
// eslint-ignore
function splitIfString(value) {
    if ((0, lodash_1.isString)(value)) {
        return value.split(',');
    }
    return value;
}
//# sourceMappingURL=AwesomeQueryBuilder.js.map
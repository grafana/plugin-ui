"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourcePicker = void 0;
const tslib_1 = require("tslib");
// Libraries
const react_1 = tslib_1.__importStar(require("react"));
// Components
const ui_1 = require("@grafana/ui");
const e2e_selectors_1 = require("@grafana/e2e-selectors");
const PluginSignatureBadge_1 = require("../Plugins/PluginSignatureBadge");
const runtime_1 = require("@grafana/runtime");
class DataSourcePicker extends react_1.PureComponent {
    constructor(props) {
        super(props);
        this.dataSourceSrv = (0, runtime_1.getDataSourceSrv)();
        this.state = {};
        this.onChange = (item) => {
            const dsSettings = this.dataSourceSrv.getInstanceSettings(item.value);
            if (dsSettings) {
                this.props.onChange(dsSettings);
                this.setState({ error: undefined });
            }
        };
    }
    componentDidMount() {
        const { current } = this.props;
        const dsSettings = this.dataSourceSrv.getInstanceSettings(current);
        if (!dsSettings) {
            this.setState({ error: 'Could not find data source ' + current });
        }
    }
    getCurrentValue() {
        const { current, hideTextValue, noDefault } = this.props;
        if (!current && noDefault) {
            return {
                label: 'No datasources found',
            };
        }
        const ds = this.dataSourceSrv.getInstanceSettings(current);
        if (ds) {
            return {
                label: ds.name.substr(0, 37),
                value: ds.name,
                imgUrl: ds.meta.info.logos.small,
                hideText: hideTextValue,
                meta: ds.meta,
            };
        }
        return {
            label: (current !== null && current !== void 0 ? current : 'no name') + ' - not found',
            value: (current !== null && current !== void 0 ? current : 'no name') + ' - not found',
            imgUrl: '',
            hideText: hideTextValue,
        };
    }
    getDataSourceOptions() {
        const options = this.dataSourceSrv.getList().map((ds) => ({
            value: ds.uid,
            label: ds.name,
            imgUrl: ds.meta.info.logos.small,
            meta: ds.meta,
        }));
        return options;
    }
    render() {
        const { autoFocus, onBlur, openMenuOnFocus, placeholder } = this.props;
        const { error } = this.state;
        const options = this.getDataSourceOptions();
        const value = this.getCurrentValue();
        return (react_1.default.createElement("div", { "aria-label": e2e_selectors_1.selectors.components.DataSourcePicker.container },
            react_1.default.createElement(ui_1.Select, { className: 'ds-picker select-container', isMulti: false, isClearable: false, backspaceRemovesValue: false, onChange: this.onChange, options: options, autoFocus: autoFocus, onBlur: onBlur, openMenuOnFocus: openMenuOnFocus, maxMenuHeight: 500, placeholder: placeholder, noOptionsMessage: 'No datasources found', value: value, invalid: !!error, getOptionLabel: (o) => {
                    if (o.meta &&
                        (0, PluginSignatureBadge_1.isUnsignedPluginSignature)(o.meta.signature) &&
                        o !== value) {
                        return (react_1.default.createElement(ui_1.HorizontalGroup, { align: 'center', justify: 'space-between' },
                            react_1.default.createElement("span", null, o.label),
                            ' ',
                            react_1.default.createElement(PluginSignatureBadge_1.PluginSignatureBadge, { status: o.meta.signature })));
                    }
                    return o.label || '';
                } })));
    }
}
exports.DataSourcePicker = DataSourcePicker;
DataSourcePicker.defaultProps = {
    autoFocus: false,
    openMenuOnFocus: false,
    placeholder: 'Select datasource',
};
//# sourceMappingURL=DataSourcePicker.js.map
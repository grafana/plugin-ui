"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPluginErrorCodeToSignatureStatus = exports.isUnsignedPluginSignature = exports.PluginSignatureBadge = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const data_1 = require("@grafana/data");
const PluginSignatureBadge = (_a) => {
    var { status } = _a, otherProps = tslib_1.__rest(_a, ["status"]);
    const display = getSignatureDisplayModel(status);
    return (react_1.default.createElement(ui_1.Badge, Object.assign({ text: display.text, color: display.color, icon: display.icon, tooltip: display.tooltip }, otherProps)));
};
exports.PluginSignatureBadge = PluginSignatureBadge;
function isUnsignedPluginSignature(signature) {
    return signature && signature !== data_1.PluginSignatureStatus.valid && signature !== data_1.PluginSignatureStatus.internal;
}
exports.isUnsignedPluginSignature = isUnsignedPluginSignature;
function mapPluginErrorCodeToSignatureStatus(code) {
    switch (code) {
        case data_1.PluginErrorCode.invalidSignature:
            return data_1.PluginSignatureStatus.invalid;
        case data_1.PluginErrorCode.missingSignature:
            return data_1.PluginSignatureStatus.missing;
        case data_1.PluginErrorCode.modifiedSignature:
            return data_1.PluginSignatureStatus.modified;
        default:
            return data_1.PluginSignatureStatus.missing;
    }
}
exports.mapPluginErrorCodeToSignatureStatus = mapPluginErrorCodeToSignatureStatus;
function getSignatureDisplayModel(signature) {
    if (!signature) {
        signature = data_1.PluginSignatureStatus.invalid;
    }
    switch (signature) {
        case data_1.PluginSignatureStatus.internal:
            return { text: 'Core', icon: 'cube', color: 'blue', tooltip: 'Core plugin that is bundled with Grafana' };
        case data_1.PluginSignatureStatus.valid:
            return { text: 'Signed', icon: 'lock', color: 'green', tooltip: 'Signed and verified plugin' };
        case data_1.PluginSignatureStatus.invalid:
            return {
                text: 'Invalid signature',
                icon: 'exclamation-triangle',
                color: 'red',
                tooltip: 'Invalid plugin signature',
            };
        case data_1.PluginSignatureStatus.modified:
            return {
                text: 'Modified signature',
                icon: 'exclamation-triangle',
                color: 'red',
                tooltip: 'Valid signature but content has been modified',
            };
        case data_1.PluginSignatureStatus.missing:
            return {
                text: 'Missing signature',
                icon: 'exclamation-triangle',
                color: 'red',
                tooltip: 'Missing plugin signature',
            };
    }
    return { text: 'Unsigned', icon: 'exclamation-triangle', color: 'red', tooltip: 'Unsigned external plugin' };
}
exports.PluginSignatureBadge.displayName = 'PluginSignatureBadge';
//# sourceMappingURL=PluginSignatureBadge.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPluginSignatureStatus = exports.mockPluginDependencies = exports.mockPluginState = exports.mockPluginIncludeType = exports.mockPluginType = exports.mockPluginInclude = exports.mockPluginMeta = exports.mockPluginMetaInfo = exports.mockDataSourcePluginMeta = void 0;
const chance_1 = require("chance");
const data_1 = require("@grafana/data");
const utils_1 = require("./utils");
const mockDataSourcePluginMeta = () => ({
    builtIn: (0, utils_1.generateBoolean)(),
    metrics: (0, utils_1.generateBoolean)(),
    logs: (0, utils_1.generateBoolean)(),
    annotations: (0, utils_1.generateBoolean)(),
    alerting: (0, utils_1.generateBoolean)(),
    tracing: (0, utils_1.generateBoolean)(),
    mixed: (0, utils_1.generateBoolean)(),
    hasQueryHelp: (0, utils_1.generateBoolean)(),
    category: (0, chance_1.Chance)().word(),
    queryOptions: {
        cacheTimeout: (0, utils_1.generateBoolean)(),
        maxDataPoints: (0, utils_1.generateBoolean)(),
        minInterval: (0, utils_1.generateBoolean)(),
    },
    sort: 1,
    streaming: (0, utils_1.generateBoolean)(),
    unlicensed: (0, utils_1.generateBoolean)(),
    id: (0, chance_1.Chance)().word(),
    name: (0, chance_1.Chance)().word(),
    type: (0, exports.mockPluginType)(),
    info: (0, exports.mockPluginMetaInfo)(),
    module: (0, chance_1.Chance)().word(),
    baseUrl: (0, chance_1.Chance)().word(),
});
exports.mockDataSourcePluginMeta = mockDataSourcePluginMeta;
const mockPluginMetaInfo = () => ({
    author: {
        name: (0, chance_1.Chance)().word(),
        url: (0, chance_1.Chance)().word(),
    },
    description: (0, chance_1.Chance)().word(),
    links: [],
    logos: {
        large: (0, chance_1.Chance)().word(),
        small: (0, chance_1.Chance)().word(),
    },
    screenshots: [],
    updated: (0, chance_1.Chance)().word(),
    version: (0, chance_1.Chance)().word(),
});
exports.mockPluginMetaInfo = mockPluginMetaInfo;
const mockPluginMeta = () => ({
    id: (0, chance_1.Chance)().word(),
    name: (0, chance_1.Chance)().word(),
    type: (0, exports.mockPluginType)(),
    info: (0, exports.mockPluginMetaInfo)(),
    includes: [(0, exports.mockPluginInclude)()],
    state: (0, exports.mockPluginState)(),
    module: (0, chance_1.Chance)().word(),
    baseUrl: (0, chance_1.Chance)().word(),
    dependencies: (0, exports.mockPluginDependencies)(),
    jsonData: {},
    secureJsonData: {},
    enabled: (0, utils_1.generateBoolean)(),
    defaultNavUrl: (0, chance_1.Chance)().word(),
    hasUpdate: (0, utils_1.generateBoolean)(),
    enterprise: (0, utils_1.generateBoolean)(),
    latestVersion: (0, chance_1.Chance)().word(),
    pinned: (0, utils_1.generateBoolean)(),
    signature: (0, exports.mockPluginSignatureStatus)(),
    live: (0, utils_1.generateBoolean)(),
});
exports.mockPluginMeta = mockPluginMeta;
const mockPluginInclude = () => ({
    type: (0, exports.mockPluginIncludeType)(),
    name: (0, chance_1.Chance)().word(),
    path: (0, chance_1.Chance)().word(),
    icon: (0, chance_1.Chance)().word(),
    role: (0, chance_1.Chance)().word(),
    addToNav: (0, utils_1.generateBoolean)(),
    component: (0, chance_1.Chance)().word(),
});
exports.mockPluginInclude = mockPluginInclude;
const mockPluginType = () => (0, chance_1.Chance)().pickone([
    data_1.PluginType.panel,
    data_1.PluginType.datasource,
    data_1.PluginType.app,
    data_1.PluginType.renderer,
]);
exports.mockPluginType = mockPluginType;
const mockPluginIncludeType = () => (0, chance_1.Chance)().pickone([
    data_1.PluginIncludeType.dashboard,
    data_1.PluginIncludeType.page,
    data_1.PluginIncludeType.panel,
    data_1.PluginIncludeType.datasource,
]);
exports.mockPluginIncludeType = mockPluginIncludeType;
const mockPluginState = () => (0, chance_1.Chance)().pickone([
    data_1.PluginState.alpha,
    data_1.PluginState.beta,
    data_1.PluginState.deprecated,
]);
exports.mockPluginState = mockPluginState;
const mockPluginDependencies = () => ({
    grafanaVersion: (0, chance_1.Chance)().word(),
    plugins: [],
});
exports.mockPluginDependencies = mockPluginDependencies;
const mockPluginSignatureStatus = () => (0, chance_1.Chance)().pickone([
    data_1.PluginSignatureStatus.internal,
    data_1.PluginSignatureStatus.valid,
    data_1.PluginSignatureStatus.invalid,
    data_1.PluginSignatureStatus.modified,
    data_1.PluginSignatureStatus.missing,
]);
exports.mockPluginSignatureStatus = mockPluginSignatureStatus;
//# sourceMappingURL=Plugin.js.map
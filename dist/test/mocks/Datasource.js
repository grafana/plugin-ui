"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDatasourceInstanceSettings = exports.mockDatasource = void 0;
const chance_1 = require("chance");
const Plugin_1 = require("./Plugin");
const utils_1 = require("./utils");
const mockDatasource = () => ({
    // DataSourceWithBackend
    query: jest.fn(),
    filterQuery: (0, utils_1.undefinedOr)(utils_1.generateBoolean),
    applyTemplateVariables: jest.fn(),
    getResource: jest.fn(),
    postResource: jest.fn(),
    callHealthCheck: jest.fn(),
    testDatasource: jest.fn(),
    // DataSourceApi
    uid: (0, chance_1.Chance)().guid(),
    name: (0, chance_1.Chance)().word(),
    id: 1,
    type: (0, chance_1.Chance)().word(),
    interval: (0, chance_1.Chance)().word(),
    importQueries: jest.fn(),
    init: jest.fn(),
    getQueryHints: jest.fn().mockReturnValue([mockQueryHint()]),
    getQueryDisplayText: jest.fn().mockReturnValue((0, chance_1.Chance)().word()),
    getLogRowContext: jest.fn(),
    metricFindQuery: jest.fn(),
    getTagKeys: jest.fn(),
    getTagValues: jest.fn(),
    components: {},
    meta: (0, Plugin_1.mockDataSourcePluginMeta)(),
    targetContainsTemplate: jest.fn(),
    modifyQuery: jest.fn(),
    getHighlighterExpression: jest.fn(),
    languageProvider: jest.fn(),
    getVersion: jest.fn(),
    showContextToggle: jest.fn(),
    interpolateVariablesInQueries: jest.fn(),
    annotations: {},
    annotationQuery: jest.fn(),
    streamOptionsProvider: jest.fn(),
    getRef: jest.fn(),
});
exports.mockDatasource = mockDatasource;
const mockQueryHint = () => ({
    type: (0, chance_1.Chance)().word(),
    label: (0, chance_1.Chance)().word(),
    fix: {
        label: (0, chance_1.Chance)().word(),
        action: {
            type: (0, chance_1.Chance)().word(),
            query: (0, chance_1.Chance)().word(),
            preventSubmit: (0, utils_1.generateBoolean)(),
        },
    },
});
const mockDatasourceInstanceSettings = () => ({
    id: (0, chance_1.Chance)().integer(),
    uid: (0, chance_1.Chance)().word(),
    type: (0, chance_1.Chance)().word(),
    name: (0, chance_1.Chance)().word(),
    meta: (0, Plugin_1.mockDataSourcePluginMeta)(),
    url: (0, chance_1.Chance)().word(),
    jsonData: {},
    username: (0, chance_1.Chance)().word(),
    password: (0, chance_1.Chance)().word(),
    database: (0, chance_1.Chance)().word(),
    basicAuth: (0, chance_1.Chance)().word(),
    withCredentials: (0, utils_1.generateBoolean)(),
    access: (0, chance_1.Chance)().pickone(["direct", "proxy"]),
});
exports.mockDatasourceInstanceSettings = mockDatasourceInstanceSettings;
//# sourceMappingURL=Datasource.js.map
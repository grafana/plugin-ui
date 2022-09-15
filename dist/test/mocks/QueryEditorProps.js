"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTimeRange = exports.mockLoadingState = exports.mockQueryEditorProps = void 0;
const data_1 = require("@grafana/data");
const chance_1 = require("chance");
const mockQueryEditorProps = () => ({
    datasource: {},
    query: {
        refId: (0, chance_1.Chance)().word(),
        hide: false,
        key: (0, chance_1.Chance)().word(),
        queryType: (0, chance_1.Chance)().word(),
        dataTopic: data_1.DataTopic.Annotations,
        datasource: (0, chance_1.Chance)().pickone([(0, chance_1.Chance)().word(), null]),
    },
    onRunQuery: jest.fn(),
    onChange: jest.fn(),
    onBlur: jest.fn(),
    data: {
        state: (0, exports.mockLoadingState)(),
        series: [],
        annotations: [],
        timeRange: (0, exports.mockTimeRange)(),
    },
    range: (0, exports.mockTimeRange)(),
    exploreId: (0, chance_1.Chance)().guid(),
    history: [],
});
exports.mockQueryEditorProps = mockQueryEditorProps;
const mockLoadingState = () => (0, chance_1.Chance)().pickone([
    data_1.LoadingState.NotStarted,
    data_1.LoadingState.Loading,
    data_1.LoadingState.Streaming,
    data_1.LoadingState.Done,
    data_1.LoadingState.Error,
]);
exports.mockLoadingState = mockLoadingState;
const mockTimeRange = () => ({
    from: (0, data_1.dateTime)(),
    to: (0, data_1.dateTime)(),
    raw: {
        from: (0, data_1.dateTime)(),
        to: (0, data_1.dateTime)(),
    },
});
exports.mockTimeRange = mockTimeRange;
//# sourceMappingURL=QueryEditorProps.js.map
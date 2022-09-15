"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOption = exports.QUERY_FORMAT_OPTIONS = exports.EditorMode = exports.QueryFormat = void 0;
const data_1 = require("@grafana/data");
var QueryFormat;
(function (QueryFormat) {
    QueryFormat["Timeseries"] = "time_series";
    QueryFormat["Table"] = "table";
})(QueryFormat = exports.QueryFormat || (exports.QueryFormat = {}));
var EditorMode;
(function (EditorMode) {
    EditorMode["Builder"] = "builder";
    EditorMode["Code"] = "code";
})(EditorMode = exports.EditorMode || (exports.EditorMode = {}));
exports.QUERY_FORMAT_OPTIONS = [
    { label: 'Time series', value: QueryFormat.Timeseries },
    { label: 'Table', value: QueryFormat.Table },
];
const backWardToOption = (value) => ({ label: value, value });
exports.toOption = data_1.toOption !== null && data_1.toOption !== void 0 ? data_1.toOption : backWardToOption;
//# sourceMappingURL=types.js.map
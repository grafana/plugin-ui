"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryEditorExpressionType = exports.QueryEditorPropertyType = void 0;
var QueryEditorPropertyType;
(function (QueryEditorPropertyType) {
    QueryEditorPropertyType["String"] = "string";
})(QueryEditorPropertyType = exports.QueryEditorPropertyType || (exports.QueryEditorPropertyType = {}));
var QueryEditorExpressionType;
(function (QueryEditorExpressionType) {
    QueryEditorExpressionType["Property"] = "property";
    QueryEditorExpressionType["Operator"] = "operator";
    QueryEditorExpressionType["Or"] = "or";
    QueryEditorExpressionType["And"] = "and";
    QueryEditorExpressionType["GroupBy"] = "groupBy";
    QueryEditorExpressionType["Function"] = "function";
    QueryEditorExpressionType["FunctionParameter"] = "functionParameter";
})(QueryEditorExpressionType = exports.QueryEditorExpressionType || (exports.QueryEditorExpressionType = {}));
//# sourceMappingURL=expressions.js.map
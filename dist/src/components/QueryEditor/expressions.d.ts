export declare enum QueryEditorPropertyType {
    String = "string"
}
export interface QueryEditorProperty {
    type: QueryEditorPropertyType;
    name?: string;
}
export declare type QueryEditorOperatorType = string | boolean | number;
declare type QueryEditorOperatorValueType = QueryEditorOperatorType | QueryEditorOperatorType[];
export interface QueryEditorOperator<T extends QueryEditorOperatorValueType> {
    name?: string;
    value?: T;
}
export interface QueryEditorOperatorExpression {
    type: QueryEditorExpressionType.Operator;
    property: QueryEditorProperty;
    operator: QueryEditorOperator<QueryEditorOperatorValueType>;
}
export interface QueryEditorArrayExpression {
    type: QueryEditorExpressionType.And | QueryEditorExpressionType.Or;
    expressions: QueryEditorExpression[] | QueryEditorArrayExpression[];
}
export interface QueryEditorPropertyExpression {
    type: QueryEditorExpressionType.Property;
    property: QueryEditorProperty;
}
export declare enum QueryEditorExpressionType {
    Property = "property",
    Operator = "operator",
    Or = "or",
    And = "and",
    GroupBy = "groupBy",
    Function = "function",
    FunctionParameter = "functionParameter"
}
export declare type QueryEditorExpression = QueryEditorArrayExpression | QueryEditorPropertyExpression | QueryEditorGroupByExpression | QueryEditorFunctionExpression | QueryEditorFunctionParameterExpression | QueryEditorOperatorExpression;
export interface QueryEditorGroupByExpression {
    type: QueryEditorExpressionType.GroupBy;
    property: QueryEditorProperty;
}
export interface QueryEditorFunctionExpression {
    type: QueryEditorExpressionType.Function;
    name?: string;
    parameters?: QueryEditorFunctionParameterExpression[];
}
export interface QueryEditorFunctionParameterExpression {
    type: QueryEditorExpressionType.FunctionParameter;
    name?: string;
}
export {};

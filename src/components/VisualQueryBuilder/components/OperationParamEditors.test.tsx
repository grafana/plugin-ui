import { getOperationParamId } from "./OperationParamEditor";

describe('getOperationParamId', () => {
  it('Generates correct id for operation param', () => {
    const operationId = 'abc';
    const paramId = 0;
    expect(getOperationParamId(operationId, paramId)).toBe('operations.abc.param.0');
  });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDataQuery = void 0;
const chance_1 = require("chance");
const utils_1 = require("./utils");
const mockDataQuery = () => ({
    refId: (0, chance_1.Chance)().word(),
    hide: false,
    key: (0, chance_1.Chance)().guid(),
    queryType: (0, chance_1.Chance)().word(),
    datasource: (0, utils_1.undefinedOr)(() => (0, chance_1.Chance)().word()),
});
exports.mockDataQuery = mockDataQuery;
//# sourceMappingURL=DataQuery.js.map
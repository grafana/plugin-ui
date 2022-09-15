import { SQLQuery } from './types';
export declare function applyQueryDefaults(q?: SQLQuery): SQLQuery;
export declare type QueryWithDefaults = ReturnType<typeof applyQueryDefaults>;

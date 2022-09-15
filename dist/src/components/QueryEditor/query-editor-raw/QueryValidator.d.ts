/// <reference types="react" />
import { TimeRange } from '@grafana/data';
import { DB, SQLQuery } from '../types';
export interface QueryValidatorProps {
    db: DB;
    query: SQLQuery;
    range?: TimeRange;
    onValidate: (isValid: boolean) => void;
}
export declare function QueryValidator({ db, query, onValidate, range }: QueryValidatorProps): JSX.Element | null;

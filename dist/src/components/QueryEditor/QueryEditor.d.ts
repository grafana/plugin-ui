/// <reference types="react" />
import { QueryEditorProps } from '@grafana/data';
import { SQLQuery, SQLOptions } from './types';
import { SqlDatasource } from '../../datasource/SqlDatasource';
declare type Props = QueryEditorProps<SqlDatasource, SQLQuery, SQLOptions>;
export declare function SqlQueryEditor({ datasource, query, onChange, onRunQuery, range }: Props): JSX.Element | null;
export {};

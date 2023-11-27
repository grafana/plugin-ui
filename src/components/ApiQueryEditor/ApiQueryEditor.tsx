import React, { FormEvent, useState } from 'react';
import { ActionMeta, AsyncSelect, InlineFormLabel, Input, Select } from '@grafana/ui';
import { DataQuery, SelectableValue } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';

export type API = {
    name: string;
    inputs: InputValue[];
}

export type ApiQuery = {
    inputs?: InputValue[]
  } & DataQuery

export type InputValue = {
    name: string;
    value?: any;
    description?: string;
    choices?: string[];
    lookup?: string;
    defaultValue?: string;
}

export interface ApiDS extends DataSourceWithBackend {
    apiList: () => API[];
    lookup?: (type: string) => Promise<SelectableValue[]>;
}

export type Props = {
    query: ApiQuery;
    onChange: (query: DataQuery) => void;
    datasource: ApiDS;
}

export const ApiQueryEditor = (props: Props) => {
    const { datasource, query } = props;
    const defaultInputs: InputValue[] = [];
    const apiList = datasource.apiList();
    const api = apiList.find((a) => a.name === query.queryType) || {name: '', inputs: defaultInputs};
    const [inputs, setInputs] = useState<InputValue[]>(api.inputs);

    const onChangeSelect = (selected: SelectableValue<string>, i: number) => {
        const val = {currentTarget: {value: selected.value!}} as unknown as FormEvent<HTMLInputElement>;
        onChangeInput(val, i)
    }

    const onChangeInput = (v: FormEvent<HTMLInputElement>, i: number) => {
        const updatedInputs = inputs?.map((input, idx) => {
            if (i === idx) {
                return {...input, value: v.currentTarget.value};
            }
            return {...input, value: value(query, idx)};
        })
        setInputs(updatedInputs);
        const update = {...query, inputs: updatedInputs};
        props.onChange(update);
    }

    const loadOptions = async (lookup: string) => {
        return await datasource.lookup!(lookup);
    }

    return (
        <div>
            {api.inputs.map((iv: InputValue, i) => {
                const val = value(query, i, iv.defaultValue);
                return <div className="gf-form" key={i}>
                        <InlineFormLabel tooltip={iv.description}>
                            {pretty(iv.name)}
                        </InlineFormLabel>
                        {iv.choices &&  
                            <Select
                                allowCustomValue
                                isClearable
                                options={toSelectable(iv.choices)}
                                width={40}
                                value={val}
                                onChange={(selected: SelectableValue<string>, _: ActionMeta) => onChangeSelect(selected, i)}
                            />
                        }
                        {iv.lookup &&  
                            <AsyncSelect
                                loadOptions={async () => await loadOptions(iv.lookup!)}
                                defaultOptions={true}
                                allowCustomValue
                                isClearable
                                width={40}
                                value={{label: val, value: val}}
                                onChange={(selected: SelectableValue<string>, _: ActionMeta) => onChangeSelect(selected, i)}
                            />
                        }
                        {!iv.choices && !iv.lookup &&  
                            <Input name={iv.name} key={i} value={val} width={40} onChange={(v) => onChangeInput(v, i)}></Input>
                        }
                    </div>
            })}
        </div>
    )
}

function pretty(val: string) {
    val = val.replace(/-/g, ' ');
    val = val.replace(/_/g, ' ');
    const words = val.split(' ');
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    return words.join(' ');
}

function toSelectable(vals: string[]) {
    return vals.map(v => ({label: v, value: v}))
}

function value(query: ApiQuery, i: number, defaultValue?: string) {
    const val = query.inputs?.find((_, idx) => { return i === idx});
    return val?.value || defaultValue;;
}

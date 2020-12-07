import { SelectableValue } from '@grafana/data';
import { Chance } from 'chance';
import { kebabCase } from 'lodash';

export const generateOptions = (): Array<SelectableValue<string>> => {
  const numberOfOptions = 5;

  return Array.from(new Array(numberOfOptions), (_, index) => {
    const name = Chance(index).name();

    return {
      label: name,
      value: kebabCase(name),
    };
  });
};

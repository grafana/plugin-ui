import { Chance } from 'chance';

export const generateBoolean = () => Chance().pickone([true, false]);

export const undefinedOr = (fn: Function) =>
  Chance().pickone([undefined, fn()]);

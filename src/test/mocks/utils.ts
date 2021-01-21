import { Chance } from 'chance';

export const generateBoolean = () => Chance().pickone([true, false]);

export const undefinedOr = (fn: Function) =>
  Chance().pickone([undefined, fn()]);

export const generateArrayOf = (fn: Function, numberOf: number = 3) =>
  Array.from(new Array(numberOf), () => fn());

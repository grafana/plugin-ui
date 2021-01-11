import { Chance } from 'chance';

export const generateBoolean = () => Chance().pickone([true, false]);

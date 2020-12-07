import { getAvailableIcons, IconName } from '@grafana/ui';
import { Chance } from 'chance';

export const getIcon = (): IconName => Chance().pickone(getAvailableIcons());

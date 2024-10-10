import { GetReleaseLine, GetDependencyReleaseLine, ChangelogFunctions } from '@changesets/types';

const getReleaseLine: GetReleaseLine = async (changeset) => `- ${changeset.summary}`;

const getDependencyReleaseLine: GetDependencyReleaseLine = async () => '';

const defaultChangelogFunctions: ChangelogFunctions = {
  getReleaseLine,
  getDependencyReleaseLine,
};

export default defaultChangelogFunctions;

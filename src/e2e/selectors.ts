import { E2ESelectors } from '@grafana/e2e-selectors';

export const Components = {
    QueryEditor: {
        CodeEditor: {
            label: `SQL Query`,
            tip: 'Tip: To re-run the query while you are editing, press ctrl/cmd+s.',
            input: () => '.monaco-editor textarea',
        },
        FormatAs: {
            label: `Format as`,
        },
    },
};

export const selectors: { components: E2ESelectors<typeof Components> } = {
    components: Components,
};

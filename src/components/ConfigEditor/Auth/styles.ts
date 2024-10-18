import { css } from '@emotion/css';

export const useCommonStyles = () => {
  return {
    inlineFieldNoMarginRight: css({
      marginRight: 0,
    }),
    // This is dirty hack to make configured secret input grow
    inlineFieldWithSecret: css({
      '[class$="layoutChildrenWrapper"]:first-child': {
        flexGrow: 1,
      },
    }),
  };
};

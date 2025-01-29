import { css } from '@emotion/css';

export function getStyles() {
  return {
    input: css({
      /* hides the native Calendar picker icon given when using type=date */
      "input[type='date']::-webkit-inner-spin-button, input[type='date']::-webkit-calendar-picker-indicator": {
        display: 'none',
        WebkitAppearance: 'none',
      },
    }),
  };
}

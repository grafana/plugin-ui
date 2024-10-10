import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export const getStyles = (theme: GrafanaTheme2) => {
  const containerBorder = theme.isDark ? theme.v1.palette.dark9 : theme.v1.palette.gray5;

  return {
    container: css`
      top: -1px;
      position: absolute;
      right: 544px;
      box-shadow: 0px 0px 20px ${theme.v1.colors.dropdownShadow};
      background-color: ${theme.v1.colors.bodyBg};
      z-index: -1;
      border: 1px solid ${containerBorder};
      border-radius: 2px 0 0 2px;

      &:after {
        display: block;
        background-color: ${theme.v1.colors.bodyBg};
        width: 19px;
        height: 100%;
        content: '';
        position: absolute;
        top: 0;
        right: -19px;
        border-left: 1px solid ${theme.v1.colors.border1};
      }
    `,
    modal: css`
      z-index: ${theme.v1.zIndex.modal};
    `,
    content: css`
      margin: 0 auto;
      width: 268px;
    `,
    backdrop: css`
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: #202226;
      opacity: 0.7;
      z-index: ${theme.v1.zIndex.modalBackdrop};
      text-align: center;
    `,
  };
};

export const getBodyStyles = (theme: GrafanaTheme2) => {
  const containerBorder = theme.isDark ? theme.v1.palette.dark9 : theme.v1.palette.gray5;

  return {
    title: css`
      color: ${theme.colors.text};
      background-color: ${theme.v1.colors.bodyBg};
      font-size: ${theme.v1.typography.size.md};
      border: 1px solid transparent;

      &:hover {
        position: relative;
      }
    `,
    body: css`
      z-index: ${theme.zIndex.modal};
      position: fixed;
      background-color: ${theme.v1.colors.bodyBg};
      width: 268px;

      box-shadow: 0px 0px 20px ${theme.v1.colors.dropdownShadow};
      border: 1px solid ${containerBorder};
      border-radius: 2px 0 0 2px;

      .react-calendar__navigation__label,
      .react-calendar__navigation__arrow,
      .react-calendar__navigation {
        padding-top: 4px;
        background-color: inherit;
        color: ${theme.colors.text};
        border: 0;
        font-weight: ${theme.v1.typography.weight.semibold};
      }

      .react-calendar__month-view__weekdays {
        background-color: inherit;
        text-align: center;
        color: ${theme.v1.palette.blue77};

        abbr {
          border: 0;
          text-decoration: none;
          cursor: default;
          display: block;
          padding: 4px 0 4px 0;
        }
      }

      .react-calendar__month-view__days {
        background-color: inherit;
      }

      .react-calendar__tile,
      .react-calendar__tile--now {
        margin-bottom: 4px;
        background-color: inherit;
        height: 26px;
      }

      .react-calendar__navigation__label,
      .react-calendar__navigation > button:focus,
      .time-picker-calendar-tile:focus {
        outline: 0;
      }

      .react-calendar__tile--active,
      .react-calendar__tile--active:hover {
        color: ${theme.v1.palette.white};
        font-weight: ${theme.v1.typography.weight.semibold};
        background: ${theme.v1.palette.blue95};
        box-shadow: none;
        border: 0px;
      }

      .react-calendar__tile--rangeEnd,
      .react-calendar__tile--rangeStart {
        padding: 0;
        border: 0px;
        color: ${theme.v1.palette.white};
        font-weight: ${theme.v1.typography.weight.semibold};
        background: ${theme.v1.palette.blue95};

        abbr {
          background-color: ${theme.v1.palette.blue77};
          border-radius: 100px;
          display: block;
          padding-top: 2px;
          height: 26px;
        }
      }

      .react-calendar__tile--rangeStart {
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
      }

      .react-calendar__tile--rangeEnd {
        border-top-right-radius: 20px;
        border-bottom-right-radius: 20px;
      }
    `,
  };
};

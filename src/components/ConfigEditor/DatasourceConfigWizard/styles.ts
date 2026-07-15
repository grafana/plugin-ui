import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';

/** Centered saving/loading overlay. Identical in tab and wizard layouts. */
const overlayStyle = (theme: GrafanaTheme2) =>
  ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    zIndex: 1,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
    opacity: 0.95,
  }) as const;

/** "Read-only — managed externally" banner. Tab layout adds a marginBottom. */
const readOnlyBannerStyle = (theme: GrafanaTheme2) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }) as const;

export const getWizardStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    overflow: 'hidden',
  }),
  overlay: css(overlayStyle(theme)),
  readOnlyBanner: css(readOnlyBannerStyle(theme)),
  navBar: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  navTitle: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text.primary,
  }),
  stepCount: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.colors.text.secondary,
  }),
  navActions: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.25),
  }),
  form: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  }),
  buttons: css({
    display: 'flex',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(0.25),
  }),
});

// Field-level styles shared by SchemaField and AuthorizationHeaderField, which
// render in both the tab and wizard layouts (hence not tied to either one).
export const getFieldStyles = (theme: GrafanaTheme2) => ({
  fieldRow: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(80px, 1fr) minmax(0, 2fr)',
    gap: theme.spacing(0.75),
    alignItems: 'start',
  }),
  fieldRowCenter: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(80px, 1fr) minmax(0, 2fr)',
    gap: theme.spacing(0.75),
    alignItems: 'center',
    padding: `${theme.spacing(0.5)} 0`,
  }),
  fieldLabelRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    paddingTop: theme.spacing(0.5),
  }),
  fieldLabelRowCompact: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
  fieldLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
  }),
  fieldRequired: css({
    color: theme.colors.error.text,
    marginLeft: 2,
  }),
  fieldInfoIcon: css({
    color: theme.colors.text.disabled,
    cursor: 'help',
    flexShrink: 0,
  }),
  fieldInputCol: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    minWidth: 0,
  }),
  fieldError: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.error.text,
  }),
});

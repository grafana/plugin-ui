import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';

// ── Shared style objects ──
// Returned as plain objects (not css() results, which are unmergeable class
// strings) so callers can spread + tweak them. `as const` narrows string
// literals (e.g. 'absolute') into the CSS property unions css() expects.

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

export const getTabStyles = (theme: GrafanaTheme2) => ({
  root: css({
    display: 'flex',
    gap: theme.spacing(3),
    position: 'relative',
    background: theme.colors.background.canvas,
    padding: theme.spacing(2),
  }),

  // Sidebar
  sidebar: css({
    width: 250,
    flexShrink: 0,
    position: 'sticky',
    top: theme.spacing(2),
    alignSelf: 'flex-start',
    [theme.breakpoints.down('sm')]: { display: 'none' },
  }),
  sidebarTitle: css({
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    padding: `${theme.spacing(1)} 0`,
    marginBottom: theme.spacing(1),
  }),
  navList: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    position: 'relative',
  }),
  navItem: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1)} 0`,
    cursor: 'pointer',
    position: 'relative',
  }),
  navItemActive: css({}),
  // Dot container: positions the dot and the connector line
  navDotWrap: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 12,
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingTop: theme.spacing(0.5),
  }),
  navDot: css({
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: `2px solid ${theme.colors.text.disabled}`,
    background: theme.colors.background.canvas,
    position: 'relative',
    zIndex: 1,
  }),
  navDotOptional: css({
    borderStyle: 'dashed',
  }),
  navDotActive: css({
    background: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
    borderStyle: 'solid',
  }),
  navDotValidated: css({
    background: theme.colors.success.main,
    borderColor: theme.colors.success.main,
    borderStyle: 'solid',
  }),
  navDotError: css({
    background: theme.colors.error.main,
    borderColor: theme.colors.error.main,
    borderStyle: 'solid',
  }),
  // Connector line running from dot center downward to next item
  navConnector: css({
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -16,
    width: 2,
    background: theme.colors.border.medium,
    zIndex: 0,
  }),
  navConnectorDashed: css({
    background: 'none',
    borderLeft: `2px dashed ${theme.colors.border.weak}`,
    width: 0,
  }),
  navLabel: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.secondary,
    lineHeight: 1.4,
  }),
  navLabelActive: css({
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
  }),

  // Main content
  main: css({
    flex: 1,
    minWidth: 0,
    width: 0, // forces flex child to respect flex-grow and fill remaining space
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  form: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  requiredNotice: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(0.5),
  }),

  // Section wrapper — card container around CollapsableSection
  section: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    overflow: 'hidden',
  }),
  // Override Collapse component styling
  collapseHeader: css({
    borderRadius: theme.shape.radius.default,
    background: 'none',
    border: 'none',
    marginBottom: 0,
    // Collapse header button: make label fill remaining space
    '& > button': {
      padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
      width: '100%',
      justifyContent: 'flex-start',
    },
    '& > button > div': {
      flex: 1,
      fontSize: theme.typography.h4.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      textAlign: 'left',
    },
  }),
  sectionLabel: css({
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  }),
  sectionLabelText: css({
    flex: 1,
  }),
  sectionHeader: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
    cursor: 'pointer',
    userSelect: 'none',
  }),
  sectionChevron: css({
    transition: 'transform 0.2s ease',
  }),
  sectionChevronOpen: css({
    transform: 'rotate(90deg)',
  }),
  sectionTitle: css({
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    flex: 1,
    textAlign: 'left',
  }),
  sectionBadge: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.colors.text.disabled,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.pill,
    padding: `1px ${theme.spacing(0.75)}`,
    whiteSpace: 'nowrap',
  }),
  sectionDescription: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(1.5),
  }),
  sectionBody: css({
    padding: `0 ${theme.spacing(2)} ${theme.spacing(2)}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  }),

  // Form bottom
  formButtons: css({
    display: 'flex',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
  }),

  // Loading / error states
  loadingContainer: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(3),
    color: theme.colors.text.secondary,
  }),
  overlay: css(overlayStyle(theme)),
  readOnlyBanner: css({ ...readOnlyBannerStyle(theme), marginBottom: theme.spacing(1) }),
});

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

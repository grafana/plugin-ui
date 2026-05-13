import React, { forwardRef, type ReactNode } from 'react';
import { cx } from '@emotion/css';
import { useStyles2, Icon } from '@grafana/ui';
import { getTabStyles } from './tabStyles';

type AccordionSectionProps = {
  title: string;
  description?: string;
  optional?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export const AccordionSection = forwardRef<HTMLDivElement, AccordionSectionProps>(function AccordionSection(
  { title, description, optional, expanded, onToggle, children },
  ref
) {
  const styles = useStyles2(getTabStyles);

  return (
    <div className={styles.section} ref={ref}>
      <div
        className={styles.sectionHeader}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <Icon
          name="angle-right"
          size="lg"
          className={cx(styles.sectionChevron, expanded && styles.sectionChevronOpen)}
        />
        <span className={styles.sectionTitle}>{title}</span>
        {optional && <span className={styles.sectionBadge}>Optional</span>}
      </div>
      {description && !expanded && <div className={styles.sectionDescription}>{description}</div>}
      {expanded && (
        <>
          {description && <div className={styles.sectionDescription}>{description}</div>}
          <div className={styles.sectionBody}>{children}</div>
        </>
      )}
    </div>
  );
});

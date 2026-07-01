import React from 'react';
import { cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import type { ResolvedGroup } from './hooks/useDatasourceConfigForm';
import { getTabStyles } from './styles';

export type SectionState = 'active' | 'draft' | 'validated' | 'error';

type SidebarNavProps = {
  groups: ResolvedGroup[];
  activeIndex: number;
  sectionStates: SectionState[];
  onSelect: (index: number) => void;
};

export function SidebarNav({ groups, activeIndex, sectionStates, onSelect }: SidebarNavProps) {
  const styles = useStyles2(getTabStyles);

  // Filter out _required synthetic group
  const visibleGroups = groups.filter((g) => g.group.id !== '_required');

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Connect data source</div>
      <ul className={styles.navList}>
        {visibleGroups.map((g, vi) => {
          // Map back to original index for state/selection
          const origIndex = groups.indexOf(g);
          const state = sectionStates[origIndex] ?? 'draft';
          const isActive = origIndex === activeIndex;
          const isOptional = g.group.optional === true;
          const isLast = vi === visibleGroups.length - 1;
          // Next item determines connector style
          const nextIsOptional = !isLast && visibleGroups[vi + 1]?.group.optional === true;

          return (
            <li key={g.group.id}>
              <div
                className={cx(styles.navItem, isActive && styles.navItemActive)}
                onClick={() => onSelect(origIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(origIndex);
                  }
                }}
              >
                <div className={styles.navDotWrap}>
                  <span
                    className={cx(
                      styles.navDot,
                      isOptional && styles.navDotOptional,
                      isActive && styles.navDotActive,
                      state === 'validated' && !isActive && styles.navDotValidated,
                      state === 'error' && !isActive && styles.navDotError
                    )}
                  />
                  {!isLast && (
                    <div
                      className={cx(styles.navConnector, (isOptional || nextIsOptional) && styles.navConnectorDashed)}
                    />
                  )}
                </div>
                <span className={cx(styles.navLabel, isActive && styles.navLabelActive)}>{g.group.title}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { Button, ClickOutsideWrapper, IconName, Select } from '@grafana/ui';
import { SelectCommonProps } from '@grafana/ui/components/Select/types';
import React from 'react';

export interface SelectWithIconProps extends SelectCommonProps<string> {
  isMulti?: boolean;
  addIcon?: IconName;
  removeIcon?: IconName;
  displayIcon: boolean;
  children?: React.ReactNode;
  renderRemove?: boolean;
  onRemove?: () => void;
  onClickOutside?: () => void;
}

export const SelectWithIcon = (props: SelectWithIconProps) => {
  const {
    isMulti,
    maxVisibleValues,
    addIcon,
    removeIcon,
    displayIcon: displayIconCriteria,
    isLoading,
    options,
    onChange,
    value,
    renderRemove,
    onRemove,
    children,
    ...rest
  } = props;

  const [openDropdown, setOpenDropdown] = React.useState(false);
  const [displayIcon, setDisplayIcon] = React.useState(displayIconCriteria);

  React.useEffect(() => setDisplayIcon(displayIconCriteria), [value]);

  return displayIcon ? (
    <Button
      variant='secondary'
      icon={addIcon || 'search-plus'}
      onClick={() => {
        setOpenDropdown(true);
        setDisplayIcon(!displayIcon);
      }}
    />
  ) : (
    <>
      <ClickOutsideWrapper
        useCapture={true}
        includeButtonPress={false}
        onClick={() => {
          // Fixes a problem where if the dropdown is open but there are no values for the field we want to add to,
          // i.e. when you first click the display icon and the dropdown is open for the first time
          // it does not close the dropdown when clicking outside of the component
          if (!children && !displayIcon && displayIconCriteria) {
            setDisplayIcon(true);
          }

          setOpenDropdown(false);
        }}
      >
        <Select
          isMulti={isMulti}
          maxVisibleValues={isMulti ? maxVisibleValues : undefined}
          isLoading={isLoading}
          options={options}
          value={value}
          onChange={(ev) => {
            onChange(ev);
            setOpenDropdown(false);
          }}
          isOpen={openDropdown}
          onOpenMenu={() => setOpenDropdown(true)}
          onCloseMenu={() => setOpenDropdown(false)}
          {...rest}
        />
      </ClickOutsideWrapper>
      {!displayIcon ? children : null}
      {!displayIcon && renderRemove ? (
        <Button
          variant='secondary'
          icon={removeIcon || 'search-minus'}
          onClick={onRemove}
        />
      ) : null}
    </>
  );
};

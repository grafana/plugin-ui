import { useState, useEffect } from 'react';

export const DEFAULT_DELAY = 275;

export const useDebounce = <T>(value: T, delay: number = DEFAULT_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
    // TODO: We should fix this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return debouncedValue;
};

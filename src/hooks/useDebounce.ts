import { useState, useEffect } from 'react';

export const DEFAULT_DELAY = 275;

export const useDebounce = (value: any, delay: number = DEFAULT_DELAY) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  return debouncedValue;
};

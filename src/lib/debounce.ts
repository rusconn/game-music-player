export const debounce = <T extends (...args: any[]) => unknown>(callback: T, delayMs: number) => {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delayMs);
  };
};

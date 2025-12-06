export const debounce = <T extends (...args: any[]) => unknown>(callback: T, delayMs: number) => {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delayMs);
  };
};

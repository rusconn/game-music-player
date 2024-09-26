export const formatSec = (sec: number) => {
  const rounded = Math.round(sec);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

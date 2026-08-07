export function visibleWindow(args: { currentIndex: number; count: number; windowSize: number }): number[] {
  const { currentIndex, count, windowSize } = args;
  if (count <= windowSize) return Array.from({ length: count }, (_, i) => i);
  const half = Math.floor(windowSize / 2);
  let start = currentIndex - half;
  if (start < 0) start = 0;
  if (start + windowSize > count) start = count - windowSize;
  return Array.from({ length: windowSize }, (_, i) => start + i);
}

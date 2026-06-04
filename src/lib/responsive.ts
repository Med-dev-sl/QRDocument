import { useWindowDimensions } from 'react-native';

const BREAKPOINT_SMALL = 380;
const BREAKPOINT_MEDIUM = 768;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmall = width < BREAKPOINT_SMALL;
  const isMedium = width >= BREAKPOINT_SMALL && width < BREAKPOINT_MEDIUM;
  const isLarge = width >= BREAKPOINT_MEDIUM;

  const padding = isSmall ? 16 : isMedium ? 24 : 32;
  const contentMaxWidth = 480;
  const contentPadding = Math.max(padding, (width - contentMaxWidth) / 2);

  return {
    isSmall,
    isMedium,
    isLarge,
    width,
    height,
    padding,
    contentPadding,
    contentMaxWidth,
  };
}

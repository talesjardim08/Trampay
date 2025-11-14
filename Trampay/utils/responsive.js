import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { breakpoints } from '../styles';

export function useResponsive() {
  const { width } = Dimensions.get('window');
  return useMemo(() => ({
    isMobile: width < breakpoints.tabletMin,
    isTablet: width >= breakpoints.tabletMin && width < breakpoints.desktopMin,
    isDesktop: width >= breakpoints.desktopMin
  }), [width]);
}

export function scaleFont(size) {
  const { width } = Dimensions.get('window');
  if (width >= breakpoints.desktopMin) return size + 2;
  if (width >= breakpoints.tabletMin) return size + 1;
  return size;
}

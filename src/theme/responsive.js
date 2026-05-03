import { useWindowDimensions } from 'react-native';

/**
 * Hook to get responsive dimensions and helpers
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 768;
  const isSmallPhone = Math.min(width, height) < 400;
  const isLargePhone = Math.min(width, height) >= 750; // iPhone Pro Max, etc.
  
  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmallPhone,
    isLargePhone,
  };
}

/**
 * Common spacing scale
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Common colors
 */
export const colors = {
  bg: {
    primary: '#0a0e27',
    secondary: '#1a1a2e',
    tertiary: '#16213e',
    surface: '#0f0f1a',
  },
  accent: {
    purple: '#6C63FF',
    pink: '#FF6584',
    teal: '#43D9AD',
    orange: '#F9A826',
    red: '#FF4757',
    green: '#2ed573',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a8a8b8',
    tertiary: '#666',
  },
  border: '#2a2a4e',
};

/**
 * Typography presets
 */
export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
};

/**
 * Responsive sizing helper
 */
export function responsiveSize(baseSize, { isTablet = false, isLandscape = false }) {
  if (isTablet) {
    if (isLandscape) return baseSize * 1.3;
    return baseSize * 1.2;
  }
  if (isLandscape) return baseSize * 1.1;
  return baseSize;
}

/**
 * Get responsive padding based on screen size
 */
export function getResponsivePadding(isTablet) {
  return isTablet ? spacing.lg : spacing.md;
}

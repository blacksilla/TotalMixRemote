import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, PanResponder, StyleSheet, Platform, useWindowDimensions, Animated, Vibration,
} from 'react-native';
import { colors, spacing, useResponsive } from '../theme/responsive';

export default function Fader({
  label,
  value = 0.75,
  onValueChange,
  onValueCommit,
  onDragStart,
  onDragEnd,
  muted = false,
  color = colors.accent.purple,
  width = 56,
  faderHeight = null, // Dynamic height (calculated from available space)
}) {
  const { height, width: screenWidth } = useWindowDimensions();
  const responsive = useResponsive();
  const isLandscape = screenWidth > height;
  const isLargePhone = responsive.isLargePhone;
  
  const [isActive, setIsActive] = useState(false);
  
  // Use provided faderHeight or calculate based on orientation
  let FADER_HEIGHT;
  if (faderHeight !== null) {
    FADER_HEIGHT = faderHeight;
  } else if (isLandscape) {
    FADER_HEIGHT = 120;
  } else {
    // Portrait mode
    FADER_HEIGHT = isLargePhone ? 320 : 260; // Much larger for Pro Max
  }
  
  const THUMB_HEIGHT = 40;
  const TRACK_HEIGHT = FADER_HEIGHT - THUMB_HEIGHT;

  const lastY = useRef(null);
  const currentValue = useRef(value);
  const lastTapTime = useRef(0);
  const tapCount = useRef(0);

  currentValue.current = value;

  const clamp = (v) => Math.min(1, Math.max(0, v));

  const thumbTop = (1 - value) * TRACK_HEIGHT;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const now = Date.now();
        const isDoubleTap = now - lastTapTime.current < 300 && tapCount.current === 1;
        
        if (isDoubleTap) {
          // Double-tap detected
          tapCount.current = 0;
          handleDoubleTap();
          lastTapTime.current = 0;
          return; // Don't start drag
        }
        
        tapCount.current = 1;
        lastTapTime.current = now;
        
        // Reset after timeout
        setTimeout(() => {
          if (Date.now() - lastTapTime.current > 300) {
            tapCount.current = 0;
          }
        }, 300);

        lastY.current = evt.nativeEvent.pageY;
        setIsActive(true);
        onDragStart?.();
        // Refined haptic feedback - subtle single tap like camera zoom
        try {
          Vibration.vibrate(3);
        } catch (e) {
          // Vibration not available
        }
      },

      onPanResponderMove: (evt) => {
        const dy = evt.nativeEvent.pageY - lastY.current;
        lastY.current = evt.nativeEvent.pageY;
        const delta = -dy / TRACK_HEIGHT;
        const newVal = clamp(currentValue.current + delta);
        currentValue.current = newVal;
        onValueChange?.(newVal);
      },

      onPanResponderRelease: () => {
        setIsActive(false);
        onDragEnd?.();
        onValueCommit?.(currentValue.current);
      },
    })
  ).current;

  // Handle double-tap to 0dB (0.75)
  const handleDoubleTap = useCallback(() => {
    try {
      // Refined double-pulse for reset confirmation - subtle and precise
      Vibration.vibrate([4, 2, 4]);
    } catch (e) {
      // Vibration not available
    }
    onValueChange?.(0.75);
    onValueCommit?.(0.75);
  }, [onValueChange, onValueCommit]);

  const dbLabel = () => {
    const db = value <= 0 ? '-∞' : (20 * Math.log10(value)).toFixed(1);
    return value <= 0 ? '-∞ dB' : `${db} dB`;
  };

  return (
    <View style={[styles.container, { width }]}>
      <Text style={[styles.label, muted && styles.mutedLabel]} numberOfLines={1}>
        {label}
      </Text>

      <Text style={[styles.db, { color: muted ? colors.text.tertiary : color }]}>
        {dbLabel()}
      </Text>

      <View 
        style={[
          styles.trackContainer,
          { height: FADER_HEIGHT },
          isActive && styles.trackContainerActive,
        ]}
        accessibilityRole="slider"
        accessibilityLabel={`${label} fader`}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(value * 100),
          text: `${(value * 100).toFixed(0)}%`,
        }}
        accessibilityHint="Double-tap to set to 0dB"
        {...panResponder.panHandlers}
      >
        <View style={[
          styles.track,
          { height: TRACK_HEIGHT },
          isActive && [styles.trackActive, { backgroundColor: color + '40' }],
        ]}>
          <View
            style={[
              styles.fill,
              {
                height: TRACK_HEIGHT * value,
                backgroundColor: muted ? colors.text.tertiary : color,
              },
              isActive && styles.fillActive,
            ]}
          />
          <View style={styles.zeroLine} />
        </View>

        <View
          style={[
            styles.thumb,
            {
              top: thumbTop,
              borderColor: muted ? colors.text.tertiary : color,
              backgroundColor: colors.bg.secondary,
            },
            isActive && [styles.thumbActive, { borderColor: color, shadowOpacity: 0.8 }],
          ]}
        >
          <View style={[styles.thumbLine, { backgroundColor: muted ? colors.text.tertiary : color }]} />
          <View style={[styles.thumbLine, { backgroundColor: muted ? colors.text.tertiary : color }]} />
          <View style={[styles.thumbLine, { backgroundColor: muted ? colors.text.tertiary : color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
    width: '100%',
  },
  mutedLabel: {
    color: colors.text.tertiary,
  },
  db: {
    fontSize: 9,
    marginBottom: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  trackContainer: {
    width: 28,
    alignItems: 'center',
    position: 'relative',
  },
  trackContainerActive: {
    backgroundColor: colors.bg.tertiary + '30',
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
  },
  track: {
    position: 'absolute',
    top: 18,
    bottom: 18,
    width: 6,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  trackActive: {
    width: 8,
    borderRadius: 4,
  },
  fill: {
    width: '100%',
    borderRadius: 3,
  },
  fillActive: {
    opacity: 0.9,
  },
  zeroLine: {
    position: 'absolute',
    width: '200%',
    left: '-50%',
    height: 1,
    backgroundColor: colors.text.tertiary,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: 28,
    height: 36,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  thumbActive: {
    width: 32,
    height: 40,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  thumbLine: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    opacity: 0.8,
  },
});

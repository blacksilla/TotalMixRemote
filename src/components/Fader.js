import React, { useRef, useCallback } from 'react';
import {
  View, Text, PanResponder, StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { colors, spacing, useResponsive } from '../theme/responsive';

export default function Fader({
  label,
  value = 0.75,
  onValueChange,
  onValueCommit,
  muted = false,
  color = colors.accent.purple,
  width = 56,
}) {
  const { height, width: screenWidth } = useWindowDimensions();
  const responsive = useResponsive();
  const isLandscape = screenWidth > height;
  const isLargePhone = responsive.isLargePhone;
  
  // Significantly larger faders for portrait mode, especially on larger phones
  let FADER_HEIGHT;
  if (isLandscape) {
    FADER_HEIGHT = 120;
  } else {
    // Portrait mode
    FADER_HEIGHT = isLargePhone ? 320 : 260; // Much larger for Pro Max
  }
  
  const THUMB_HEIGHT = 40;
  const TRACK_HEIGHT = FADER_HEIGHT - THUMB_HEIGHT;

  const lastY = useRef(null);
  const currentValue = useRef(value);

  currentValue.current = value;

  const clamp = (v) => Math.min(1, Math.max(0, v));

  const thumbTop = (1 - value) * TRACK_HEIGHT;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        lastY.current = evt.nativeEvent.pageY;
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
        onValueCommit?.(currentValue.current);
      },
    })
  ).current;

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

      <View style={[styles.trackContainer, { height: FADER_HEIGHT }]} {...panResponder.panHandlers}>
        <View style={[styles.track, { height: TRACK_HEIGHT }]}>
          <View
            style={[
              styles.fill,
              {
                height: TRACK_HEIGHT * value,
                backgroundColor: muted ? colors.text.tertiary : color,
              },
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
  fill: {
    width: '100%',
    borderRadius: 3,
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
  thumbLine: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    opacity: 0.8,
  },
});

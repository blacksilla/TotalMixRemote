import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Vibration } from 'react-native';
import Fader from './Fader';
import { colors, spacing, useResponsive } from '../theme/responsive';

export default function ChannelStrip({ 
  channel, 
  value, 
  muted = false, 
  onFaderChange, 
  onMuteToggle,
  onFaderDragStart,
  onFaderDragEnd,
  faderHeight,
}) {
  const { height, width } = useWindowDimensions();
  const responsive = useResponsive();
  const isLandscape = width > height;

  // Responsive fader width: tablets get significantly larger faders
  let faderWidth = 60; // Base: small phones
  if (responsive.isTabletPortrait) {
    faderWidth = 95; // Tablets in portrait: much larger
  } else if (responsive.isTablet) {
    faderWidth = 90; // Tablets in landscape: still large
  } else if (responsive.isLargePhone && !isLandscape) {
    faderWidth = 80; // Large phones in portrait: increased from 72
  }

  const handleMute = () => {
    try {
      // Refined haptic for mute toggle - subtle and responsive
      Vibration.vibrate(3);
    } catch (e) {
      // Vibration not available
    }
    onMuteToggle?.(channel);
  };

  return (
    <View style={styles.strip}>
      <Fader
        label={channel.name}
        value={value ?? 0.75}
        color={channel.color}
        muted={muted}
        onValueChange={(v) => onFaderChange?.(channel, v)}
        width={faderWidth}
        faderHeight={faderHeight}
        onDragStart={onFaderDragStart}
        onDragEnd={onFaderDragEnd}
      />

      <TouchableOpacity
        style={[
          styles.muteBtn,
          muted && {
            backgroundColor: colors.accent.red,
            borderColor: colors.accent.red,
          },
        ]}
        onPress={handleMute}
        activeOpacity={0.7}
      >
        <Text style={[styles.muteText, muted && { color: colors.text.primary }]}>
          {muted ? 'MUTED' : 'M'}
        </Text>
      </TouchableOpacity>

      <View
        style={[
          styles.badge,
          {
            backgroundColor:
              channel.type === 'input' ? colors.bg.tertiary : colors.bg.tertiary,
          },
        ]}
      >
        <Text style={styles.badgeText}>{channel.type === 'input' ? 'IN' : 'PB'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  muteBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.secondary,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteText: {
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.text.tertiary,
    fontSize: 8,
    fontWeight: '600',
  },
});

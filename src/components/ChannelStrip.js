import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Fader from './Fader';
import { colors, spacing, useResponsive } from '../theme/responsive';

export default function ChannelStrip({ channel, value, muted = false, onFaderChange, onMuteToggle }) {
  const { height, width } = useWindowDimensions();
  const responsive = useResponsive();
  const isLandscape = width > height;

  // Larger fader width for larger phones in portrait
  const faderWidth = responsive.isLargePhone && !isLandscape ? 72 : 60;

  const handleMute = () => {
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.secondary,
    minWidth: 40,
    alignItems: 'center',
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

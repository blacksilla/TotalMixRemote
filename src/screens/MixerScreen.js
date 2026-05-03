import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, StatusBar, useWindowDimensions, SafeAreaView,
} from 'react-native';
import { useOsc } from '../osc/OscContext';
import { loadChannels, loadBuses } from '../storage/settings';
import { DEFAULT_CHANNELS, DEFAULT_BUSES } from '../osc/TotalMixOSC';
import ChannelStrip from '../components/ChannelStrip';
import Fader from '../components/Fader';
import { useResponsive, colors, spacing } from '../theme/responsive';

export default function MixerScreen({ onDisconnect, onOpenSettings }) {
  const responsive = useResponsive();
  const { selectBus, setFader, toggleMute, setMasterFader, toggleDim, loadSnapshot, feedback, disconnect } = useOsc();

  const [buses, setBuses] = useState(DEFAULT_BUSES);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [activeBus, setActiveBus] = useState(null);
  const [faderValues, setFaderValues] = useState({});
  const [muteStates, setMuteStates] = useState({});
  const [masterValue, setMasterValue] = useState(0.75);
  const [dimActive, setDimActive] = useState(false);

  // Load config from persisted settings and defaults
  useEffect(() => {
    const initConfig = async () => {
      // Load from AsyncStorage overrides, fallback to defaults
      const savedChannels = await loadChannels(DEFAULT_CHANNELS);
      const savedBuses = await loadBuses(DEFAULT_BUSES);

      setChannels(savedChannels);
      setBuses(savedBuses);

      // Auto-select the first bus
      if (savedBuses.length > 0) handleSelectBus(savedBuses[0]);
    };

    initConfig();
  }, []);

  // Sync feedback from TotalMix
  useEffect(() => {
    Object.entries(feedback).forEach(([address, value]) => {
      // Parse volume feedback e.g. /1/volume3 → ch 3 input
      const volumeMatch = address.match(/^\/([123])\/volume(\d+)$/);
      if (volumeMatch) {
        const [, row, chStr] = volumeMatch;
        const ch = parseInt(chStr);
        const type = row === '2' ? 'playback' : 'input';
        const key = `${type}_${ch}`;
        setFaderValues((prev) => ({ ...prev, [key]: value }));
      }

      // Parse mute feedback e.g. /1/mute3 → ch 3 input muted
      const muteMatch = address.match(/^\/([12])\/mute(\d+)$/);
      if (muteMatch) {
        const [, row, chStr] = muteMatch;
        const ch = parseInt(chStr);
        const type = row === '2' ? 'playback' : 'input';
        const key = `${type}_${ch}`;
        // TotalMix sends 1.0 when muted
        setMuteStates((prev) => ({ ...prev, [key]: value === 1.0 }));
      }
    });
  }, [feedback]);

  const handleSelectBus = useCallback((bus) => {
    setActiveBus(bus);
    selectBus(bus.id);
  }, [selectBus]);

  const handleFaderChange = useCallback((channel, value) => {
    const key = `${channel.type}_${channel.ch}`;
    setFaderValues((prev) => ({ ...prev, [key]: value }));
    setFader(channel, value);
  }, [setFader]);

  const handleMasterChange = useCallback((value) => {
    setMasterValue(value);
    setMasterFader(1, value);
  }, [setMasterFader]);

  const handleDim = () => {
    setDimActive((v) => !v);
    toggleDim();
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  const getFaderValue = (channel) => {
    const key = `${channel.type}_${channel.ch}`;
    return faderValues[key] ?? 0.75;
  };

  const getMuteState = (channel) => {
    const key = `${channel.type}_${channel.ch}`;
    return muteStates[key] ?? false;
  };

  return (
    <SafeAreaView style={[styles(responsive).root, { backgroundColor: colors.bg.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />

      {/* Main container with flex layout */}
      <View style={styles(responsive).container}>
        {/* Header - compact in landscape */}
        <View style={[styles(responsive).header, { borderBottomColor: colors.border }]}>
          <View style={styles(responsive).headerTitle}>
            <Text style={[styles(responsive).headerTitleText, { color: colors.text.primary }]}>TotalMix Remote</Text>
            <Text style={[styles(responsive).headerSub, { color: colors.accent.purple }]}>
              {activeBus ? `Editing: ${activeBus.name}` : 'Select a mix bus'}
            </Text>
          </View>
          <View style={styles(responsive).headerActions}>
            <TouchableOpacity 
              style={[styles(responsive).iconBtn, { backgroundColor: colors.bg.secondary }]} 
              onPress={onOpenSettings}
              activeOpacity={0.7}
            >
              <Text style={[styles(responsive).iconBtnText, { color: colors.text.secondary }]}>⚙</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles(responsive).iconBtn, { backgroundColor: colors.bg.secondary }]} 
              onPress={handleDisconnect}
              activeOpacity={0.7}
            >
              <Text style={[styles(responsive).iconBtnText, { color: colors.text.secondary }]}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bus selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles(responsive).busBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles(responsive).busBarContent}
        >
          {buses.map((bus) => (
            <TouchableOpacity
              key={bus.id}
              style={[
                styles(responsive).busChip,
                { borderColor: colors.border, backgroundColor: colors.bg.secondary },
                activeBus?.id === bus.id && { backgroundColor: bus.color + '33', borderColor: bus.color },
              ]}
              onPress={() => handleSelectBus(bus)}
              activeOpacity={0.7}
            >
              <View style={[styles(responsive).busDot, { backgroundColor: bus.color }]} />
              <Text style={[styles(responsive).busChipText, { color: colors.text.secondary }, activeBus?.id === bus.id && { color: colors.text.primary }]}>
                {bus.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main mixer area with channels and snapshots */}
        <View style={styles(responsive).mixerContainer}>
          {/* Channel strips area */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles(responsive).mixerArea}
            contentContainerStyle={styles(responsive).stripsContainer}
          >
            {channels.map((ch) => (
              <ChannelStrip
                key={ch.id}
                channel={ch}
                value={getFaderValue(ch)}
                muted={getMuteState(ch)}
                onFaderChange={handleFaderChange}
                onMuteToggle={toggleMute}
              />
            ))}

            {/* Divider */}
            <View style={[styles(responsive).divider, { backgroundColor: colors.border }]} />

            {/* Master fader */}
            <View style={styles(responsive).masterStrip}>
              <Fader
                label="MASTER"
                value={masterValue}
                color={colors.accent.teal}
                onValueChange={handleMasterChange}
                width={responsive.isLargePhone && !responsive.isLandscape ? 72 : 60}
              />
              <TouchableOpacity
                style={[
                  styles(responsive).dimBtn,
                  { borderColor: colors.border, backgroundColor: colors.bg.secondary },
                  dimActive && { backgroundColor: colors.accent.orange, borderColor: colors.accent.orange },
                ]}
                onPress={handleDim}
              >
                <Text style={[styles(responsive).dimText, { color: colors.text.secondary }, dimActive && { color: colors.text.primary }]}>
                  DIM
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Snapshot bar - fixed at bottom in portrait, fixed at bottom in landscape with better accessibility */}
          <View style={[styles(responsive).snapshotBar, { borderTopColor: colors.border, backgroundColor: colors.bg.secondary }]}>
            <Text style={[styles(responsive).snapshotLabel, { color: colors.text.tertiary }]}>
              Snapshots
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles(responsive).snapshotScrollContent}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles(responsive).snapshotBtn,
                    { backgroundColor: colors.bg.primary, borderColor: colors.border },
                  ]}
                  onPress={() => loadSnapshot(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles(responsive).snapshotText, { color: colors.text.secondary }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = (responsive) => {
  const isTablet = responsive.isTablet;
  const isLandscape = responsive.isLandscape;
  const isLargePhone = responsive.isLargePhone;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.primary,
    },

    container: {
      flex: 1,
      flexDirection: 'column',
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      minHeight: isLandscape ? 50 : 70,
    },
    headerTitle: {
      flex: 1,
    },
    headerTitleText: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    headerSub: {
      fontSize: isTablet ? 13 : 11,
      marginTop: spacing.xs,
      fontWeight: '500',
    },
    headerActions: { 
      flexDirection: 'row', 
      gap: spacing.md,
      marginLeft: spacing.md,
    },
    iconBtn: {
      width: isTablet ? 48 : 42,
      height: isTablet ? 48 : 42,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconBtnText: { fontSize: isTablet ? 20 : 18 },

    // Bus selector
    busBar: { 
      maxHeight: isTablet ? 70 : 64, 
      borderBottomWidth: 1 
    },
    busBarContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
      flexDirection: 'row',
    },
    busChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
    },
    busDot: {
      width: isTablet ? 10 : 8,
      height: isTablet ? 10 : 8,
      borderRadius: isTablet ? 5 : 4,
    },
    busChipText: { fontSize: isTablet ? 13 : 12, fontWeight: '600' },

    // Mixer container
    mixerContainer: {
      flex: 1,
      flexDirection: 'column',
    },

    // Mixer area with channels
    mixerArea: { 
      flex: 1,
    },
    stripsContainer: {
      paddingHorizontal: isLargePhone ? spacing.md : spacing.lg,
      paddingVertical: isLandscape ? spacing.md : spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: isLargePhone && !isLandscape ? spacing.sm : spacing.md,
    },
    divider: {
      width: 1,
      height: isLandscape ? 140 : (isLargePhone ? 360 : 280),
      marginHorizontal: isLargePhone ? spacing.sm : spacing.lg,
      alignSelf: 'center',
    },
    masterStrip: { 
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    dimBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      minWidth: isLargePhone ? 70 : 60,
      alignItems: 'center',
    },
    dimText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

    // Snapshot bar - more accessible with larger buttons
    snapshotBar: {
      borderTopWidth: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: isLandscape ? 60 : 70,
    },
    snapshotLabel: { 
      fontSize: 12, 
      fontWeight: '600', 
      letterSpacing: 0.3,
      minWidth: 75,
    },
    snapshotScrollContent: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    snapshotBtn: {
      width: isTablet || (isLargePhone && !isLandscape) ? 50 : 44,
      height: isTablet || (isLargePhone && !isLandscape) ? 50 : 44,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    snapshotText: { fontSize: isTablet || isLargePhone ? 14 : 12, fontWeight: '700' },
  });
};

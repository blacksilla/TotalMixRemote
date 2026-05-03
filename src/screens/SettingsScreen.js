import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert, StatusBar, useWindowDimensions,
} from 'react-native';
import { loadChannels, saveChannels, loadBuses, saveBuses } from '../storage/settings';
import { DEFAULT_CHANNELS, DEFAULT_BUSES } from '../osc/TotalMixOSC';
import { useResponsive, colors, spacing } from '../theme/responsive';

const COLORS = ['#6C63FF', '#FF6584', '#43D9AD', '#F9A826', '#FF4757', '#2ed573', '#ffa502', '#eccc68'];

export default function SettingsScreen({ onBack }) {
  const responsive = useResponsive();
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [buses, setBuses] = useState(DEFAULT_BUSES);
  const [tab, setTab] = useState('channels');

  useEffect(() => {
    loadChannels(DEFAULT_CHANNELS).then(setChannels);
    loadBuses(DEFAULT_BUSES).then(setBuses);
  }, []);

  const updateChannel = (id, field, value) => {
    setChannels((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateBus = (id, field, value) => {
    setBuses((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSave = async () => {
    await saveChannels(channels);
    await saveBuses(buses);
    Alert.alert('Saved', 'Settings saved successfully.');
    onBack?.();
  };

  const handleReset = () => {
    Alert.alert('Reset', 'Reset to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setChannels(DEFAULT_CHANNELS);
          setBuses(DEFAULT_BUSES);
        },
      },
    ]);
  };

  return (
    <View style={[styles(responsive).root, { backgroundColor: colors.bg.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />

      {/* Header */}
      <View style={[styles(responsive).header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles(responsive).backBtn}>
          <Text style={[styles(responsive).backText, { color: colors.accent.purple }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles(responsive).headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={[styles(responsive).resetText, { color: colors.accent.red }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles(responsive).tabs, { borderBottomColor: colors.border }]}>
        {['channels', 'buses'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles(responsive).tab,
              tab === t && [
                styles(responsive).tabActive,
                { borderBottomColor: colors.accent.purple },
              ],
            ]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles(responsive).tabText,
                { color: colors.text.secondary },
                tab === t && { color: colors.text.primary },
              ]}
            >
              {t === 'channels' ? 'Channels' : 'Mix Buses'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles(responsive).list} showsVerticalScrollIndicator={false}>
        {tab === 'channels' &&
          channels.map((ch) => (
            <View
              key={ch.id}
              style={[
                styles(responsive).row,
                { backgroundColor: colors.bg.secondary, borderColor: colors.border },
              ]}
            >
              <View style={[styles(responsive).colorDot, { backgroundColor: ch.color }]} />
              <View style={styles(responsive).rowMain}>
                <TextInput
                  style={[
                    styles(responsive).nameInput,
                    { color: colors.text.primary, borderBottomColor: colors.border },
                  ]}
                  value={ch.name}
                  onChangeText={(v) => updateChannel(ch.id, 'name', v)}
                  placeholderTextColor={colors.text.tertiary}
                />
                <Text style={[styles(responsive).rowMeta, { color: colors.text.secondary }]}>
                  {ch.type === 'input' ? 'Input' : 'Playback'} ch {ch.ch}
                </Text>
              </View>
              <View style={styles(responsive).colorRow}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles(responsive).colorBtn,
                      { backgroundColor: c },
                      ch.color === c && styles(responsive).colorBtnActive,
                    ]}
                    onPress={() => updateChannel(ch.id, 'color', c)}
                  />
                ))}
              </View>
            </View>
          ))}

        {tab === 'buses' &&
          buses.map((bus) => (
            <View
              key={bus.id}
              style={[
                styles(responsive).row,
                { backgroundColor: colors.bg.secondary, borderColor: colors.border },
              ]}
            >
              <View style={[styles(responsive).colorDot, { backgroundColor: bus.color }]} />
              <View style={styles(responsive).rowMain}>
                <TextInput
                  style={[
                    styles(responsive).nameInput,
                    { color: colors.text.primary, borderBottomColor: colors.border },
                  ]}
                  value={bus.name}
                  onChangeText={(v) => updateBus(bus.id, 'name', v)}
                  placeholderTextColor={colors.text.tertiary}
                />
                <Text style={[styles(responsive).rowMeta, { color: colors.text.secondary }]}>
                  OSC Bus index: {bus.id}
                </Text>
              </View>
              <View style={styles(responsive).colorRow}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles(responsive).colorBtn,
                      { backgroundColor: c },
                      bus.color === c && styles(responsive).colorBtnActive,
                    ]}
                    onPress={() => updateBus(bus.id, 'color', c)}
                  />
                ))}
              </View>
            </View>
          ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Save button */}
      <View style={[styles(responsive).footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles(responsive).saveBtn, { backgroundColor: colors.accent.purple }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[styles(responsive).saveBtnText, { color: colors.text.primary }]}>
            Save & Close
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (responsive) => {
  const isTablet = responsive.isTablet;
  const isLandscape = responsive.isLandscape;

  return StyleSheet.create({
    root: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 50 : 24,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
    },
    backBtn: { padding: spacing.sm },
    backText: { fontSize: isTablet ? 15 : 14, fontWeight: '500' },
    headerTitle: {
      fontSize: isTablet ? 19 : 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    resetText: { fontSize: isTablet ? 14 : 13, fontWeight: '600' },

    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: isTablet ? 15 : 14,
      fontWeight: '500',
    },
    tabTextActive: {
      fontWeight: '700',
    },

    list: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },

    row: {
      borderRadius: 14,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    colorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    rowMain: {
      flex: 1,
    },
    nameInput: {
      fontSize: isTablet ? 15 : 14,
      fontWeight: '600',
      borderBottomWidth: 1,
      paddingBottom: spacing.sm,
      marginBottom: spacing.sm,
    },
    rowMeta: {
      fontSize: 11,
      fontWeight: '400',
    },

    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
      width: '100%',
    },
    colorBtn: {
      width: isTablet ? 26 : 22,
      height: isTablet ? 26 : 22,
      borderRadius: isTablet ? 13 : 11,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorBtnActive: {
      borderColor: colors.text.primary,
    },

    footer: {
      padding: spacing.lg,
      borderTopWidth: 1,
      paddingBottom: Platform.OS === 'ios' ? 32 : spacing.lg,
    },
    saveBtn: {
      borderRadius: 14,
      padding: isTablet ? 18 : 16,
      alignItems: 'center',
      shadowColor: colors.accent.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    saveBtnText: {
      fontSize: isTablet ? 17 : 15,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });
};

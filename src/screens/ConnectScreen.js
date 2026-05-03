import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch, StatusBar,
  Alert,
} from 'react-native';
import { useOsc } from '../osc/OscContext';
import { useDevMode } from '../context/DevModeContext';
import { loadSettings, saveSettings } from '../storage/settings';
import { useResponsive, spacing, colors, typography } from '../theme/responsive';

export default function ConnectScreen({ onConnected }) {
  const { connect, connected, error } = useOsc();
  const { devMode, toggleDevMode } = useDevMode();
  const responsive = useResponsive();
  
  const [host, setHost] = useState('192.168.1.100');
  const [sendPort, setSendPort] = useState('7001');
  const [receivePort, setReceivePort] = useState('9001');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setHost(s.host);
      setSendPort(String(s.sendPort));
      setReceivePort(String(s.receivePort));
    });
  }, []);

  useEffect(() => {
    if (connected) {
      Alert.alert('Connected!', `Successfully connected to ${host}`, [{ text: 'OK', style: 'default' }]);
      onConnected?.();
    }
  }, [connected, host, onConnected]);

  const handleConnect = async () => {
    if (!host || !sendPort || !receivePort) {
      Alert.alert('Missing Info', 'Please enter IP and ports', [{ text: 'OK', style: 'default' }]);
      return;
    }

    setLoading(true);
    try {
      await saveSettings({ host, sendPort: parseInt(sendPort), receivePort: parseInt(receivePort) });
      // Connect with 8 second timeout built into OscClient
      await connect(host, parseInt(sendPort), parseInt(receivePort), 8000);
    } catch (err) {
      const errorMsg = err?.message || 'Connection failed';
      Alert.alert('Connection Error', errorMsg, [{ text: 'OK', style: 'default' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDevModeToggle = (value) => {
    toggleDevMode(value);
  };

  const isPortrait = !responsive.isLandscape;
  const contentPaddingVertical = responsive.isTablet ? spacing.xl : spacing.lg;

  return (
    <KeyboardAvoidingView
      style={styles(responsive).root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />
      
      <ScrollView
        contentContainerStyle={styles(responsive).inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles(responsive).logoArea}>
          <View style={styles(responsive).logoIcon}>
            <Text style={styles(responsive).logoEmoji}>🎚</Text>
          </View>
          <Text style={[styles(responsive).title, { color: colors.text.primary }]}>
            TotalMix Remote
          </Text>
          <Text style={[styles(responsive).subtitle, { color: colors.accent.purple }]}>
            Monitor Mix Controller
          </Text>
        </View>

        {/* Main card */}
        <View style={styles(responsive).card}>
          <Text style={[styles(responsive).cardTitle, { color: colors.text.primary }]}>
            Connect to TotalMix FX
          </Text>

          {/* Form fields */}
          <Text style={[styles(responsive).fieldLabel, { color: colors.text.secondary }]}>
            Computer IP Address
          </Text>
          <TextInput
            style={[styles(responsive).input, { color: colors.text.primary, borderColor: colors.border }]}
            value={host}
            onChangeText={setHost}
            placeholder="192.168.1.100"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
            autoCapitalize="none"
          />
          <Text style={[styles(responsive).hint, { color: colors.text.tertiary }]}>
            Find this in TotalMix → Options → Settings → OSC tab
          </Text>

          <View style={styles(responsive).row}>
            <View style={styles(responsive).halfField}>
              <Text style={[styles(responsive).fieldLabel, { color: colors.text.secondary }]}>
                Send Port
              </Text>
              <TextInput
                style={[styles(responsive).input, { color: colors.text.primary, borderColor: colors.border }]}
                value={sendPort}
                onChangeText={setSendPort}
                keyboardType="number-pad"
                placeholder="7001"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
            <View style={styles(responsive).halfField}>
              <Text style={[styles(responsive).fieldLabel, { color: colors.text.secondary }]}>
                Receive Port
              </Text>
              <TextInput
                style={[styles(responsive).input, { color: colors.text.primary, borderColor: colors.border }]}
                value={receivePort}
                onChangeText={setReceivePort}
                keyboardType="number-pad"
                placeholder="9001"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          {error && (
            <View style={styles(responsive).errorBox}>
              <Text style={styles(responsive).errorText}>⚠ {error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles(responsive).connectBtn, loading && { opacity: 0.6 }]}
            onPress={handleConnect}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={colors.text.primary} />
              : <Text style={[styles(responsive).connectBtnText, { color: colors.text.primary }]}>
                  Connect
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Developer Mode Toggle */}
        <View style={styles(responsive).devModeCard}>
          <View style={styles(responsive).devModeHeader}>
            <Text style={[styles(responsive).devModeTitle, { color: colors.text.primary }]}>
              Developer Mode
            </Text>
            <Switch
              value={devMode}
              onValueChange={handleDevModeToggle}
              thumbColor={devMode ? colors.accent.purple : colors.text.tertiary}
              trackColor={{ false: colors.bg.secondary, true: colors.accent.purple + '33' }}
            />
          </View>
          <Text style={[styles(responsive).devModeDesc, { color: colors.text.secondary }]}>
            {devMode
              ? '✓ Dev mode enabled - Use a button to cycle through screens'
              : 'Enable to test screen transitions quickly'}
          </Text>
        </View>

        {/* Setup reminder */}
        <View style={styles(responsive).setupCard}>
          <Text style={[styles(responsive).setupTitle, { color: colors.accent.purple }]}>
            TotalMix Setup Checklist
          </Text>
          {[
            'Options → Settings → OSC tab',
            'Enable "Enable OSC control"',
            'Remote Controller 1 → check "In Use"',
            'Set your phone/tablet IP in "Remote Controller Address"',
            'Default ports: Send 7001 / Receive 9001',
          ].map((step, i) => (
            <View key={i} style={styles(responsive).setupRow}>
              <Text style={[styles(responsive).setupNumber, { color: colors.accent.purple }]}>
                {i + 1}
              </Text>
              <Text style={[styles(responsive).setupText, { color: colors.text.secondary }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (responsive) => {
  const isTablet = responsive.isTablet;
  const isLandscape = responsive.isLandscape;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      paddingTop: Platform.OS === 'ios' ? 50 : 24,
    },
    inner: {
      padding: isTablet ? spacing.xl : spacing.lg,
      paddingTop: isTablet ? 40 : 32,
      paddingBottom: spacing.xl,
    },
    logoArea: {
      alignItems: 'center',
      marginBottom: isTablet ? spacing.xxl : spacing.xl,
    },
    logoIcon: {
      width: isTablet ? 96 : 72,
      height: isTablet ? 96 : 72,
      borderRadius: 24,
      backgroundColor: colors.bg.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: colors.accent.purple + '44',
    },
    logoEmoji: {
      fontSize: isTablet ? 48 : 36,
    },
    title: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: isTablet ? 16 : 13,
      marginTop: spacing.xs,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: colors.bg.secondary,
      borderRadius: 20,
      padding: isTablet ? spacing.xl : spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    cardTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: 12,
      marginBottom: spacing.sm,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.bg.primary,
      borderWidth: 1,
      borderRadius: 12,
      padding: isTablet ? 14 : 12,
      fontSize: isTablet ? 16 : 15,
      marginBottom: spacing.md,
    },
    hint: {
      fontSize: 11,
      marginBottom: spacing.lg,
      fontWeight: '400',
      lineHeight: 16,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    halfField: {
      flex: 1,
    },
    errorBox: {
      backgroundColor: colors.accent.red + '11',
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.accent.red + '44',
    },
    errorText: {
      color: colors.accent.red,
      fontSize: 13,
      fontWeight: '500',
    },
    connectBtn: {
      backgroundColor: colors.accent.purple,
      borderRadius: 14,
      padding: isTablet ? 18 : 16,
      alignItems: 'center',
      marginTop: spacing.md,
      shadowColor: colors.accent.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    connectBtnText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    devModeCard: {
      backgroundColor: colors.bg.secondary,
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    devModeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    devModeTitle: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    devModeDesc: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 18,
    },
    setupCard: {
      backgroundColor: colors.bg.secondary,
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    setupTitle: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: spacing.md,
      letterSpacing: 0.3,
    },
    setupRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    setupNumber: {
      fontWeight: '700',
      fontSize: 12,
      marginRight: spacing.md,
      width: 18,
    },
    setupText: {
      fontSize: 12,
      flex: 1,
      lineHeight: 18,
      fontWeight: '400',
    },
  });
};

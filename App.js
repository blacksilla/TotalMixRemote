import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { OscProvider } from './src/osc/OscContext';
import { DevModeProvider, useDevMode } from './src/context/DevModeContext';
import ConnectScreen from './src/screens/ConnectScreen';
import MixerScreen from './src/screens/MixerScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Screens: 'connect' | 'mixer' | 'settings'
const SCREENS = ['connect', 'mixer', 'settings'];

function AppContent() {
  const [screen, setScreen] = useState('connect');
  const { devMode } = useDevMode();

  const cycleScreen = () => {
    const currentIndex = SCREENS.indexOf(screen);
    const nextIndex = (currentIndex + 1) % SCREENS.length;
    setScreen(SCREENS[nextIndex]);
  };

  return (
    <View style={{ flex: 1 }}>
      {screen === 'connect' && (
        <ConnectScreen onConnected={() => devMode ? undefined : setScreen('mixer')} />
      )}
      {screen === 'mixer' && (
        <MixerScreen
          onDisconnect={() => devMode ? undefined : setScreen('connect')}
          onOpenSettings={() => devMode ? undefined : setScreen('settings')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => devMode ? undefined : setScreen('mixer')} />
      )}

      {/* Developer Mode Button */}
      {devMode && (
        <TouchableOpacity
          style={styles.devButton}
          onPress={cycleScreen}
          activeOpacity={0.7}
        >
          <Text style={styles.devButtonText}>
            ⏭ {screen.toUpperCase()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function App() {
  return (
    <OscProvider>
      <DevModeProvider>
        <AppContent />
      </DevModeProvider>
    </OscProvider>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

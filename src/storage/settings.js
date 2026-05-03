import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@totalmix_settings';
const CHANNELS_KEY = '@totalmix_channels';
const BUSES_KEY = '@totalmix_buses';
const DEV_MODE_KEY = '@totalmix_devmode';

export const DEFAULT_SETTINGS = {
  host: '192.168.1.100',
  sendPort: 7001,
  receivePort: 9001,
};

export const DEFAULT_DEV_MODE = {
  enabled: false,
  screenIndex: 0, // 0: connect, 1: mixer, 2: settings
};

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadChannels(defaults) {
  try {
    const raw = await AsyncStorage.getItem(CHANNELS_KEY);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

export async function saveChannels(channels) {
  await AsyncStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
}

export async function loadBuses(defaults) {
  try {
    const raw = await AsyncStorage.getItem(BUSES_KEY);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

export async function saveBuses(buses) {
  await AsyncStorage.setItem(BUSES_KEY, JSON.stringify(buses));
}

export async function loadDevMode() {
  try {
    const raw = await AsyncStorage.getItem(DEV_MODE_KEY);
    return raw ? { ...DEFAULT_DEV_MODE, ...JSON.parse(raw) } : DEFAULT_DEV_MODE;
  } catch {
    return DEFAULT_DEV_MODE;
  }
}

export async function saveDevMode(devMode) {
  await AsyncStorage.setItem(DEV_MODE_KEY, JSON.stringify(devMode));
}

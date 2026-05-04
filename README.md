# TotalMix Remote Monitor 🎚

A React Native remote control app for RME TotalMix FX, focused on **monitor/headphone mix control**.
Works on both **iPhone** and **Android tablets** from the same codebase.

---

## Features

- **Bus selector** — switch between Phones 1, Phones 2, Main Out, Monitor B
- **Channel strips** — per-channel faders and mute buttons for inputs and playback
- **Master fader** with DIM toggle
- **Snapshot recall** (1–8)
- **Live feedback** — fader positions sync back from TotalMix via OSC
- **Persistent settings** — channel/bus names, colors, and IP saved on device
- **Fully customizable** — rename channels and buses to match your rig

---

## Prerequisites

1. **Node.js** 18+ and npm
2. **Expo CLI**: `npm install -g expo-cli`
3. **React Native UDP**: `npx expo install react-native-udp`
4. A **custom Expo Dev Client** (Expo Go does NOT support UDP sockets)

---

## Installation

```bash
git clone <your-repo>
cd TotalMixRemote
npm install
npx expo install react-native-udp
```

### Build a Dev Client

**iOS** (requires macOS + Xcode):
```bash
npx expo run:ios
```

**Android**:
```bash
npx expo run:android
```

Or use EAS Build for cloud builds:
```bash
npm install -g eas-cli
eas build --profile development --platform android   # or ios
```

---

## TotalMix FX Setup

In TotalMix on your computer:

1. **Options → Settings → OSC tab**
2. Check **"Enable OSC control"**
3. Remote Controller 1:
   - Check **"In Use"**
   - Set **"Remote Controller Address"** to your phone/tablet's IP
   - Send port: `7001`
   - Receive port: `9001`
4. Set **"Number of faders per bank"** to match your interface's channel count

---

## Project Structure

```
TotalMixRemote/
├── App.js                          # Root — screen navigation
├── src/
│   ├── osc/
│   │   ├── OscClient.js            # OSC encoder/decoder + UDP socket
│   │   ├── TotalMixOSC.js          # OSC command map + default config
│   │   └── OscContext.js           # React context, all TotalMix actions
│   ├── components/
│   │   ├── Fader.js                # Vertical drag fader
│   │   └── ChannelStrip.js         # Fader + mute button
│   ├── screens/
│   │   ├── ConnectScreen.js        # IP/port entry + setup checklist
│   │   ├── MixerScreen.js          # Main mixer UI
│   │   └── SettingsScreen.js       # Rename channels & buses
│   └── storage/
│       └── settings.js             # AsyncStorage persistence
```

---

## Configuration

### Automatic Setup (Recommended)

When you connect to TotalMix, the app attempts to load a `config.json` file from the project root. This JSON contains your channel and bus layout.

#### Step 1: Create your config.json

Copy and edit the provided `config.example.json` in the project root:

```bash
cp config.example.json config.json
```

Edit `config.json` to match your interface setup:

```json
{
  "version": "1.0",
  "channels": {
    "inputs": [
      { "id": 1, "name": "Kick",   "ch": 1, "color": "#6C63FF" },
      { "id": 2, "name": "Snare",  "ch": 2, "color": "#FF6584" },
      { "id": 3, "name": "Bass DI", "ch": 3, "color": "#43D9AD" }
    ],
    "playback": [
      { "id": 4, "name": "Click", "ch": 1, "color": "#FB923C" }
    ]
  },
  "buses": [
    { "id": 1, "name": "Drummer IEM", "color": "#6C63FF" },
    { "id": 2, "name": "FOH", "color": "#43D9AD" }
  ]
}
```

Fields:
- **inputs** / **playback**: Channels in your interface
  - `ch`: Physical channel number on your interface
  - `name`: Display name in the app
  - `color`: Hex color for the channel strip
- **buses**: Output/submix buses to control

#### Step 2: Rebuild your dev client

After editing `config.json`, you must rebuild your dev client for the JSON to be bundled:

```bash
npx expo run:android   # or npx expo run:ios
```

#### Live Customization (Optional)

You can also rename channels and buses from within the app via the **Settings screen** (⚙ icon). These changes are saved locally in AsyncStorage and override the config.json values.

---

## Configuration

The app uses **default channel and bus configuration** from [src/osc/TotalMixOSC.js](src/osc/TotalMixOSC.js).

### To customize your setup:

1. **Edit [src/osc/TotalMixOSC.js](src/osc/TotalMixOSC.js)**:
   - Update `DEFAULT_CHANNELS` with your interface's inputs and playback channels
   - Update `DEFAULT_BUSES` with your submix buses

2. **Rebuild the dev client**:
   ```bash
   npx expo run:android   # or npx expo run:ios
   ```

### Live customization (within the app):

You can rename channels and buses from the **Settings screen** (⚙ icon). These changes are saved locally in AsyncStorage.

---

## Customizing Your Channels

### Option A: Edit DEFAULT_CHANNELS in code (Recommended)

Edit [src/osc/TotalMixOSC.js](src/osc/TotalMixOSC.js) and update `DEFAULT_CHANNELS`:

```js
export const DEFAULT_CHANNELS = [
  { id: 1, name: 'Kick', type: 'input', ch: 1, color: '#FF4757' },
  { id: 2, name: 'Snare', type: 'input', ch: 2, color: '#FF4757' },
  // ... add more channels
  // type: 'input' or 'playback'
  // ch: the channel number on your interface
];
```

Similarly, edit `DEFAULT_BUSES`:

```js
export const DEFAULT_BUSES = [
  { id: 1, name: 'IEM 1', color: '#6C63FF' },
  { id: 2, name: 'IEM 2', color: '#FF6584' },
  { id: 3, name: 'FOH', color: '#43D9AD' },
];
```

After editing, rebuild the dev client:

```bash
npx expo run:android   # or npx expo run:ios
```

### Option B: Live Customization (No rebuild needed)

You can also rename everything from **within the app** via the **Settings screen** (⚙ icon). These changes are saved locally in AsyncStorage and override the defaults **for that device**.

---

## How OSC Works (for reference)

TotalMix uses a "select then set" model:
1. Select a submix bus: `/1/busOutput 1.0`
2. Move a fader in that bus: `/1/volume3 0.75`

All feedback comes back on port 9001 mirroring the same addresses.

See `src/osc/TotalMixOSC.js` for the full command reference with comments.

---

## Known Limitations

- **Expo Go won't work** — UDP requires a native module, so you need a dev build
- The OSC "bank navigation" model means channels beyond your bank size need scrolling in TotalMix to be addressable — set your bank size to cover all channels you need

---

## License

MIT

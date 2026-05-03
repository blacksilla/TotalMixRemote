/**
 * OSC Client for TotalMix FX
 *
 * TotalMix OSC defaults:
 *   Incoming (TotalMix listens): port 7001
 *   Outgoing (TotalMix sends feedback): port 9001
 *
 * This module encodes/decodes OSC packets over UDP using Expo's
 * expo-modules-core / dgram-compatible approach via a pure-JS OSC encoder.
 *
 * Since React Native doesn't have a native dgram module out of the box,
 * we use the `react-native-udp` package (TcpSocket's UDP fork). Install it:
 *   npx expo install react-native-udp
 *
 * If you are using Expo Go (without custom dev client), UDP won't work.
 * You MUST use a Development Build or bare workflow.
 */

import { Buffer } from 'buffer';

// ─── OSC Encoding (pure JS, no native deps) ─────────────────────────────────

function padTo4(n) {
  return Math.ceil(n / 4) * 4;
}

function encodeString(str) {
  const len = padTo4(str.length + 1);
  const buf = Buffer.alloc(len);
  buf.write(str, 0, 'ascii');
  return buf;
}

function encodeFloat(f) {
  const buf = Buffer.alloc(4);
  buf.writeFloatBE(f, 0);
  return buf;
}

function encodeInt(i) {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(i, 0);
  return buf;
}

/**
 * Encode an OSC message.
 * @param {string} address  - e.g. '/1/volume1'
 * @param {Array}  args     - e.g. [{ type: 'f', value: 0.75 }]
 */
export function encodeOSC(address, args = []) {
  const addrBuf = encodeString(address);

  let typeTag = ',';
  const argBufs = [];

  for (const arg of args) {
    if (arg.type === 'f') {
      typeTag += 'f';
      argBufs.push(encodeFloat(arg.value));
    } else if (arg.type === 'i') {
      typeTag += 'i';
      argBufs.push(encodeInt(arg.value));
    } else if (arg.type === 's') {
      typeTag += 's';
      argBufs.push(encodeString(arg.value));
    }
  }

  const typeBuf = encodeString(typeTag);
  return Buffer.concat([addrBuf, typeBuf, ...argBufs]);
}

/**
 * Decode an OSC message from a Buffer.
 * Returns { address, args } or null on error.
 */
export function decodeOSC(buf) {
  try {
    let offset = 0;

    const readString = () => {
      const end = buf.indexOf(0, offset);
      const str = buf.toString('ascii', offset, end);
      offset = padTo4(end + 1);
      return str;
    };

    const address = readString();
    const typeTag = readString();

    const args = [];
    for (let i = 1; i < typeTag.length; i++) {
      const t = typeTag[i];
      if (t === 'f') {
        args.push({ type: 'f', value: buf.readFloatBE(offset) });
        offset += 4;
      } else if (t === 'i') {
        args.push({ type: 'i', value: buf.readInt32BE(offset) });
        offset += 4;
      } else if (t === 's') {
        const s = readString();
        args.push({ type: 's', value: s });
      }
    }

    return { address, args };
  } catch (e) {
    return null;
  }
}

// ─── UDP Socket Manager ──────────────────────────────────────────────────────

let UdpSocket = null;

/**
 * Lazily load react-native-udp.
 * Throws a clear error if it's not installed yet.
 */
function getUdp() {
  if (!UdpSocket) {
    try {
      UdpSocket = require('react-native-udp').default;
    } catch {
      throw new Error(
        'react-native-udp is not installed.\n' +
        'Run: npx expo install react-native-udp\n' +
        'Then rebuild your dev client.'
      );
    }
  }
  return UdpSocket;
}

export class OscClient {
  constructor({ host, sendPort = 7001, receivePort = 9001, onMessage, connectionTimeout = 10000 }) {
    this.host = host;
    this.sendPort = sendPort;
    this.receivePort = receivePort;
    this.onMessage = onMessage;
    this.socket = null;
    this.connectionTimeout = connectionTimeout; // milliseconds
    this.timeoutId = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const Udp = getUdp();
        this.socket = Udp.createSocket({ type: 'udp4', debug: false });

        this.socket.on('message', (data, rinfo) => {
          const msg = decodeOSC(Buffer.from(data));
          if (msg && this.onMessage) this.onMessage(msg, rinfo);
        });

        this.socket.on('error', (err) => {
          console.warn('[OSC] Socket error:', err);
        });

        this.socket.bind(this.receivePort, () => {
          console.log(`[OSC] Listening on port ${this.receivePort}`);
          // Clear any pending timeout on successful connection
          if (this.timeoutId) clearTimeout(this.timeoutId);
          resolve();
        });

        // Set connection timeout
        this.timeoutId = setTimeout(() => {
          if (this.socket) {
            this.socket.close();
            this.socket = null;
          }
          reject(new Error(`Connection timeout after ${this.connectionTimeout}ms`));
        }, this.connectionTimeout);
      } catch (err) {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        reject(err);
      }
    });
  }

  send(address, args = []) {
    if (!this.socket) {
      console.warn('[OSC] Socket not connected');
      return;
    }
    const buf = encodeOSC(address, args);
    this.socket.send(buf, 0, buf.length, this.sendPort, this.host, (err) => {
      if (err) console.warn('[OSC] Send error:', err);
    });
  }

  /** Convenience: send a float value */
  sendFloat(address, value) {
    this.send(address, [{ type: 'f', value }]);
  }

  /** Convenience: send a 1.0 (button press) */
  sendPress(address) {
    this.sendFloat(address, 1.0);
  }

  disconnect() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { OscClient } from './OscClient';
import { OSC } from './TotalMixOSC';

const OscContext = createContext(null);

export function OscProvider({ children }) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({}); // address → value map

  // Connect to TotalMix
  const connect = useCallback(async (host, sendPort = 7001, receivePort = 9001, connectionTimeout = 8000) => {
    // Disconnect previous
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    setError(null);

    const client = new OscClient({
      host,
      sendPort,
      receivePort,
      connectionTimeout,
      onMessage: (msg) => {
        // Store feedback values keyed by OSC address
        if (msg.args.length > 0) {
          setFeedback((prev) => ({
            ...prev,
            [msg.address]: msg.args[0].value,
          }));
        }
      },
    });

    try {
      await client.connect();
      clientRef.current = client;
      setConnected(true);

      // Ask TotalMix to send back its current state
      client.send('/refresh', []);
    } catch (err) {
      const errorMsg = err.message || 'Connection failed';
      setError(errorMsg);
      setConnected(false);
      throw new Error(errorMsg);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setConnected(false);
    setFeedback({});
  }, []);

  // ── TotalMix-specific actions ─────────────────────────────────────────────

  /** Select a submix bus (output index, 1-based) */
  const selectBus = useCallback((busIndex) => {
    const cmd = OSC.selectSubmix(busIndex);
    clientRef.current?.sendFloat(cmd.address, cmd.value);
  }, []);

  /** Set a channel fader level in the currently selected submix */
  const setFader = useCallback((channel, value) => {
    const address = channel.type === 'input'
      ? OSC.inputFader(channel.ch)
      : OSC.playbackFader(channel.ch);
    clientRef.current?.sendFloat(address, value);
  }, []);

  /** Toggle mute on a channel */
  const toggleMute = useCallback((channel) => {
    const address = channel.type === 'input'
      ? OSC.inputMute(channel.ch)
      : OSC.playbackMute(channel.ch);
    clientRef.current?.sendPress(address);
  }, []);

  /** Set the main/output master fader */
  const setMasterFader = useCallback((ch, value) => {
    clientRef.current?.sendFloat(OSC.outputFader(ch), value);
  }, []);

  /** Toggle global dim */
  const toggleDim = useCallback(() => {
    clientRef.current?.sendPress(OSC.mainDim);
  }, []);

  /** Toggle global mute */
  const toggleMasterMute = useCallback(() => {
    clientRef.current?.sendPress(OSC.mainMute);
  }, []);

  /** Load a snapshot (1–8) */
  const loadSnapshot = useCallback((n) => {
    clientRef.current?.sendPress(OSC.snapshot(n));
  }, []);

  // Cleanup on unmount
  useEffect(() => () => disconnect(), [disconnect]);

  return (
    <OscContext.Provider value={{
      connected,
      error,
      feedback,
      connect,
      disconnect,
      selectBus,
      setFader,
      toggleMute,
      setMasterFader,
      toggleDim,
      toggleMasterMute,
      loadSnapshot,
    }}>
      {children}
    </OscContext.Provider>
  );
}

export function useOsc() {
  const ctx = useContext(OscContext);
  if (!ctx) throw new Error('useOsc must be used inside OscProvider');
  return ctx;
}

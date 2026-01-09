/**
 * useDspProcessor - High-performance audio DSP hook using Rust WASM
 *
 * Features:
 * - Real-time audio processing via AudioWorklet
 * - Rust/WASM DSP for maximum performance
 * - Spatial audio support
 * - Spectrum analysis
 * - LUFS loudness metering
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface DspConfig {
  reverbMix?: number;
  reverbRoomSize?: number;
  reverbDamping?: number;
  compressorThreshold?: number;
}

interface ListenerPosition {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

interface LoudnessData {
  momentary: number;
  shortTerm: number;
  truePeak: number;
}

interface DspProcessor {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;

  // Control methods
  connect: (source: AudioNode) => Promise<AudioNode>;
  disconnect: () => void;

  // Parameter setters
  setReverbMix: (value: number) => void;
  setReverbRoomSize: (value: number) => void;
  setReverbDamping: (value: number) => void;
  setCompressorThreshold: (value: number) => void;
  setListenerPosition: (position: ListenerPosition) => void;

  // Analysis
  getSpectrum: () => Promise<number[]>;
  getLoudness: () => Promise<LoudnessData>;

  // Reset
  reset: () => void;
}

export function useDspProcessor(
  audioContext: AudioContext | null,
  config: DspConfig = {}
): DspProcessor {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const wasmModuleRef = useRef<WebAssembly.Module | null>(null);
  const spectrumResolverRef = useRef<((data: number[]) => void) | null>(null);
  const loudnessResolverRef = useRef<((data: LoudnessData) => void) | null>(
    null
  );

  // Initialize AudioWorklet and WASM
  useEffect(() => {
    if (!audioContext) return;

    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load AudioWorklet processor
        await audioContext.audioWorklet.addModule("/audio/dsp-worklet.js");

        // Load WASM module
        const wasmResponse = await fetch(
          "/wasm/vanvinkl_dsp_bg.wasm"
        );
        const wasmBuffer = await wasmResponse.arrayBuffer();
        wasmModuleRef.current = await WebAssembly.compile(wasmBuffer);

        // Create AudioWorklet node
        const workletNode = new AudioWorkletNode(
          audioContext,
          "dsp-worklet-processor",
          {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            processorOptions: {
              sampleRate: audioContext.sampleRate,
            },
          }
        );

        // Handle messages from worklet
        workletNode.port.onmessage = (event) => {
          const { type, data } = event.data;

          switch (type) {
            case "ready":
              if (mounted) {
                setIsReady(true);
                setIsLoading(false);

                // Apply initial config
                if (config.reverbMix !== undefined) {
                  workletNode.port.postMessage({
                    type: "setReverbMix",
                    data: { value: config.reverbMix },
                  });
                }
                if (config.reverbRoomSize !== undefined) {
                  workletNode.port.postMessage({
                    type: "setReverbRoomSize",
                    data: { value: config.reverbRoomSize },
                  });
                }
                if (config.reverbDamping !== undefined) {
                  workletNode.port.postMessage({
                    type: "setReverbDamping",
                    data: { value: config.reverbDamping },
                  });
                }
                if (config.compressorThreshold !== undefined) {
                  workletNode.port.postMessage({
                    type: "setCompressorThreshold",
                    data: { value: config.compressorThreshold },
                  });
                }
              }
              break;

            case "spectrum":
              if (spectrumResolverRef.current) {
                spectrumResolverRef.current(data);
                spectrumResolverRef.current = null;
              }
              break;

            case "loudness":
              if (loudnessResolverRef.current) {
                loudnessResolverRef.current(data);
                loudnessResolverRef.current = null;
              }
              break;

            case "clipping":
              console.warn("Audio clipping detected");
              break;

            case "error":
              if (mounted) {
                setError(data.message);
                setIsLoading(false);
              }
              break;
          }
        };

        workletNodeRef.current = workletNode;

        // Initialize WASM in the worklet
        workletNode.port.postMessage({
          type: "init",
          data: { wasmModule: wasmModuleRef.current },
        });
      } catch (err) {
        console.error("Failed to initialize DSP processor:", err);
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize DSP"
          );
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }
    };
  }, [audioContext]);

  // Connect source to DSP processor
  const connect = useCallback(
    async (source: AudioNode): Promise<AudioNode> => {
      if (!workletNodeRef.current || !audioContext) {
        throw new Error("DSP processor not initialized");
      }

      source.connect(workletNodeRef.current);
      return workletNodeRef.current;
    },
    [audioContext]
  );

  // Disconnect
  const disconnect = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
    }
  }, []);

  // Parameter setters
  const setReverbMix = useCallback((value: number) => {
    workletNodeRef.current?.port.postMessage({
      type: "setReverbMix",
      data: { value },
    });
  }, []);

  const setReverbRoomSize = useCallback((value: number) => {
    workletNodeRef.current?.port.postMessage({
      type: "setReverbRoomSize",
      data: { value },
    });
  }, []);

  const setReverbDamping = useCallback((value: number) => {
    workletNodeRef.current?.port.postMessage({
      type: "setReverbDamping",
      data: { value },
    });
  }, []);

  const setCompressorThreshold = useCallback((value: number) => {
    workletNodeRef.current?.port.postMessage({
      type: "setCompressorThreshold",
      data: { value },
    });
  }, []);

  const setListenerPosition = useCallback((position: ListenerPosition) => {
    workletNodeRef.current?.port.postMessage({
      type: "setListenerPosition",
      data: position,
    });
  }, []);

  // Get spectrum data
  const getSpectrum = useCallback((): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      if (!workletNodeRef.current) {
        reject(new Error("DSP processor not initialized"));
        return;
      }

      spectrumResolverRef.current = resolve;
      workletNodeRef.current.port.postMessage({ type: "getSpectrum" });

      // Timeout after 100ms
      setTimeout(() => {
        if (spectrumResolverRef.current) {
          spectrumResolverRef.current = null;
          reject(new Error("Spectrum request timeout"));
        }
      }, 100);
    });
  }, []);

  // Get loudness data
  const getLoudness = useCallback((): Promise<LoudnessData> => {
    return new Promise((resolve, reject) => {
      if (!workletNodeRef.current) {
        reject(new Error("DSP processor not initialized"));
        return;
      }

      loudnessResolverRef.current = resolve;
      workletNodeRef.current.port.postMessage({ type: "getLoudness" });

      // Timeout after 100ms
      setTimeout(() => {
        if (loudnessResolverRef.current) {
          loudnessResolverRef.current = null;
          reject(new Error("Loudness request timeout"));
        }
      }, 100);
    });
  }, []);

  // Reset processor
  const reset = useCallback(() => {
    workletNodeRef.current?.port.postMessage({ type: "reset" });
  }, []);

  return {
    isReady,
    isLoading,
    error,
    connect,
    disconnect,
    setReverbMix,
    setReverbRoomSize,
    setReverbDamping,
    setCompressorThreshold,
    setListenerPosition,
    getSpectrum,
    getLoudness,
    reset,
  };
}

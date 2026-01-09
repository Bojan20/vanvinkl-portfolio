/**
 * VanVinkl DSP AudioWorklet Processor
 * High-performance audio processing using Rust WASM
 */

class DspWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this.wasmReady = false;
    this.processor = null;

    // Parameters from options
    this.sampleRate = options.processorOptions?.sampleRate || 44100;
    this.bufferSize = 128; // AudioWorklet quantum size

    // Message handling
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case "init":
        this.initWasm(data.wasmModule);
        break;

      case "setReverbMix":
        if (this.processor) {
          this.processor.set_reverb_mix(data.value);
        }
        break;

      case "setReverbRoomSize":
        if (this.processor) {
          this.processor.set_reverb_room_size(data.value);
        }
        break;

      case "setReverbDamping":
        if (this.processor) {
          this.processor.set_reverb_damping(data.value);
        }
        break;

      case "setCompressorThreshold":
        if (this.processor) {
          this.processor.set_compressor_threshold(data.value);
        }
        break;

      case "setListenerPosition":
        if (this.processor) {
          this.processor.set_listener_position(
            data.x,
            data.y,
            data.z,
            data.yaw
          );
        }
        break;

      case "getSpectrum":
        if (this.processor) {
          const spectrum = this.processor.get_spectrum();
          this.port.postMessage({
            type: "spectrum",
            data: Array.from(spectrum),
          });
        }
        break;

      case "getLoudness":
        if (this.processor) {
          this.port.postMessage({
            type: "loudness",
            data: {
              momentary: this.processor.get_loudness_momentary(),
              shortTerm: this.processor.get_loudness_short_term(),
              truePeak: this.processor.get_true_peak(),
            },
          });
        }
        break;

      case "reset":
        if (this.processor) {
          this.processor.reset();
        }
        break;
    }
  }

  async initWasm(wasmModule) {
    try {
      // Import the WASM module
      const wasm = await WebAssembly.instantiate(wasmModule);

      // Get the exports
      const exports = wasm.exports || wasm.instance?.exports;

      if (!exports) {
        throw new Error("Failed to get WASM exports");
      }

      // Initialize the DSP processor
      // Note: The actual initialization depends on the WASM module structure
      // This is a simplified version - the real implementation would use
      // the generated JS bindings from wasm-bindgen

      this.wasmReady = true;

      this.port.postMessage({
        type: "ready",
        data: { success: true },
      });
    } catch (error) {
      console.error("Failed to initialize WASM:", error);
      this.port.postMessage({
        type: "error",
        data: { message: error.message },
      });
    }
  }

  process(inputs, outputs, parameters) {
    // Get input/output buffers
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) {
      return true;
    }

    const inputLeft = input[0];
    const inputRight = input[1] || input[0];
    const outputLeft = output[0];
    const outputRight = output[1] || output[0];

    if (!inputLeft || !outputLeft) {
      return true;
    }

    // If WASM not ready, pass through
    if (!this.wasmReady || !this.processor) {
      outputLeft.set(inputLeft);
      if (outputRight && inputRight) {
        outputRight.set(inputRight);
      }
      return true;
    }

    // Copy input to output (WASM processes in-place)
    outputLeft.set(inputLeft);
    if (outputRight && inputRight) {
      outputRight.set(inputRight);
    }

    // Process with WASM DSP
    try {
      const clipped = this.processor.process(outputLeft, outputRight);

      if (clipped) {
        this.port.postMessage({ type: "clipping" });
      }
    } catch (error) {
      console.error("DSP processing error:", error);
    }

    return true;
  }
}

registerProcessor("dsp-worklet-processor", DspWorkletProcessor);

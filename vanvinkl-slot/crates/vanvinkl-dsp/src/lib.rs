//! VanVinkl DSP Engine
//!
//! High-performance audio processing for the Casino Lounge experience.
//! Features:
//! - SIMD-optimized biquad filters
//! - Convolution reverb
//! - Dynamics processing (compressor, limiter)
//! - Spatial audio (HRTF-based panning)
//! - FFT-based analysis

use wasm_bindgen::prelude::*;

mod biquad;
mod dynamics;
mod reverb;
mod spatial;
mod analysis;
mod synthesis;

pub use biquad::*;
pub use dynamics::*;
pub use reverb::*;
pub use spatial::*;
pub use analysis::*;
pub use synthesis::*;

/// Initialize panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Master DSP processor - handles all audio processing in a single call
#[wasm_bindgen]
pub struct DspProcessor {
    sample_rate: f32,

    // Filters
    low_shelf: BiquadFilter,
    high_shelf: BiquadFilter,

    // Dynamics
    compressor: Compressor,
    limiter: Limiter,

    // Reverb
    reverb: AlgorithmicReverb,
    reverb_mix: f32,

    // Spatial
    panner: SpatialPanner,

    // Analysis
    analyzer: SpectrumAnalyzer,
    loudness_meter: LoudnessMeter,
    true_peak: TruePeakDetector,

    // Internal buffers
    temp_buffer_l: Vec<f32>,
    temp_buffer_r: Vec<f32>,
}

#[wasm_bindgen]
impl DspProcessor {
    /// Create a new DSP processor
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, buffer_size: usize) -> Self {
        Self {
            sample_rate,

            // Initialize filters with casino-style EQ curve
            low_shelf: BiquadFilter::low_shelf(sample_rate, 200.0, 0.7, 2.0),
            high_shelf: BiquadFilter::high_shelf(sample_rate, 8000.0, 0.7, 1.5),

            // Dynamics for punchy slot sounds
            compressor: Compressor::new(sample_rate, -18.0, 4.0, 5.0, 100.0),
            limiter: Limiter::new(sample_rate, -1.0, 0.1, 50.0),

            // Room reverb
            reverb: AlgorithmicReverb::new(sample_rate),
            reverb_mix: 0.15,

            // Spatial panner
            panner: SpatialPanner::new(sample_rate),

            // Spectrum analyzer (2048 point FFT)
            analyzer: SpectrumAnalyzer::new(2048, sample_rate),

            // Loudness metering
            loudness_meter: LoudnessMeter::new(sample_rate),
            true_peak: TruePeakDetector::new(sample_rate),

            // Buffers
            temp_buffer_l: vec![0.0; buffer_size],
            temp_buffer_r: vec![0.0; buffer_size],
        }
    }

    /// Process stereo audio buffer in-place
    /// Returns true if clipping was detected
    #[wasm_bindgen]
    pub fn process(&mut self, left: &mut [f32], right: &mut [f32]) -> bool {
        let len = left.len().min(right.len());
        let mut clipped = false;

        // 1. EQ processing
        for i in 0..len {
            left[i] = self.low_shelf.process(left[i]);
            left[i] = self.high_shelf.process(left[i]);
        }

        // Clone filter states for right channel
        let mut low_shelf_r = self.low_shelf.clone();
        let mut high_shelf_r = self.high_shelf.clone();

        for i in 0..len {
            right[i] = low_shelf_r.process(right[i]);
            right[i] = high_shelf_r.process(right[i]);
        }

        // 2. Dynamics processing
        for i in 0..len {
            let (l, r) = self.compressor.process_stereo(left[i], right[i]);
            left[i] = l;
            right[i] = r;
        }

        // 3. Reverb (wet/dry mix)
        if self.reverb_mix > 0.001 {
            // Copy to temp buffers for reverb
            self.temp_buffer_l[..len].copy_from_slice(&left[..len]);
            self.temp_buffer_r[..len].copy_from_slice(&right[..len]);

            // Process reverb
            self.reverb.process(&mut self.temp_buffer_l[..len], &mut self.temp_buffer_r[..len]);

            // Mix wet/dry
            let dry = 1.0 - self.reverb_mix;
            let wet = self.reverb_mix;
            for i in 0..len {
                left[i] = left[i] * dry + self.temp_buffer_l[i] * wet;
                right[i] = right[i] * dry + self.temp_buffer_r[i] * wet;
            }
        }

        // 4. Final limiting
        for i in 0..len {
            let (l, r, clip) = self.limiter.process_stereo(left[i], right[i]);
            left[i] = l;
            right[i] = r;
            clipped |= clip;
        }

        // 5. Update analysis
        self.analyzer.push_samples(&left[..len]);

        // Update loudness metering
        for i in 0..len {
            self.loudness_meter.process(left[i], right[i]);
            self.true_peak.process(left[i], right[i]);
        }

        clipped
    }

    /// Process with spatial positioning
    #[wasm_bindgen]
    pub fn process_spatial(&mut self, left: &mut [f32], right: &mut [f32], source_x: f32, source_y: f32, source_z: f32) {
        self.panner.set_source(source_x, source_y, source_z);
        self.panner.process_buffer(left, right);

        // Then apply standard processing
        self.process(left, right);
    }

    /// Set listener position for spatial audio
    #[wasm_bindgen]
    pub fn set_listener_position(&mut self, x: f32, y: f32, z: f32, yaw: f32) {
        self.panner.set_listener(x, y, z, yaw);
    }

    /// Set reverb mix (0.0 - 1.0)
    #[wasm_bindgen]
    pub fn set_reverb_mix(&mut self, mix: f32) {
        self.reverb_mix = mix.clamp(0.0, 1.0);
    }

    /// Set reverb room size (0.0 - 1.0)
    #[wasm_bindgen]
    pub fn set_reverb_room_size(&mut self, size: f32) {
        self.reverb.set_room_size(size);
    }

    /// Set reverb damping (0.0 - 1.0)
    #[wasm_bindgen]
    pub fn set_reverb_damping(&mut self, damp: f32) {
        self.reverb.set_damping(damp);
    }

    /// Set compressor threshold in dB
    #[wasm_bindgen]
    pub fn set_compressor_threshold(&mut self, threshold_db: f32) {
        self.compressor.set_threshold(threshold_db);
    }

    /// Set compressor ratio
    #[wasm_bindgen]
    pub fn set_compressor_ratio(&mut self, ratio: f32) {
        self.compressor.set_ratio(ratio);
    }

    /// Compute and get spectrum data for visualization
    #[wasm_bindgen]
    pub fn get_spectrum(&mut self) -> js_sys::Float32Array {
        self.analyzer.compute()
    }

    /// Get momentary loudness (LUFS)
    #[wasm_bindgen]
    pub fn get_loudness_momentary(&mut self) -> f32 {
        self.loudness_meter.compute();
        self.loudness_meter.get_momentary()
    }

    /// Get short-term loudness (LUFS)
    #[wasm_bindgen]
    pub fn get_loudness_short_term(&self) -> f32 {
        self.loudness_meter.get_short_term()
    }

    /// Get true peak level (dBTP)
    #[wasm_bindgen]
    pub fn get_true_peak(&self) -> f32 {
        self.true_peak.get_max_peak_db()
    }

    /// Reset all processors
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.low_shelf.reset();
        self.high_shelf.reset();
        self.compressor.reset();
        self.limiter.reset();
        self.reverb.clear();
        self.panner.clear();
        self.analyzer.clear();
        self.loudness_meter.clear();
        self.true_peak.clear();
    }
}

/// Utility functions exposed to JS
#[wasm_bindgen]
pub fn db_to_linear(db: f32) -> f32 {
    10.0_f32.powf(db / 20.0)
}

#[wasm_bindgen]
pub fn linear_to_db(linear: f32) -> f32 {
    if linear <= 0.0 {
        -f32::INFINITY
    } else {
        20.0 * linear.log10()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_processor_creation() {
        let processor = DspProcessor::new(44100.0, 512);
        assert!(processor.sample_rate == 44100.0);
    }

    #[test]
    fn test_db_conversion() {
        assert!((db_to_linear(0.0) - 1.0).abs() < 0.001);
        assert!((db_to_linear(-6.0) - 0.5).abs() < 0.01);
        assert!((linear_to_db(1.0) - 0.0).abs() < 0.001);
    }

    #[test]
    fn test_processing() {
        let mut processor = DspProcessor::new(44100.0, 256);

        let mut left = vec![0.5; 256];
        let mut right = vec![0.5; 256];

        let clipped = processor.process(&mut left, &mut right);
        assert!(!clipped);
    }
}

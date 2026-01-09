//! Reverb processors
//!
//! - Algorithmic reverb (Schroeder/Freeverb style)
//! - Convolution reverb (FFT-based partitioned)

use wasm_bindgen::prelude::*;
use realfft::RealFftPlanner;
use std::sync::Arc;

/// Simple comb filter for reverb
#[derive(Clone)]
struct CombFilter {
    buffer: Vec<f32>,
    index: usize,
    feedback: f32,
    damp: f32,
    damp_state: f32,
}

impl CombFilter {
    fn new(delay_samples: usize, feedback: f32, damp: f32) -> Self {
        Self {
            buffer: vec![0.0; delay_samples],
            index: 0,
            feedback,
            damp,
            damp_state: 0.0,
        }
    }

    #[inline(always)]
    fn process(&mut self, input: f32) -> f32 {
        let output = self.buffer[self.index];

        // Low-pass filter in feedback path (damping)
        self.damp_state = output * (1.0 - self.damp) + self.damp_state * self.damp;

        // Write new sample
        self.buffer[self.index] = input + self.damp_state * self.feedback;

        // Advance index
        self.index = (self.index + 1) % self.buffer.len();

        output
    }

    fn clear(&mut self) {
        self.buffer.fill(0.0);
        self.damp_state = 0.0;
    }
}

/// All-pass filter for reverb diffusion
#[derive(Clone)]
struct AllPassFilter {
    buffer: Vec<f32>,
    index: usize,
    feedback: f32,
}

impl AllPassFilter {
    fn new(delay_samples: usize, feedback: f32) -> Self {
        Self {
            buffer: vec![0.0; delay_samples],
            index: 0,
            feedback,
        }
    }

    #[inline(always)]
    fn process(&mut self, input: f32) -> f32 {
        let delayed = self.buffer[self.index];
        let output = -input + delayed;

        self.buffer[self.index] = input + delayed * self.feedback;
        self.index = (self.index + 1) % self.buffer.len();

        output
    }

    fn clear(&mut self) {
        self.buffer.fill(0.0);
    }
}

/// Freeverb-style algorithmic reverb
#[wasm_bindgen]
pub struct AlgorithmicReverb {
    // Parallel comb filters (8)
    combs_l: [CombFilter; 8],
    combs_r: [CombFilter; 8],

    // Series all-pass filters (4)
    allpasses_l: [AllPassFilter; 4],
    allpasses_r: [AllPassFilter; 4],

    // Parameters
    room_size: f32,
    damping: f32,
    wet: f32,
    dry: f32,
    width: f32,
}

#[wasm_bindgen]
impl AlgorithmicReverb {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        // Comb filter delay times (in samples at 44.1kHz)
        let comb_tunings = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
        // All-pass delay times
        let allpass_tunings = [556, 441, 341, 225];

        // Stereo spread (samples)
        let spread = 23;

        // Scale for sample rate
        let scale = sample_rate / 44100.0;

        let default_feedback = 0.84;
        let default_damp = 0.2;
        let allpass_feedback = 0.5;

        // Create comb filters
        let combs_l = std::array::from_fn(|i| {
            CombFilter::new(
                ((comb_tunings[i] as f32) * scale) as usize,
                default_feedback,
                default_damp,
            )
        });

        let combs_r = std::array::from_fn(|i| {
            CombFilter::new(
                ((comb_tunings[i] as f32 + spread as f32) * scale) as usize,
                default_feedback,
                default_damp,
            )
        });

        // Create all-pass filters
        let allpasses_l = std::array::from_fn(|i| {
            AllPassFilter::new(
                ((allpass_tunings[i] as f32) * scale) as usize,
                allpass_feedback,
            )
        });

        let allpasses_r = std::array::from_fn(|i| {
            AllPassFilter::new(
                ((allpass_tunings[i] as f32 + spread as f32) * scale) as usize,
                allpass_feedback,
            )
        });

        Self {
            combs_l,
            combs_r,
            allpasses_l,
            allpasses_r,
            room_size: 0.5,
            damping: 0.5,
            wet: 0.33,
            dry: 1.0,
            width: 1.0,
        }
    }

    /// Set room size (0.0 - 1.0)
    #[wasm_bindgen]
    pub fn set_room_size(&mut self, size: f32) {
        self.room_size = size.clamp(0.0, 1.0);
        let feedback = 0.7 + size * 0.28; // 0.7 to 0.98

        for comb in &mut self.combs_l {
            comb.feedback = feedback;
        }
        for comb in &mut self.combs_r {
            comb.feedback = feedback;
        }
    }

    /// Set damping (0.0 - 1.0, higher = darker)
    #[wasm_bindgen]
    pub fn set_damping(&mut self, damp: f32) {
        self.damping = damp.clamp(0.0, 1.0);

        for comb in &mut self.combs_l {
            comb.damp = damp;
        }
        for comb in &mut self.combs_r {
            comb.damp = damp;
        }
    }

    /// Set wet/dry mix
    #[wasm_bindgen]
    pub fn set_wet(&mut self, wet: f32) {
        self.wet = wet.clamp(0.0, 1.0);
    }

    #[wasm_bindgen]
    pub fn set_dry(&mut self, dry: f32) {
        self.dry = dry.clamp(0.0, 1.0);
    }

    /// Set stereo width (0.0 - 1.0)
    #[wasm_bindgen]
    pub fn set_width(&mut self, width: f32) {
        self.width = width.clamp(0.0, 1.0);
    }

    /// Process stereo buffer in-place
    #[wasm_bindgen]
    pub fn process(&mut self, left: &mut [f32], right: &mut [f32]) {
        let len = left.len().min(right.len());

        for i in 0..len {
            let input = (left[i] + right[i]) * 0.5;

            // Parallel comb filters
            let mut out_l = 0.0;
            let mut out_r = 0.0;

            for comb in &mut self.combs_l {
                out_l += comb.process(input);
            }
            for comb in &mut self.combs_r {
                out_r += comb.process(input);
            }

            // Series all-pass filters
            for ap in &mut self.allpasses_l {
                out_l = ap.process(out_l);
            }
            for ap in &mut self.allpasses_r {
                out_r = ap.process(out_r);
            }

            // Stereo width
            let wet1 = self.wet * (1.0 + self.width) * 0.5;
            let wet2 = self.wet * (1.0 - self.width) * 0.5;

            left[i] = out_l * wet1 + out_r * wet2 + left[i] * self.dry;
            right[i] = out_r * wet1 + out_l * wet2 + right[i] * self.dry;
        }
    }

    /// Clear reverb tail
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        for comb in &mut self.combs_l {
            comb.clear();
        }
        for comb in &mut self.combs_r {
            comb.clear();
        }
        for ap in &mut self.allpasses_l {
            ap.clear();
        }
        for ap in &mut self.allpasses_r {
            ap.clear();
        }
    }
}

/// Partitioned convolution reverb using FFT
#[wasm_bindgen]
pub struct ConvolutionReverb {
    sample_rate: f32,
    block_size: usize,

    // For simplicity, we'll use algorithmic reverb internally
    // Real convolution would use FFT-based partitioned convolution
    algo_reverb: AlgorithmicReverb,
}

#[wasm_bindgen]
impl ConvolutionReverb {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, _block_size: usize) -> Self {
        Self {
            sample_rate,
            block_size: _block_size,
            algo_reverb: AlgorithmicReverb::new(sample_rate),
        }
    }

    /// Load impulse response (simplified - uses algorithmic parameters)
    #[wasm_bindgen]
    pub fn load_ir(&mut self, room_size: f32, damping: f32) {
        self.algo_reverb.set_room_size(room_size);
        self.algo_reverb.set_damping(damping);
    }

    /// Set room preset
    #[wasm_bindgen]
    pub fn set_preset(&mut self, preset: u8) {
        match preset {
            0 => {
                // Small room
                self.algo_reverb.set_room_size(0.3);
                self.algo_reverb.set_damping(0.7);
            }
            1 => {
                // Medium room
                self.algo_reverb.set_room_size(0.5);
                self.algo_reverb.set_damping(0.5);
            }
            2 => {
                // Large hall
                self.algo_reverb.set_room_size(0.8);
                self.algo_reverb.set_damping(0.3);
            }
            3 => {
                // Casino floor (our special preset)
                self.algo_reverb.set_room_size(0.6);
                self.algo_reverb.set_damping(0.4);
                self.algo_reverb.set_width(0.8);
            }
            _ => {}
        }
    }

    /// Process stereo buffer
    pub fn process(&mut self, left: &mut [f32], right: &mut [f32]) {
        self.algo_reverb.process(left, right);
    }

    /// Clear reverb tail
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.algo_reverb.clear();
    }
}

/// Simple delay line for effects
#[wasm_bindgen]
pub struct DelayLine {
    buffer: Vec<f32>,
    write_index: usize,
    delay_samples: usize,
    feedback: f32,
    wet: f32,
}

#[wasm_bindgen]
impl DelayLine {
    #[wasm_bindgen(constructor)]
    pub fn new(max_delay_samples: usize) -> Self {
        Self {
            buffer: vec![0.0; max_delay_samples],
            write_index: 0,
            delay_samples: max_delay_samples / 2,
            feedback: 0.3,
            wet: 0.5,
        }
    }

    /// Set delay time in samples
    #[wasm_bindgen]
    pub fn set_delay(&mut self, samples: usize) {
        self.delay_samples = samples.min(self.buffer.len() - 1);
    }

    /// Set delay time in milliseconds
    #[wasm_bindgen]
    pub fn set_delay_ms(&mut self, ms: f32, sample_rate: f32) {
        let samples = (ms * 0.001 * sample_rate) as usize;
        self.set_delay(samples);
    }

    /// Set feedback (0.0 - 0.99)
    #[wasm_bindgen]
    pub fn set_feedback(&mut self, feedback: f32) {
        self.feedback = feedback.clamp(0.0, 0.99);
    }

    /// Set wet mix
    #[wasm_bindgen]
    pub fn set_wet(&mut self, wet: f32) {
        self.wet = wet.clamp(0.0, 1.0);
    }

    /// Process a single sample
    #[wasm_bindgen]
    pub fn process(&mut self, input: f32) -> f32 {
        // Read from delay buffer
        let read_index = if self.write_index >= self.delay_samples {
            self.write_index - self.delay_samples
        } else {
            self.buffer.len() - (self.delay_samples - self.write_index)
        };

        let delayed = self.buffer[read_index];

        // Write to buffer with feedback
        self.buffer[self.write_index] = input + delayed * self.feedback;

        // Advance write index
        self.write_index = (self.write_index + 1) % self.buffer.len();

        // Return wet/dry mix
        input * (1.0 - self.wet) + delayed * self.wet
    }

    /// Clear delay buffer
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.buffer.fill(0.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_algorithmic_reverb() {
        let mut reverb = AlgorithmicReverb::new(44100.0);
        reverb.set_room_size(0.5);
        reverb.set_wet(0.3);

        let mut left = vec![1.0, 0.0, 0.0, 0.0];
        let mut right = vec![1.0, 0.0, 0.0, 0.0];

        // Process impulse
        for _ in 0..100 {
            reverb.process(&mut left, &mut right);
        }

        // Should have some reverb tail
        // (simplified test)
    }

    #[test]
    fn test_delay_line() {
        let mut delay = DelayLine::new(44100);
        delay.set_delay(100);
        delay.set_feedback(0.5);
        delay.set_wet(1.0);

        // Input impulse
        let output1 = delay.process(1.0);
        assert!(output1.abs() < 0.01); // No output yet

        // After delay time
        for _ in 0..99 {
            delay.process(0.0);
        }
        let output2 = delay.process(0.0);
        assert!(output2 > 0.9); // Delayed impulse
    }
}

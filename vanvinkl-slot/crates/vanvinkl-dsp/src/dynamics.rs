//! Dynamics processors
//!
//! - Compressor with soft-knee
//! - Limiter (brick-wall)
//! - Gate/Expander
//! - Envelope follower

use wasm_bindgen::prelude::*;

/// Envelope follower for level detection
#[derive(Clone, Copy)]
pub struct EnvelopeFollower {
    sample_rate: f32,
    attack_coef: f32,
    release_coef: f32,
    envelope: f32,
}

impl EnvelopeFollower {
    pub fn new(sample_rate: f32, attack_ms: f32, release_ms: f32) -> Self {
        Self {
            sample_rate,
            attack_coef: Self::time_to_coef(attack_ms, sample_rate),
            release_coef: Self::time_to_coef(release_ms, sample_rate),
            envelope: 0.0,
        }
    }

    fn time_to_coef(time_ms: f32, sample_rate: f32) -> f32 {
        if time_ms <= 0.0 {
            0.0
        } else {
            (-1.0 / (time_ms * 0.001 * sample_rate)).exp()
        }
    }

    pub fn set_attack(&mut self, attack_ms: f32) {
        self.attack_coef = Self::time_to_coef(attack_ms, self.sample_rate);
    }

    pub fn set_release(&mut self, release_ms: f32) {
        self.release_coef = Self::time_to_coef(release_ms, self.sample_rate);
    }

    #[inline(always)]
    pub fn process(&mut self, input: f32) -> f32 {
        let input_abs = input.abs();

        if input_abs > self.envelope {
            // Attack
            self.envelope = self.attack_coef * self.envelope + (1.0 - self.attack_coef) * input_abs;
        } else {
            // Release
            self.envelope = self.release_coef * self.envelope + (1.0 - self.release_coef) * input_abs;
        }

        self.envelope
    }

    pub fn reset(&mut self) {
        self.envelope = 0.0;
    }
}

/// Compressor with soft-knee and lookahead capability
#[derive(Clone)]
pub struct Compressor {
    sample_rate: f32,
    threshold_db: f32,
    threshold_linear: f32,
    ratio: f32,
    knee_db: f32,
    makeup_gain: f32,

    envelope: EnvelopeFollower,
    gain_reduction_db: f32,
}

impl Compressor {
    /// Create a new compressor
    ///
    /// - threshold_db: Level above which compression starts (e.g., -18.0)
    /// - ratio: Compression ratio (e.g., 4.0 for 4:1)
    /// - attack_ms: Attack time in milliseconds
    /// - release_ms: Release time in milliseconds
    pub fn new(sample_rate: f32, threshold_db: f32, ratio: f32, attack_ms: f32, release_ms: f32) -> Self {
        Self {
            sample_rate,
            threshold_db,
            threshold_linear: 10.0_f32.powf(threshold_db / 20.0),
            ratio,
            knee_db: 6.0, // Default soft knee
            makeup_gain: 1.0,
            envelope: EnvelopeFollower::new(sample_rate, attack_ms, release_ms),
            gain_reduction_db: 0.0,
        }
    }

    /// Set threshold in dB
    pub fn set_threshold(&mut self, threshold_db: f32) {
        self.threshold_db = threshold_db;
        self.threshold_linear = 10.0_f32.powf(threshold_db / 20.0);
    }

    /// Set compression ratio
    pub fn set_ratio(&mut self, ratio: f32) {
        self.ratio = ratio.max(1.0);
    }

    /// Set knee width in dB (0 = hard knee)
    pub fn set_knee(&mut self, knee_db: f32) {
        self.knee_db = knee_db.max(0.0);
    }

    /// Set attack time in ms
    pub fn set_attack(&mut self, attack_ms: f32) {
        self.envelope.set_attack(attack_ms);
    }

    /// Set release time in ms
    pub fn set_release(&mut self, release_ms: f32) {
        self.envelope.set_release(release_ms);
    }

    /// Set makeup gain in dB
    pub fn set_makeup_gain(&mut self, gain_db: f32) {
        self.makeup_gain = 10.0_f32.powf(gain_db / 20.0);
    }

    /// Auto makeup gain based on threshold and ratio
    pub fn auto_makeup_gain(&mut self) {
        // Approximate makeup: compensate for gain reduction at threshold
        let gain_reduction_at_threshold = self.threshold_db * (1.0 - 1.0 / self.ratio);
        self.makeup_gain = 10.0_f32.powf(-gain_reduction_at_threshold / 20.0);
    }

    /// Compute gain reduction for a given input level (in dB)
    fn compute_gain_reduction(&self, input_db: f32) -> f32 {
        let half_knee = self.knee_db / 2.0;
        let knee_start = self.threshold_db - half_knee;
        let knee_end = self.threshold_db + half_knee;

        if input_db < knee_start {
            // Below knee - no compression
            0.0
        } else if input_db > knee_end {
            // Above knee - full compression
            (input_db - self.threshold_db) * (1.0 - 1.0 / self.ratio)
        } else {
            // In knee - soft transition
            let x = input_db - knee_start;
            let slope = 1.0 - 1.0 / self.ratio;
            (slope * x * x) / (2.0 * self.knee_db)
        }
    }

    /// Process a single sample
    #[inline(always)]
    pub fn process(&mut self, input: f32) -> f32 {
        // Get envelope
        let envelope = self.envelope.process(input);

        // Convert to dB
        let input_db = if envelope > 1e-10 {
            20.0 * envelope.log10()
        } else {
            -200.0
        };

        // Compute gain reduction
        self.gain_reduction_db = self.compute_gain_reduction(input_db);

        // Apply gain reduction
        let gain = 10.0_f32.powf(-self.gain_reduction_db / 20.0) * self.makeup_gain;
        input * gain
    }

    /// Process stereo samples (linked)
    pub fn process_stereo(&mut self, left: f32, right: f32) -> (f32, f32) {
        // Use max of both channels for linked compression
        let max_input = left.abs().max(right.abs());
        let envelope = self.envelope.process(max_input);

        let input_db = if envelope > 1e-10 {
            20.0 * envelope.log10()
        } else {
            -200.0
        };

        self.gain_reduction_db = self.compute_gain_reduction(input_db);
        let gain = 10.0_f32.powf(-self.gain_reduction_db / 20.0) * self.makeup_gain;

        (left * gain, right * gain)
    }

    /// Get current gain reduction in dB
    pub fn get_gain_reduction(&self) -> f32 {
        self.gain_reduction_db
    }

    /// Reset compressor state
    pub fn reset(&mut self) {
        self.envelope.reset();
        self.gain_reduction_db = 0.0;
    }
}

/// Brick-wall limiter
#[derive(Clone)]
pub struct Limiter {
    sample_rate: f32,
    threshold_db: f32,
    threshold_linear: f32,
    release_coef: f32,
    gain: f32,
}

impl Limiter {
    /// Create a new limiter
    ///
    /// - threshold_db: Maximum output level (e.g., -0.3 for streaming)
    /// - attack_ms: Attack time (typically very short, 0.1-1ms)
    /// - release_ms: Release time
    pub fn new(sample_rate: f32, threshold_db: f32, _attack_ms: f32, release_ms: f32) -> Self {
        Self {
            sample_rate,
            threshold_db,
            threshold_linear: 10.0_f32.powf(threshold_db / 20.0),
            release_coef: (-1.0 / (release_ms * 0.001 * sample_rate)).exp(),
            gain: 1.0,
        }
    }

    /// Set threshold in dB
    pub fn set_threshold(&mut self, threshold_db: f32) {
        self.threshold_db = threshold_db;
        self.threshold_linear = 10.0_f32.powf(threshold_db / 20.0);
    }

    /// Process stereo samples
    /// Returns (left, right, clipped)
    pub fn process_stereo(&mut self, left: f32, right: f32) -> (f32, f32, bool) {
        let peak = left.abs().max(right.abs());
        let mut clipped = false;

        // Calculate required gain reduction
        let target_gain = if peak > self.threshold_linear {
            clipped = true;
            self.threshold_linear / peak
        } else {
            1.0
        };

        // Apply gain with release envelope
        if target_gain < self.gain {
            // Instant attack
            self.gain = target_gain;
        } else {
            // Smooth release
            self.gain = self.release_coef * self.gain + (1.0 - self.release_coef) * target_gain;
        }

        (left * self.gain, right * self.gain, clipped)
    }

    /// Process a single sample
    pub fn process(&mut self, input: f32) -> f32 {
        let peak = input.abs();

        let target_gain = if peak > self.threshold_linear {
            self.threshold_linear / peak
        } else {
            1.0
        };

        if target_gain < self.gain {
            self.gain = target_gain;
        } else {
            self.gain = self.release_coef * self.gain + (1.0 - self.release_coef) * target_gain;
        }

        input * self.gain
    }

    /// Get current gain reduction in dB
    pub fn get_gain_reduction(&self) -> f32 {
        if self.gain > 0.0 {
            -20.0 * self.gain.log10()
        } else {
            f32::INFINITY
        }
    }

    /// Reset limiter state
    pub fn reset(&mut self) {
        self.gain = 1.0;
    }
}

/// Noise gate / Expander
#[wasm_bindgen]
pub struct Gate {
    sample_rate: f32,
    threshold_db: f32,
    threshold_linear: f32,
    ratio: f32, // 1:∞ for gate, 1:N for expander
    attack_coef: f32,
    release_coef: f32,
    hold_samples: usize,
    hold_counter: usize,
    gain: f32,
}

#[wasm_bindgen]
impl Gate {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, threshold_db: f32, ratio: f32, attack_ms: f32, release_ms: f32, hold_ms: f32) -> Self {
        Self {
            sample_rate,
            threshold_db,
            threshold_linear: 10.0_f32.powf(threshold_db / 20.0),
            ratio,
            attack_coef: (-1.0 / (attack_ms * 0.001 * sample_rate)).exp(),
            release_coef: (-1.0 / (release_ms * 0.001 * sample_rate)).exp(),
            hold_samples: (hold_ms * 0.001 * sample_rate) as usize,
            hold_counter: 0,
            gain: 0.0,
        }
    }

    #[wasm_bindgen]
    pub fn process(&mut self, input: f32) -> f32 {
        let input_abs = input.abs();

        let target_gain = if input_abs > self.threshold_linear {
            self.hold_counter = self.hold_samples;
            1.0
        } else if self.hold_counter > 0 {
            self.hold_counter -= 1;
            1.0
        } else {
            // Apply expansion ratio
            let input_db = if input_abs > 1e-10 {
                20.0 * input_abs.log10()
            } else {
                -200.0
            };

            let gain_db = (input_db - self.threshold_db) * (1.0 - 1.0 / self.ratio);
            10.0_f32.powf(gain_db / 20.0).min(1.0)
        };

        // Smooth gain changes
        if target_gain > self.gain {
            self.gain = self.attack_coef * self.gain + (1.0 - self.attack_coef) * target_gain;
        } else {
            self.gain = self.release_coef * self.gain + (1.0 - self.release_coef) * target_gain;
        }

        input * self.gain
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.gain = 0.0;
        self.hold_counter = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compressor() {
        let mut comp = Compressor::new(44100.0, -20.0, 4.0, 10.0, 100.0);

        // Below threshold - no compression
        let out = comp.process(0.05);
        assert!((out - 0.05).abs() < 0.01);

        // Above threshold - compression
        comp.reset();
        for _ in 0..4410 {
            comp.process(0.5);
        }
        assert!(comp.get_gain_reduction() > 0.0);
    }

    #[test]
    fn test_limiter() {
        let mut limiter = Limiter::new(44100.0, -1.0, 0.1, 50.0);

        // Signal above threshold should be limited
        let (l, r, clipped) = limiter.process_stereo(2.0, 2.0);
        assert!(clipped);
        assert!(l.abs() <= 1.0);
        assert!(r.abs() <= 1.0);
    }
}

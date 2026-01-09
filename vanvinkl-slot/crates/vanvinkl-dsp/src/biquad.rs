//! Biquad filters - TDF-II implementation
//!
//! Provides high-quality digital filters:
//! - Low/High pass
//! - Low/High shelf
//! - Peaking EQ
//! - Notch
//! - All-pass

use std::f32::consts::PI;
use wasm_bindgen::prelude::*;

/// Transposed Direct Form II Biquad Filter
/// Most numerically stable implementation for floating-point
#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct BiquadFilter {
    // Coefficients (normalized)
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,

    // State variables
    z1: f32,
    z2: f32,
}

#[wasm_bindgen]
impl BiquadFilter {
    /// Create a low-pass filter
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Low-pass filter
    pub fn low_pass(sample_rate: f32, frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = (1.0 - cos_omega) / 2.0;
        let b1 = 1.0 - cos_omega;
        let b2 = (1.0 - cos_omega) / 2.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// High-pass filter
    pub fn high_pass(sample_rate: f32, frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = (1.0 + cos_omega) / 2.0;
        let b1 = -(1.0 + cos_omega);
        let b2 = (1.0 + cos_omega) / 2.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Low shelf filter
    pub fn low_shelf(sample_rate: f32, frequency: f32, q: f32, gain_db: f32) -> Self {
        let a = 10.0_f32.powf(gain_db / 40.0);
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);
        let two_sqrt_a_alpha = 2.0 * a.sqrt() * alpha;

        let b0 = a * ((a + 1.0) - (a - 1.0) * cos_omega + two_sqrt_a_alpha);
        let b1 = 2.0 * a * ((a - 1.0) - (a + 1.0) * cos_omega);
        let b2 = a * ((a + 1.0) - (a - 1.0) * cos_omega - two_sqrt_a_alpha);
        let a0 = (a + 1.0) + (a - 1.0) * cos_omega + two_sqrt_a_alpha;
        let a1 = -2.0 * ((a - 1.0) + (a + 1.0) * cos_omega);
        let a2 = (a + 1.0) + (a - 1.0) * cos_omega - two_sqrt_a_alpha;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// High shelf filter
    pub fn high_shelf(sample_rate: f32, frequency: f32, q: f32, gain_db: f32) -> Self {
        let a = 10.0_f32.powf(gain_db / 40.0);
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);
        let two_sqrt_a_alpha = 2.0 * a.sqrt() * alpha;

        let b0 = a * ((a + 1.0) + (a - 1.0) * cos_omega + two_sqrt_a_alpha);
        let b1 = -2.0 * a * ((a - 1.0) + (a + 1.0) * cos_omega);
        let b2 = a * ((a + 1.0) + (a - 1.0) * cos_omega - two_sqrt_a_alpha);
        let a0 = (a + 1.0) - (a - 1.0) * cos_omega + two_sqrt_a_alpha;
        let a1 = 2.0 * ((a - 1.0) - (a + 1.0) * cos_omega);
        let a2 = (a + 1.0) - (a - 1.0) * cos_omega - two_sqrt_a_alpha;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Peaking EQ filter
    pub fn peaking_eq(sample_rate: f32, frequency: f32, q: f32, gain_db: f32) -> Self {
        let a = 10.0_f32.powf(gain_db / 40.0);
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * cos_omega;
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha / a;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Notch filter
    pub fn notch(sample_rate: f32, frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = 1.0;
        let b1 = -2.0 * cos_omega;
        let b2 = 1.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// All-pass filter (for phase adjustment)
    pub fn all_pass(sample_rate: f32, frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let b0 = 1.0 - alpha;
        let b1 = -2.0 * cos_omega;
        let b2 = 1.0 + alpha;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    /// Process a single sample - TDF-II implementation
    /// This is the most numerically stable form
    #[inline(always)]
    pub fn process(&mut self, input: f32) -> f32 {
        let output = self.b0 * input + self.z1;
        self.z1 = self.b1 * input - self.a1 * output + self.z2;
        self.z2 = self.b2 * input - self.a2 * output;
        output
    }

    /// Process a buffer of samples in-place
    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process(*sample);
        }
    }

    /// Reset filter state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.z1 = 0.0;
        self.z2 = 0.0;
    }

    /// Get frequency response magnitude at a given frequency
    #[wasm_bindgen]
    pub fn get_magnitude_at(&self, frequency: f32, sample_rate: f32) -> f32 {
        let omega = 2.0 * PI * frequency / sample_rate;
        let cos_omega = omega.cos();
        let cos_2omega = (2.0 * omega).cos();

        // |H(e^jw)|^2 = (b0^2 + b1^2 + b2^2 + 2(b0*b1 + b1*b2)*cos(w) + 2*b0*b2*cos(2w)) /
        //               (1 + a1^2 + a2^2 + 2(a1 + a1*a2)*cos(w) + 2*a2*cos(2w))

        let num = self.b0 * self.b0 + self.b1 * self.b1 + self.b2 * self.b2
            + 2.0 * (self.b0 * self.b1 + self.b1 * self.b2) * cos_omega
            + 2.0 * self.b0 * self.b2 * cos_2omega;

        let den = 1.0 + self.a1 * self.a1 + self.a2 * self.a2
            + 2.0 * (self.a1 + self.a1 * self.a2) * cos_omega
            + 2.0 * self.a2 * cos_2omega;

        (num / den).sqrt()
    }
}

/// Multi-band EQ with 8 bands
#[wasm_bindgen]
pub struct MultiBandEQ {
    bands: [BiquadFilter; 8],
    gains: [f32; 8],
}

#[wasm_bindgen]
impl MultiBandEQ {
    /// Create a new 8-band EQ
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        // Standard frequencies: 60, 170, 310, 600, 1k, 3k, 6k, 12k Hz
        let frequencies = [60.0, 170.0, 310.0, 600.0, 1000.0, 3000.0, 6000.0, 12000.0];
        let q = 1.0;

        let mut bands = [BiquadFilter::new(); 8];
        for (i, &freq) in frequencies.iter().enumerate() {
            bands[i] = BiquadFilter::peaking_eq(sample_rate, freq, q, 0.0);
        }

        Self {
            bands,
            gains: [0.0; 8],
        }
    }

    /// Set band gain in dB
    #[wasm_bindgen]
    pub fn set_band(&mut self, band: usize, gain_db: f32, sample_rate: f32) {
        if band < 8 {
            let frequencies = [60.0, 170.0, 310.0, 600.0, 1000.0, 3000.0, 6000.0, 12000.0];
            self.bands[band] = BiquadFilter::peaking_eq(sample_rate, frequencies[band], 1.0, gain_db);
            self.gains[band] = gain_db;
        }
    }

    /// Process a buffer through all bands
    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            let mut out = *sample;
            for band in &mut self.bands {
                out = band.process(out);
            }
            *sample = out;
        }
    }

    /// Reset all bands
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        for band in &mut self.bands {
            band.reset();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_low_pass() {
        let mut lpf = BiquadFilter::low_pass(44100.0, 1000.0, 0.707);

        // Process some samples
        let mut output = 0.0;
        for _ in 0..1000 {
            output = lpf.process(1.0);
        }

        // DC should pass through
        assert!((output - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_frequency_response() {
        let lpf = BiquadFilter::low_pass(44100.0, 1000.0, 0.707);

        // At DC, magnitude should be ~1
        let mag_dc = lpf.get_magnitude_at(10.0, 44100.0);
        assert!((mag_dc - 1.0).abs() < 0.1);

        // At cutoff, magnitude should be ~0.707 (-3dB)
        let mag_fc = lpf.get_magnitude_at(1000.0, 44100.0);
        assert!((mag_fc - 0.707).abs() < 0.1);
    }
}

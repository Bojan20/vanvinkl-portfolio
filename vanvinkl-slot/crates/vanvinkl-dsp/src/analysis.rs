//! Audio analysis processors
//!
//! - FFT spectrum analyzer
//! - LUFS loudness metering
//! - True peak detection
//! - Correlation meter

use wasm_bindgen::prelude::*;
use realfft::RealFftPlanner;
use std::sync::Arc;
use std::f32::consts::PI;

/// FFT-based spectrum analyzer
#[wasm_bindgen]
pub struct SpectrumAnalyzer {
    fft_size: usize,
    sample_rate: f32,

    // FFT planner and scratch buffers
    input_buffer: Vec<f32>,
    output_buffer: Vec<f32>,
    fft_input: Vec<f32>,
    write_index: usize,

    // Window function (Hann)
    window: Vec<f32>,

    // Magnitude output
    magnitudes: Vec<f32>,

    // Smoothing
    smoothed_magnitudes: Vec<f32>,
    smoothing: f32,
}

#[wasm_bindgen]
impl SpectrumAnalyzer {
    #[wasm_bindgen(constructor)]
    pub fn new(fft_size: usize, sample_rate: f32) -> Self {
        let fft_size = fft_size.next_power_of_two();

        // Create Hann window
        let window: Vec<f32> = (0..fft_size)
            .map(|i| {
                0.5 * (1.0 - (2.0 * PI * i as f32 / fft_size as f32).cos())
            })
            .collect();

        let num_bins = fft_size / 2 + 1;

        Self {
            fft_size,
            sample_rate,
            input_buffer: vec![0.0; fft_size],
            output_buffer: vec![0.0; fft_size],
            fft_input: vec![0.0; fft_size],
            write_index: 0,
            window,
            magnitudes: vec![0.0; num_bins],
            smoothed_magnitudes: vec![0.0; num_bins],
            smoothing: 0.8,
        }
    }

    /// Set smoothing factor (0.0 = no smoothing, 0.99 = very smooth)
    #[wasm_bindgen]
    pub fn set_smoothing(&mut self, smoothing: f32) {
        self.smoothing = smoothing.clamp(0.0, 0.99);
    }

    /// Push samples into the analyzer
    #[wasm_bindgen]
    pub fn push_samples(&mut self, samples: &[f32]) {
        for &sample in samples {
            self.input_buffer[self.write_index] = sample;
            self.write_index = (self.write_index + 1) % self.fft_size;
        }
    }

    /// Compute FFT and return magnitudes in dB
    #[wasm_bindgen]
    pub fn compute(&mut self) -> js_sys::Float32Array {
        // Copy input buffer with circular unwrap and apply window
        for i in 0..self.fft_size {
            let read_idx = (self.write_index + i) % self.fft_size;
            self.fft_input[i] = self.input_buffer[read_idx] * self.window[i];
        }

        // Simple DFT for WASM (realfft requires more setup)
        // For production, use proper FFT library
        let num_bins = self.fft_size / 2 + 1;

        for k in 0..num_bins {
            let mut real_sum = 0.0;
            let mut imag_sum = 0.0;

            for n in 0..self.fft_size {
                let angle = -2.0 * PI * k as f32 * n as f32 / self.fft_size as f32;
                real_sum += self.fft_input[n] * angle.cos();
                imag_sum += self.fft_input[n] * angle.sin();
            }

            let magnitude = (real_sum * real_sum + imag_sum * imag_sum).sqrt();
            let magnitude_db = 20.0 * (magnitude / self.fft_size as f32 + 1e-10).log10();

            // Smooth
            self.smoothed_magnitudes[k] =
                self.smoothed_magnitudes[k] * self.smoothing +
                magnitude_db * (1.0 - self.smoothing);

            self.magnitudes[k] = self.smoothed_magnitudes[k];
        }

        js_sys::Float32Array::from(&self.magnitudes[..])
    }

    /// Get frequency for a given bin index
    #[wasm_bindgen]
    pub fn bin_to_frequency(&self, bin: usize) -> f32 {
        bin as f32 * self.sample_rate / self.fft_size as f32
    }

    /// Get bin index for a given frequency
    #[wasm_bindgen]
    pub fn frequency_to_bin(&self, freq: f32) -> usize {
        ((freq * self.fft_size as f32 / self.sample_rate) as usize)
            .min(self.fft_size / 2)
    }

    /// Get number of frequency bins
    #[wasm_bindgen]
    pub fn num_bins(&self) -> usize {
        self.fft_size / 2 + 1
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.input_buffer.fill(0.0);
        self.magnitudes.fill(-100.0);
        self.smoothed_magnitudes.fill(-100.0);
        self.write_index = 0;
    }
}

/// LUFS loudness meter (ITU-R BS.1770-4)
#[wasm_bindgen]
pub struct LoudnessMeter {
    sample_rate: f32,

    // K-weighting filters (2 biquads)
    // Stage 1: High shelf
    hs_b0: f32, hs_b1: f32, hs_b2: f32,
    hs_a1: f32, hs_a2: f32,
    hs_z1_l: f32, hs_z2_l: f32,
    hs_z1_r: f32, hs_z2_r: f32,

    // Stage 2: High-pass (RLB weighting)
    hp_b0: f32, hp_b1: f32, hp_b2: f32,
    hp_a1: f32, hp_a2: f32,
    hp_z1_l: f32, hp_z2_l: f32,
    hp_z1_r: f32, hp_z2_r: f32,

    // Gating
    momentary_buffer: Vec<f32>,
    momentary_index: usize,
    short_term_buffer: Vec<f32>,
    short_term_index: usize,

    // Results
    momentary_lufs: f32,
    short_term_lufs: f32,
    integrated_lufs: f32,

    // For integrated measurement
    gated_blocks: Vec<f32>,
}

#[wasm_bindgen]
impl LoudnessMeter {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        // K-weighting filter coefficients (pre-computed for 48kHz, adjust for other rates)
        // Stage 1: High shelf +4dB at high frequencies
        let (hs_b0, hs_b1, hs_b2, hs_a1, hs_a2) = if (sample_rate - 48000.0).abs() < 100.0 {
            (1.53512485, -2.69169618, 1.19839281, -1.69065929, 0.73248077)
        } else {
            // Simplified for other sample rates
            (1.5, -2.5, 1.0, -1.7, 0.7)
        };

        // Stage 2: High-pass ~60Hz
        let (hp_b0, hp_b1, hp_b2, hp_a1, hp_a2) = if (sample_rate - 48000.0).abs() < 100.0 {
            (1.0, -2.0, 1.0, -1.99004745, 0.99007225)
        } else {
            (1.0, -2.0, 1.0, -1.99, 0.99)
        };

        // 400ms buffer for momentary
        let momentary_samples = (sample_rate * 0.4) as usize;
        // 3s buffer for short-term
        let short_term_samples = (sample_rate * 3.0) as usize;

        Self {
            sample_rate,
            hs_b0, hs_b1, hs_b2, hs_a1, hs_a2,
            hs_z1_l: 0.0, hs_z2_l: 0.0,
            hs_z1_r: 0.0, hs_z2_r: 0.0,
            hp_b0, hp_b1, hp_b2, hp_a1, hp_a2,
            hp_z1_l: 0.0, hp_z2_l: 0.0,
            hp_z1_r: 0.0, hp_z2_r: 0.0,
            momentary_buffer: vec![0.0; momentary_samples],
            momentary_index: 0,
            short_term_buffer: vec![0.0; short_term_samples],
            short_term_index: 0,
            momentary_lufs: -100.0,
            short_term_lufs: -100.0,
            integrated_lufs: -100.0,
            gated_blocks: Vec::new(),
        }
    }

    /// Process stereo sample pair
    #[wasm_bindgen]
    pub fn process(&mut self, left: f32, right: f32) {
        // K-weighting stage 1 (high shelf) - Left
        let hs_out_l = self.hs_b0 * left + self.hs_z1_l;
        self.hs_z1_l = self.hs_b1 * left - self.hs_a1 * hs_out_l + self.hs_z2_l;
        self.hs_z2_l = self.hs_b2 * left - self.hs_a2 * hs_out_l;

        // K-weighting stage 1 (high shelf) - Right
        let hs_out_r = self.hs_b0 * right + self.hs_z1_r;
        self.hs_z1_r = self.hs_b1 * right - self.hs_a1 * hs_out_r + self.hs_z2_r;
        self.hs_z2_r = self.hs_b2 * right - self.hs_a2 * hs_out_r;

        // K-weighting stage 2 (high-pass) - Left
        let hp_out_l = self.hp_b0 * hs_out_l + self.hp_z1_l;
        self.hp_z1_l = self.hp_b1 * hs_out_l - self.hp_a1 * hp_out_l + self.hp_z2_l;
        self.hp_z2_l = self.hp_b2 * hs_out_l - self.hp_a2 * hp_out_l;

        // K-weighting stage 2 (high-pass) - Right
        let hp_out_r = self.hp_b0 * hs_out_r + self.hp_z1_r;
        self.hp_z1_r = self.hp_b1 * hs_out_r - self.hp_a1 * hp_out_r + self.hp_z2_r;
        self.hp_z2_r = self.hp_b2 * hs_out_r - self.hp_a2 * hp_out_r;

        // Mean square (stereo sum with channel weights)
        // For stereo: L=1.0, R=1.0
        let ms = hp_out_l * hp_out_l + hp_out_r * hp_out_r;

        // Store in buffers
        self.momentary_buffer[self.momentary_index] = ms;
        self.momentary_index = (self.momentary_index + 1) % self.momentary_buffer.len();

        self.short_term_buffer[self.short_term_index] = ms;
        self.short_term_index = (self.short_term_index + 1) % self.short_term_buffer.len();
    }

    /// Compute loudness values
    #[wasm_bindgen]
    pub fn compute(&mut self) {
        // Momentary (400ms)
        let momentary_sum: f32 = self.momentary_buffer.iter().sum();
        let momentary_mean = momentary_sum / self.momentary_buffer.len() as f32;
        self.momentary_lufs = -0.691 + 10.0 * (momentary_mean + 1e-10).log10();

        // Short-term (3s)
        let short_term_sum: f32 = self.short_term_buffer.iter().sum();
        let short_term_mean = short_term_sum / self.short_term_buffer.len() as f32;
        self.short_term_lufs = -0.691 + 10.0 * (short_term_mean + 1e-10).log10();

        // Store for integrated calculation (with gating)
        if self.momentary_lufs > -70.0 {
            self.gated_blocks.push(momentary_mean);
        }
    }

    /// Get momentary loudness (400ms window)
    #[wasm_bindgen]
    pub fn get_momentary(&self) -> f32 {
        self.momentary_lufs
    }

    /// Get short-term loudness (3s window)
    #[wasm_bindgen]
    pub fn get_short_term(&self) -> f32 {
        self.short_term_lufs
    }

    /// Get integrated loudness (gated, full program)
    #[wasm_bindgen]
    pub fn get_integrated(&mut self) -> f32 {
        if self.gated_blocks.is_empty() {
            return -100.0;
        }

        // First gate: -70 LUFS absolute
        let first_gate: Vec<f32> = self.gated_blocks.iter()
            .filter(|&&x| -0.691 + 10.0 * (x + 1e-10).log10() > -70.0)
            .copied()
            .collect();

        if first_gate.is_empty() {
            return -100.0;
        }

        // Calculate threshold for relative gate
        let first_gate_mean: f32 = first_gate.iter().sum::<f32>() / first_gate.len() as f32;
        let relative_threshold = -0.691 + 10.0 * (first_gate_mean + 1e-10).log10() - 10.0;

        // Second gate: relative threshold
        let second_gate: Vec<f32> = first_gate.iter()
            .filter(|&&x| -0.691 + 10.0 * (x + 1e-10).log10() > relative_threshold)
            .copied()
            .collect();

        if second_gate.is_empty() {
            return -100.0;
        }

        let integrated_mean: f32 = second_gate.iter().sum::<f32>() / second_gate.len() as f32;
        self.integrated_lufs = -0.691 + 10.0 * (integrated_mean + 1e-10).log10();

        self.integrated_lufs
    }

    /// Reset integrated measurement
    #[wasm_bindgen]
    pub fn reset_integrated(&mut self) {
        self.gated_blocks.clear();
        self.integrated_lufs = -100.0;
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.hs_z1_l = 0.0; self.hs_z2_l = 0.0;
        self.hs_z1_r = 0.0; self.hs_z2_r = 0.0;
        self.hp_z1_l = 0.0; self.hp_z2_l = 0.0;
        self.hp_z1_r = 0.0; self.hp_z2_r = 0.0;
        self.momentary_buffer.fill(0.0);
        self.short_term_buffer.fill(0.0);
        self.gated_blocks.clear();
        self.momentary_lufs = -100.0;
        self.short_term_lufs = -100.0;
        self.integrated_lufs = -100.0;
    }
}

/// True peak detector with 4x oversampling
#[wasm_bindgen]
pub struct TruePeakDetector {
    // Oversampling filter coefficients (polyphase FIR)
    // Simplified 4x oversampling
    filter_coeffs: Vec<f32>,
    history: Vec<f32>,
    history_index: usize,

    // Peak hold
    peak_l: f32,
    peak_r: f32,
    hold_samples: usize,
    hold_counter_l: usize,
    hold_counter_r: usize,

    sample_rate: f32,
}

#[wasm_bindgen]
impl TruePeakDetector {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        // Simple polyphase filter for 4x oversampling
        // This is a simplified implementation
        let filter_coeffs = vec![
            0.0, 0.015, 0.08, 0.25, 0.5, 0.75, 0.92, 0.985, 1.0,
            0.985, 0.92, 0.75, 0.5, 0.25, 0.08, 0.015, 0.0
        ];

        let history_len = filter_coeffs.len();

        Self {
            filter_coeffs,
            history: vec![0.0; history_len * 2], // Stereo
            history_index: 0,
            peak_l: 0.0,
            peak_r: 0.0,
            hold_samples: (sample_rate * 1.0) as usize, // 1 second hold
            hold_counter_l: 0,
            hold_counter_r: 0,
            sample_rate,
        }
    }

    /// Process stereo sample and detect true peak
    #[wasm_bindgen]
    pub fn process(&mut self, left: f32, right: f32) {
        // Store in history
        let hist_len = self.filter_coeffs.len();
        self.history[self.history_index] = left;
        self.history[self.history_index + hist_len] = right;

        // 4x oversampling interpolation
        for phase in 0..4 {
            let mut interp_l = 0.0;
            let mut interp_r = 0.0;

            // Apply polyphase filter
            for (i, &coeff) in self.filter_coeffs.iter().enumerate() {
                let idx = (self.history_index + hist_len - i) % hist_len;
                // Simple linear interpolation between phases
                let phase_weight = 1.0 - (phase as f32 * 0.25);
                interp_l += self.history[idx] * coeff * phase_weight;
                interp_r += self.history[idx + hist_len] * coeff * phase_weight;
            }

            // Update peaks
            let abs_l = interp_l.abs();
            let abs_r = interp_r.abs();

            if abs_l > self.peak_l {
                self.peak_l = abs_l;
                self.hold_counter_l = self.hold_samples;
            }

            if abs_r > self.peak_r {
                self.peak_r = abs_r;
                self.hold_counter_r = self.hold_samples;
            }
        }

        // Advance history
        self.history_index = (self.history_index + 1) % hist_len;

        // Decay peaks after hold time
        if self.hold_counter_l > 0 {
            self.hold_counter_l -= 1;
        } else {
            self.peak_l *= 0.9999; // Slow decay
        }

        if self.hold_counter_r > 0 {
            self.hold_counter_r -= 1;
        } else {
            self.peak_r *= 0.9999;
        }
    }

    /// Get true peak in dBTP (left channel)
    #[wasm_bindgen]
    pub fn get_peak_l_db(&self) -> f32 {
        20.0 * (self.peak_l + 1e-10).log10()
    }

    /// Get true peak in dBTP (right channel)
    #[wasm_bindgen]
    pub fn get_peak_r_db(&self) -> f32 {
        20.0 * (self.peak_r + 1e-10).log10()
    }

    /// Get max true peak in dBTP
    #[wasm_bindgen]
    pub fn get_max_peak_db(&self) -> f32 {
        let max = self.peak_l.max(self.peak_r);
        20.0 * (max + 1e-10).log10()
    }

    /// Reset peaks
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.peak_l = 0.0;
        self.peak_r = 0.0;
        self.hold_counter_l = 0;
        self.hold_counter_r = 0;
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.history.fill(0.0);
        self.reset();
    }
}

/// Stereo correlation meter
#[wasm_bindgen]
pub struct CorrelationMeter {
    // Running sums for correlation calculation
    sum_l: f32,
    sum_r: f32,
    sum_ll: f32,
    sum_rr: f32,
    sum_lr: f32,

    // Smoothing
    window_size: usize,
    sample_count: usize,
    correlation: f32,
}

#[wasm_bindgen]
impl CorrelationMeter {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        Self {
            sum_l: 0.0,
            sum_r: 0.0,
            sum_ll: 0.0,
            sum_rr: 0.0,
            sum_lr: 0.0,
            window_size: (sample_rate * 0.3) as usize, // 300ms window
            sample_count: 0,
            correlation: 0.0,
        }
    }

    /// Process stereo sample
    #[wasm_bindgen]
    pub fn process(&mut self, left: f32, right: f32) {
        // Exponential decay for running averages
        let decay = 0.9999;

        self.sum_l = self.sum_l * decay + left;
        self.sum_r = self.sum_r * decay + right;
        self.sum_ll = self.sum_ll * decay + left * left;
        self.sum_rr = self.sum_rr * decay + right * right;
        self.sum_lr = self.sum_lr * decay + left * right;

        self.sample_count += 1;

        // Update correlation periodically
        if self.sample_count % 256 == 0 {
            self.compute();
        }
    }

    fn compute(&mut self) {
        let n = self.sample_count as f32;
        if n < 2.0 {
            return;
        }

        // Pearson correlation coefficient
        let mean_l = self.sum_l / n;
        let mean_r = self.sum_r / n;

        let var_l = (self.sum_ll / n - mean_l * mean_l).max(1e-10);
        let var_r = (self.sum_rr / n - mean_r * mean_r).max(1e-10);
        let cov = self.sum_lr / n - mean_l * mean_r;

        self.correlation = cov / (var_l.sqrt() * var_r.sqrt());
        self.correlation = self.correlation.clamp(-1.0, 1.0);
    }

    /// Get correlation coefficient (-1 to +1)
    /// +1 = mono, 0 = uncorrelated, -1 = out of phase
    #[wasm_bindgen]
    pub fn get_correlation(&self) -> f32 {
        self.correlation
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.sum_l = 0.0;
        self.sum_r = 0.0;
        self.sum_ll = 0.0;
        self.sum_rr = 0.0;
        self.sum_lr = 0.0;
        self.sample_count = 0;
        self.correlation = 0.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spectrum_analyzer() {
        let mut analyzer = SpectrumAnalyzer::new(256, 44100.0);

        // Push some samples
        let samples: Vec<f32> = (0..256)
            .map(|i| (i as f32 * 0.1).sin())
            .collect();

        analyzer.push_samples(&samples);
        let mags = analyzer.compute();

        assert_eq!(mags.length() as usize, analyzer.num_bins());
    }

    #[test]
    fn test_loudness_meter() {
        let mut meter = LoudnessMeter::new(48000.0);

        // Process some samples
        for i in 0..48000 {
            let sample = (i as f32 * 0.01).sin() * 0.5;
            meter.process(sample, sample);
        }

        meter.compute();
        let lufs = meter.get_momentary();

        // Should be a reasonable value
        assert!(lufs > -100.0);
        assert!(lufs < 0.0);
    }

    #[test]
    fn test_correlation_mono() {
        let mut meter = CorrelationMeter::new(44100.0);

        // Mono signal (L = R)
        for i in 0..44100 {
            let sample = (i as f32 * 0.01).sin();
            meter.process(sample, sample);
        }

        let corr = meter.get_correlation();
        assert!(corr > 0.99); // Should be ~1.0 for mono
    }
}

//! Procedural sound synthesis
//!
//! - Oscillators (sine, saw, square, triangle, noise)
//! - Wavetable synthesis
//! - FM synthesis
//! - Additive synthesis
//! - Noise generators

use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

const TWO_PI: f32 = 2.0 * PI;

/// Basic oscillator with multiple waveforms
#[wasm_bindgen]
pub struct Oscillator {
    phase: f32,
    frequency: f32,
    sample_rate: f32,
    waveform: u8, // 0=sine, 1=saw, 2=square, 3=triangle, 4=noise

    // For band-limited waveforms (polyBLEP)
    phase_increment: f32,

    // Noise state (xorshift)
    noise_state: u32,
}

#[wasm_bindgen]
impl Oscillator {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        Self {
            phase: 0.0,
            frequency: 440.0,
            sample_rate,
            waveform: 0,
            phase_increment: 440.0 / sample_rate,
            noise_state: 12345,
        }
    }

    /// Set frequency in Hz
    #[wasm_bindgen]
    pub fn set_frequency(&mut self, freq: f32) {
        self.frequency = freq.clamp(0.01, self.sample_rate * 0.49);
        self.phase_increment = self.frequency / self.sample_rate;
    }

    /// Set waveform: 0=sine, 1=saw, 2=square, 3=triangle, 4=noise
    #[wasm_bindgen]
    pub fn set_waveform(&mut self, waveform: u8) {
        self.waveform = waveform.min(4);
    }

    /// Reset phase
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.phase = 0.0;
    }

    /// PolyBLEP for anti-aliased waveforms
    #[inline(always)]
    fn poly_blep(&self, t: f32) -> f32 {
        let dt = self.phase_increment;

        if t < dt {
            let t_norm = t / dt;
            2.0 * t_norm - t_norm * t_norm - 1.0
        } else if t > 1.0 - dt {
            let t_norm = (t - 1.0) / dt;
            t_norm * t_norm + 2.0 * t_norm + 1.0
        } else {
            0.0
        }
    }

    /// Generate next sample
    #[wasm_bindgen]
    pub fn process(&mut self) -> f32 {
        let output = match self.waveform {
            0 => {
                // Sine
                (self.phase * TWO_PI).sin()
            }
            1 => {
                // Saw (band-limited with polyBLEP)
                let mut saw = 2.0 * self.phase - 1.0;
                saw -= self.poly_blep(self.phase);
                saw
            }
            2 => {
                // Square (band-limited with polyBLEP)
                let mut square = if self.phase < 0.5 { 1.0 } else { -1.0 };
                square += self.poly_blep(self.phase);
                square -= self.poly_blep((self.phase + 0.5) % 1.0);
                square
            }
            3 => {
                // Triangle (integrated square)
                let phase2 = self.phase * 2.0;
                if phase2 < 1.0 {
                    -1.0 + 2.0 * phase2
                } else {
                    3.0 - 2.0 * phase2
                }
            }
            4 => {
                // White noise (xorshift)
                self.noise_state ^= self.noise_state << 13;
                self.noise_state ^= self.noise_state >> 17;
                self.noise_state ^= self.noise_state << 5;
                (self.noise_state as f32 / u32::MAX as f32) * 2.0 - 1.0
            }
            _ => 0.0,
        };

        // Advance phase
        self.phase += self.phase_increment;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        output
    }

    /// Fill buffer with oscillator output
    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process();
        }
    }
}

/// FM (Frequency Modulation) synthesizer
/// Classic 2-operator FM
#[wasm_bindgen]
pub struct FmSynth {
    // Carrier
    carrier_phase: f32,
    carrier_freq: f32,

    // Modulator
    mod_phase: f32,
    mod_ratio: f32,      // Frequency ratio to carrier
    mod_index: f32,      // Modulation depth

    sample_rate: f32,

    // Envelope
    env_state: f32,
    env_attack: f32,
    env_decay: f32,
    env_sustain: f32,
    env_release: f32,
    env_stage: u8, // 0=idle, 1=attack, 2=decay, 3=sustain, 4=release
    gate: bool,
}

#[wasm_bindgen]
impl FmSynth {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        Self {
            carrier_phase: 0.0,
            carrier_freq: 440.0,
            mod_phase: 0.0,
            mod_ratio: 2.0,
            mod_index: 1.0,
            sample_rate,
            env_state: 0.0,
            env_attack: 0.01,
            env_decay: 0.1,
            env_sustain: 0.7,
            env_release: 0.3,
            env_stage: 0,
            gate: false,
        }
    }

    /// Set carrier frequency
    #[wasm_bindgen]
    pub fn set_frequency(&mut self, freq: f32) {
        self.carrier_freq = freq.clamp(20.0, 20000.0);
    }

    /// Set modulator ratio (e.g., 2.0 = modulator is 2x carrier freq)
    #[wasm_bindgen]
    pub fn set_mod_ratio(&mut self, ratio: f32) {
        self.mod_ratio = ratio.clamp(0.1, 16.0);
    }

    /// Set modulation index (depth)
    #[wasm_bindgen]
    pub fn set_mod_index(&mut self, index: f32) {
        self.mod_index = index.clamp(0.0, 20.0);
    }

    /// Set ADSR envelope (times in seconds)
    #[wasm_bindgen]
    pub fn set_envelope(&mut self, attack: f32, decay: f32, sustain: f32, release: f32) {
        self.env_attack = attack.max(0.001);
        self.env_decay = decay.max(0.001);
        self.env_sustain = sustain.clamp(0.0, 1.0);
        self.env_release = release.max(0.001);
    }

    /// Note on
    #[wasm_bindgen]
    pub fn note_on(&mut self) {
        self.gate = true;
        self.env_stage = 1; // Attack
    }

    /// Note off
    #[wasm_bindgen]
    pub fn note_off(&mut self) {
        self.gate = false;
        if self.env_stage != 0 {
            self.env_stage = 4; // Release
        }
    }

    fn process_envelope(&mut self) -> f32 {
        let rate = 1.0 / self.sample_rate;

        match self.env_stage {
            0 => {
                // Idle
                self.env_state = 0.0;
            }
            1 => {
                // Attack
                self.env_state += rate / self.env_attack;
                if self.env_state >= 1.0 {
                    self.env_state = 1.0;
                    self.env_stage = 2;
                }
            }
            2 => {
                // Decay
                self.env_state -= rate / self.env_decay * (1.0 - self.env_sustain);
                if self.env_state <= self.env_sustain {
                    self.env_state = self.env_sustain;
                    self.env_stage = 3;
                }
            }
            3 => {
                // Sustain (just hold)
                self.env_state = self.env_sustain;
            }
            4 => {
                // Release
                self.env_state -= rate / self.env_release * self.env_state;
                if self.env_state <= 0.001 {
                    self.env_state = 0.0;
                    self.env_stage = 0;
                }
            }
            _ => {}
        }

        self.env_state
    }

    /// Generate next sample
    #[wasm_bindgen]
    pub fn process(&mut self) -> f32 {
        let env = self.process_envelope();

        if env < 0.001 {
            return 0.0;
        }

        // Modulator frequency
        let mod_freq = self.carrier_freq * self.mod_ratio;
        let mod_phase_inc = mod_freq / self.sample_rate;

        // Modulator output
        let modulator = (self.mod_phase * TWO_PI).sin();

        // Carrier with FM
        let carrier_phase_inc = self.carrier_freq / self.sample_rate;
        let fm_amount = modulator * self.mod_index * env; // Envelope affects FM depth
        let carrier = ((self.carrier_phase + fm_amount) * TWO_PI).sin();

        // Advance phases
        self.carrier_phase += carrier_phase_inc;
        if self.carrier_phase >= 1.0 {
            self.carrier_phase -= 1.0;
        }

        self.mod_phase += mod_phase_inc;
        if self.mod_phase >= 1.0 {
            self.mod_phase -= 1.0;
        }

        carrier * env
    }

    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process();
        }
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.carrier_phase = 0.0;
        self.mod_phase = 0.0;
        self.env_state = 0.0;
        self.env_stage = 0;
    }
}

/// Wavetable oscillator
#[wasm_bindgen]
pub struct WavetableOsc {
    wavetable: Vec<f32>,
    table_size: usize,
    phase: f32,
    phase_increment: f32,
    sample_rate: f32,
}

#[wasm_bindgen]
impl WavetableOsc {
    /// Create with a preset wavetable
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, table_size: usize) -> Self {
        let table_size = table_size.max(256);

        // Default to sine wave
        let wavetable: Vec<f32> = (0..table_size)
            .map(|i| (i as f32 / table_size as f32 * TWO_PI).sin())
            .collect();

        Self {
            wavetable,
            table_size,
            phase: 0.0,
            phase_increment: 440.0 / sample_rate,
            sample_rate,
        }
    }

    /// Set custom wavetable
    #[wasm_bindgen]
    pub fn set_wavetable(&mut self, table: &[f32]) {
        self.wavetable = table.to_vec();
        self.table_size = table.len();
    }

    /// Generate preset wavetables
    #[wasm_bindgen]
    pub fn set_preset(&mut self, preset: u8) {
        let size = self.table_size;

        self.wavetable = match preset {
            0 => {
                // Sine
                (0..size).map(|i| (i as f32 / size as f32 * TWO_PI).sin()).collect()
            }
            1 => {
                // Saw (additive harmonics)
                (0..size).map(|i| {
                    let mut sum = 0.0;
                    for h in 1..=16 {
                        sum += (h as f32 * i as f32 / size as f32 * TWO_PI).sin() / h as f32;
                    }
                    sum * 0.5
                }).collect()
            }
            2 => {
                // Square (odd harmonics)
                (0..size).map(|i| {
                    let mut sum = 0.0;
                    for h in (1..=15).step_by(2) {
                        sum += (h as f32 * i as f32 / size as f32 * TWO_PI).sin() / h as f32;
                    }
                    sum * 0.6
                }).collect()
            }
            3 => {
                // PWM 25%
                (0..size).map(|i| {
                    if (i as f32 / size as f32) < 0.25 { 1.0 } else { -1.0 }
                }).collect()
            }
            4 => {
                // Organ-like (multiple harmonics)
                (0..size).map(|i| {
                    let phase = i as f32 / size as f32 * TWO_PI;
                    phase.sin() * 0.5 +
                    (phase * 2.0).sin() * 0.3 +
                    (phase * 3.0).sin() * 0.15 +
                    (phase * 4.0).sin() * 0.05
                }).collect()
            }
            5 => {
                // Bell-like (inharmonic)
                (0..size).map(|i| {
                    let phase = i as f32 / size as f32 * TWO_PI;
                    phase.sin() * 0.4 +
                    (phase * 2.3).sin() * 0.3 +
                    (phase * 3.7).sin() * 0.2 +
                    (phase * 5.1).sin() * 0.1
                }).collect()
            }
            _ => {
                // Default sine
                (0..size).map(|i| (i as f32 / size as f32 * TWO_PI).sin()).collect()
            }
        };
    }

    /// Set frequency
    #[wasm_bindgen]
    pub fn set_frequency(&mut self, freq: f32) {
        self.phase_increment = freq.clamp(0.01, self.sample_rate * 0.49) / self.sample_rate;
    }

    /// Generate next sample with linear interpolation
    #[wasm_bindgen]
    pub fn process(&mut self) -> f32 {
        let table_phase = self.phase * self.table_size as f32;
        let index = table_phase as usize;
        let frac = table_phase.fract();

        // Linear interpolation
        let s0 = self.wavetable[index % self.table_size];
        let s1 = self.wavetable[(index + 1) % self.table_size];
        let output = s0 + (s1 - s0) * frac;

        // Advance phase
        self.phase += self.phase_increment;
        if self.phase >= 1.0 {
            self.phase -= 1.0;
        }

        output
    }

    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process();
        }
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.phase = 0.0;
    }
}

/// Noise generators
#[wasm_bindgen]
pub struct NoiseGenerator {
    // Xorshift state for white noise
    state: u32,

    // Pink noise filter state (Paul Kellet's algorithm)
    pink_b0: f32,
    pink_b1: f32,
    pink_b2: f32,
    pink_b3: f32,
    pink_b4: f32,
    pink_b5: f32,
    pink_b6: f32,

    noise_type: u8, // 0=white, 1=pink, 2=brown

    // Brown noise state
    brown_state: f32,
}

#[wasm_bindgen]
impl NoiseGenerator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            state: 12345678,
            pink_b0: 0.0,
            pink_b1: 0.0,
            pink_b2: 0.0,
            pink_b3: 0.0,
            pink_b4: 0.0,
            pink_b5: 0.0,
            pink_b6: 0.0,
            noise_type: 0,
            brown_state: 0.0,
        }
    }

    /// Set noise type: 0=white, 1=pink, 2=brown/red
    #[wasm_bindgen]
    pub fn set_type(&mut self, noise_type: u8) {
        self.noise_type = noise_type.min(2);
    }

    /// Generate white noise (xorshift)
    #[inline(always)]
    fn white(&mut self) -> f32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 17;
        self.state ^= self.state << 5;
        (self.state as f32 / u32::MAX as f32) * 2.0 - 1.0
    }

    /// Generate next sample
    #[wasm_bindgen]
    pub fn process(&mut self) -> f32 {
        match self.noise_type {
            0 => {
                // White noise
                self.white()
            }
            1 => {
                // Pink noise (Paul Kellet's refined method)
                let white = self.white();

                self.pink_b0 = 0.99886 * self.pink_b0 + white * 0.0555179;
                self.pink_b1 = 0.99332 * self.pink_b1 + white * 0.0750759;
                self.pink_b2 = 0.96900 * self.pink_b2 + white * 0.1538520;
                self.pink_b3 = 0.86650 * self.pink_b3 + white * 0.3104856;
                self.pink_b4 = 0.55000 * self.pink_b4 + white * 0.5329522;
                self.pink_b5 = -0.7616 * self.pink_b5 - white * 0.0168980;

                let pink = self.pink_b0 + self.pink_b1 + self.pink_b2 +
                           self.pink_b3 + self.pink_b4 + self.pink_b5 +
                           self.pink_b6 + white * 0.5362;

                self.pink_b6 = white * 0.115926;

                pink * 0.11 // Normalize
            }
            2 => {
                // Brown/Red noise (integrated white noise)
                let white = self.white();
                self.brown_state = (self.brown_state + white * 0.02).clamp(-1.0, 1.0);
                self.brown_state * 3.5 // Boost level
            }
            _ => 0.0,
        }
    }

    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process();
        }
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.pink_b0 = 0.0;
        self.pink_b1 = 0.0;
        self.pink_b2 = 0.0;
        self.pink_b3 = 0.0;
        self.pink_b4 = 0.0;
        self.pink_b5 = 0.0;
        self.pink_b6 = 0.0;
        self.brown_state = 0.0;
    }
}

impl Default for NoiseGenerator {
    fn default() -> Self {
        Self::new()
    }
}

/// Additive synthesizer (sum of sine partials)
#[wasm_bindgen]
pub struct AdditiveSynth {
    num_partials: usize,
    phases: Vec<f32>,
    frequencies: Vec<f32>,
    amplitudes: Vec<f32>,
    base_frequency: f32,
    sample_rate: f32,
}

#[wasm_bindgen]
impl AdditiveSynth {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32, num_partials: usize) -> Self {
        let num_partials = num_partials.clamp(1, 64);

        // Default to harmonic series with 1/n amplitude falloff
        let frequencies: Vec<f32> = (1..=num_partials).map(|n| n as f32).collect();
        let amplitudes: Vec<f32> = (1..=num_partials).map(|n| 1.0 / n as f32).collect();

        Self {
            num_partials,
            phases: vec![0.0; num_partials],
            frequencies,
            amplitudes,
            base_frequency: 440.0,
            sample_rate,
        }
    }

    /// Set base frequency
    #[wasm_bindgen]
    pub fn set_frequency(&mut self, freq: f32) {
        self.base_frequency = freq.clamp(20.0, 20000.0);
    }

    /// Set partial ratios (frequency multipliers)
    #[wasm_bindgen]
    pub fn set_partial_ratios(&mut self, ratios: &[f32]) {
        for (i, &ratio) in ratios.iter().take(self.num_partials).enumerate() {
            self.frequencies[i] = ratio;
        }
    }

    /// Set partial amplitudes
    #[wasm_bindgen]
    pub fn set_partial_amplitudes(&mut self, amps: &[f32]) {
        for (i, &amp) in amps.iter().take(self.num_partials).enumerate() {
            self.amplitudes[i] = amp.clamp(0.0, 1.0);
        }
    }

    /// Set harmonic falloff (1/n^power)
    #[wasm_bindgen]
    pub fn set_harmonic_falloff(&mut self, power: f32) {
        for i in 0..self.num_partials {
            self.frequencies[i] = (i + 1) as f32;
            self.amplitudes[i] = 1.0 / ((i + 1) as f32).powf(power);
        }
    }

    /// Generate next sample
    #[wasm_bindgen]
    pub fn process(&mut self) -> f32 {
        let mut output = 0.0;

        for i in 0..self.num_partials {
            let freq = self.base_frequency * self.frequencies[i];

            // Skip partials above Nyquist
            if freq >= self.sample_rate * 0.5 {
                continue;
            }

            output += (self.phases[i] * TWO_PI).sin() * self.amplitudes[i];

            // Advance phase
            self.phases[i] += freq / self.sample_rate;
            if self.phases[i] >= 1.0 {
                self.phases[i] -= 1.0;
            }
        }

        // Normalize
        output / (self.num_partials as f32).sqrt()
    }

    #[wasm_bindgen]
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process();
        }
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.phases.fill(0.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_oscillator() {
        let mut osc = Oscillator::new(44100.0);
        osc.set_frequency(440.0);

        // Generate samples
        let mut buffer = vec![0.0; 1024];
        osc.process_buffer(&mut buffer);

        // Check output is in valid range
        for sample in &buffer {
            assert!(*sample >= -1.0 && *sample <= 1.0);
        }
    }

    #[test]
    fn test_fm_synth() {
        let mut fm = FmSynth::new(44100.0);
        fm.set_frequency(440.0);
        fm.set_mod_ratio(2.0);
        fm.set_mod_index(5.0);
        fm.note_on();

        // Generate samples
        let mut buffer = vec![0.0; 4410];
        fm.process_buffer(&mut buffer);

        // Should have output during attack
        let max = buffer.iter().fold(0.0f32, |a, &b| a.max(b.abs()));
        assert!(max > 0.0);
    }

    #[test]
    fn test_noise() {
        let mut noise = NoiseGenerator::new();

        // Test white noise
        noise.set_type(0);
        let mut buffer = vec![0.0; 1000];
        noise.process_buffer(&mut buffer);

        // Check variance (white noise should have good distribution)
        let mean: f32 = buffer.iter().sum::<f32>() / buffer.len() as f32;
        assert!(mean.abs() < 0.2); // Mean should be near 0

        // Test pink noise
        noise.set_type(1);
        noise.process_buffer(&mut buffer);

        // Test brown noise
        noise.set_type(2);
        noise.process_buffer(&mut buffer);
    }
}

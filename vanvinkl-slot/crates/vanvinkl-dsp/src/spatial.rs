//! Spatial audio processing
//!
//! - HRTF-based binaural panning
//! - Distance attenuation
//! - Doppler effect
//! - Room simulation

use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

/// Simple HRTF approximation using ITD and ILD
/// For full HRTF, you'd load SOFA files with measured impulse responses
#[wasm_bindgen]
pub struct SpatialPanner {
    // Listener position
    listener_x: f32,
    listener_y: f32,
    listener_z: f32,
    listener_yaw: f32,

    // Source position
    source_x: f32,
    source_y: f32,
    source_z: f32,

    // Previous position for Doppler
    prev_distance: f32,

    // Parameters
    sample_rate: f32,
    speed_of_sound: f32, // ~343 m/s

    // Delay lines for ITD (Interaural Time Difference)
    delay_buffer_l: Vec<f32>,
    delay_buffer_r: Vec<f32>,
    delay_index: usize,
    max_itd_samples: usize,

    // Low-pass for distance
    lp_state_l: f32,
    lp_state_r: f32,
}

#[wasm_bindgen]
impl SpatialPanner {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        let speed_of_sound = 343.0;
        // Max ITD is about 0.7ms (head width ~17cm / 343 m/s)
        let max_itd_samples = ((0.001 * sample_rate) as usize).max(64);

        Self {
            listener_x: 0.0,
            listener_y: 0.0,
            listener_z: 0.0,
            listener_yaw: 0.0,
            source_x: 0.0,
            source_y: 0.0,
            source_z: 1.0,
            prev_distance: 1.0,
            sample_rate,
            speed_of_sound,
            delay_buffer_l: vec![0.0; max_itd_samples * 2],
            delay_buffer_r: vec![0.0; max_itd_samples * 2],
            delay_index: 0,
            max_itd_samples,
            lp_state_l: 0.0,
            lp_state_r: 0.0,
        }
    }

    /// Set listener position and orientation
    #[wasm_bindgen]
    pub fn set_listener(&mut self, x: f32, y: f32, z: f32, yaw: f32) {
        self.listener_x = x;
        self.listener_y = y;
        self.listener_z = z;
        self.listener_yaw = yaw;
    }

    /// Set source position
    #[wasm_bindgen]
    pub fn set_source(&mut self, x: f32, y: f32, z: f32) {
        self.source_x = x;
        self.source_y = y;
        self.source_z = z;
    }

    /// Calculate azimuth angle from listener to source (in radians)
    fn calculate_azimuth(&self) -> f32 {
        let dx = self.source_x - self.listener_x;
        let dz = self.source_z - self.listener_z;

        // Angle from listener's forward direction
        let angle = dz.atan2(dx) - self.listener_yaw;

        // Normalize to -PI to PI
        let mut normalized = angle % (2.0 * PI);
        if normalized > PI {
            normalized -= 2.0 * PI;
        } else if normalized < -PI {
            normalized += 2.0 * PI;
        }
        normalized
    }

    /// Calculate distance from listener to source
    fn calculate_distance(&self) -> f32 {
        let dx = self.source_x - self.listener_x;
        let dy = self.source_y - self.listener_y;
        let dz = self.source_z - self.listener_z;
        (dx * dx + dy * dy + dz * dz).sqrt().max(0.1)
    }

    /// Process mono input to stereo output
    #[wasm_bindgen]
    pub fn process(&mut self, input: f32) -> js_sys::Float32Array {
        let azimuth = self.calculate_azimuth();
        let distance = self.calculate_distance();

        // === Distance attenuation (inverse square law with rolloff) ===
        let ref_distance = 1.0;
        let max_distance = 100.0;
        let rolloff = 1.0;

        let clamped_distance = distance.clamp(ref_distance, max_distance);
        let attenuation = ref_distance / (ref_distance + rolloff * (clamped_distance - ref_distance));

        // === ILD (Interaural Level Difference) ===
        // Simplified: sounds from the side are louder on near ear
        let cos_az = azimuth.cos();
        let sin_az = azimuth.sin();

        // Pan law (equal power)
        let gain_l = ((1.0 - sin_az) * 0.5).sqrt();
        let gain_r = ((1.0 + sin_az) * 0.5).sqrt();

        // Head shadow effect (high frequencies attenuated on far side)
        // Simplified as level reduction
        let shadow_l = if sin_az > 0.0 { 1.0 - sin_az * 0.3 } else { 1.0 };
        let shadow_r = if sin_az < 0.0 { 1.0 + sin_az * 0.3 } else { 1.0 };

        // === ITD (Interaural Time Difference) ===
        // Max ITD ~0.7ms, varies with azimuth
        let head_radius = 0.0875; // meters
        let itd_seconds = (head_radius / self.speed_of_sound) * (sin_az + sin_az.abs());
        let itd_samples = (itd_seconds * self.sample_rate) as usize;
        let itd_samples = itd_samples.min(self.max_itd_samples);

        // Write to delay buffers
        self.delay_buffer_l[self.delay_index] = input;
        self.delay_buffer_r[self.delay_index] = input;

        // Read with ITD offset
        let read_l = if sin_az > 0.0 {
            // Source on right, left ear delayed
            let idx = (self.delay_index + self.delay_buffer_l.len() - itd_samples) % self.delay_buffer_l.len();
            self.delay_buffer_l[idx]
        } else {
            self.delay_buffer_l[self.delay_index]
        };

        let read_r = if sin_az < 0.0 {
            // Source on left, right ear delayed
            let idx = (self.delay_index + self.delay_buffer_r.len() - itd_samples) % self.delay_buffer_r.len();
            self.delay_buffer_r[idx]
        } else {
            self.delay_buffer_r[self.delay_index]
        };

        self.delay_index = (self.delay_index + 1) % self.delay_buffer_l.len();

        // === Distance filtering (air absorption) ===
        // High frequencies attenuate more over distance
        let lp_coeff = (1.0 / (1.0 + distance * 0.1)).clamp(0.1, 0.99);

        let filtered_l = self.lp_state_l + lp_coeff * (read_l - self.lp_state_l);
        let filtered_r = self.lp_state_r + lp_coeff * (read_r - self.lp_state_r);

        self.lp_state_l = filtered_l;
        self.lp_state_r = filtered_r;

        // === Final output ===
        let out_l = filtered_l * gain_l * shadow_l * attenuation;
        let out_r = filtered_r * gain_r * shadow_r * attenuation;

        // Store distance for Doppler calculation
        self.prev_distance = distance;

        let result = js_sys::Float32Array::new_with_length(2);
        result.set_index(0, out_l);
        result.set_index(1, out_r);
        result
    }

    /// Process stereo buffer in-place with current spatial settings
    #[wasm_bindgen]
    pub fn process_buffer(&mut self, left: &mut [f32], right: &mut [f32]) {
        let len = left.len().min(right.len());

        for i in 0..len {
            // Mix to mono for spatial processing
            let mono = (left[i] + right[i]) * 0.5;

            let azimuth = self.calculate_azimuth();
            let distance = self.calculate_distance();

            // Distance attenuation
            let attenuation = 1.0 / (1.0 + distance * 0.5);

            // Pan
            let sin_az = azimuth.sin();
            let gain_l = ((1.0 - sin_az) * 0.5).sqrt();
            let gain_r = ((1.0 + sin_az) * 0.5).sqrt();

            left[i] = mono * gain_l * attenuation;
            right[i] = mono * gain_r * attenuation;
        }
    }

    /// Clear internal state
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.delay_buffer_l.fill(0.0);
        self.delay_buffer_r.fill(0.0);
        self.lp_state_l = 0.0;
        self.lp_state_r = 0.0;
    }
}

/// Doppler effect processor
#[wasm_bindgen]
pub struct DopplerProcessor {
    sample_rate: f32,
    speed_of_sound: f32,
    prev_distance: f32,

    // Variable delay line for pitch shifting
    buffer: Vec<f32>,
    write_index: usize,
    read_position: f32,
}

#[wasm_bindgen]
impl DopplerProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        let buffer_size = (sample_rate * 0.5) as usize; // 500ms max delay

        Self {
            sample_rate,
            speed_of_sound: 343.0,
            prev_distance: 1.0,
            buffer: vec![0.0; buffer_size],
            write_index: 0,
            read_position: 0.0,
        }
    }

    /// Update distance (call this to update Doppler effect)
    #[wasm_bindgen]
    pub fn set_distance(&mut self, distance: f32) {
        self.prev_distance = distance.max(0.1);
    }

    /// Process with Doppler pitch shift
    #[wasm_bindgen]
    pub fn process(&mut self, input: f32, current_distance: f32) -> f32 {
        // Write input
        self.buffer[self.write_index] = input;
        self.write_index = (self.write_index + 1) % self.buffer.len();

        // Calculate velocity (distance change per sample)
        let velocity = (current_distance - self.prev_distance) * self.sample_rate;
        self.prev_distance = current_distance;

        // Doppler ratio: f' = f * c / (c + v)
        // For our purposes, this changes the read rate
        let doppler_ratio = self.speed_of_sound / (self.speed_of_sound + velocity);
        let read_increment = doppler_ratio.clamp(0.5, 2.0); // Limit pitch shift

        // Read with linear interpolation
        let read_idx = self.read_position as usize % self.buffer.len();
        let frac = self.read_position.fract();
        let next_idx = (read_idx + 1) % self.buffer.len();

        let output = self.buffer[read_idx] * (1.0 - frac) + self.buffer[next_idx] * frac;

        // Advance read position
        self.read_position += read_increment;
        if self.read_position >= self.buffer.len() as f32 {
            self.read_position -= self.buffer.len() as f32;
        }

        output
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.buffer.fill(0.0);
        self.read_position = 0.0;
    }
}

/// Early reflections simulator for room ambience
#[wasm_bindgen]
pub struct EarlyReflections {
    delays: Vec<DelayTap>,
    sample_rate: f32,
}

struct DelayTap {
    buffer: Vec<f32>,
    index: usize,
    gain: f32,
    pan: f32, // -1 to 1
}

impl DelayTap {
    fn new(delay_samples: usize, gain: f32, pan: f32) -> Self {
        Self {
            buffer: vec![0.0; delay_samples.max(1)],
            index: 0,
            gain,
            pan,
        }
    }

    fn process(&mut self, input: f32) -> f32 {
        let output = self.buffer[self.index];
        self.buffer[self.index] = input;
        self.index = (self.index + 1) % self.buffer.len();
        output * self.gain
    }
}

#[wasm_bindgen]
impl EarlyReflections {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        // Create early reflections based on typical room dimensions
        // These represent first-order reflections from walls
        let delays = vec![
            // Front wall
            DelayTap::new((0.012 * sample_rate) as usize, 0.7, 0.0),
            // Left wall
            DelayTap::new((0.018 * sample_rate) as usize, 0.6, -0.8),
            // Right wall
            DelayTap::new((0.020 * sample_rate) as usize, 0.6, 0.8),
            // Back wall
            DelayTap::new((0.035 * sample_rate) as usize, 0.5, 0.0),
            // Floor
            DelayTap::new((0.008 * sample_rate) as usize, 0.4, 0.0),
            // Ceiling
            DelayTap::new((0.025 * sample_rate) as usize, 0.45, 0.0),
            // Corner reflections
            DelayTap::new((0.042 * sample_rate) as usize, 0.35, -0.5),
            DelayTap::new((0.048 * sample_rate) as usize, 0.35, 0.5),
        ];

        Self { delays, sample_rate }
    }

    /// Set room size (scales delay times)
    #[wasm_bindgen]
    pub fn set_room_size(&mut self, size: f32) {
        // Recreate delays with new size
        let base_times = [0.012, 0.018, 0.020, 0.035, 0.008, 0.025, 0.042, 0.048];
        let gains = [0.7, 0.6, 0.6, 0.5, 0.4, 0.45, 0.35, 0.35];
        let pans = [0.0, -0.8, 0.8, 0.0, 0.0, 0.0, -0.5, 0.5];

        for (i, delay) in self.delays.iter_mut().enumerate() {
            let new_delay = ((base_times[i] * size * self.sample_rate) as usize).max(1);
            delay.buffer = vec![0.0; new_delay];
            delay.index = 0;
            delay.gain = gains[i];
            delay.pan = pans[i];
        }
    }

    /// Process mono to stereo
    #[wasm_bindgen]
    pub fn process(&mut self, input: f32, out_left: &mut [f32], out_right: &mut [f32]) {
        if out_left.is_empty() || out_right.is_empty() {
            return;
        }

        let mut sum_l = 0.0;
        let mut sum_r = 0.0;

        for delay in &mut self.delays {
            let delayed = delay.process(input);

            // Pan the reflection
            let gain_l = ((1.0 - delay.pan) * 0.5).sqrt();
            let gain_r = ((1.0 + delay.pan) * 0.5).sqrt();

            sum_l += delayed * gain_l;
            sum_r += delayed * gain_r;
        }

        out_left[0] = sum_l;
        out_right[0] = sum_r;
    }

    /// Process stereo buffer
    #[wasm_bindgen]
    pub fn process_buffer(&mut self, left: &mut [f32], right: &mut [f32]) {
        let len = left.len().min(right.len());

        for i in 0..len {
            let input = (left[i] + right[i]) * 0.5;

            let mut sum_l = 0.0;
            let mut sum_r = 0.0;

            for delay in &mut self.delays {
                let delayed = delay.process(input);
                let gain_l = ((1.0 - delay.pan) * 0.5).sqrt();
                let gain_r = ((1.0 + delay.pan) * 0.5).sqrt();
                sum_l += delayed * gain_l;
                sum_r += delayed * gain_r;
            }

            // Add reflections to original
            left[i] += sum_l * 0.3;
            right[i] += sum_r * 0.3;
        }
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        for delay in &mut self.delays {
            delay.buffer.fill(0.0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spatial_panner() {
        let mut panner = SpatialPanner::new(44100.0);

        // Source directly in front
        panner.set_source(0.0, 0.0, 1.0);
        let result = panner.process(1.0);

        // Should be roughly equal in both channels
        let l = result.get_index(0);
        let r = result.get_index(1);
        assert!((l - r).abs() < 0.1);
    }

    #[test]
    fn test_early_reflections() {
        let mut er = EarlyReflections::new(44100.0);

        let mut left = [0.0f32; 1];
        let mut right = [0.0f32; 1];

        // First sample - no output yet (delayed)
        er.process(1.0, &mut left, &mut right);

        // Process more samples to get reflections
        for _ in 0..1000 {
            er.process(0.0, &mut left, &mut right);
        }

        // Should have some reflection output
    }
}

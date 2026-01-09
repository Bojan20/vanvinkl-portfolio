let wasm;

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

const AdditiveSynthFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_additivesynth_free(ptr >>> 0, 1));

const AlgorithmicReverbFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_algorithmicreverb_free(ptr >>> 0, 1));

const BiquadFilterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_biquadfilter_free(ptr >>> 0, 1));

const ConvolutionReverbFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_convolutionreverb_free(ptr >>> 0, 1));

const CorrelationMeterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_correlationmeter_free(ptr >>> 0, 1));

const DelayLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_delayline_free(ptr >>> 0, 1));

const DopplerProcessorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dopplerprocessor_free(ptr >>> 0, 1));

const DspProcessorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dspprocessor_free(ptr >>> 0, 1));

const EarlyReflectionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_earlyreflections_free(ptr >>> 0, 1));

const FmSynthFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fmsynth_free(ptr >>> 0, 1));

const GateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gate_free(ptr >>> 0, 1));

const LoudnessMeterFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_loudnessmeter_free(ptr >>> 0, 1));

const MultiBandEQFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_multibandeq_free(ptr >>> 0, 1));

const NoiseGeneratorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_noisegenerator_free(ptr >>> 0, 1));

const OscillatorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_oscillator_free(ptr >>> 0, 1));

const SpatialPannerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spatialpanner_free(ptr >>> 0, 1));

const SpectrumAnalyzerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spectrumanalyzer_free(ptr >>> 0, 1));

const TruePeakDetectorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_truepeakdetector_free(ptr >>> 0, 1));

const WavetableOscFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wavetableosc_free(ptr >>> 0, 1));

/**
 * Additive synthesizer (sum of sine partials)
 */
export class AdditiveSynth {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AdditiveSynthFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_additivesynth_free(ptr, 0);
    }
    /**
     * Set base frequency
     * @param {number} freq
     */
    set_frequency(freq) {
        wasm.additivesynth_set_frequency(this.__wbg_ptr, freq);
    }
    /**
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.additivesynth_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    /**
     * Set partial ratios (frequency multipliers)
     * @param {Float32Array} ratios
     */
    set_partial_ratios(ratios) {
        const ptr0 = passArrayF32ToWasm0(ratios, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.additivesynth_set_partial_ratios(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Set harmonic falloff (1/n^power)
     * @param {number} power
     */
    set_harmonic_falloff(power) {
        wasm.additivesynth_set_harmonic_falloff(this.__wbg_ptr, power);
    }
    /**
     * Set partial amplitudes
     * @param {Float32Array} amps
     */
    set_partial_amplitudes(amps) {
        const ptr0 = passArrayF32ToWasm0(amps, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.additivesynth_set_partial_amplitudes(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number} sample_rate
     * @param {number} num_partials
     */
    constructor(sample_rate, num_partials) {
        const ret = wasm.additivesynth_new(sample_rate, num_partials);
        this.__wbg_ptr = ret >>> 0;
        AdditiveSynthFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    reset() {
        wasm.additivesynth_reset(this.__wbg_ptr);
    }
    /**
     * Generate next sample
     * @returns {number}
     */
    process() {
        const ret = wasm.additivesynth_process(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) AdditiveSynth.prototype[Symbol.dispose] = AdditiveSynth.prototype.free;

/**
 * Freeverb-style algorithmic reverb
 */
export class AlgorithmicReverb {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AlgorithmicReverbFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_algorithmicreverb_free(ptr, 0);
    }
    /**
     * Set damping (0.0 - 1.0, higher = darker)
     * @param {number} damp
     */
    set_damping(damp) {
        wasm.algorithmicreverb_set_damping(this.__wbg_ptr, damp);
    }
    /**
     * Set room size (0.0 - 1.0)
     * @param {number} size
     */
    set_room_size(size) {
        wasm.algorithmicreverb_set_room_size(this.__wbg_ptr, size);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.algorithmicreverb_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        AlgorithmicReverbFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Clear reverb tail
     */
    clear() {
        wasm.algorithmicreverb_clear(this.__wbg_ptr);
    }
    /**
     * Process stereo buffer in-place
     * @param {Float32Array} left
     * @param {Float32Array} right
     */
    process(left, right) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.algorithmicreverb_process(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right);
    }
    /**
     * @param {number} dry
     */
    set_dry(dry) {
        wasm.algorithmicreverb_set_dry(this.__wbg_ptr, dry);
    }
    /**
     * Set wet/dry mix
     * @param {number} wet
     */
    set_wet(wet) {
        wasm.algorithmicreverb_set_wet(this.__wbg_ptr, wet);
    }
    /**
     * Set stereo width (0.0 - 1.0)
     * @param {number} width
     */
    set_width(width) {
        wasm.algorithmicreverb_set_width(this.__wbg_ptr, width);
    }
}
if (Symbol.dispose) AlgorithmicReverb.prototype[Symbol.dispose] = AlgorithmicReverb.prototype.free;

/**
 * Transposed Direct Form II Biquad Filter
 * Most numerically stable implementation for floating-point
 */
export class BiquadFilter {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BiquadFilter.prototype);
        obj.__wbg_ptr = ptr;
        BiquadFilterFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BiquadFilterFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_biquadfilter_free(ptr, 0);
    }
    /**
     * High shelf filter
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @param {number} gain_db
     * @returns {BiquadFilter}
     */
    static high_shelf(sample_rate, frequency, q, gain_db) {
        const ret = wasm.biquadfilter_high_shelf(sample_rate, frequency, q, gain_db);
        return BiquadFilter.__wrap(ret);
    }
    /**
     * Peaking EQ filter
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @param {number} gain_db
     * @returns {BiquadFilter}
     */
    static peaking_eq(sample_rate, frequency, q, gain_db) {
        const ret = wasm.biquadfilter_peaking_eq(sample_rate, frequency, q, gain_db);
        return BiquadFilter.__wrap(ret);
    }
    /**
     * Process a buffer of samples in-place
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.biquadfilter_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    /**
     * Get frequency response magnitude at a given frequency
     * @param {number} frequency
     * @param {number} sample_rate
     * @returns {number}
     */
    get_magnitude_at(frequency, sample_rate) {
        const ret = wasm.biquadfilter_get_magnitude_at(this.__wbg_ptr, frequency, sample_rate);
        return ret;
    }
    /**
     * Create a low-pass filter
     */
    constructor() {
        const ret = wasm.biquadfilter_new();
        this.__wbg_ptr = ret >>> 0;
        BiquadFilterFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Notch filter
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @returns {BiquadFilter}
     */
    static notch(sample_rate, frequency, q) {
        const ret = wasm.biquadfilter_notch(sample_rate, frequency, q);
        return BiquadFilter.__wrap(ret);
    }
    /**
     * Reset filter state
     */
    reset() {
        wasm.biquadfilter_reset(this.__wbg_ptr);
    }
    /**
     * Process a single sample - TDF-II implementation
     * This is the most numerically stable form
     * @param {number} input
     * @returns {number}
     */
    process(input) {
        const ret = wasm.biquadfilter_process(this.__wbg_ptr, input);
        return ret;
    }
    /**
     * All-pass filter (for phase adjustment)
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @returns {BiquadFilter}
     */
    static all_pass(sample_rate, frequency, q) {
        const ret = wasm.biquadfilter_all_pass(sample_rate, frequency, q);
        return BiquadFilter.__wrap(ret);
    }
    /**
     * Low-pass filter
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @returns {BiquadFilter}
     */
    static low_pass(sample_rate, frequency, q) {
        const ret = wasm.biquadfilter_low_pass(sample_rate, frequency, q);
        return BiquadFilter.__wrap(ret);
    }
    /**
     * High-pass filter
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @returns {BiquadFilter}
     */
    static high_pass(sample_rate, frequency, q) {
        const ret = wasm.biquadfilter_high_pass(sample_rate, frequency, q);
        return BiquadFilter.__wrap(ret);
    }
    /**
     * Low shelf filter
     * @param {number} sample_rate
     * @param {number} frequency
     * @param {number} q
     * @param {number} gain_db
     * @returns {BiquadFilter}
     */
    static low_shelf(sample_rate, frequency, q, gain_db) {
        const ret = wasm.biquadfilter_low_shelf(sample_rate, frequency, q, gain_db);
        return BiquadFilter.__wrap(ret);
    }
}
if (Symbol.dispose) BiquadFilter.prototype[Symbol.dispose] = BiquadFilter.prototype.free;

/**
 * Partitioned convolution reverb using FFT
 */
export class ConvolutionReverb {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ConvolutionReverbFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_convolutionreverb_free(ptr, 0);
    }
    /**
     * Set room preset
     * @param {number} preset
     */
    set_preset(preset) {
        wasm.convolutionreverb_set_preset(this.__wbg_ptr, preset);
    }
    /**
     * @param {number} sample_rate
     * @param {number} _block_size
     */
    constructor(sample_rate, _block_size) {
        const ret = wasm.convolutionreverb_new(sample_rate, _block_size);
        this.__wbg_ptr = ret >>> 0;
        ConvolutionReverbFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Clear reverb tail
     */
    clear() {
        wasm.convolutionreverb_clear(this.__wbg_ptr);
    }
    /**
     * Load impulse response (simplified - uses algorithmic parameters)
     * @param {number} room_size
     * @param {number} damping
     */
    load_ir(room_size, damping) {
        wasm.convolutionreverb_load_ir(this.__wbg_ptr, room_size, damping);
    }
    /**
     * Process stereo buffer
     * @param {Float32Array} left
     * @param {Float32Array} right
     */
    process(left, right) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.convolutionreverb_process(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right);
    }
}
if (Symbol.dispose) ConvolutionReverb.prototype[Symbol.dispose] = ConvolutionReverb.prototype.free;

/**
 * Stereo correlation meter
 */
export class CorrelationMeter {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CorrelationMeterFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_correlationmeter_free(ptr, 0);
    }
    /**
     * Get correlation coefficient (-1 to +1)
     * +1 = mono, 0 = uncorrelated, -1 = out of phase
     * @returns {number}
     */
    get_correlation() {
        const ret = wasm.correlationmeter_get_correlation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.correlationmeter_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        CorrelationMeterFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    clear() {
        wasm.correlationmeter_clear(this.__wbg_ptr);
    }
    /**
     * Process stereo sample
     * @param {number} left
     * @param {number} right
     */
    process(left, right) {
        wasm.correlationmeter_process(this.__wbg_ptr, left, right);
    }
}
if (Symbol.dispose) CorrelationMeter.prototype[Symbol.dispose] = CorrelationMeter.prototype.free;

/**
 * Simple delay line for effects
 */
export class DelayLine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DelayLineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_delayline_free(ptr, 0);
    }
    /**
     * Set delay time in milliseconds
     * @param {number} ms
     * @param {number} sample_rate
     */
    set_delay_ms(ms, sample_rate) {
        wasm.delayline_set_delay_ms(this.__wbg_ptr, ms, sample_rate);
    }
    /**
     * Set feedback (0.0 - 0.99)
     * @param {number} feedback
     */
    set_feedback(feedback) {
        wasm.delayline_set_feedback(this.__wbg_ptr, feedback);
    }
    /**
     * @param {number} max_delay_samples
     */
    constructor(max_delay_samples) {
        const ret = wasm.delayline_new(max_delay_samples);
        this.__wbg_ptr = ret >>> 0;
        DelayLineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Clear delay buffer
     */
    clear() {
        wasm.delayline_clear(this.__wbg_ptr);
    }
    /**
     * Process a single sample
     * @param {number} input
     * @returns {number}
     */
    process(input) {
        const ret = wasm.delayline_process(this.__wbg_ptr, input);
        return ret;
    }
    /**
     * Set wet mix
     * @param {number} wet
     */
    set_wet(wet) {
        wasm.delayline_set_wet(this.__wbg_ptr, wet);
    }
    /**
     * Set delay time in samples
     * @param {number} samples
     */
    set_delay(samples) {
        wasm.delayline_set_delay(this.__wbg_ptr, samples);
    }
}
if (Symbol.dispose) DelayLine.prototype[Symbol.dispose] = DelayLine.prototype.free;

/**
 * Doppler effect processor
 */
export class DopplerProcessor {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DopplerProcessorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dopplerprocessor_free(ptr, 0);
    }
    /**
     * Update distance (call this to update Doppler effect)
     * @param {number} distance
     */
    set_distance(distance) {
        wasm.dopplerprocessor_set_distance(this.__wbg_ptr, distance);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.dopplerprocessor_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        DopplerProcessorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    clear() {
        wasm.dopplerprocessor_clear(this.__wbg_ptr);
    }
    /**
     * Process with Doppler pitch shift
     * @param {number} input
     * @param {number} current_distance
     * @returns {number}
     */
    process(input, current_distance) {
        const ret = wasm.dopplerprocessor_process(this.__wbg_ptr, input, current_distance);
        return ret;
    }
}
if (Symbol.dispose) DopplerProcessor.prototype[Symbol.dispose] = DopplerProcessor.prototype.free;

/**
 * Master DSP processor - handles all audio processing in a single call
 */
export class DspProcessor {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DspProcessorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dspprocessor_free(ptr, 0);
    }
    /**
     * Compute and get spectrum data for visualization
     * @returns {Float32Array}
     */
    get_spectrum() {
        const ret = wasm.dspprocessor_get_spectrum(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get true peak level (dBTP)
     * @returns {number}
     */
    get_true_peak() {
        const ret = wasm.dspprocessor_get_true_peak(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set reverb mix (0.0 - 1.0)
     * @param {number} mix
     */
    set_reverb_mix(mix) {
        wasm.dspprocessor_set_reverb_mix(this.__wbg_ptr, mix);
    }
    /**
     * Process with spatial positioning
     * @param {Float32Array} left
     * @param {Float32Array} right
     * @param {number} source_x
     * @param {number} source_y
     * @param {number} source_z
     */
    process_spatial(left, right, source_x, source_y, source_z) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.dspprocessor_process_spatial(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right, source_x, source_y, source_z);
    }
    /**
     * Set reverb damping (0.0 - 1.0)
     * @param {number} damp
     */
    set_reverb_damping(damp) {
        wasm.algorithmicreverb_set_damping(this.__wbg_ptr, damp);
    }
    /**
     * Set compressor ratio
     * @param {number} ratio
     */
    set_compressor_ratio(ratio) {
        wasm.dspprocessor_set_compressor_ratio(this.__wbg_ptr, ratio);
    }
    /**
     * Set reverb room size (0.0 - 1.0)
     * @param {number} size
     */
    set_reverb_room_size(size) {
        wasm.algorithmicreverb_set_room_size(this.__wbg_ptr, size);
    }
    /**
     * Set listener position for spatial audio
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} yaw
     */
    set_listener_position(x, y, z, yaw) {
        wasm.dspprocessor_set_listener_position(this.__wbg_ptr, x, y, z, yaw);
    }
    /**
     * Get momentary loudness (LUFS)
     * @returns {number}
     */
    get_loudness_momentary() {
        const ret = wasm.dspprocessor_get_loudness_momentary(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get short-term loudness (LUFS)
     * @returns {number}
     */
    get_loudness_short_term() {
        const ret = wasm.dspprocessor_get_loudness_short_term(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set compressor threshold in dB
     * @param {number} threshold_db
     */
    set_compressor_threshold(threshold_db) {
        wasm.dspprocessor_set_compressor_threshold(this.__wbg_ptr, threshold_db);
    }
    /**
     * Create a new DSP processor
     * @param {number} sample_rate
     * @param {number} buffer_size
     */
    constructor(sample_rate, buffer_size) {
        const ret = wasm.dspprocessor_new(sample_rate, buffer_size);
        this.__wbg_ptr = ret >>> 0;
        DspProcessorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Reset all processors
     */
    reset() {
        wasm.dspprocessor_reset(this.__wbg_ptr);
    }
    /**
     * Process stereo audio buffer in-place
     * Returns true if clipping was detected
     * @param {Float32Array} left
     * @param {Float32Array} right
     * @returns {boolean}
     */
    process(left, right) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.dspprocessor_process(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right);
        return ret !== 0;
    }
}
if (Symbol.dispose) DspProcessor.prototype[Symbol.dispose] = DspProcessor.prototype.free;

/**
 * Early reflections simulator for room ambience
 */
export class EarlyReflections {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EarlyReflectionsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_earlyreflections_free(ptr, 0);
    }
    /**
     * Set room size (scales delay times)
     * @param {number} size
     */
    set_room_size(size) {
        wasm.earlyreflections_set_room_size(this.__wbg_ptr, size);
    }
    /**
     * Process stereo buffer
     * @param {Float32Array} left
     * @param {Float32Array} right
     */
    process_buffer(left, right) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.earlyreflections_process_buffer(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.earlyreflections_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        EarlyReflectionsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    clear() {
        wasm.earlyreflections_clear(this.__wbg_ptr);
    }
    /**
     * Process mono to stereo
     * @param {number} input
     * @param {Float32Array} out_left
     * @param {Float32Array} out_right
     */
    process(input, out_left, out_right) {
        var ptr0 = passArrayF32ToWasm0(out_left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(out_right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.earlyreflections_process(this.__wbg_ptr, input, ptr0, len0, out_left, ptr1, len1, out_right);
    }
}
if (Symbol.dispose) EarlyReflections.prototype[Symbol.dispose] = EarlyReflections.prototype.free;

/**
 * FM (Frequency Modulation) synthesizer
 * Classic 2-operator FM
 */
export class FmSynth {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FmSynthFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fmsynth_free(ptr, 0);
    }
    /**
     * Set ADSR envelope (times in seconds)
     * @param {number} attack
     * @param {number} decay
     * @param {number} sustain
     * @param {number} release
     */
    set_envelope(attack, decay, sustain, release) {
        wasm.fmsynth_set_envelope(this.__wbg_ptr, attack, decay, sustain, release);
    }
    /**
     * Set carrier frequency
     * @param {number} freq
     */
    set_frequency(freq) {
        wasm.fmsynth_set_frequency(this.__wbg_ptr, freq);
    }
    /**
     * Set modulation index (depth)
     * @param {number} index
     */
    set_mod_index(index) {
        wasm.fmsynth_set_mod_index(this.__wbg_ptr, index);
    }
    /**
     * Set modulator ratio (e.g., 2.0 = modulator is 2x carrier freq)
     * @param {number} ratio
     */
    set_mod_ratio(ratio) {
        wasm.fmsynth_set_mod_ratio(this.__wbg_ptr, ratio);
    }
    /**
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.fmsynth_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.fmsynth_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        FmSynthFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    reset() {
        wasm.fmsynth_reset(this.__wbg_ptr);
    }
    /**
     * Note on
     */
    note_on() {
        wasm.fmsynth_note_on(this.__wbg_ptr);
    }
    /**
     * Generate next sample
     * @returns {number}
     */
    process() {
        const ret = wasm.fmsynth_process(this.__wbg_ptr);
        return ret;
    }
    /**
     * Note off
     */
    note_off() {
        wasm.fmsynth_note_off(this.__wbg_ptr);
    }
}
if (Symbol.dispose) FmSynth.prototype[Symbol.dispose] = FmSynth.prototype.free;

/**
 * Noise gate / Expander
 */
export class Gate {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GateFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gate_free(ptr, 0);
    }
    /**
     * @param {number} sample_rate
     * @param {number} threshold_db
     * @param {number} ratio
     * @param {number} attack_ms
     * @param {number} release_ms
     * @param {number} hold_ms
     */
    constructor(sample_rate, threshold_db, ratio, attack_ms, release_ms, hold_ms) {
        const ret = wasm.gate_new(sample_rate, threshold_db, ratio, attack_ms, release_ms, hold_ms);
        this.__wbg_ptr = ret >>> 0;
        GateFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    reset() {
        wasm.gate_reset(this.__wbg_ptr);
    }
    /**
     * @param {number} input
     * @returns {number}
     */
    process(input) {
        const ret = wasm.gate_process(this.__wbg_ptr, input);
        return ret;
    }
}
if (Symbol.dispose) Gate.prototype[Symbol.dispose] = Gate.prototype.free;

/**
 * LUFS loudness meter (ITU-R BS.1770-4)
 */
export class LoudnessMeter {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LoudnessMeterFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_loudnessmeter_free(ptr, 0);
    }
    /**
     * Get momentary loudness (400ms window)
     * @returns {number}
     */
    get_momentary() {
        const ret = wasm.loudnessmeter_get_momentary(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get integrated loudness (gated, full program)
     * @returns {number}
     */
    get_integrated() {
        const ret = wasm.loudnessmeter_get_integrated(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get short-term loudness (3s window)
     * @returns {number}
     */
    get_short_term() {
        const ret = wasm.loudnessmeter_get_short_term(this.__wbg_ptr);
        return ret;
    }
    /**
     * Reset integrated measurement
     */
    reset_integrated() {
        wasm.loudnessmeter_reset_integrated(this.__wbg_ptr);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.loudnessmeter_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        LoudnessMeterFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    clear() {
        wasm.loudnessmeter_clear(this.__wbg_ptr);
    }
    /**
     * Compute loudness values
     */
    compute() {
        wasm.loudnessmeter_compute(this.__wbg_ptr);
    }
    /**
     * Process stereo sample pair
     * @param {number} left
     * @param {number} right
     */
    process(left, right) {
        wasm.loudnessmeter_process(this.__wbg_ptr, left, right);
    }
}
if (Symbol.dispose) LoudnessMeter.prototype[Symbol.dispose] = LoudnessMeter.prototype.free;

/**
 * Multi-band EQ with 8 bands
 */
export class MultiBandEQ {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MultiBandEQFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_multibandeq_free(ptr, 0);
    }
    /**
     * Process a buffer through all bands
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.multibandeq_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    /**
     * Create a new 8-band EQ
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.multibandeq_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        MultiBandEQFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Reset all bands
     */
    reset() {
        wasm.multibandeq_reset(this.__wbg_ptr);
    }
    /**
     * Set band gain in dB
     * @param {number} band
     * @param {number} gain_db
     * @param {number} sample_rate
     */
    set_band(band, gain_db, sample_rate) {
        wasm.multibandeq_set_band(this.__wbg_ptr, band, gain_db, sample_rate);
    }
}
if (Symbol.dispose) MultiBandEQ.prototype[Symbol.dispose] = MultiBandEQ.prototype.free;

/**
 * Noise generators
 */
export class NoiseGenerator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoiseGeneratorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_noisegenerator_free(ptr, 0);
    }
    /**
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.noisegenerator_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    constructor() {
        const ret = wasm.noisegenerator_new();
        this.__wbg_ptr = ret >>> 0;
        NoiseGeneratorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    reset() {
        wasm.noisegenerator_reset(this.__wbg_ptr);
    }
    /**
     * Generate next sample
     * @returns {number}
     */
    process() {
        const ret = wasm.noisegenerator_process(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set noise type: 0=white, 1=pink, 2=brown/red
     * @param {number} noise_type
     */
    set_type(noise_type) {
        wasm.noisegenerator_set_type(this.__wbg_ptr, noise_type);
    }
}
if (Symbol.dispose) NoiseGenerator.prototype[Symbol.dispose] = NoiseGenerator.prototype.free;

/**
 * Basic oscillator with multiple waveforms
 */
export class Oscillator {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OscillatorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_oscillator_free(ptr, 0);
    }
    /**
     * Set waveform: 0=sine, 1=saw, 2=square, 3=triangle, 4=noise
     * @param {number} waveform
     */
    set_waveform(waveform) {
        wasm.oscillator_set_waveform(this.__wbg_ptr, waveform);
    }
    /**
     * Set frequency in Hz
     * @param {number} freq
     */
    set_frequency(freq) {
        wasm.oscillator_set_frequency(this.__wbg_ptr, freq);
    }
    /**
     * Fill buffer with oscillator output
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.oscillator_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.oscillator_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        OscillatorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Reset phase
     */
    reset() {
        wasm.oscillator_reset(this.__wbg_ptr);
    }
    /**
     * Generate next sample
     * @returns {number}
     */
    process() {
        const ret = wasm.oscillator_process(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Oscillator.prototype[Symbol.dispose] = Oscillator.prototype.free;

/**
 * Simple HRTF approximation using ITD and ILD
 * For full HRTF, you'd load SOFA files with measured impulse responses
 */
export class SpatialPanner {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpatialPannerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spatialpanner_free(ptr, 0);
    }
    /**
     * Set source position
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    set_source(x, y, z) {
        wasm.spatialpanner_set_source(this.__wbg_ptr, x, y, z);
    }
    /**
     * Set listener position and orientation
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} yaw
     */
    set_listener(x, y, z, yaw) {
        wasm.spatialpanner_set_listener(this.__wbg_ptr, x, y, z, yaw);
    }
    /**
     * Process stereo buffer in-place with current spatial settings
     * @param {Float32Array} left
     * @param {Float32Array} right
     */
    process_buffer(left, right) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.spatialpanner_process_buffer(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.spatialpanner_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        SpatialPannerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Clear internal state
     */
    clear() {
        wasm.spatialpanner_clear(this.__wbg_ptr);
    }
    /**
     * Process mono input to stereo output
     * @param {number} input
     * @returns {Float32Array}
     */
    process(input) {
        const ret = wasm.spatialpanner_process(this.__wbg_ptr, input);
        return ret;
    }
}
if (Symbol.dispose) SpatialPanner.prototype[Symbol.dispose] = SpatialPanner.prototype.free;

/**
 * FFT-based spectrum analyzer
 */
export class SpectrumAnalyzer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpectrumAnalyzerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spectrumanalyzer_free(ptr, 0);
    }
    /**
     * Push samples into the analyzer
     * @param {Float32Array} samples
     */
    push_samples(samples) {
        const ptr0 = passArrayF32ToWasm0(samples, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.spectrumanalyzer_push_samples(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Set smoothing factor (0.0 = no smoothing, 0.99 = very smooth)
     * @param {number} smoothing
     */
    set_smoothing(smoothing) {
        wasm.spectrumanalyzer_set_smoothing(this.__wbg_ptr, smoothing);
    }
    /**
     * Get frequency for a given bin index
     * @param {number} bin
     * @returns {number}
     */
    bin_to_frequency(bin) {
        const ret = wasm.spectrumanalyzer_bin_to_frequency(this.__wbg_ptr, bin);
        return ret;
    }
    /**
     * Get bin index for a given frequency
     * @param {number} freq
     * @returns {number}
     */
    frequency_to_bin(freq) {
        const ret = wasm.spectrumanalyzer_frequency_to_bin(this.__wbg_ptr, freq);
        return ret >>> 0;
    }
    /**
     * @param {number} fft_size
     * @param {number} sample_rate
     */
    constructor(fft_size, sample_rate) {
        const ret = wasm.spectrumanalyzer_new(fft_size, sample_rate);
        this.__wbg_ptr = ret >>> 0;
        SpectrumAnalyzerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    clear() {
        wasm.spectrumanalyzer_clear(this.__wbg_ptr);
    }
    /**
     * Compute FFT and return magnitudes in dB
     * @returns {Float32Array}
     */
    compute() {
        const ret = wasm.spectrumanalyzer_compute(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get number of frequency bins
     * @returns {number}
     */
    num_bins() {
        const ret = wasm.spectrumanalyzer_num_bins(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) SpectrumAnalyzer.prototype[Symbol.dispose] = SpectrumAnalyzer.prototype.free;

/**
 * True peak detector with 4x oversampling
 */
export class TruePeakDetector {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TruePeakDetectorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_truepeakdetector_free(ptr, 0);
    }
    /**
     * Get true peak in dBTP (left channel)
     * @returns {number}
     */
    get_peak_l_db() {
        const ret = wasm.truepeakdetector_get_peak_l_db(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get true peak in dBTP (right channel)
     * @returns {number}
     */
    get_peak_r_db() {
        const ret = wasm.truepeakdetector_get_peak_r_db(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get max true peak in dBTP
     * @returns {number}
     */
    get_max_peak_db() {
        const ret = wasm.truepeakdetector_get_max_peak_db(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.truepeakdetector_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        TruePeakDetectorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    clear() {
        wasm.truepeakdetector_clear(this.__wbg_ptr);
    }
    /**
     * Reset peaks
     */
    reset() {
        wasm.truepeakdetector_reset(this.__wbg_ptr);
    }
    /**
     * Process stereo sample and detect true peak
     * @param {number} left
     * @param {number} right
     */
    process(left, right) {
        wasm.truepeakdetector_process(this.__wbg_ptr, left, right);
    }
}
if (Symbol.dispose) TruePeakDetector.prototype[Symbol.dispose] = TruePeakDetector.prototype.free;

/**
 * Wavetable oscillator
 */
export class WavetableOsc {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WavetableOscFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wavetableosc_free(ptr, 0);
    }
    /**
     * Generate preset wavetables
     * @param {number} preset
     */
    set_preset(preset) {
        wasm.wavetableosc_set_preset(this.__wbg_ptr, preset);
    }
    /**
     * Set frequency
     * @param {number} freq
     */
    set_frequency(freq) {
        wasm.wavetableosc_set_frequency(this.__wbg_ptr, freq);
    }
    /**
     * Set custom wavetable
     * @param {Float32Array} table
     */
    set_wavetable(table) {
        const ptr0 = passArrayF32ToWasm0(table, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wavetableosc_set_wavetable(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Float32Array} buffer
     */
    process_buffer(buffer) {
        var ptr0 = passArrayF32ToWasm0(buffer, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.wavetableosc_process_buffer(this.__wbg_ptr, ptr0, len0, buffer);
    }
    /**
     * Create with a preset wavetable
     * @param {number} sample_rate
     * @param {number} table_size
     */
    constructor(sample_rate, table_size) {
        const ret = wasm.wavetableosc_new(sample_rate, table_size);
        this.__wbg_ptr = ret >>> 0;
        WavetableOscFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    reset() {
        wasm.wavetableosc_reset(this.__wbg_ptr);
    }
    /**
     * Generate next sample with linear interpolation
     * @returns {number}
     */
    process() {
        const ret = wasm.wavetableosc_process(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WavetableOsc.prototype[Symbol.dispose] = WavetableOsc.prototype.free;

/**
 * Utility functions exposed to JS
 * @param {number} db
 * @returns {number}
 */
export function db_to_linear(db) {
    const ret = wasm.db_to_linear(db);
    return ret;
}

/**
 * Initialize panic hook for better error messages in browser console
 */
export function init() {
    wasm.init();
}

/**
 * @param {number} linear
 * @returns {number}
 */
export function linear_to_db(linear) {
    const ret = wasm.linear_to_db(linear);
    return ret;
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg___wbindgen_copy_to_typed_array_db832bc4df7216c1 = function(arg0, arg1, arg2) {
        new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_41e2764a343e3cb1 = function(arg0, arg1) {
        const ret = new Float32Array(getArrayF32FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_with_length_95ba657dfb7d3dfb = function(arg0) {
        const ret = new Float32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_set_index_165b46b0114d368c = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('vanvinkl_dsp_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

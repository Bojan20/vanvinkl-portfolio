/**
 * Generate Placeholder Audio Files
 *
 * Creates synthetic audio files using Node.js
 * These serve as placeholders until real audio is added
 *
 * Run: node scripts/generate-placeholder-audio.js
 */

const fs = require('fs');
const path = require('path');

// Simple WAV file generator
function generateWav(filename, durationMs, frequency, type = 'sine') {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor((durationMs / 1000) * sampleRate);

  // WAV header
  const headerSize = 44;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const fileSize = headerSize + dataSize - 8;

  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // block align
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Envelope (fade in/out)
    const attackTime = 0.01;
    const releaseTime = 0.05;
    const duration = durationMs / 1000;
    let envelope = 1;
    if (t < attackTime) {
      envelope = t / attackTime;
    } else if (t > duration - releaseTime) {
      envelope = (duration - t) / releaseTime;
    }

    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
        break;
      case 'noise':
        sample = Math.random() * 2 - 1;
        break;
      case 'sweep':
        // Frequency sweep from frequency to frequency*2
        const sweepFreq = frequency + (frequency * t / (durationMs / 1000));
        sample = Math.sin(2 * Math.PI * sweepFreq * t);
        break;
      case 'reel':
        // Slot reel spinning sound - mix of frequencies
        sample = Math.sin(2 * Math.PI * 200 * t) * 0.3 +
                 Math.sin(2 * Math.PI * 350 * t) * 0.2 +
                 (Math.random() * 0.5 - 0.25); // Add noise
        break;
      case 'win':
        // Win jingle - arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        const noteIndex = Math.floor((t * 8) % notes.length);
        sample = Math.sin(2 * Math.PI * notes[noteIndex] * t);
        break;
      case 'jackpot':
        // Jackpot fanfare
        const jpNotes = [392, 494, 587, 784, 988]; // G4, B4, D5, G5, B5
        const jpIndex = Math.floor((t * 6) % jpNotes.length);
        sample = Math.sin(2 * Math.PI * jpNotes[jpIndex] * t) * 0.8 +
                 Math.sin(2 * Math.PI * jpNotes[jpIndex] * 2 * t) * 0.2;
        break;
      case 'click':
        // Short click
        sample = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 50);
        break;
      case 'hover':
        // Soft hover tick
        sample = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 100);
        break;
      case 'footstep':
        // Low thump
        sample = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 30) +
                 (Math.random() * 0.3 - 0.15) * Math.exp(-t * 20);
        break;
      case 'ambient':
        // Low ambient hum
        sample = Math.sin(2 * Math.PI * 60 * t) * 0.3 +
                 Math.sin(2 * Math.PI * 120 * t) * 0.2 +
                 Math.sin(2 * Math.PI * 180 * t) * 0.1 +
                 (Math.random() * 0.1 - 0.05);
        break;
      case 'neon':
        // Electrical buzz
        sample = Math.sin(2 * Math.PI * 60 * t) * 0.5 +
                 (Math.random() * 0.3 - 0.15) * Math.sin(2 * Math.PI * 120 * t);
        break;
    }

    // Apply envelope and convert to 16-bit
    sample = sample * envelope * 0.7; // 0.7 to avoid clipping
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, headerSize + i * 2);
  }

  return buffer;
}

// Audio files to generate
const audioFiles = [
  // Ambient
  { path: 'ambient/casino-hum.wav', duration: 5000, freq: 60, type: 'ambient' },
  { path: 'ambient/neon-buzz.wav', duration: 2000, freq: 60, type: 'neon' },

  // Slots
  { path: 'slots/spin-loop.wav', duration: 2000, freq: 200, type: 'reel' },
  { path: 'slots/reel-stop-1.wav', duration: 150, freq: 300, type: 'click' },
  { path: 'slots/reel-stop-2.wav', duration: 150, freq: 350, type: 'click' },
  { path: 'slots/reel-stop-3.wav', duration: 150, freq: 400, type: 'click' },
  { path: 'slots/win-small.wav', duration: 500, freq: 800, type: 'sweep' },
  { path: 'slots/win-big.wav', duration: 1500, freq: 523, type: 'win' },
  { path: 'slots/jackpot.wav', duration: 2500, freq: 392, type: 'jackpot' },

  // UI
  { path: 'ui/hover.wav', duration: 50, freq: 2000, type: 'hover' },
  { path: 'ui/click.wav', duration: 100, freq: 1000, type: 'click' },
  { path: 'ui/modal-open.wav', duration: 300, freq: 600, type: 'sweep' },

  // Player
  { path: 'player/footstep-1.wav', duration: 150, freq: 100, type: 'footstep' },
  { path: 'player/footstep-2.wav', duration: 150, freq: 110, type: 'footstep' },
  { path: 'player/footstep-3.wav', duration: 150, freq: 95, type: 'footstep' },
  { path: 'player/sit.wav', duration: 400, freq: 150, type: 'footstep' }
];

const baseDir = path.join(__dirname, '..', 'public', 'audio');

console.log('Generating placeholder audio files...\n');

audioFiles.forEach(file => {
  const filePath = path.join(baseDir, file.path);
  const dir = path.dirname(filePath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Generate WAV
  const wavBuffer = generateWav(file.path, file.duration, file.freq, file.type);
  fs.writeFileSync(filePath, wavBuffer);

  console.log(`✓ ${file.path} (${file.duration}ms, ${file.type})`);
});

console.log('\n✅ All placeholder audio files generated!');
console.log('\nNote: These are synthetic placeholders.');
console.log('Replace with real audio from:');
console.log('- https://mixkit.co/free-sound-effects/casino/');
console.log('- https://pixabay.com/sound-effects/search/casino/');

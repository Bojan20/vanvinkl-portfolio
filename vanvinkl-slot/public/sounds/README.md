# Casino Audio Files

This folder should contain audio files for the 3D casino experience.

## Required Audio Files

### Slot Machine Attract Loops (3 variations)
- `slot_attract_1.mp3` - Looping ambient sound for machines
- `slot_attract_2.mp3` - Variation 2
- `slot_attract_3.mp3` - Variation 3

**Specs**:
- Format: MP3
- Loop: Seamless
- Length: 3-5 seconds
- Volume: Normalized to -12dB

### Casino Ambient
- `casino_ambient.mp3` - General casino atmosphere

**Specs**:
- Format: MP3
- Loop: Seamless
- Length: 30-60 seconds
- Volume: Normalized to -18dB (quieter background)

### UI Sounds (Optional)
- `ui_click.mp3` - Button click
- `ui_hover.mp3` - Button hover
- `ui_select.mp3` - Selection confirmation
- `footstep.mp3` - Avatar footstep

**Specs**:
- Format: MP3
- Length: < 0.5 seconds
- Volume: Normalized to -6dB

### Music Stems (Optional)
- `music_ambient.mp3` - Ambient background music
- `music_tension.mp3` - Tension/excitement layer
- `music_celebration.mp3` - Win celebration layer

**Specs**:
- Format: MP3
- Loop: Seamless
- Length: 60-120 seconds
- Volume: Normalized to -12dB

## Usage

The SpatialAudioSystem component will automatically detect if audio files are present.

To enable audio, pass `enabled={true}` prop to SpatialAudioSystem:

```tsx
<SpatialAudioSystem
  machinePositions={PORTFOLIO_MACHINES}
  nearMachine={nearMachine}
  enabled={true} // Enable when audio files are added
/>
```

## Generating Placeholder Audio

If you need placeholder audio for testing, you can generate silent MP3 files:

```bash
# Using ffmpeg (install via brew install ffmpeg on macOS)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -q:a 9 -acodec libmp3lame slot_attract_1.mp3
```

## Audio Sources

Recommended free audio sources:
- [Freesound.org](https://freesound.org) - CC-licensed sounds
- [Zapsplat](https://www.zapsplat.com) - Free for commercial use
- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk) - Public domain

Search terms:
- "casino ambience"
- "slot machine"
- "casino crowd"
- "gaming atmosphere"

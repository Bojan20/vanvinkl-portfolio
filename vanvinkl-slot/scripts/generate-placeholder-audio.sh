#!/bin/bash

# Generate placeholder silent MP3 files for testing SpatialAudioSystem
# Requires: ffmpeg (install via: brew install ffmpeg)

SOUNDS_DIR="../public/sounds"

echo "🎵 Generating placeholder audio files..."

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Install it with: brew install ffmpeg"
    exit 1
fi

# Create sounds directory if it doesn't exist
mkdir -p "$SOUNDS_DIR"

# Generate slot machine attract loops (5 seconds each)
for i in 1 2 3; do
    echo "Generating slot_attract_$i.mp3..."
    ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -q:a 9 -acodec libmp3lame "$SOUNDS_DIR/slot_attract_$i.mp3" -y -loglevel quiet
done

# Generate casino ambient (30 seconds)
echo "Generating casino_ambient.mp3..."
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 30 -q:a 9 -acodec libmp3lame "$SOUNDS_DIR/casino_ambient.mp3" -y -loglevel quiet

# Generate UI sounds (0.3 seconds each)
for sound in ui_click ui_hover ui_select footstep; do
    echo "Generating $sound.mp3..."
    ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 0.3 -q:a 9 -acodec libmp3lame "$SOUNDS_DIR/$sound.mp3" -y -loglevel quiet
done

# Generate music stems (60 seconds each)
for stem in music_ambient music_tension music_celebration; do
    echo "Generating $stem.mp3..."
    ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "$SOUNDS_DIR/$stem.mp3" -y -loglevel quiet
done

echo "✅ Placeholder audio files generated!"
echo ""
echo "⚠️  IMPORTANT: These are silent placeholders for testing only."
echo "Replace them with real audio files before production."
echo ""
echo "To enable audio in the app, set enabled={true} in CasinoLoungeUltra.tsx:"
echo "  <SpatialAudioSystem ... enabled={true} />"

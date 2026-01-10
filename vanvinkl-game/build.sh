#!/bin/bash
# Build VanVinkl Game for Web

set -e

echo "🎰 Building VanVinkl Game..."

# Build WASM
echo "📦 Compiling to WebAssembly..."
cargo build --release --target wasm32-unknown-unknown

# Generate JS bindings
echo "🔗 Generating JS bindings..."
wasm-bindgen --out-dir web --target web \
    target/wasm32-unknown-unknown/release/vanvinkl-game.wasm

# Optimize WASM size
echo "⚡ Optimizing WASM..."
if command -v wasm-opt &> /dev/null; then
    wasm-opt -Oz -o web/vanvinkl-game_bg.wasm web/vanvinkl-game_bg.wasm
else
    echo "⚠️  wasm-opt not found, skipping optimization"
    echo "   Install with: brew install binaryen"
fi

# Report size
echo ""
echo "✅ Build complete!"
ls -lh web/*.wasm

echo ""
echo "🌐 To run locally:"
echo "   cd web && python3 -m http.server 8080"
echo "   Open http://localhost:8080"

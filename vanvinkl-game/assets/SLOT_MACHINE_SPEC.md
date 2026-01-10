# AAA Slot Machine - Blender Modeling Specification

## Target: IGT/Aristocrat Level Quality

---

## 1. POLYGON BUDGET

| Component | Triangles | Notes |
|-----------|-----------|-------|
| **Cabinet Body** | 8,000 | Beveled edges, panel lines |
| **Chrome Frame** | 4,000 | High-poly bevels for reflections |
| **Screen Assembly** | 3,000 | Glass + bezel + inner frame |
| **Reel Drums (x3)** | 3,000 | Cylinder + symbol geometry |
| **Button Panel** | 2,500 | 5 buttons + housing |
| **LED Strips** | 1,500 | Individual bulb geometry |
| **Coin Tray** | 1,000 | Brass with wear |
| **Top Sign** | 2,000 | Backlit panel + frame |
| **Details** | 5,000 | Vents, screws, labels |
| **TOTAL** | ~30,000 | Hero asset |

---

## 2. DIMENSIONS (Real-World Scale)

```
Total Height: 1.85m (72.8")
Cabinet Width: 0.66m (26")
Cabinet Depth: 0.76m (30")

Screen Size: 0.58m x 0.43m (23" diagonal)
Button Panel: 0.50m x 0.12m
Coin Tray: 0.45m x 0.10m x 0.08m

Reel Drum Diameter: 0.20m
Reel Drum Width: 0.12m
Reel Spacing: 0.14m (center to center)
```

---

## 3. MATERIAL SLOTS (12 Total)

### Metals
1. **M_Chrome_Polished**
   - Metallic: 1.0
   - Roughness: 0.02
   - Base Color: #B4B4C3

2. **M_Chrome_Brushed**
   - Metallic: 1.0
   - Roughness: 0.35
   - Anisotropic: 0.8

3. **M_Gold_Polished**
   - Metallic: 1.0
   - Roughness: 0.15
   - Base Color: #FFD700

4. **M_Brass_Aged**
   - Metallic: 0.9
   - Roughness: 0.4
   - Base Color: #B87333

### Cabinet
5. **M_Cabinet_Red**
   - Metallic: 0.3
   - Roughness: 0.4
   - Base Color: #8B0000
   - Clear coat layer

6. **M_Cabinet_Black**
   - Metallic: 0.1
   - Roughness: 0.6
   - Base Color: #0A0A0F

### Glass & Screens
7. **M_Glass_Clear**
   - IOR: 1.52
   - Roughness: 0.02
   - Transmission: 0.95

8. **M_Screen_Emissive**
   - Emissive: HDR (5.0 intensity)
   - Base Color: #000000
   - Roughness: 0.1

### LEDs
9. **M_LED_Gold**
   - Emissive: #FFD700 @ 8.0
   - Bloom threshold: 1.0

10. **M_LED_Red**
    - Emissive: #FF0000 @ 10.0

11. **M_LED_White**
    - Emissive: #FFFFFF @ 6.0

### Plastic
12. **M_Plastic_Button**
    - Metallic: 0.0
    - Roughness: 0.3
    - Subsurface: 0.1 (for backlit glow)

---

## 4. MODELING WORKFLOW

### Phase 1: Block-out (1 hour)
```
1. Import reference images (front, side, top)
2. Create base cabinet box
3. Add major volumes:
   - Screen housing
   - Button panel angle
   - Top crown
   - Base pedestal
4. Verify proportions against real machines
```

### Phase 2: Primary Forms (2 hours)
```
1. Cabinet body with panel lines
2. Chrome frame extrusion
3. Screen bezel and glass
4. Reel housing cavity
5. Button panel with cutouts
6. Coin tray depression
```

### Phase 3: Secondary Details (2 hours)
```
1. Reel drums (cylindrical)
2. Individual buttons (5x)
3. LED strip geometry
4. Ventilation grilles
5. Speaker mesh
6. Cable management
```

### Phase 4: Tertiary Details (1 hour)
```
1. Screw heads (use instances)
2. Brand label area
3. Edge bevels (2-3mm all hard edges)
4. Panel line grooves
5. Rubber feet
```

### Phase 5: UV & Export (1 hour)
```
1. UV unwrap (0.01 texel density variance max)
2. Pack UVs efficiently
3. Name all objects properly
4. Apply transforms
5. Export as GLTF 2.0
```

---

## 5. UV LAYOUT

```
┌────────────────────────────────────────┐
│  Cabinet Body        │  Chrome Frame   │
│  (40% UV space)      │  (15% UV space) │
├──────────────────────┼─────────────────┤
│  Screen + Glass      │  Buttons        │
│  (15% UV space)      │  (10% UV space) │
├──────────────────────┼─────────────────┤
│  Reels    │  LEDs    │  Details/Misc   │
│  (10%)    │  (5%)    │  (5%)           │
└───────────┴──────────┴─────────────────┘
```

**Texel Density**: 512 pixels per meter (for 4K textures)

---

## 6. HIGH-POLY TO LOW-POLY BAKE

### High-Poly Additions
- Subdivision on all surfaces (level 2)
- Micro-bevels on ALL edges (0.5mm)
- Screw thread detail
- Panel line depth
- Surface imperfections (noise displacement)

### Bake Settings (Substance Painter)
```
Output Size: 4096 x 4096
Anti-aliasing: 8x8
Match: By Mesh Name
Max Frontal Distance: 0.01
Max Rear Distance: 0.01

Maps to bake:
- Normal (OpenGL)
- Ambient Occlusion
- Curvature
- Position
- World Space Normal
- ID (by material)
```

---

## 7. TEXTURE MAPS (Per Material Set)

### PBR Maps Required
```
SlotMachine_Cabinet_BaseColor.png     (4K, sRGB)
SlotMachine_Cabinet_Normal.png        (4K, Linear)
SlotMachine_Cabinet_Roughness.png     (4K, Linear)
SlotMachine_Cabinet_Metallic.png      (4K, Linear)
SlotMachine_Cabinet_AO.png            (4K, Linear)
SlotMachine_Cabinet_Emissive.png      (4K, sRGB)
```

### Compression for Web
```bash
# Convert to KTX2 for Bevy/WebGPU
gltf-transform etc1s SlotMachine.glb SlotMachine_compressed.glb \
  --slots "baseColorTexture normalTexture" \
  --quality 192

# DRACO mesh compression
gltf-transform draco SlotMachine_compressed.glb SlotMachine_final.glb
```

---

## 8. ANIMATION BONES/EMPTIES

### Rig Structure
```
SlotMachine_Root
├── Cabinet (static)
├── Screen_Content (UV scroll)
├── Reel_01 (rotate X)
├── Reel_02 (rotate X)
├── Reel_03 (rotate X)
├── Button_Spin (translate Y)
├── Button_Bet1 (translate Y)
├── Button_Bet2 (translate Y)
├── Button_Bet3 (translate Y)
├── Button_MaxBet (translate Y)
├── LED_Controller (color animation)
└── Coin_Tray (shake animation)
```

---

## 9. LOD SPECIFICATIONS

### LOD0 (0-5m) - Full Detail
- 30,000 triangles
- All materials
- Full normal maps
- All LED geometry

### LOD1 (5-15m) - Reduced
- 15,000 triangles
- Merged small details
- Combined materials (6 instead of 12)
- Simplified LED (single strip mesh)

### LOD2 (15-30m) - Minimal
- 5,000 triangles
- No internal details
- 2 materials (body + emissive)
- Baked lighting hints

### LOD3 (30m+) - Billboard
- 2 triangles (billboard quad)
- Single texture with baked render
- Used for distant background machines

---

## 10. FILE NAMING CONVENTION

```
/assets/models/slot_machine/
├── SlotMachine_Hero.blend          # Source file
├── SlotMachine_LOD0.glb            # 30K tris
├── SlotMachine_LOD1.glb            # 15K tris
├── SlotMachine_LOD2.glb            # 5K tris
├── SlotMachine_Billboard.png       # LOD3 texture
│
├── /textures/
│   ├── T_SlotMachine_BaseColor.ktx2
│   ├── T_SlotMachine_Normal.ktx2
│   ├── T_SlotMachine_ORM.ktx2      # Occlusion/Roughness/Metallic packed
│   └── T_SlotMachine_Emissive.ktx2
│
└── /references/
    ├── ref_front.jpg
    ├── ref_side.jpg
    └── ref_igt_inspiration.jpg
```

---

## 11. QUALITY CHECKLIST

### Modeling
- [ ] All edges beveled (no sharp 90° edges)
- [ ] Consistent quad topology
- [ ] No N-gons in deforming areas
- [ ] Proper edge flow for materials
- [ ] Scale applied (1 unit = 1 meter)

### UVs
- [ ] No overlapping UVs
- [ ] Consistent texel density (±10%)
- [ ] 2-pixel padding between islands
- [ ] Straight edges where possible

### Materials
- [ ] PBR values physically accurate
- [ ] No pure black (use 0.04 minimum)
- [ ] No pure white (use 0.95 maximum)
- [ ] Metallic is binary (0 or 1, no mid-values)

### Export
- [ ] GLTF 2.0 format
- [ ] Embedded textures OR separate with correct paths
- [ ] Y-up coordinate system
- [ ] Transforms applied
- [ ] Named objects and materials

---

## 12. REFERENCE IMAGES TO COLLECT

1. **IGT S3000** - Classic upright cabinet
2. **Aristocrat MarsX** - Modern curved screen
3. **Scientific Games TwinStar** - Dual screen
4. **Novomatic V.I.P. Lounge** - Premium cabinet

Search terms:
- "IGT slot machine cabinet"
- "casino slot machine close up"
- "slot machine chrome detail"
- "slot machine button panel"
- "slot machine LED lights"

---

## 13. ESTIMATED TIME

| Phase | Time |
|-------|------|
| Reference gathering | 30 min |
| Block-out | 1 hour |
| Primary modeling | 2 hours |
| Secondary details | 2 hours |
| Tertiary details | 1 hour |
| UV unwrapping | 1 hour |
| High-poly for baking | 1 hour |
| Substance Painter texturing | 3 hours |
| Export & optimization | 1 hour |
| **TOTAL** | **~12 hours** |

---

## NOTES

- Start with IGT S3000 as base reference - most recognizable
- Chrome quality makes or breaks the model
- LED glow is critical for casino atmosphere
- Screen content will be dynamic (handled in engine)
- Consider modular approach for variations (different top signs)

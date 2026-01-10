//! Cyberpunk Neon Slot Machine
//!
//! Based on reference: Futuristic slot with
//! - Magenta/cyan neon LED strips
//! - Top display with lightning/plasma effect
//! - 5-reel display section
//! - Glowing base panel
//! - Chrome/silver metallic frame

use bevy::prelude::*;
use std::f32::consts::PI;

use crate::GameState;

pub struct SlotMachinePlugin;

impl Plugin for SlotMachinePlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(AnimTimer(0.0))
            .add_systems(
                Update,
                (animate_leds, animate_screens, animate_plasma).run_if(in_state(GameState::Playing)),
            );
    }
}

#[derive(Resource)]
struct AnimTimer(f32);

#[derive(Component)]
pub struct SlotLed {
    pub index: usize,
    pub led_type: LedType,
}

#[derive(Clone, Copy)]
pub enum LedType {
    Magenta,
    Cyan,
    Blue,
}

#[derive(Component)]
pub struct ScreenGlow {
    pub base_emissive: LinearRgba,
}

#[derive(Component)]
pub struct PlasmaScreen;

// Dimensions - Tall impressive machines like reference
const SCALE: f32 = 1.2;
const W: f32 = 1.4 * SCALE;   // Width
const H: f32 = 3.8 * SCALE;   // Height (tall like reference)
const D: f32 = 0.9 * SCALE;   // Depth

pub fn spawn_slot_machine(
    commands: &mut Commands,
    meshes: &mut ResMut<Assets<Mesh>>,
    materials: &mut ResMut<Assets<StandardMaterial>>,
    position: Vec3,
    _label: &str,
    _id: &str,
    _asset_server: &Res<AssetServer>,
) -> Entity {
    // === MATERIALS - Cyberpunk Theme ===

    // Dark gunmetal body
    let body_dark = materials.add(StandardMaterial {
        base_color: Color::srgb(0.08, 0.08, 0.12),
        metallic: 0.9,
        perceptual_roughness: 0.2,
        reflectance: 0.6,
        ..default()
    });

    // Silver chrome frame
    let chrome = materials.add(StandardMaterial {
        base_color: Color::srgb(0.85, 0.87, 0.92),
        metallic: 1.0,
        perceptual_roughness: 0.05,
        reflectance: 1.0,
        ..default()
    });

    // Brushed silver
    let silver = materials.add(StandardMaterial {
        base_color: Color::srgb(0.7, 0.72, 0.78),
        metallic: 0.95,
        perceptual_roughness: 0.15,
        reflectance: 0.8,
        ..default()
    });

    // Deep black glass
    let black_glass = materials.add(StandardMaterial {
        base_color: Color::srgba(0.02, 0.02, 0.04, 0.95),
        metallic: 0.1,
        perceptual_roughness: 0.0,
        reflectance: 0.9,
        alpha_mode: AlphaMode::Blend,
        ..default()
    });

    // Purple/magenta metallic accent
    let purple_accent = materials.add(StandardMaterial {
        base_color: Color::srgb(0.25, 0.05, 0.35),
        metallic: 0.85,
        perceptual_roughness: 0.1,
        emissive: LinearRgba::new(0.8, 0.1, 1.2, 1.0),
        ..default()
    });

    // Top screen - plasma/lightning blue
    let screen_plasma = materials.add(StandardMaterial {
        base_color: Color::srgb(0.0, 0.1, 0.2),
        emissive: LinearRgba::new(0.5, 2.0, 4.0, 1.0),
        ..default()
    });

    // Reel screen - bright white/cyan
    let screen_reels = materials.add(StandardMaterial {
        base_color: Color::srgb(0.15, 0.2, 0.25),
        emissive: LinearRgba::new(1.8, 2.2, 2.8, 1.0),
        ..default()
    });

    // Bottom info panel - cyan glow
    let screen_info = materials.add(StandardMaterial {
        base_color: Color::srgb(0.0, 0.15, 0.2),
        emissive: LinearRgba::new(0.3, 1.5, 2.5, 1.0),
        ..default()
    });

    // NEON MAGENTA LED
    let led_magenta = materials.add(StandardMaterial {
        base_color: Color::srgb(1.0, 0.0, 0.6),
        emissive: LinearRgba::new(50.0, 5.0, 40.0, 1.0),
        unlit: true,
        ..default()
    });

    // NEON CYAN LED
    let led_cyan = materials.add(StandardMaterial {
        base_color: Color::srgb(0.0, 0.9, 1.0),
        emissive: LinearRgba::new(5.0, 40.0, 50.0, 1.0),
        unlit: true,
        ..default()
    });

    // NEON BLUE LED
    let led_blue = materials.add(StandardMaterial {
        base_color: Color::srgb(0.2, 0.4, 1.0),
        emissive: LinearRgba::new(10.0, 20.0, 60.0, 1.0),
        unlit: true,
        ..default()
    });

    // Lever chrome
    let lever_chrome = materials.add(StandardMaterial {
        base_color: Color::srgb(0.4, 0.42, 0.48),
        metallic: 1.0,
        perceptual_roughness: 0.1,
        ..default()
    });

    // Lever ball - dark blue
    let lever_ball = materials.add(StandardMaterial {
        base_color: Color::srgb(0.1, 0.15, 0.3),
        metallic: 0.6,
        perceptual_roughness: 0.2,
        emissive: LinearRgba::new(0.1, 0.2, 0.5, 1.0),
        ..default()
    });

    let machine = commands
        .spawn((
            Transform::from_translation(position),
            GlobalTransform::default(),
            Visibility::default(),
            InheritedVisibility::default(),
            ViewVisibility::default(),
            Name::new("CyberpunkSlot"),
        ))
        .with_children(|p| {
            // === BASE PLATFORM ===
            let base_h = 0.12;

            // Main base - silver
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W + 0.15, base_h, D + 0.1))),
                MeshMaterial3d(silver.clone()),
                Transform::from_xyz(0.0, base_h / 2.0, 0.0),
            ));

            // Base glow strip - cyan underglow
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W + 0.1, 0.02, D + 0.05))),
                MeshMaterial3d(led_cyan.clone()),
                Transform::from_xyz(0.0, 0.01, 0.0),
            ));

            // === MAIN CABINET - 3 SECTIONS ===

            // --- LOWER SECTION (Info panel + button area) ---
            let lower_h = H * 0.22;
            let lower_y = base_h + lower_h / 2.0;

            // Lower body
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W, lower_h, D))),
                MeshMaterial3d(body_dark.clone()),
                Transform::from_xyz(0.0, lower_y, 0.0),
            ));

            // Lower front panel - angled
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W - 0.05, lower_h * 0.9, 0.03))),
                MeshMaterial3d(silver.clone()),
                Transform::from_xyz(0.0, lower_y, D / 2.0 - 0.01),
            ));

            // Info display (bottom cyan screen)
            let info_screen_w = W * 0.7;
            let info_screen_h = lower_h * 0.45;
            p.spawn((
                ScreenGlow { base_emissive: LinearRgba::new(0.3, 1.5, 2.5, 1.0) },
                Mesh3d(meshes.add(Cuboid::new(info_screen_w, info_screen_h, 0.02))),
                MeshMaterial3d(screen_info.clone()),
                Transform::from_xyz(0.0, lower_y + lower_h * 0.15, D / 2.0 + 0.02),
            ));

            // --- MIDDLE SECTION (5-Reel display) ---
            let mid_h = H * 0.35;
            let mid_y = base_h + lower_h + mid_h / 2.0;

            // Middle body
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W, mid_h, D))),
                MeshMaterial3d(body_dark.clone()),
                Transform::from_xyz(0.0, mid_y, 0.0),
            ));

            // Reel frame - chrome
            let reel_w = W * 0.88;
            let reel_h = mid_h * 0.75;
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(reel_w + 0.08, reel_h + 0.08, 0.04))),
                MeshMaterial3d(chrome.clone()),
                Transform::from_xyz(0.0, mid_y, D / 2.0 + 0.01),
            ));

            // Reel screen (5 reels visible)
            p.spawn((
                ScreenGlow { base_emissive: LinearRgba::new(1.8, 2.2, 2.8, 1.0) },
                Mesh3d(meshes.add(Cuboid::new(reel_w, reel_h, 0.02))),
                MeshMaterial3d(screen_reels.clone()),
                Transform::from_xyz(0.0, mid_y, D / 2.0 + 0.04),
            ));

            // Reel dividers (4 dividers for 5 reels)
            let reel_slot_w = reel_w / 5.0;
            for i in 1..5 {
                let x = -reel_w / 2.0 + i as f32 * reel_slot_w;
                p.spawn((
                    Mesh3d(meshes.add(Cuboid::new(0.015, reel_h * 0.9, 0.025))),
                    MeshMaterial3d(chrome.clone()),
                    Transform::from_xyz(x, mid_y, D / 2.0 + 0.055),
                ));
            }

            // Black glass overlay
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(reel_w - 0.02, reel_h - 0.02, 0.003))),
                MeshMaterial3d(black_glass.clone()),
                Transform::from_xyz(0.0, mid_y, D / 2.0 + 0.07),
            ));

            // --- UPPER SECTION (Plasma screen) ---
            let upper_h = H * 0.32;
            let upper_y = base_h + lower_h + mid_h + upper_h / 2.0;

            // Upper body - wider at top
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W + 0.1, upper_h, D * 0.8))),
                MeshMaterial3d(body_dark.clone()),
                Transform::from_xyz(0.0, upper_y, -D * 0.05),
            ));

            // Top frame - purple accent
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(W + 0.15, 0.06, D * 0.85))),
                MeshMaterial3d(purple_accent.clone()),
                Transform::from_xyz(0.0, upper_y + upper_h / 2.0 - 0.03, -D * 0.05),
            ));

            // Plasma screen frame
            let plasma_w = W * 0.9;
            let plasma_h = upper_h * 0.7;
            p.spawn((
                Mesh3d(meshes.add(Cuboid::new(plasma_w + 0.06, plasma_h + 0.06, 0.04))),
                MeshMaterial3d(chrome.clone()),
                Transform::from_xyz(0.0, upper_y, D * 0.35),
            ));

            // Plasma screen (lightning effect)
            p.spawn((
                PlasmaScreen,
                ScreenGlow { base_emissive: LinearRgba::new(0.5, 2.0, 4.0, 1.0) },
                Mesh3d(meshes.add(Cuboid::new(plasma_w, plasma_h, 0.02))),
                MeshMaterial3d(screen_plasma.clone()),
                Transform::from_xyz(0.0, upper_y, D * 0.37),
            ));

            // === NEON LED STRIPS ===

            // Left magenta strip (full height)
            let strip_x = -W / 2.0 - 0.04;
            for i in 0..22 {
                let y = base_h + 0.15 + i as f32 * 0.18;
                p.spawn((
                    SlotLed { index: i, led_type: LedType::Magenta },
                    Mesh3d(meshes.add(Capsule3d::new(0.018, 0.06))),
                    MeshMaterial3d(led_magenta.clone()),
                    Transform::from_xyz(strip_x, y, D / 2.0 - 0.05),
                ));
            }

            // Right magenta strip (full height)
            let strip_x = W / 2.0 + 0.04;
            for i in 0..22 {
                let y = base_h + 0.15 + i as f32 * 0.18;
                p.spawn((
                    SlotLed { index: 22 + i, led_type: LedType::Magenta },
                    Mesh3d(meshes.add(Capsule3d::new(0.018, 0.06))),
                    MeshMaterial3d(led_magenta.clone()),
                    Transform::from_xyz(strip_x, y, D / 2.0 - 0.05),
                ));
            }

            // Inner cyan strips (around reel area)
            let inner_strip_x_left = -W / 2.0 + 0.06;
            let inner_strip_x_right = W / 2.0 - 0.06;
            for i in 0..12 {
                let y = mid_y - mid_h / 2.0 + 0.1 + i as f32 * 0.12;

                // Left inner
                p.spawn((
                    SlotLed { index: 44 + i, led_type: LedType::Cyan },
                    Mesh3d(meshes.add(Sphere::new(0.015))),
                    MeshMaterial3d(led_cyan.clone()),
                    Transform::from_xyz(inner_strip_x_left, y, D / 2.0 + 0.02),
                ));

                // Right inner
                p.spawn((
                    SlotLed { index: 56 + i, led_type: LedType::Cyan },
                    Mesh3d(meshes.add(Sphere::new(0.015))),
                    MeshMaterial3d(led_cyan.clone()),
                    Transform::from_xyz(inner_strip_x_right, y, D / 2.0 + 0.02),
                ));
            }

            // Top blue accent strip
            let top_led_y = upper_y + upper_h / 2.0 + 0.01;
            for i in 0..10 {
                let x = (i as f32 - 4.5) * 0.14;
                p.spawn((
                    SlotLed { index: 68 + i, led_type: LedType::Blue },
                    Mesh3d(meshes.add(Sphere::new(0.02))),
                    MeshMaterial3d(led_blue.clone()),
                    Transform::from_xyz(x, top_led_y, D * 0.3),
                ));
            }

            // Base underglow strip
            for i in 0..12 {
                let x = (i as f32 - 5.5) * 0.12;
                p.spawn((
                    SlotLed { index: 78 + i, led_type: LedType::Cyan },
                    Mesh3d(meshes.add(Capsule3d::new(0.012, 0.04))),
                    MeshMaterial3d(led_cyan.clone()),
                    Transform::from_xyz(x, 0.02, D / 2.0 + 0.06),
                ));
            }

            // === LEVER (Right side) ===
            let lever_x = W / 2.0 + 0.12;
            let lever_y = mid_y;

            // Lever mount
            p.spawn((
                Mesh3d(meshes.add(Cylinder::new(0.06, 0.08))),
                MeshMaterial3d(chrome.clone()),
                Transform::from_xyz(lever_x, lever_y, 0.0)
                    .with_rotation(Quat::from_rotation_z(PI / 2.0)),
            ));

            // Lever shaft
            p.spawn((
                Mesh3d(meshes.add(Cylinder::new(0.025, 0.6))),
                MeshMaterial3d(lever_chrome.clone()),
                Transform::from_xyz(lever_x + 0.04, lever_y + 0.25, 0.0),
            ));

            // Lever ball
            p.spawn((
                Mesh3d(meshes.add(Sphere::new(0.07))),
                MeshMaterial3d(lever_ball.clone()),
                Transform::from_xyz(lever_x + 0.04, lever_y + 0.58, 0.0),
            ));

            // === ACCENT LIGHTING ===

            // Main front light (magenta tint)
            p.spawn((
                PointLight {
                    color: Color::srgb(1.0, 0.4, 0.8),
                    intensity: 35000.0,
                    range: 10.0,
                    shadows_enabled: false,
                    ..default()
                },
                Transform::from_xyz(0.0, mid_y, D / 2.0 + 1.2),
            ));

            // Plasma screen light (cyan)
            p.spawn((
                PointLight {
                    color: Color::srgb(0.3, 0.8, 1.0),
                    intensity: 20000.0,
                    range: 6.0,
                    shadows_enabled: false,
                    ..default()
                },
                Transform::from_xyz(0.0, upper_y, D * 0.6),
            ));

            // Cyan underglow
            p.spawn((
                PointLight {
                    color: Color::srgb(0.0, 0.9, 1.0),
                    intensity: 12000.0,
                    range: 5.0,
                    shadows_enabled: false,
                    ..default()
                },
                Transform::from_xyz(0.0, 0.15, D / 2.0 + 0.4),
            ));

            // Side magenta lights
            for side in [-1.0_f32, 1.0] {
                p.spawn((
                    PointLight {
                        color: Color::srgb(1.0, 0.1, 0.6),
                        intensity: 8000.0,
                        range: 4.0,
                        shadows_enabled: false,
                        ..default()
                    },
                    Transform::from_xyz(side * (W / 2.0 + 0.2), mid_y, D / 2.0 + 0.3),
                ));
            }
        })
        .id();

    machine
}

fn animate_leds(
    time: Res<Time>,
    mut timer: ResMut<AnimTimer>,
    mut query: Query<(&SlotLed, &MeshMaterial3d<StandardMaterial>)>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    timer.0 += time.delta_secs();
    let t = timer.0;

    for (led, mat_handle) in query.iter_mut() {
        if let Some(mat) = materials.get_mut(mat_handle.0.id()) {
            let phase = led.index as f32 * 0.15;

            // Different animation per LED type
            let (base_r, base_g, base_b, speed, wave_strength) = match led.led_type {
                LedType::Magenta => (50.0, 5.0, 40.0, 8.0, 0.6),
                LedType::Cyan => (5.0, 40.0, 50.0, 10.0, 0.5),
                LedType::Blue => (10.0, 20.0, 60.0, 6.0, 0.4),
            };

            // Chase wave going up
            let chase = ((t * speed - phase) % (PI * 2.0)).sin();
            let intensity = (chase * wave_strength + (1.0 - wave_strength / 2.0)).clamp(0.3, 1.0);

            // Global pulse
            let pulse = (t * 2.0).sin() * 0.15 + 0.85;

            let final_intensity = intensity * pulse;

            mat.emissive = LinearRgba::new(
                base_r * final_intensity,
                base_g * final_intensity,
                base_b * final_intensity,
                1.0,
            );
        }
    }
}

fn animate_screens(
    time: Res<Time>,
    query: Query<(&ScreenGlow, &MeshMaterial3d<StandardMaterial>), Without<PlasmaScreen>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let t = time.elapsed_secs();

    for (glow, mat_handle) in query.iter() {
        if let Some(mat) = materials.get_mut(mat_handle.0.id()) {
            // Subtle breathing
            let pulse = (t * 1.5).sin() * 0.1 + 0.9;

            mat.emissive = LinearRgba::new(
                glow.base_emissive.red * pulse,
                glow.base_emissive.green * pulse,
                glow.base_emissive.blue * pulse,
                1.0,
            );
        }
    }
}

fn animate_plasma(
    time: Res<Time>,
    query: Query<(&ScreenGlow, &MeshMaterial3d<StandardMaterial>), With<PlasmaScreen>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let t = time.elapsed_secs();

    for (glow, mat_handle) in query.iter() {
        if let Some(mat) = materials.get_mut(mat_handle.0.id()) {
            // Lightning flicker effect
            let flicker1 = (t * 15.0).sin() * (t * 23.0).cos();
            let flicker2 = (t * 31.0).sin();
            let burst = if flicker1 > 0.7 { 1.5 } else { 1.0 };

            let intensity = (0.7 + flicker2 * 0.3) * burst;

            mat.emissive = LinearRgba::new(
                glow.base_emissive.red * intensity * 0.8,
                glow.base_emissive.green * intensity,
                glow.base_emissive.blue * intensity * 1.2,
                1.0,
            );
        }
    }
}

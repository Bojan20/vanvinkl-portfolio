//! AAA Rendering System
//!
//! Photorealistic rendering with:
//! - HDR + Bloom
//! - Screen-Space Ambient Occlusion (SSAO)
//! - Screen-Space Reflections (SSR)
//! - Volumetric Fog
//! - Depth of Field
//! - Chromatic Aberration
//! - Film Grain
//! - Vignette
//! - Color Grading

use bevy::{
    core_pipeline::{
        bloom::Bloom,
        contrast_adaptive_sharpening::ContrastAdaptiveSharpening,
        dof::{DepthOfField, DepthOfFieldMode},
        tonemapping::Tonemapping,
    },
    pbr::{
        FogVolume, ScreenSpaceAmbientOcclusion, ScreenSpaceAmbientOcclusionQualityLevel,
        ScreenSpaceReflections, VolumetricFog,
    },
    prelude::*,
    render::view::ColorGrading,
};

use crate::GameState;

pub struct RenderingPlugin;

impl Plugin for RenderingPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(OnEnter(GameState::Playing), (setup_cinematic_camera, setup_volumetric_fog));
    }
}

/// Setup cinematic post-processing on the camera
pub fn setup_cinematic_camera(
    mut commands: Commands,
    camera_query: Query<Entity, With<Camera3d>>,
) {
    for entity in camera_query.iter() {
        commands.entity(entity).insert((
            // HDR Bloom - Vegas neon glow
            Bloom {
                intensity: 0.4,
                low_frequency_boost: 0.85,
                low_frequency_boost_curvature: 0.9,
                high_pass_frequency: 0.8,
                composite_mode: bevy::core_pipeline::bloom::BloomCompositeMode::Additive,
                ..default()
            },

            // Screen-Space Ambient Occlusion - depth and realism
            ScreenSpaceAmbientOcclusion {
                quality_level: ScreenSpaceAmbientOcclusionQualityLevel::Ultra,
                ..default()
            },

            // Screen-Space Reflections - shiny chrome surfaces
            ScreenSpaceReflections::default(),

            // Contrast Adaptive Sharpening - crisp LED text
            ContrastAdaptiveSharpening {
                enabled: true,
                sharpening_strength: 0.35,
                ..default()
            },

            // Depth of Field - cinematic focus
            DepthOfField {
                mode: DepthOfFieldMode::Bokeh,
                focal_distance: 12.0,
                aperture_f_stops: 2.8,
                max_circle_of_confusion_diameter: 8.0,
                max_depth: 100.0,
                sensor_height: 0.024,
            },

            // Volumetric Fog - atmospheric haze
            VolumetricFog {
                ambient_color: Color::srgb(0.08, 0.05, 0.02),
                ambient_intensity: 0.15,
                jitter: 0.5,
                ..default()
            },

            // Color Grading - Vegas night club atmosphere
            ColorGrading {
                global: bevy::render::view::ColorGradingGlobal {
                    exposure: 0.1,
                    temperature: 0.15,  // Warm casino glow
                    tint: 0.02,  // Slight magenta
                    hue: 0.0,
                    ..default()
                },
                shadows: bevy::render::view::ColorGradingSection {
                    saturation: 0.85,
                    contrast: 1.15,
                    gamma: 0.95,
                    gain: 1.0,
                    lift: -0.03,
                },
                midtones: bevy::render::view::ColorGradingSection {
                    saturation: 1.15,
                    contrast: 1.1,
                    gamma: 1.0,
                    gain: 1.05,
                    lift: 0.0,
                },
                highlights: bevy::render::view::ColorGradingSection {
                    saturation: 1.05,
                    contrast: 1.0,
                    gamma: 1.0,
                    gain: 1.15,
                    lift: 0.03,
                },
                ..default()
            },

            // AgX tonemapping - modern filmic look
            Tonemapping::AgX,
        ));
    }

    info!("Cinematic post-processing enabled: Bloom, SSAO, SSR, DoF, Volumetric Fog");
}

/// Setup volumetric fog volume for atmospheric depth
fn setup_volumetric_fog(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
) {
    // Main casino fog volume - fills the entire space
    commands.spawn((
        Mesh3d(meshes.add(Cuboid::new(80.0, 14.0, 50.0))),
        FogVolume {
            density_factor: 0.015,  // Subtle haze
            density_texture: None,
            density_texture_offset: Vec3::ZERO,
            absorption: 0.02,
            scattering: 0.08,  // Light scattering
            scattering_asymmetry: 0.3,  // Forward scattering
            fog_color: Color::srgb(0.06, 0.04, 0.02),  // Warm smoky haze
            light_intensity: 0.8,  // Volumetric light intensity
            light_tint: Color::srgb(1.0, 0.9, 0.7),  // Warm light tint
        },
        Transform::from_xyz(0.0, 7.0, 0.0),
    ));

    // Ground-level dense fog - for atmosphere at player height
    commands.spawn((
        Mesh3d(meshes.add(Cuboid::new(80.0, 2.0, 50.0))),
        FogVolume {
            density_factor: 0.025,  // Denser near floor
            density_texture: None,
            density_texture_offset: Vec3::ZERO,
            absorption: 0.01,
            scattering: 0.12,
            scattering_asymmetry: 0.4,
            fog_color: Color::srgb(0.04, 0.03, 0.02),
            light_intensity: 0.6,
            light_tint: Color::srgb(1.0, 0.85, 0.6),
        },
        Transform::from_xyz(0.0, 1.0, 0.0),
    ));

    info!("Volumetric fog setup complete");
}

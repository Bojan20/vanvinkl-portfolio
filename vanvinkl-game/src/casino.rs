//! Casino environment
//!
//! Contains:
//! - Floor, walls, ceiling
//! - AAA slot machines (portfolio sections)
//! - Lighting setup
//! - Decorative elements

use bevy::pbr::VolumetricLight;
use bevy::prelude::*;
use bevy_rapier3d::prelude::*;
use std::f32::consts::PI;

use crate::slot_machine::spawn_slot_machine;

pub struct CasinoPlugin;

impl Plugin for CasinoPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, spawn_casino);
    }
}

/// Portfolio sections mapped to slot machines
#[derive(Component, Clone, Copy, Debug)]
pub enum PortfolioSection {
    Skills,
    Services,
    About,
    Projects,
    Experience,
    Contact,
}

impl PortfolioSection {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Skills => "Skills",
            Self::Services => "Services",
            Self::About => "About Me",
            Self::Projects => "Projects",
            Self::Experience => "Experience",
            Self::Contact => "Contact",
        }
    }

    pub fn id(&self) -> &'static str {
        match self {
            Self::Skills => "skills",
            Self::Services => "services",
            Self::About => "about",
            Self::Projects => "projects",
            Self::Experience => "experience",
            Self::Contact => "contact",
        }
    }

    pub fn all() -> [Self; 6] {
        [
            Self::Skills,
            Self::Services,
            Self::About,
            Self::Projects,
            Self::Experience,
            Self::Contact,
        ]
    }
}

/// Slot machine marker
#[derive(Component)]
pub struct SlotMachine {
    pub section: PortfolioSection,
    pub is_active: bool,
}

/// Spawn the casino environment
fn spawn_casino(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    asset_server: Res<AssetServer>,
) {
    // === FLOOR - Luxurious casino carpet ===
    let floor_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.12, 0.05, 0.03),
        perceptual_roughness: 0.95,
        metallic: 0.0,
        ..default()
    });

    commands.spawn((
        Mesh3d(meshes.add(Plane3d::default().mesh().size(80.0, 50.0))),
        MeshMaterial3d(floor_material),
        Transform::from_xyz(0.0, 0.0, 0.0),
        Collider::cuboid(40.0, 0.1, 25.0),
        RigidBody::Fixed,
    ));

    // Floor pattern (gold carpet lines)
    let gold_line = materials.add(StandardMaterial {
        base_color: Color::srgb(0.6, 0.45, 0.1),
        perceptual_roughness: 0.7,
        metallic: 0.3,
        ..default()
    });

    for i in -4..=4 {
        let x = i as f32 * 8.0;
        commands.spawn((
            Mesh3d(meshes.add(Cuboid::new(0.1, 0.01, 40.0))),
            MeshMaterial3d(gold_line.clone()),
            Transform::from_xyz(x, 0.01, 0.0),
        ));
    }

    // === CEILING ===
    let ceiling_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.08, 0.04, 0.02),
        perceptual_roughness: 0.6,
        metallic: 0.15,
        ..default()
    });

    commands.spawn((
        Mesh3d(meshes.add(Plane3d::default().mesh().size(80.0, 50.0))),
        MeshMaterial3d(ceiling_material),
        Transform::from_xyz(0.0, 14.0, 0.0).with_rotation(Quat::from_rotation_x(PI)),
    ));

    // === WALLS ===
    let wall_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.15, 0.08, 0.05),
        perceptual_roughness: 0.75,
        metallic: 0.1,
        ..default()
    });

    // Back wall
    commands.spawn((
        Mesh3d(meshes.add(Plane3d::default().mesh().size(80.0, 14.0))),
        MeshMaterial3d(wall_material.clone()),
        Transform::from_xyz(0.0, 7.0, -20.0).with_rotation(Quat::from_rotation_x(-PI / 2.0)),
        Collider::cuboid(40.0, 7.0, 0.5),
        RigidBody::Fixed,
    ));

    // Side walls
    for (x, rot) in [(-35.0, PI / 2.0), (35.0, -PI / 2.0)] {
        commands.spawn((
            Mesh3d(meshes.add(Plane3d::default().mesh().size(50.0, 14.0))),
            MeshMaterial3d(wall_material.clone()),
            Transform::from_xyz(x, 7.0, 0.0).with_rotation(Quat::from_rotation_z(rot)),
            Collider::cuboid(0.5, 7.0, 25.0),
            RigidBody::Fixed,
        ));
    }

    // === PILLARS (Gold columns) ===
    let pillar_gold = materials.add(StandardMaterial {
        base_color: Color::srgb(0.85, 0.65, 0.1),
        perceptual_roughness: 0.25,
        metallic: 0.9,
        ..default()
    });

    for x in [-25.0, -10.0, 10.0, 25.0] {
        // Main column
        commands.spawn((
            Mesh3d(meshes.add(Cylinder::new(0.4, 12.0))),
            MeshMaterial3d(pillar_gold.clone()),
            Transform::from_xyz(x, 6.0, -18.0),
        ));

        // Base
        commands.spawn((
            Mesh3d(meshes.add(Cylinder::new(0.6, 0.4))),
            MeshMaterial3d(pillar_gold.clone()),
            Transform::from_xyz(x, 0.2, -18.0),
        ));

        // Capital
        commands.spawn((
            Mesh3d(meshes.add(Cylinder::new(0.6, 0.3))),
            MeshMaterial3d(pillar_gold.clone()),
            Transform::from_xyz(x, 12.0, -18.0),
        ));
    }

    // === SLOT MACHINES ===
    let sections = PortfolioSection::all();
    let spacing = 3.5;  // Wider spacing for bigger machines
    let total_width = (sections.len() - 1) as f32 * spacing;
    let start_x = -total_width / 2.0;

    for (i, section) in sections.iter().enumerate() {
        let x = start_x + i as f32 * spacing;
        let z = -8.0;

        let machine_entity = spawn_slot_machine(
            &mut commands,
            &mut meshes,
            &mut materials,
            Vec3::new(x, 0.0, z),
            section.label(),
            section.id(),
            &asset_server,
        );

        // Collider (W=1.68, H=4.56, D=1.08) - matches new cyberpunk machine
        commands.entity(machine_entity).insert((
            SlotMachine {
                section: *section,
                is_active: false,
            },
            Collider::cuboid(0.95, 2.3, 0.6),
            RigidBody::Fixed,
        ));
    }

    // === CHANDELIER ===
    spawn_chandelier(&mut commands, &mut meshes, &mut materials, Vec3::new(0.0, 12.0, 0.0));

    // === LIGHTING ===

    // === VOLUMETRIC LIGHTING - God rays ===

    // Main chandelier light - volumetric
    commands.spawn((
        PointLight {
            color: Color::srgb(1.0, 0.92, 0.75),
            intensity: 120000.0,  // Boosted for volumetrics
            radius: 1.0,
            range: 45.0,
            shadows_enabled: true,  // Required for volumetrics
            ..default()
        },
        VolumetricLight,  // God rays!
        Transform::from_xyz(0.0, 11.0, 0.0),
    ));

    // Front fill spotlight - volumetric beam
    commands.spawn((
        SpotLight {
            color: Color::srgb(1.0, 0.95, 0.9),
            intensity: 80000.0,  // Boosted
            range: 50.0,
            radius: 0.5,
            outer_angle: PI / 2.5,
            inner_angle: PI / 3.0,
            shadows_enabled: true,
            ..default()
        },
        VolumetricLight,
        Transform::from_xyz(0.0, 10.0, 20.0).looking_at(Vec3::new(0.0, 1.0, -5.0), Vec3::Y),
    ));

    // Warm side fills - volumetric
    for x in [-20.0, 20.0] {
        commands.spawn((
            PointLight {
                color: Color::srgb(1.0, 0.75, 0.4),
                intensity: 40000.0,  // Boosted
                range: 30.0,
                shadows_enabled: true,
                ..default()
            },
            VolumetricLight,
            Transform::from_xyz(x, 8.0, -5.0),
        ));
    }

    // Machine accent spotlights - dramatic beams on each machine
    for i in 0..6 {
        let x = start_x + i as f32 * spacing;
        commands.spawn((
            SpotLight {
                color: Color::srgb(1.0, 0.85, 0.5),
                intensity: 50000.0,  // Jače za veće mašine
                range: 20.0,
                outer_angle: PI / 4.0,
                inner_angle: PI / 6.0,
                shadows_enabled: true,
                ..default()
            },
            VolumetricLight,
            Transform::from_xyz(x, 11.0, -4.0).looking_at(Vec3::new(x, 3.5, -10.0), Vec3::Y),
        ));
    }

    // Back rim lights
    for i in 0..6 {
        let x = start_x + i as f32 * spacing;
        commands.spawn((
            SpotLight {
                color: Color::srgb(0.4, 0.6, 1.0),
                intensity: 15000.0,
                range: 12.0,
                outer_angle: PI / 4.0,
                inner_angle: PI / 6.0,
                shadows_enabled: false,
                ..default()
            },
            Transform::from_xyz(x, 4.0, -16.0).looking_at(Vec3::new(x, 3.0, -10.0), Vec3::Y),
        ));
    }

    info!("Casino environment spawned with AAA slot machines");
}

/// Spawn a decorative chandelier
fn spawn_chandelier(
    commands: &mut Commands,
    meshes: &mut ResMut<Assets<Mesh>>,
    materials: &mut ResMut<Assets<StandardMaterial>>,
    position: Vec3,
) {
    let gold = materials.add(StandardMaterial {
        base_color: Color::srgb(0.9, 0.7, 0.2),
        metallic: 0.95,
        perceptual_roughness: 0.15,
        ..default()
    });

    let crystal = materials.add(StandardMaterial {
        base_color: Color::srgba(1.0, 1.0, 1.0, 0.3),
        metallic: 0.0,
        perceptual_roughness: 0.05,
        emissive: LinearRgba::new(0.5, 0.45, 0.3, 1.0),
        ..default()
    });

    commands
        .spawn((
            Transform::from_translation(position),
            GlobalTransform::default(),
            Visibility::default(),
            InheritedVisibility::default(),
            ViewVisibility::default(),
            Name::new("Chandelier"),
        ))
        .with_children(|parent| {
            // Central hub
            parent.spawn((
                Mesh3d(meshes.add(Sphere::new(0.5))),
                MeshMaterial3d(gold.clone()),
                Transform::from_xyz(0.0, 0.0, 0.0),
            ));

            // Arms and crystals (3 tiers)
            for tier in 0..3 {
                let tier_y = -0.5 - tier as f32 * 0.8;
                let tier_radius = 1.0 + tier as f32 * 0.5;
                let arm_count = 6 + tier * 2;

                for i in 0..arm_count {
                    let angle = (i as f32 / arm_count as f32) * PI * 2.0;
                    let x = angle.cos() * tier_radius;
                    let z = angle.sin() * tier_radius;

                    // Arm
                    parent.spawn((
                        Mesh3d(meshes.add(Cylinder::new(0.03, tier_radius))),
                        MeshMaterial3d(gold.clone()),
                        Transform::from_xyz(x / 2.0, tier_y, z / 2.0)
                            .with_rotation(Quat::from_rotation_z(PI / 2.0 - angle)),
                    ));

                    // Crystal drop
                    parent.spawn((
                        Mesh3d(meshes.add(Capsule3d::new(0.08, 0.3))),
                        MeshMaterial3d(crystal.clone()),
                        Transform::from_xyz(x, tier_y - 0.3, z),
                    ));
                }

                // Tier ring
                parent.spawn((
                    Mesh3d(meshes.add(Torus::new(tier_radius - 0.05, 0.04))),
                    MeshMaterial3d(gold.clone()),
                    Transform::from_xyz(0.0, tier_y, 0.0),
                ));
            }
        });
}

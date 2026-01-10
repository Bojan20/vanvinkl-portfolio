//! Player/Avatar controller
//!
//! Handles:
//! - WASD/Arrow movement
//! - Rotation towards movement direction
//! - Physics-based movement with Rapier
//! - Mobile joystick input (via JS bridge)

use bevy::prelude::*;
use bevy_rapier3d::prelude::*;

use crate::GameState;

pub struct PlayerPlugin;

impl Plugin for PlayerPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(OnEnter(GameState::Playing), spawn_player)
            .add_systems(
                Update,
                (player_movement, player_rotation).run_if(in_state(GameState::Playing)),
            );
    }
}

/// Player marker component
#[derive(Component)]
pub struct Player {
    pub speed: f32,
    pub rotation_speed: f32,
}

impl Default for Player {
    fn default() -> Self {
        Self {
            speed: 16.0,  // Dupla brzina
            rotation_speed: 15.0,
        }
    }
}

/// Current movement input
#[derive(Component, Default)]
pub struct MovementInput {
    pub direction: Vec2,
}

/// Spawn the player avatar
fn spawn_player(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    // Gold material for VIP avatar
    let gold_material = materials.add(StandardMaterial {
        base_color: Color::srgb(1.0, 0.84, 0.0),
        metallic: 0.9,
        perceptual_roughness: 0.3,
        emissive: LinearRgba::new(0.3, 0.25, 0.0, 1.0),
        ..default()
    });

    let suit_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.1, 0.1, 0.15),
        metallic: 0.2,
        perceptual_roughness: 0.8,
        ..default()
    });

    // Player capsule with physics
    commands
        .spawn((
            Player::default(),
            MovementInput::default(),
            Transform::from_xyz(0.0, 1.0, 10.0),
            GlobalTransform::default(),
            Visibility::default(),
            InheritedVisibility::default(),
            ViewVisibility::default(),
            // Physics
            RigidBody::Dynamic,
            Collider::capsule_y(0.5, 0.3),
            LockedAxes::ROTATION_LOCKED_X | LockedAxes::ROTATION_LOCKED_Z,
            Velocity::default(),
            Damping {
                linear_damping: 5.0,
                angular_damping: 5.0,
            },
            GravityScale(1.0),
        ))
        .with_children(|parent| {
            // Body (capsule)
            parent.spawn((
                Mesh3d(meshes.add(Capsule3d::new(0.3, 1.0))),
                MeshMaterial3d(suit_material.clone()),
                Transform::from_xyz(0.0, 0.0, 0.0),
            ));

            // Head (sphere)
            parent.spawn((
                Mesh3d(meshes.add(Sphere::new(0.25))),
                MeshMaterial3d(gold_material.clone()),
                Transform::from_xyz(0.0, 0.8, 0.0),
            ));

            // Hat brim (cylinder)
            parent.spawn((
                Mesh3d(meshes.add(Cylinder::new(0.35, 0.08))),
                MeshMaterial3d(suit_material.clone()),
                Transform::from_xyz(0.0, 1.0, 0.0),
            ));

            // Hat top (cylinder)
            parent.spawn((
                Mesh3d(meshes.add(Cylinder::new(0.2, 0.25))),
                MeshMaterial3d(suit_material),
                Transform::from_xyz(0.0, 1.15, 0.0),
            ));
        });

    info!("Player spawned");
}

/// Handle player movement input
fn player_movement(
    keyboard: Res<ButtonInput<KeyCode>>,
    mut query: Query<(&Player, &mut MovementInput, &mut Velocity)>,
) {
    for (player, mut input, mut velocity) in query.iter_mut() {
        // Gather input
        let mut direction = Vec2::ZERO;

        if keyboard.pressed(KeyCode::KeyW) || keyboard.pressed(KeyCode::ArrowUp) {
            direction.y += 1.0;
        }
        if keyboard.pressed(KeyCode::KeyS) || keyboard.pressed(KeyCode::ArrowDown) {
            direction.y -= 1.0;
        }
        if keyboard.pressed(KeyCode::KeyA) || keyboard.pressed(KeyCode::ArrowLeft) {
            direction.x -= 1.0;
        }
        if keyboard.pressed(KeyCode::KeyD) || keyboard.pressed(KeyCode::ArrowRight) {
            direction.x += 1.0;
        }

        // Normalize for consistent speed in all directions
        if direction.length_squared() > 0.0 {
            direction = direction.normalize();
        }

        input.direction = direction;

        // Apply velocity (Z is forward in Bevy)
        let move_vec = Vec3::new(direction.x, 0.0, -direction.y) * player.speed;
        velocity.linvel.x = move_vec.x;
        velocity.linvel.z = move_vec.z;
    }
}

/// Rotate player to face movement direction
fn player_rotation(
    mut query: Query<(&Player, &MovementInput, &mut Transform)>,
    time: Res<Time>,
) {
    for (player, input, mut transform) in query.iter_mut() {
        if input.direction.length_squared() > 0.01 {
            // Calculate target rotation (Z is forward)
            let target_angle = (-input.direction.x).atan2(-input.direction.y);
            let target_rotation = Quat::from_rotation_y(target_angle);

            // Smooth rotation
            transform.rotation = transform.rotation.slerp(
                target_rotation,
                player.rotation_speed * time.delta_secs(),
            );
        }
    }
}

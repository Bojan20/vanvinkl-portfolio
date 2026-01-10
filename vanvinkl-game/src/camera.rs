//! Third-person camera system
//!
//! Features:
//! - Smooth follow with spring physics
//! - Configurable offset (height, distance)
//! - Look-at player with damping

use bevy::prelude::*;

use crate::player::Player;
use crate::GameState;

pub struct CameraPlugin;

impl Plugin for CameraPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(OnEnter(GameState::Playing), spawn_camera)
            .add_systems(
                Update,
                camera_follow.run_if(in_state(GameState::Playing)),
            );
    }
}

/// Main game camera marker
#[derive(Component)]
pub struct GameCamera {
    /// Offset from player (x, y, z) where y is up, z is back
    pub offset: Vec3,
    /// How quickly camera follows (higher = snappier)
    pub follow_speed: f32,
    /// How quickly camera rotates to look at target
    pub look_speed: f32,
}

impl Default for GameCamera {
    fn default() -> Self {
        Self {
            offset: Vec3::new(0.0, 6.0, 12.0),
            follow_speed: 5.0,
            look_speed: 8.0,
        }
    }
}

/// Spawn the game camera
fn spawn_camera(
    mut commands: Commands,
    existing_cameras: Query<Entity, With<Camera3d>>,
) {
    // Despawn any existing cameras to avoid duplicates
    for entity in existing_cameras.iter() {
        commands.entity(entity).despawn_recursive();
    }

    commands.spawn((
        GameCamera::default(),
        Camera3d::default(),
        Camera {
            order: 0,
            ..default()
        },
        Transform::from_xyz(0.0, 8.0, 15.0).looking_at(Vec3::new(0.0, 1.0, 0.0), Vec3::Y),
        Projection::Perspective(PerspectiveProjection {
            fov: 60.0_f32.to_radians(),
            near: 0.1,
            far: 100.0,
            ..default()
        }),
        // Tonemapping for cinematic look
        bevy::core_pipeline::tonemapping::Tonemapping::TonyMcMapface,
    ));

    info!("Game camera spawned");
}

/// Smooth camera follow system
fn camera_follow(
    player_query: Query<&Transform, (With<Player>, Without<GameCamera>)>,
    mut camera_query: Query<(&GameCamera, &mut Transform), Without<Player>>,
    time: Res<Time>,
) {
    let Ok(player_transform) = player_query.get_single() else {
        return;
    };

    for (camera, mut cam_transform) in camera_query.iter_mut() {
        // Target position: player position + offset
        let target_pos = player_transform.translation + camera.offset;

        // Smooth position follow
        cam_transform.translation = cam_transform.translation.lerp(
            target_pos,
            camera.follow_speed * time.delta_secs(),
        );

        // Look at player (slightly above ground)
        let look_target = player_transform.translation + Vec3::Y * 1.0;
        let target_rotation =
            Transform::from_translation(cam_transform.translation).looking_at(look_target, Vec3::Y);

        // Smooth rotation
        cam_transform.rotation = cam_transform.rotation.slerp(
            target_rotation.rotation,
            camera.look_speed * time.delta_secs(),
        );
    }
}

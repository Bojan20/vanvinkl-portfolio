//! Entrance animation
//!
//! Vegas-style grand entrance with:
//! - Doors opening
//! - Light burst
//! - Title reveal
//! - Transition to gameplay

use bevy::prelude::*;
use bevy_tweening::*;

use crate::GameState;

pub struct EntrancePlugin;

impl Plugin for EntrancePlugin {
    fn build(&self, app: &mut App) {
        app.add_plugins(TweeningPlugin)
            .add_systems(OnEnter(GameState::Loading), setup_entrance)
            .add_systems(OnEnter(GameState::Entrance), start_entrance_animation)
            .add_systems(
                Update,
                (check_loading_complete, update_entrance).run_if(in_state(GameState::Entrance)),
            );
    }
}

/// Entrance door marker
#[derive(Component)]
pub struct EntranceDoor {
    pub is_left: bool,
}

/// Light burst effect
#[derive(Component)]
pub struct LightBurst;

/// Entrance state
#[derive(Resource)]
pub struct EntranceState {
    pub timer: Timer,
    pub phase: EntrancePhase,
}

#[derive(Clone, Copy, PartialEq)]
pub enum EntrancePhase {
    DoorsOpening,
    LightBurst,
    TitleReveal,
    FadeOut,
    Complete,
}

/// Setup entrance elements (2D overlay)
fn setup_entrance(
    mut commands: Commands,
    mut next_state: ResMut<NextState<GameState>>,
) {
    // Skip entrance for now - go directly to playing
    // TODO: Implement proper entrance with StateScoped cleanup
    next_state.set(GameState::Playing);

    commands.insert_resource(EntranceState {
        timer: Timer::from_seconds(3.5, TimerMode::Once),
        phase: EntrancePhase::DoorsOpening,
    });
}

/// Check if all assets are loaded
fn check_loading_complete() {
    // Placeholder - check asset loading status
}

/// Start the entrance animation sequence
fn start_entrance_animation(_commands: Commands) {
    // NOTE: Skipped for now - entrance goes directly to Playing state
    // Camera is spawned by CameraPlugin in Playing state
    info!("Entrance animation started (skipped)");
}

/// Update entrance animation
fn update_entrance(
    time: Res<Time>,
    mut state: ResMut<EntranceState>,
    mut door_query: Query<(&EntranceDoor, &mut Transform)>,
    mut light_query: Query<&mut PointLight, With<LightBurst>>,
    mut next_game_state: ResMut<NextState<GameState>>,
) {
    state.timer.tick(time.delta());
    let progress = state.timer.elapsed_secs();

    // Phase transitions based on time
    state.phase = match progress {
        t if t < 1.2 => EntrancePhase::DoorsOpening,
        t if t < 2.0 => EntrancePhase::LightBurst,
        t if t < 2.8 => EntrancePhase::TitleReveal,
        t if t < 3.5 => EntrancePhase::FadeOut,
        _ => EntrancePhase::Complete,
    };

    // Animate doors
    for (door, mut transform) in door_query.iter_mut() {
        let door_progress = (progress / 1.2).clamp(0.0, 1.0);
        let ease = ease_out_cubic(door_progress);

        let target_x = if door.is_left { -12.0 } else { 12.0 };
        let start_x = if door.is_left { -5.0 } else { 5.0 };

        transform.translation.x = start_x + (target_x - start_x) * ease;
    }

    // Animate light burst
    if let Ok(mut light) = light_query.get_single_mut() {
        let light_progress = ((progress - 0.5) / 1.5).clamp(0.0, 1.0);
        light.intensity = 100000.0 * ease_out_cubic(light_progress) * (1.0 - progress / 3.5);
    }

    // Complete - transition to playing
    if state.phase == EntrancePhase::Complete {
        next_game_state.set(GameState::Playing);
        info!("Entrance complete, starting game");
    }
}

/// Cubic ease-out function
fn ease_out_cubic(t: f32) -> f32 {
    1.0 - (1.0 - t).powi(3)
}

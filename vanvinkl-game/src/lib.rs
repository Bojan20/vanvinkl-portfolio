//! VanVinkl Game Library
//!
//! WASM entry point for web builds

pub mod camera;
pub mod casino;
pub mod entrance;
pub mod interaction;
pub mod player;
pub mod rendering;
pub mod slot_machine;
pub mod ui;

use bevy::prelude::*;
use bevy_rapier3d::prelude::*;
use wasm_bindgen::prelude::*;

/// Game states
#[derive(States, Debug, Clone, Copy, Eq, PartialEq, Hash, Default)]
pub enum GameState {
    #[default]
    Loading,
    Entrance,
    Playing,
    Viewing,
}

/// WASM entry point
#[wasm_bindgen(start)]
pub fn wasm_main() {
    // Panic hook for better error messages
    console_error_panic_hook::set_once();

    run_game();
}

/// Run the game (shared between native and WASM)
pub fn run_game() {
    App::new()
        .add_plugins(
            DefaultPlugins
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        title: "VanVinkl - Creative Portfolio".into(),
                        resolution: (1920., 1080.).into(),
                        present_mode: bevy::window::PresentMode::AutoVsync,
                        fit_canvas_to_parent: true,
                        prevent_default_event_handling: false,
                        canvas: Some("#game-canvas".into()),
                        ..default()
                    }),
                    ..default()
                })
                .set(ImagePlugin::default_nearest()),
        )
        .add_plugins(RapierPhysicsPlugin::<NoUserData>::default())
        .init_state::<GameState>()
        .add_plugins((
            camera::CameraPlugin,
            player::PlayerPlugin,
            casino::CasinoPlugin,
            slot_machine::SlotMachinePlugin,
            interaction::InteractionPlugin,
            entrance::EntrancePlugin,
            ui::UiPlugin,
            rendering::RenderingPlugin,
        ))
        .add_systems(Startup, setup_world)
        .run();
}

/// Initial world setup
fn setup_world(mut commands: Commands) {
    commands.insert_resource(AmbientLight {
        color: Color::srgb(1.0, 0.95, 0.8),
        brightness: 800.0,
    });

    commands.insert_resource(ClearColor(Color::srgb(0.02, 0.01, 0.01)));
}

//! Interaction system
//!
//! Handles:
//! - Proximity detection to slot machines
//! - Space key to interact
//! - Highlighting active machines

use bevy::prelude::*;

use crate::casino::{PortfolioSection, SlotMachine};
use crate::player::Player;
use crate::GameState;

pub struct InteractionPlugin;

impl Plugin for InteractionPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(NearestMachine::default())
            .add_event::<MachineInteractEvent>()
            .add_systems(
                Update,
                (
                    detect_proximity,
                    handle_interaction_input,
                    highlight_active_machine,
                )
                    .run_if(in_state(GameState::Playing)),
            );
    }
}

/// Currently nearest machine
#[derive(Resource, Default)]
pub struct NearestMachine {
    pub entity: Option<Entity>,
    pub section: Option<PortfolioSection>,
    pub distance: f32,
}

/// Event fired when player interacts with a machine
#[derive(Event)]
pub struct MachineInteractEvent {
    pub section: PortfolioSection,
}

/// Interaction range
const INTERACTION_RANGE: f32 = 3.0;

/// Detect nearest slot machine
fn detect_proximity(
    player_query: Query<&Transform, With<Player>>,
    machine_query: Query<(Entity, &Transform, &SlotMachine)>,
    mut nearest: ResMut<NearestMachine>,
) {
    let Ok(player_transform) = player_query.get_single() else {
        return;
    };

    let player_pos = player_transform.translation;
    let mut closest: Option<(Entity, PortfolioSection, f32)> = None;

    for (entity, machine_transform, machine) in machine_query.iter() {
        let distance = player_pos.distance(machine_transform.translation);

        if distance < INTERACTION_RANGE {
            if closest.is_none() || distance < closest.as_ref().unwrap().2 {
                closest = Some((entity, machine.section, distance));
            }
        }
    }

    if let Some((entity, section, distance)) = closest {
        nearest.entity = Some(entity);
        nearest.section = Some(section);
        nearest.distance = distance;
    } else {
        nearest.entity = None;
        nearest.section = None;
        nearest.distance = f32::MAX;
    }
}

/// Handle space key interaction
fn handle_interaction_input(
    keyboard: Res<ButtonInput<KeyCode>>,
    nearest: Res<NearestMachine>,
    mut events: EventWriter<MachineInteractEvent>,
    mut next_state: ResMut<NextState<GameState>>,
) {
    if keyboard.just_pressed(KeyCode::Space) {
        if let Some(section) = nearest.section {
            info!("Interacting with: {:?}", section);
            events.send(MachineInteractEvent { section });
            next_state.set(GameState::Viewing);
        }
    }
}

/// Highlight the nearest interactable machine
fn highlight_active_machine(
    nearest: Res<NearestMachine>,
    mut machine_query: Query<(Entity, &mut SlotMachine)>,
) {
    for (entity, mut machine) in machine_query.iter_mut() {
        machine.is_active = nearest.entity == Some(entity);
    }
}

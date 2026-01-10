//! UI system
//!
//! Handles:
//! - HUD overlay (instructions)
//! - Portfolio detail view
//! - HTML/JS bridge for web overlay

use bevy::prelude::*;

use crate::casino::PortfolioSection;
use crate::interaction::{MachineInteractEvent, NearestMachine};
use crate::GameState;

pub struct UiPlugin;

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(OnEnter(GameState::Playing), setup_hud)
            .add_systems(
                Update,
                (update_instruction_text, handle_view_close).run_if(in_state(GameState::Playing)),
            )
            .add_systems(OnEnter(GameState::Viewing), show_detail_view)
            .add_systems(
                Update,
                handle_detail_close.run_if(in_state(GameState::Viewing)),
            );
    }
}

/// Instruction text marker
#[derive(Component)]
struct InstructionText;

/// Detail view marker
#[derive(Component)]
struct DetailView;

/// Setup HUD elements
fn setup_hud(mut commands: Commands) {
    // Root UI node
    commands
        .spawn((
            Node {
                width: Val::Percent(100.0),
                height: Val::Percent(100.0),
                justify_content: JustifyContent::SpaceBetween,
                flex_direction: FlexDirection::Column,
                padding: UiRect::all(Val::Px(20.0)),
                ..default()
            },
            StateScoped(GameState::Playing),
        ))
        .with_children(|parent| {
            // Top instruction bar
            parent
                .spawn((
                    Node {
                        width: Val::Percent(100.0),
                        justify_content: JustifyContent::Center,
                        ..default()
                    },
                ))
                .with_children(|parent| {
                    parent.spawn((
                        InstructionText,
                        Text::new("Use WASD to move"),
                        TextFont {
                            font_size: 20.0,
                            ..default()
                        },
                        TextColor(Color::srgba(1.0, 1.0, 1.0, 0.7)),
                    ));
                });

            // Bottom spacer (for future controls)
            parent.spawn(Node::default());
        });

    info!("HUD setup complete");
}

/// Update instruction text based on proximity
fn update_instruction_text(
    nearest: Res<NearestMachine>,
    mut query: Query<&mut Text, With<InstructionText>>,
) {
    for mut text in query.iter_mut() {
        if let Some(section) = &nearest.section {
            **text = format!("Press SPACE to view {}", section.label());
        } else {
            **text = "Use WASD to move".to_string();
        }
    }
}

/// Handle closing view with movement
fn handle_view_close() {
    // Placeholder - ESC to close would go here
}

/// Show portfolio detail view
fn show_detail_view(
    mut commands: Commands,
    mut events: EventReader<MachineInteractEvent>,
) {
    for event in events.read() {
        // Full-screen overlay
        commands
            .spawn((
                DetailView,
                Node {
                    width: Val::Percent(100.0),
                    height: Val::Percent(100.0),
                    justify_content: JustifyContent::Center,
                    align_items: AlignItems::Center,
                    ..default()
                },
                BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.9)),
                StateScoped(GameState::Viewing),
            ))
            .with_children(|parent| {
                // Content card
                parent
                    .spawn((
                        Node {
                            width: Val::Px(600.0),
                            height: Val::Px(400.0),
                            flex_direction: FlexDirection::Column,
                            padding: UiRect::all(Val::Px(30.0)),
                            ..default()
                        },
                        BackgroundColor(Color::srgb(0.1, 0.08, 0.06)),
                        BorderRadius::all(Val::Px(16.0)),
                    ))
                    .with_children(|parent| {
                        // Title
                        parent.spawn((
                            Text::new(event.section.label()),
                            TextFont {
                                font_size: 36.0,
                                ..default()
                            },
                            TextColor(Color::srgb(1.0, 0.84, 0.0)), // Gold
                        ));

                        // Description placeholder
                        parent.spawn((
                            Text::new(get_section_content(event.section)),
                            TextFont {
                                font_size: 18.0,
                                ..default()
                            },
                            TextColor(Color::srgba(1.0, 1.0, 1.0, 0.8)),
                            Node {
                                margin: UiRect::top(Val::Px(20.0)),
                                ..default()
                            },
                        ));

                        // Close hint
                        parent.spawn((
                            Text::new("Press ESC to close"),
                            TextFont {
                                font_size: 14.0,
                                ..default()
                            },
                            TextColor(Color::srgba(1.0, 1.0, 1.0, 0.5)),
                            Node {
                                margin: UiRect::top(Val::Auto),
                                ..default()
                            },
                        ));
                    });
            });

        info!("Showing detail view for: {:?}", event.section);
    }
}

/// Handle closing detail view
fn handle_detail_close(
    keyboard: Res<ButtonInput<KeyCode>>,
    mut next_state: ResMut<NextState<GameState>>,
) {
    if keyboard.just_pressed(KeyCode::Escape) {
        next_state.set(GameState::Playing);
        info!("Closing detail view");
    }
}

/// Get content for each portfolio section
fn get_section_content(section: PortfolioSection) -> &'static str {
    match section {
        PortfolioSection::Skills => {
            "Rust, TypeScript, WebGL, Three.js, React, Node.js, PostgreSQL, Docker, AWS"
        }
        PortfolioSection::Services => {
            "Full-stack development, 3D web experiences, Audio software, Game development"
        }
        PortfolioSection::About => {
            "Creative developer with 10+ years of experience building immersive digital experiences."
        }
        PortfolioSection::Projects => {
            "ReelForge Audio Suite, VanVinkl Casino, Various client projects"
        }
        PortfolioSection::Experience => {
            "Senior Developer @ TechCorp, Lead Engineer @ StartupX, Freelance consultant"
        }
        PortfolioSection::Contact => "hello@vanvinkl.com | GitHub: vanvinkl | LinkedIn: vanvinkl",
    }
}

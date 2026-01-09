/**
 * Game State Machine - XState 5
 *
 * Manages the complete game state including:
 * - Navigation modes (exploration, slot interaction)
 * - Slot machine states (idle, spinning, win/lose)
 * - UI states (menus, modals, tutorials)
 * - Audio states
 */

import { createMachine, assign } from "xstate";

// Types
export interface Position {
  x: number;
  y: number;
}

export interface SlotResult {
  symbols: string[][];
  winAmount: number;
  winLines: number[];
  isJackpot: boolean;
}

export interface GameContext {
  // Player
  playerPosition: Position;
  playerRotation: number;
  balance: number;

  // Current slot
  currentSlotId: string | null;
  betAmount: number;

  // Last spin result
  lastResult: SlotResult | null;

  // UI
  showHelp: boolean;
  showSettings: boolean;
  tutorialStep: number;
  tutorialComplete: boolean;

  // Audio
  audioEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;

  // Stats
  totalSpins: number;
  totalWins: number;
  biggestWin: number;
}

// Events
export type GameEvent =
  | { type: "MOVE"; direction: Position }
  | { type: "ROTATE"; angle: number }
  | { type: "APPROACH_SLOT"; slotId: string }
  | { type: "LEAVE_SLOT" }
  | { type: "SIT_DOWN" }
  | { type: "STAND_UP" }
  | { type: "SET_BET"; amount: number }
  | { type: "SPIN" }
  | { type: "SPIN_COMPLETE"; result: SlotResult }
  | { type: "COLLECT_WIN" }
  | { type: "TOGGLE_HELP" }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "CLOSE_MODAL" }
  | { type: "NEXT_TUTORIAL" }
  | { type: "SKIP_TUTORIAL" }
  | { type: "TOGGLE_AUDIO" }
  | { type: "SET_MUSIC_VOLUME"; volume: number }
  | { type: "SET_SFX_VOLUME"; volume: number }
  | { type: "RESET" };

// Initial context
const initialContext: GameContext = {
  playerPosition: { x: 0, y: 0 },
  playerRotation: 0,
  balance: 1000,
  currentSlotId: null,
  betAmount: 10,
  lastResult: null,
  showHelp: false,
  showSettings: false,
  tutorialStep: 0,
  tutorialComplete: false,
  audioEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  totalSpins: 0,
  totalWins: 0,
  biggestWin: 0,
};

// Game state machine
export const gameMachine = createMachine({
  id: "game",
  initial: "loading",
  context: initialContext,
  types: {} as {
    context: GameContext;
    events: GameEvent;
  },

  states: {
    // Initial loading state
    loading: {
      always: [
        {
          target: "tutorial",
          guard: ({ context }: { context: GameContext }) => !context.tutorialComplete,
        },
        { target: "exploring" },
      ],
    },

    // Tutorial flow
    tutorial: {
      initial: "welcome",
      states: {
        welcome: {
          on: {
            NEXT_TUTORIAL: "movement",
            SKIP_TUTORIAL: {
              target: "#game.exploring",
              actions: assign({ tutorialComplete: true, tutorialStep: 0 }),
            },
          },
          entry: assign({ tutorialStep: 0 }),
        },
        movement: {
          on: {
            NEXT_TUTORIAL: "interaction",
            SKIP_TUTORIAL: {
              target: "#game.exploring",
              actions: assign({ tutorialComplete: true }),
            },
          },
          entry: assign({ tutorialStep: 1 }),
        },
        interaction: {
          on: {
            NEXT_TUTORIAL: "slots",
            SKIP_TUTORIAL: {
              target: "#game.exploring",
              actions: assign({ tutorialComplete: true }),
            },
          },
          entry: assign({ tutorialStep: 2 }),
        },
        slots: {
          on: {
            NEXT_TUTORIAL: {
              target: "#game.exploring",
              actions: assign({ tutorialComplete: true, tutorialStep: 0 }),
            },
            SKIP_TUTORIAL: {
              target: "#game.exploring",
              actions: assign({ tutorialComplete: true }),
            },
          },
          entry: assign({ tutorialStep: 3 }),
        },
      },
    },

    // Main exploration state
    exploring: {
      on: {
        MOVE: {
          actions: assign({
            playerPosition: ({ context, event }) => ({
              x: context.playerPosition.x + event.direction.x,
              y: context.playerPosition.y + event.direction.y,
            }),
          }),
        },
        ROTATE: {
          actions: assign({
            playerRotation: ({ event }) => event.angle,
          }),
        },
        APPROACH_SLOT: {
          target: "nearSlot",
          actions: assign({
            currentSlotId: ({ event }) => event.slotId,
          }),
        },
        TOGGLE_HELP: {
          actions: assign({
            showHelp: ({ context }) => !context.showHelp,
          }),
        },
        TOGGLE_SETTINGS: {
          actions: assign({
            showSettings: ({ context }) => !context.showSettings,
          }),
        },
      },
    },

    // Near a slot machine
    nearSlot: {
      on: {
        MOVE: {
          actions: assign({
            playerPosition: ({ context, event }) => ({
              x: context.playerPosition.x + event.direction.x,
              y: context.playerPosition.y + event.direction.y,
            }),
          }),
        },
        LEAVE_SLOT: {
          target: "exploring",
          actions: assign({ currentSlotId: null }),
        },
        SIT_DOWN: "playing",
        TOGGLE_HELP: {
          actions: assign({
            showHelp: ({ context }) => !context.showHelp,
          }),
        },
      },
    },

    // Playing at a slot machine
    playing: {
      initial: "idle",
      states: {
        idle: {
          on: {
            SET_BET: {
              actions: assign({
                betAmount: ({ event, context }) =>
                  Math.min(event.amount, context.balance),
              }),
            },
            SPIN: {
              target: "spinning",
              guard: ({ context }) => context.balance >= context.betAmount,
              actions: assign({
                balance: ({ context }) => context.balance - context.betAmount,
                totalSpins: ({ context }) => context.totalSpins + 1,
              }),
            },
            STAND_UP: "#game.nearSlot",
          },
        },

        spinning: {
          on: {
            SPIN_COMPLETE: [
              {
                target: "jackpot",
                guard: ({ event }) => event.result.isJackpot,
                actions: assign({
                  lastResult: ({ event }) => event.result,
                }),
              },
              {
                target: "win",
                guard: ({ event }) => event.result.winAmount > 0,
                actions: assign({
                  lastResult: ({ event }) => event.result,
                }),
              },
              {
                target: "lose",
                actions: assign({
                  lastResult: ({ event }) => event.result,
                }),
              },
            ],
          },
          // Auto-complete after timeout (fallback)
          after: {
            10000: {
              target: "idle",
              actions: assign({
                lastResult: {
                  symbols: [],
                  winAmount: 0,
                  winLines: [],
                  isJackpot: false,
                },
              }),
            },
          },
        },

        win: {
          on: {
            COLLECT_WIN: {
              target: "idle",
              actions: assign({
                balance: ({ context }) =>
                  context.balance + (context.lastResult?.winAmount || 0),
                totalWins: ({ context }) => context.totalWins + 1,
                biggestWin: ({ context }) =>
                  Math.max(
                    context.biggestWin,
                    context.lastResult?.winAmount || 0
                  ),
                lastResult: null,
              }),
            },
          },
          // Auto-collect after delay
          after: {
            3000: {
              target: "idle",
              actions: assign({
                balance: ({ context }) =>
                  context.balance + (context.lastResult?.winAmount || 0),
                totalWins: ({ context }) => context.totalWins + 1,
                biggestWin: ({ context }) =>
                  Math.max(
                    context.biggestWin,
                    context.lastResult?.winAmount || 0
                  ),
                lastResult: null,
              }),
            },
          },
        },

        jackpot: {
          on: {
            COLLECT_WIN: {
              target: "idle",
              actions: assign({
                balance: ({ context }) =>
                  context.balance + (context.lastResult?.winAmount || 0),
                totalWins: ({ context }) => context.totalWins + 1,
                biggestWin: ({ context }) =>
                  Math.max(
                    context.biggestWin,
                    context.lastResult?.winAmount || 0
                  ),
                lastResult: null,
              }),
            },
          },
          // Jackpot celebration lasts longer
          after: {
            8000: {
              target: "idle",
              actions: assign({
                balance: ({ context }) =>
                  context.balance + (context.lastResult?.winAmount || 0),
                totalWins: ({ context }) => context.totalWins + 1,
                biggestWin: ({ context }) =>
                  Math.max(
                    context.biggestWin,
                    context.lastResult?.winAmount || 0
                  ),
                lastResult: null,
              }),
            },
          },
        },

        lose: {
          after: {
            1000: {
              target: "idle",
              actions: assign({ lastResult: null }),
            },
          },
        },
      },
      on: {
        TOGGLE_HELP: {
          actions: assign({
            showHelp: ({ context }) => !context.showHelp,
          }),
        },
      },
    },
  },

  // Global events (available in all states)
  on: {
    TOGGLE_AUDIO: {
      actions: assign({
        audioEnabled: ({ context }) => !context.audioEnabled,
      }),
    },
    SET_MUSIC_VOLUME: {
      actions: assign({
        musicVolume: ({ event }) => Math.max(0, Math.min(1, event.volume)),
      }),
    },
    SET_SFX_VOLUME: {
      actions: assign({
        sfxVolume: ({ event }) => Math.max(0, Math.min(1, event.volume)),
      }),
    },
    CLOSE_MODAL: {
      actions: assign({
        showHelp: false,
        showSettings: false,
      }),
    },
    RESET: {
      target: ".exploring",
      actions: assign(initialContext),
    },
  },
});

// Type exports for use with useActor
export type GameMachine = typeof gameMachine;
export type GameState = ReturnType<typeof gameMachine.getInitialSnapshot>;

/**
 * Slot Machine State Machine
 *
 * Individual slot machine logic including:
 * - Reel spinning animation states
 * - Symbol generation
 * - Win calculation
 * - Bonus features
 */

import { createMachine, assign } from "xstate";

// Symbol types
export const SYMBOLS = {
  CHERRY: { id: "cherry", value: 2, weight: 30 },
  LEMON: { id: "lemon", value: 3, weight: 25 },
  ORANGE: { id: "orange", value: 5, weight: 20 },
  PLUM: { id: "plum", value: 8, weight: 15 },
  BELL: { id: "bell", value: 15, weight: 7 },
  BAR: { id: "bar", value: 25, weight: 2 },
  SEVEN: { id: "seven", value: 50, weight: 0.9 },
  DIAMOND: { id: "diamond", value: 100, weight: 0.1 },
} as const;

export type SymbolId = keyof typeof SYMBOLS;

// Paylines for 5x3 slot
export const PAYLINES = [
  // Horizontal lines
  [1, 1, 1, 1, 1], // Middle row
  [0, 0, 0, 0, 0], // Top row
  [2, 2, 2, 2, 2], // Bottom row
  // V shapes
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // Inverted V
  // Zigzags
  [0, 0, 1, 2, 2], // Top to bottom
  [2, 2, 1, 0, 0], // Bottom to top
  // W shapes
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
];

export interface ReelState {
  symbols: SymbolId[];
  position: number;
  spinning: boolean;
  speed: number;
}

export interface SlotContext {
  reels: ReelState[];
  visibleSymbols: SymbolId[][]; // 5 reels x 3 visible symbols
  activePaylines: number;
  betPerLine: number;
  totalBet: number;

  // Results
  winAmount: number;
  winningLines: number[];
  isJackpot: boolean;

  // Animation
  spinStartTime: number;
  reelsToStop: number;

  // Features
  freeSpinsRemaining: number;
  multiplier: number;
}

export type SlotEvent =
  | { type: "START_SPIN" }
  | { type: "STOP_REEL"; reelIndex: number }
  | { type: "ALL_STOPPED" }
  | { type: "SET_BET"; betPerLine: number }
  | { type: "SET_PAYLINES"; count: number }
  | { type: "TRIGGER_BONUS" }
  | { type: "BONUS_COMPLETE" }
  | { type: "RESET" };

// Generate random symbol based on weights
function getRandomSymbol(): SymbolId {
  const totalWeight = Object.values(SYMBOLS).reduce(
    (sum, s) => sum + s.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const [id, symbol] of Object.entries(SYMBOLS)) {
    random -= symbol.weight;
    if (random <= 0) {
      return id as SymbolId;
    }
  }

  return "CHERRY";
}

// Generate reel strip (virtual reel with all symbols)
function generateReelStrip(length: number = 100): SymbolId[] {
  return Array.from({ length }, () => getRandomSymbol());
}

// Initial reel states
function createInitialReels(): ReelState[] {
  return Array.from({ length: 5 }, () => ({
    symbols: generateReelStrip(),
    position: Math.floor(Math.random() * 50),
    spinning: false,
    speed: 0,
  }));
}

// Get visible symbols from reel position
function getVisibleSymbols(reels: ReelState[]): SymbolId[][] {
  return reels.map((reel) => {
    const result: SymbolId[] = [];
    for (let i = 0; i < 3; i++) {
      const index = (reel.position + i) % reel.symbols.length;
      result.push(reel.symbols[index]);
    }
    return result;
  });
}

// Check for wins
function calculateWins(
  symbols: SymbolId[][],
  activePaylines: number,
  betPerLine: number
): { winAmount: number; winningLines: number[]; isJackpot: boolean } {
  let winAmount = 0;
  const winningLines: number[] = [];
  let isJackpot = false;

  for (let lineIndex = 0; lineIndex < Math.min(activePaylines, PAYLINES.length); lineIndex++) {
    const line = PAYLINES[lineIndex];
    const lineSymbols = line.map((row, col) => symbols[col][row]);

    // Check for consecutive matches from left
    const firstSymbol = lineSymbols[0];
    let matchCount = 1;

    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === firstSymbol) {
        matchCount++;
      } else {
        break;
      }
    }

    // Calculate win (need at least 3 matches)
    if (matchCount >= 3) {
      const symbolValue = SYMBOLS[firstSymbol].value;
      const multiplier =
        matchCount === 3 ? 1 : matchCount === 4 ? 3 : matchCount === 5 ? 10 : 0;

      const lineWin = symbolValue * multiplier * betPerLine;
      winAmount += lineWin;
      winningLines.push(lineIndex);

      // Check for jackpot (5 diamonds)
      if (firstSymbol === "DIAMOND" && matchCount === 5) {
        isJackpot = true;
      }
    }
  }

  return { winAmount, winningLines, isJackpot };
}

// Initial context
const initialContext: SlotContext = {
  reels: createInitialReels(),
  visibleSymbols: [],
  activePaylines: 9,
  betPerLine: 1,
  totalBet: 9,
  winAmount: 0,
  winningLines: [],
  isJackpot: false,
  spinStartTime: 0,
  reelsToStop: 5,
  freeSpinsRemaining: 0,
  multiplier: 1,
};

// Slot machine state machine
export const slotMachine = createMachine({
  id: "slot",
  initial: "idle",
  context: {
    ...initialContext,
    visibleSymbols: getVisibleSymbols(initialContext.reels),
  },
  types: {} as {
    context: SlotContext;
    events: SlotEvent;
  },

  states: {
    idle: {
      on: {
        START_SPIN: {
          target: "spinning",
          actions: assign({
            spinStartTime: () => Date.now(),
            reelsToStop: 5,
            winAmount: 0,
            winningLines: [],
            isJackpot: false,
            reels: ({ context }) =>
              context.reels.map((reel) => ({
                ...reel,
                spinning: true,
                speed: 50,
              })),
          }),
        },
        SET_BET: {
          actions: assign({
            betPerLine: ({ event }) => Math.max(1, event.betPerLine),
            totalBet: ({ event, context }) =>
              Math.max(1, event.betPerLine) * context.activePaylines,
          }),
        },
        SET_PAYLINES: {
          actions: assign({
            activePaylines: ({ event }) =>
              Math.max(1, Math.min(event.count, PAYLINES.length)),
            totalBet: ({ event, context }) =>
              context.betPerLine *
              Math.max(1, Math.min(event.count, PAYLINES.length)),
          }),
        },
      },
    },

    spinning: {
      on: {
        STOP_REEL: {
          actions: assign({
            reels: ({ context, event }) =>
              context.reels.map((reel, index) =>
                index === event.reelIndex
                  ? {
                      ...reel,
                      spinning: false,
                      speed: 0,
                      // New random position
                      position: Math.floor(Math.random() * reel.symbols.length),
                    }
                  : reel
              ),
            reelsToStop: ({ context }) => context.reelsToStop - 1,
          }),
        },
        ALL_STOPPED: [
          {
            target: "evaluating",
            guard: ({ context }) =>
              context.reels.every((reel) => !reel.spinning),
          },
        ],
      },
      // Auto-stop reels sequentially
      after: {
        1000: {
          actions: assign({
            reels: ({ context }) =>
              context.reels.map((reel, index) =>
                index === 0 && reel.spinning
                  ? {
                      ...reel,
                      spinning: false,
                      speed: 0,
                      position: Math.floor(Math.random() * reel.symbols.length),
                    }
                  : reel
              ),
          }),
        },
        1300: {
          actions: assign({
            reels: ({ context }) =>
              context.reels.map((reel, index) =>
                index === 1 && reel.spinning
                  ? {
                      ...reel,
                      spinning: false,
                      speed: 0,
                      position: Math.floor(Math.random() * reel.symbols.length),
                    }
                  : reel
              ),
          }),
        },
        1600: {
          actions: assign({
            reels: ({ context }) =>
              context.reels.map((reel, index) =>
                index === 2 && reel.spinning
                  ? {
                      ...reel,
                      spinning: false,
                      speed: 0,
                      position: Math.floor(Math.random() * reel.symbols.length),
                    }
                  : reel
              ),
          }),
        },
        1900: {
          actions: assign({
            reels: ({ context }) =>
              context.reels.map((reel, index) =>
                index === 3 && reel.spinning
                  ? {
                      ...reel,
                      spinning: false,
                      speed: 0,
                      position: Math.floor(Math.random() * reel.symbols.length),
                    }
                  : reel
              ),
          }),
        },
        2200: {
          target: "evaluating",
          actions: assign({
            reels: ({ context }) =>
              context.reels.map((reel) => ({
                ...reel,
                spinning: false,
                speed: 0,
                position: reel.spinning
                  ? Math.floor(Math.random() * reel.symbols.length)
                  : reel.position,
              })),
          }),
        },
      },
    },

    evaluating: {
      entry: assign(({ context }) => {
        const visibleSymbols = getVisibleSymbols(context.reels);
        const { winAmount, winningLines, isJackpot } = calculateWins(
          visibleSymbols,
          context.activePaylines,
          context.betPerLine * context.multiplier
        );

        return {
          visibleSymbols,
          winAmount,
          winningLines,
          isJackpot,
        };
      }),
      always: [
        {
          target: "jackpot",
          guard: ({ context }) => context.isJackpot,
        },
        {
          target: "winning",
          guard: ({ context }) => context.winAmount > 0,
        },
        { target: "losing" },
      ],
    },

    winning: {
      after: {
        2000: "idle",
      },
    },

    losing: {
      after: {
        500: "idle",
      },
    },

    jackpot: {
      on: {
        TRIGGER_BONUS: "bonus",
      },
      after: {
        5000: "idle",
      },
    },

    bonus: {
      entry: assign({
        freeSpinsRemaining: 10,
        multiplier: 2,
      }),
      on: {
        START_SPIN: {
          target: "spinning",
          guard: ({ context }) => context.freeSpinsRemaining > 0,
          actions: assign({
            freeSpinsRemaining: ({ context }) =>
              context.freeSpinsRemaining - 1,
            spinStartTime: () => Date.now(),
            reelsToStop: 5,
            winAmount: 0,
            winningLines: [],
            isJackpot: false,
            reels: ({ context }) =>
              context.reels.map((reel) => ({
                ...reel,
                spinning: true,
                speed: 50,
              })),
          }),
        },
        BONUS_COMPLETE: {
          target: "idle",
          actions: assign({
            freeSpinsRemaining: 0,
            multiplier: 1,
          }),
        },
      },
    },
  },

  on: {
    RESET: {
      target: ".idle",
      actions: assign({
        ...initialContext,
        reels: createInitialReels(),
        visibleSymbols: getVisibleSymbols(createInitialReels()),
      }),
    },
  },
});

export type SlotMachine = typeof slotMachine;

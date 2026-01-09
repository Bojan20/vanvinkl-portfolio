/**
 * State Management - XState machines
 */

export {
  gameMachine,
  type GameContext,
  type GameEvent,
  type GameMachine,
  type GameState,
  type Position,
  type SlotResult,
} from "./gameMachine";

export {
  slotMachine,
  SYMBOLS,
  PAYLINES,
  type SlotContext,
  type SlotEvent,
  type SlotMachine,
  type SymbolId,
  type ReelState,
} from "./slotMachine";

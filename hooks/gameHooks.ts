/**
 * Game Hooks
 * 
 * This file re-exports the game hooks from the GameWrapper component
 * to provide a cleaner import path using the @/hooks/gameHooks alias.
 */

import { 
  useKeyState, 
  useGameLoop, 
  GameEventType, 
  GameEvent, 
  EventCallback 
} from '../components/GameWrapper';

export { 
  useKeyState, 
  useGameLoop, 
  type GameEventType, 
  type GameEvent, 
  type EventCallback 
};
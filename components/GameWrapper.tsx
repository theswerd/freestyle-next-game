/**
 * GameWrapper Component
 *
 * A comprehensive game framework that provides:
 * 1. Game loop with precise timing (deltaTime, FPS tracking)
 * 2. Input handling (keyboard with WASD + arrow keys support)
 * 3. Event system (subscribe/emit pattern for game events)
 * 4. React Context for sharing game state across components
 *
 * This wrapper enables building complex games with clean component separation
 * by providing centralized game systems.
 */
import { useEffect, useState, createContext, useContext, useRef } from "react";
import "./GameWrapper.css";
import KeyDisplay from "./KeyDisplay";

/**
 * KeyState Interface
 *
 * Tracks the current pressed/released state of game control keys
 * including arrow keys and space bar.
 */
interface KeyState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  Space: boolean;
}

/**
 * Game Event Types
 *
 * Defines the types of events that can be emitted in the game:
 * - tick: Emitted every frame with deltaTime
 * - collision: Emitted when game objects collide
 * - keyChange: Emitted when a key is pressed or released
 * - custom: For any other game-specific events
 */
export type GameEventType = "tick" | "collision" | "keyChange" | "custom";

/**
 * Game Event Interface
 *
 * Structure for events in the game system:
 * - type: The category of event
 * - payload: Optional data associated with the event
 * - timestamp: When the event occurred
 */
export interface GameEvent {
  type: GameEventType;
  payload?: any;
  timestamp: number;
}

/**
 * Event Callback Type
 *
 * Function signature for event subscribers.
 * Takes a GameEvent as parameter.
 */
export type EventCallback = (event: GameEvent) => void;

/**
 * React Contexts
 *
 * These contexts allow components to access the game state and systems:
 * - KeyContext: Provides the current state of game control keys
 * - GameLoopContext: Provides access to the game loop, timing, and event system
 */
const KeyContext = createContext<KeyState | null>(null);
const GameLoopContext = createContext<{
  subscribe: (type: GameEventType, callback: EventCallback) => () => void;
  emit: (type: GameEventType, payload?: any) => void;
  deltaTime: number;
  fps: number;
} | null>(null);

/**
 * Key Mapping
 *
 * Maps physical keyboard keys to game control actions.
 * Supports both WASD and arrow keys for movement, plus space bar.
 */
const keyMap: Record<string, keyof KeyState | undefined> = {
  // WASD keys
  w: "ArrowUp",
  W: "ArrowUp",
  a: "ArrowLeft",
  A: "ArrowLeft",
  s: "ArrowDown",
  S: "ArrowDown",
  d: "ArrowRight",
  D: "ArrowRight",

  // Arrow keys (direct mapping)
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",

  // Space bar
  " ": "Space",
};

/**
 * useKeyState Hook
 *
 * Custom hook that provides access to the current keyboard state.
 * Can be used by any component inside the GameWrapper.
 *
 * @returns Current state of game control keys
 * @throws Error if used outside of a GameWrapper
 */
export function useKeyState() {
  const context = useContext(KeyContext);
  if (!context) {
    throw new Error("useKeyState must be used within a GameWrapper");
  }
  return context;
}

/**
 * useGameLoop Hook
 *
 * Custom hook that provides access to the game loop and event system.
 * Can be used by any component inside the GameWrapper.
 *
 * @returns Object containing:
 *   - subscribe: Function to subscribe to game events
 *   - emit: Function to emit game events
 *   - deltaTime: Time in seconds since last frame
 *   - fps: Current frames per second
 * @throws Error if used outside of a GameWrapper
 */
export function useGameLoop() {
  const context = useContext(GameLoopContext);
  if (!context) {
    throw new Error("useGameLoop must be used within a GameWrapper");
  }
  return context;
}

/**
 * GameWrapper Component
 *
 * The main component that sets up the game environment.
 * Provides game loop, input handling, and event system to its children.
 *
 * @param children - React components to render inside the game wrapper
 */
export function GameWrapper({ children }: { children?: React.ReactNode }) {
  /**
   * Keyboard State
   *
   * Tracks which game control keys are currently pressed.
   */
  const [keyState, setKeyState] = useState<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  /**
   * Game Loop State
   *
   * Tracks timing information for the game loop:
   * - deltaTime: Time in seconds since last frame
   * - fps: Current frames per second
   */
  const [deltaTime, setDeltaTime] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  /**
   * Game Loop References
   *
   * Use refs to persist values across renders without triggering re-renders:
   * - frameIdRef: ID of the current animation frame for cancellation
   * - lastFrameTimeRef: Timestamp of the previous frame
   * - fpsCounterRef: Tracks frames for FPS calculation
   */
  const frameIdRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<{ frames: number; elapsed: number }>({
    frames: 0,
    elapsed: 0,
  });

  /**
   * Event System
   *
   * Uses a Map to store event subscribers by event type.
   * Each event type has a Set of callback functions.
   */
  const subscribersRef = useRef<Map<GameEventType, Set<EventCallback>>>(
    new Map()
  );

  /**
   * Event Subscription
   *
   * Registers a callback function to be called when events of a specific type occur.
   *
   * @param type - Type of event to subscribe to
   * @param callback - Function to call when event occurs
   * @returns Function to unsubscribe from the event
   */
  const subscribe = (type: GameEventType, callback: EventCallback) => {
    // Create a new Set for this event type if it doesn't exist
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }

    // Get the Set of subscribers for this event type
    const typeSubscribers = subscribersRef.current.get(type)!;

    // Add the callback to the Set
    typeSubscribers.add(callback);

    // Return a function to unsubscribe
    return () => {
      // Remove the callback from the Set
      typeSubscribers.delete(callback);

      // If no more subscribers for this event type, remove the Set
      if (typeSubscribers.size === 0) {
        subscribersRef.current.delete(type);
      }
    };
  };

  /**
   * Event Emission
   *
   * Broadcasts an event to all subscribers of that event type.
   *
   * @param type - Type of event to emit
   * @param payload - Optional data to include with the event
   */
  const emit = (type: GameEventType, payload?: any) => {
    // Create the event object
    const event: GameEvent = {
      type,
      payload,
      timestamp: performance.now(),
    };

    // Get subscribers for this event type
    const typeSubscribers = subscribersRef.current.get(type);

    // If there are subscribers, call each one with the event
    if (typeSubscribers) {
      typeSubscribers.forEach((callback) => callback(event));
    }
  };

  /**
   * Game Loop Setup
   *
   * Sets up the main game loop using requestAnimationFrame.
   * Calculates deltaTime, tracks FPS, and emits tick events.
   */
  useEffect(() => {
    /**
     * Main Game Loop Function
     *
     * Called once per frame by requestAnimationFrame.
     *
     * @param timestamp - Current time provided by requestAnimationFrame
     */
    const gameLoop = (timestamp: number) => {
      // Initialize lastFrameTime on first frame
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      // Calculate delta time (time since last frame) in seconds
      const dt = (timestamp - lastFrameTimeRef.current) / 1000;
      setDeltaTime(dt);

      // Update FPS counter
      fpsCounterRef.current.frames++;
      fpsCounterRef.current.elapsed += dt;

      // Update FPS display once per second
      if (fpsCounterRef.current.elapsed >= 1) {
        setFps(
          Math.round(
            fpsCounterRef.current.frames / fpsCounterRef.current.elapsed
          )
        );
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.elapsed = 0;
      }

      // Emit tick event with deltaTime for game systems
      emit("tick", { deltaTime: dt });

      // Store current timestamp for next frame
      lastFrameTimeRef.current = timestamp;

      // Request next frame
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    frameIdRef.current = requestAnimationFrame(gameLoop);

    // Clean up on unmount - cancel animation frame
    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  /**
   * Keyboard Input Setup
   *
   * Sets up event listeners for keyboard input.
   * Maps keyboard keys to game controls and updates state accordingly.
   */
  useEffect(() => {
    /**
     * Key Down Handler
     *
     * Handles key press events, updates state, and emits events.
     *
     * @param e - Keyboard event
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map the keyboard key to a game control
      const mappedKey = keyMap[e.key];

      if (mappedKey) {
        // Prevent default browser behavior for game controls
        e.preventDefault();

        // Only update if key wasn't already pressed (prevents repeat events)
        if (!keyState[mappedKey]) {
          // Update key state
          setKeyState((prev) => {
            const newState = {
              ...prev,
              [mappedKey]: true,
            };

            // Emit key change event with details
            emit("keyChange", {
              key: mappedKey,
              pressed: true,
              state: newState,
            });

            return newState;
          });
        }
      }
    };

    /**
     * Key Up Handler
     *
     * Handles key release events, updates state, and emits events.
     *
     * @param e - Keyboard event
     */
    const handleKeyUp = (e: KeyboardEvent) => {
      // Map the keyboard key to a game control
      const mappedKey = keyMap[e.key];

      if (mappedKey) {
        // Prevent default browser behavior for game controls
        e.preventDefault();

        // Only update if key was pressed (prevents duplicate events)
        if (keyState[mappedKey]) {
          // Update key state
          setKeyState((prev) => {
            const newState = {
              ...prev,
              [mappedKey]: false,
            };

            // Emit key change event with details
            emit("keyChange", {
              key: mappedKey,
              pressed: false,
              state: newState,
            });

            return newState;
          });
        }
      }
    };

    // Add event listeners to window
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up event listeners on unmount or when keyState changes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keyState]); // Depends on keyState to check current key state

  /**
   * Game Loop Context Value
   *
   * Object containing all the game loop and event system functionality
   * to be provided to child components.
   */
  const gameLoopValue = {
    subscribe, // Function to subscribe to events
    emit, // Function to emit events
    deltaTime, // Time since last frame
    fps, // Current frames per second
  };

  return (
    <GameLoopContext.Provider value={gameLoopValue}>
      <KeyContext.Provider value={keyState}>
        <div className="game-wrapper">{children}</div>
        <KeyDisplay />
      </KeyContext.Provider>
    </GameLoopContext.Provider>
  );
}

export default GameWrapper;

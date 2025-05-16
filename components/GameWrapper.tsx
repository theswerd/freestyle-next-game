import { useEffect, useState, createContext, useContext } from "react";
import "./GameWrapper.css";
import KeyDisplay from "./KeyDisplay";

// Define the key state interface - arrow keys and space
interface KeyState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  Space: boolean;
}

// Create a context for key states
const KeyContext = createContext<KeyState | null>(null);

// Mapping from WASD to arrow keys
const keyMap: Record<string, keyof KeyState | undefined> = {
  w: "ArrowUp",
  W: "ArrowUp",
  a: "ArrowLeft",
  A: "ArrowLeft",
  s: "ArrowDown",
  S: "ArrowDown",
  d: "ArrowRight",
  D: "ArrowRight",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  " ": "Space",
};

// Hook to use the key state from any component
export function useKeyState() {
  const context = useContext(KeyContext);
  if (!context) {
    throw new Error("useKeyState must be used within a GameWrapper");
  }
  return context;
}

export function GameWrapper({ children }: { children: React.ReactNode }) {
  // Initialize key state with arrow keys and space
  const [keyState, setKeyState] = useState<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  useEffect(() => {
    // Define key handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map the key to its equivalent if exists
      const mappedKey = keyMap[e.key];

      if (mappedKey) {
        // Prevent default behavior for tracked keys
        e.preventDefault();

        // Update state for the pressed key
        setKeyState((prev) => ({
          ...prev,
          [mappedKey]: true,
        }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Map the key to its equivalent if exists
      const mappedKey = keyMap[e.key];

      if (mappedKey) {
        // Prevent default behavior for tracked keys
        e.preventDefault();

        // Update state for the released key
        setKeyState((prev) => ({
          ...prev,
          [mappedKey]: false,
        }));
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []); // Empty dependency array so it only runs once

  return (
    <KeyContext.Provider value={keyState}>
      <div className="game-wrapper">{children}</div>
      <KeyDisplay />
    </KeyContext.Provider>
  );
}

export default GameWrapper;

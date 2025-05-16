import { useKeyState, useGameLoop } from "./GameWrapper";
import "./KeyDisplay.css";
import { useEffect, useState } from "react";

function KeyDisplay() {
  const keyState = useKeyState();
  const { fps, subscribe } = useGameLoop();
  const [keyPressCount, setKeyPressCount] = useState(0);

  // Subscribe to key change events to demonstrate event subscription
  useEffect(() => {
    // Subscribe to key change events
    const unsubscribe = subscribe('keyChange', (event) => {
      if (event.payload?.pressed) {
        setKeyPressCount(prev => prev + 1);
      }
    });
    
    // Clean up subscription on unmount
    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="directional-pad">
      <div className="d-pad-row">
        <div className="d-pad-spacer"></div>
        <div className={`d-pad-button up ${keyState.ArrowUp ? "active" : ""}`}>
          <span>↑</span>
          <span className="key-label">W</span>
        </div>
        <div className="d-pad-spacer"></div>
      </div>

      <div className="d-pad-row">
        <div
          className={`d-pad-button left ${keyState.ArrowLeft ? "active" : ""}`}
        >
          <span>←</span>
          <span className="key-label">A</span>
        </div>
        <div className={`d-pad-center ${keyState.Space ? "active" : ""}`}>
          <span>_</span>
        </div>
        <div
          className={`d-pad-button right ${
            keyState.ArrowRight ? "active" : ""
          }`}
        >
          <span>→</span>
          <span className="key-label">D</span>
        </div>
      </div>

      <div className="d-pad-row">
        <div className="d-pad-spacer"></div>
        <div
          className={`d-pad-button down ${keyState.ArrowDown ? "active" : ""}`}
        >
          <span>↓</span>
          <span className="key-label">S</span>
        </div>
        <div className="d-pad-spacer"></div>
      </div>
      
      <div className="game-stats">
        <div className="fps-counter">FPS: {fps}</div>
        <div className="key-press-counter">Key Presses: {keyPressCount}</div>
      </div>
    </div>
  );
}

export default KeyDisplay;

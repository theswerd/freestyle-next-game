import { useKeyState } from "./GameWrapper";
import "./KeyDisplay.css";

function KeyDisplay() {
  const keyState = useKeyState();

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
    </div>
  );
}

export default KeyDisplay;

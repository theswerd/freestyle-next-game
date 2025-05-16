"use client";
import GameWrapper, { useKeyState } from "../../components/GameWrapper";
import { useState, useEffect } from "react";
import "./Game.css";

export default function Game() {
  return (
    <GameWrapper>
      <GameExample />

      {/* <>your game goes here</> */}
    </GameWrapper>
  );
}

// Example implementation of a game
function GameExample() {
  // useKeyState gives you a bunch of booleans for if the keys are pressed
  const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = useKeyState();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Game loop to update position
  useEffect(() => {
    const tick = () => {
      setPosition((prev) => {
        const speed = Space ? 5 : 2;
        let x = prev.x;
        let y = prev.y;

        if (ArrowUp) y -= speed;
        if (ArrowDown) y += speed;
        if (ArrowLeft) x -= speed;
        if (ArrowRight) x += speed;

        return { x, y };
      });
    };

    const id = setInterval(tick, 16);
    return () => clearInterval(id);
  }, [ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space]);

  // Determine player emoji based on key state
  const isMoving = ArrowUp || ArrowDown || ArrowLeft || ArrowRight;
  const playerEmoji = Space ? "🦸" : isMoving ? "🏃" : "🧍";

  return (
    <div className="game">
      <div
        className="player"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {playerEmoji}
      </div>
    </div>
  );
}

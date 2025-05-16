"use client";
import { useState, useEffect, useRef } from "react";
import { useGameLoop, useKeyState } from '@/hooks/gameHooks';

/**
 * Example game component that demonstrates using the hooks with the new import path
 */
export default function ExampleGame() {
  // Access keyboard state using the hook from the new path
  const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = useKeyState();
  
  // Access game loop functionality using the hook from the new path
  const { deltaTime, subscribe, emit, fps } = useGameLoop();
  
  // Set up player state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Update player position using deltaTime for smooth movement
  useEffect(() => {
    const tick = () => {
      setPosition((prev) => {
        // Calculate movement speed based on deltaTime for consistent movement
        const baseSpeed = 120; // units per second
        const speed = Space ? baseSpeed * 2.5 : baseSpeed;
        const frameSpeed = speed * deltaTime;
        
        // Update position based on key state
        let x = prev.x;
        let y = prev.y;
        
        if (ArrowUp) y -= frameSpeed;
        if (ArrowDown) y += frameSpeed;
        if (ArrowLeft) x -= frameSpeed;
        if (ArrowRight) x += frameSpeed;
        
        return { x, y };
      });
    };
    
    // Run the tick function every frame
    tick();
  }, [ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space, deltaTime]);
  
  // Determine player appearance based on movement
  const isMoving = ArrowUp || ArrowDown || ArrowLeft || ArrowRight;
  const playerEmoji = Space ? "🦸" : isMoving ? "🏃" : "🧍";
  
  // Render game
  return (
    <div className="game">
      <div className="fps-counter">FPS: {fps}</div>
      <div 
        className="player"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        {playerEmoji}
      </div>
    </div>
  );
}
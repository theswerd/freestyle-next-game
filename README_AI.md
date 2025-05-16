# Game Development Guide for AI Assistants

This document provides guidance for AI assistants on building games with the Next.js game framework provided in this repository. Follow these steps to create engaging browser games.

## Overview

This repository contains a framework for building web-based games using React and Next.js with a custom game loop system. The framework provides:

1. A robust game loop with precise timing (deltaTime, FPS tracking)
2. Input handling (keyboard with WASD + arrow keys support)
3. Event system for game communication (subscribe/emit pattern)
4. Physics simulation capabilities
5. Multiple game examples (basic movement, particles, platformer)

## Step-by-Step Game Creation Process

### 1. Create a Landing Page (app/page.tsx)

First, create an engaging landing page that introduces the game:

- Design a visually appealing layout
- Include a title, description, and "Play" button
- Consider generating a thematic background image
- Provide simple instructions for how to play
- Add links to game variants if implementing multiple game types

Example landing page structure:

```tsx
export default function Home() {
  return (
    <main className="home-container">
      <h1 className="game-title">Your Game Title</h1>

      <div className="game-description">
        <p>Brief description of your game and how to play it.</p>
      </div>

      <Link href="/game" className="play-button">
        Play Now!
      </Link>

      <div className="controls-guide">
        <h2>Controls</h2>
        <p>WASD or Arrow Keys to move</p>
        <p>Space to jump/action</p>
      </div>
    </main>
  );
}
```

### 2. Implement the Game (app/game/page.tsx)

Use the GameWrapper component to implement your game:

```tsx
export default function Game() {
  return (
    <GameWrapper>
      <YourGameComponent />
    </GameWrapper>
  );
}
```

The GameWrapper provides:

- Game loop via `useGameLoop()`
- Keyboard input via `useKeyState()`
- Event system via `subscribe()` and `emit()`

### 3. Choose a Game Type

Based on the examples already in the repository, implement one of these game types or create your own:

#### a. Basic Movement Game

Simple character movement with arrow keys and space to boost speed. Good for beginners.

#### b. Particle Effects Game

Utilize the event system to create visual effects based on player actions.

#### c. Platformer Game

Implement physics, gravity, jumping, and collision detection for a classic platformer experience.

## Game Development Guidelines

### Using the Event Loop

The event loop is the heart of the game system. Use it to handle physics updates, animations, and game state changes:

```tsx
// Subscribe to the tick event to update game state every frame
useEffect(() => {
  const unsubscribe = subscribe("tick", (event) => {
    const dt = event.payload.deltaTime; // Time since last frame in seconds

    // Update game state based on time
    updateGameState(dt);
  });

  return unsubscribe; // Clean up subscription when component unmounts
}, [subscribe]);
```

### Handling Input

Use the `useKeyState` hook to access keyboard input:

```tsx
const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = useKeyState();

// Use in your game logic
if (ArrowLeft) {
  movePlayerLeft();
}
```

### Implementing Physics

For games with physics (like platformers), implement these core systems:

1. **Gravity**: Apply constant downward acceleration

   ```tsx
   // In your tick event handler
   velocityY += gravity * deltaTime;
   ```

2. **Velocity and Position**: Update position based on velocity

   ```tsx
   // Calculate new position
   const newX = position.x + velocityX * deltaTime;
   const newY = position.y + velocityY * deltaTime;
   ```

3. **Collision Detection**: Check for and resolve collisions

   ```tsx
   // After calculating new position
   const { correctedPosition, isColliding } = checkCollisions(newX, newY);
   ```

4. **Jumping**: Apply upward velocity when jump input is detected
   ```tsx
   if (Space && isOnGround) {
     velocityY = -jumpForce;
     isOnGround = false;
   }
   ```

### Creating Event-Based Systems

Use the event system for communication between game components:

```tsx
// Emit an event when player collects an item
emit("itemCollected", { itemId: 123, points: 10 });

// Listen for the event in another component
useEffect(() => {
  const unsubscribe = subscribe("itemCollected", (event) => {
    updateScore(event.payload.points);
    playCollectionSound();
  });

  return unsubscribe;
}, [subscribe]);
```

### Visual Effects

Add visual polish using particle systems:

```tsx
// Create particles on event
useEffect(() => {
  const unsubscribe = subscribe("explosion", (event) => {
    const { x, y } = event.payload.position;

    // Create multiple particles
    const newParticles = Array.from({ length: 20 }, () => ({
      id: generateId(),
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 40 - 20),
      size: Math.random() * 10 + 5,
      life: Math.random() * 1 + 0.5,
      // Add other particle properties
    }));

    setParticles((prev) => [...prev, ...newParticles]);
  });

  return unsubscribe;
}, [subscribe]);

// Update and render particles
useEffect(() => {
  const unsubscribe = subscribe("tick", (event) => {
    const dt = event.payload.deltaTime;

    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          life: p.life - dt,
          // Update other properties
        }))
        .filter((p) => p.life > 0)
    );
  });

  return unsubscribe;
}, [subscribe]);
```

## Best Practices

1. **Performance**:

   - Use `useRef` for values that shouldn't trigger re-renders
   - Limit React state updates to necessary changes
   - Consider using memoization for expensive calculations

2. **Organization**:

   - Separate game logic into distinct components and functions
   - Use meaningful names for variables and functions
   - Add comprehensive comments to explain complex game mechanics

3. **Debugging**:

   - Implement a debug mode to visualize hitboxes, velocities, etc.
   - Add FPS counter to monitor performance
   - Use console.log strategically for troubleshooting

4. **Responsive Design**:
   - Consider different screen sizes in your game design
   - Scale game elements based on viewport dimensions
   - Provide alternative controls for touch devices

## Example Framework Features

### GameWrapper Component

The `GameWrapper` component provides:

- Game loop with deltaTime calculation
- FPS tracking
- Keyboard input mapping (WASD + arrows)
- Event subscription system

### Key Hooks and Functions

- `useKeyState()`: Access keyboard input state
- `useGameLoop()`: Access game loop and event system
- `subscribe(eventType, callback)`: Listen for game events
- `emit(eventType, payload)`: Broadcast game events

You can import these hooks using the convenient path alias:

```tsx
import { useGameLoop, useKeyState } from '@/hooks/gameHooks';
```

This provides a cleaner import experience than importing directly from the GameWrapper component.

### Event Types

- `'tick'`: Emitted every frame with deltaTime
- `'collision'`: Emitted when game objects collide
- `'keyChange'`: Emitted when keyboard input changes
- `'custom'`: For any game-specific events

## Advanced Techniques

### Game States

Implement a state machine for your game:

```tsx
type GameState = "loading" | "title" | "playing" | "paused" | "gameOver";

const [gameState, setGameState] = useState<GameState>("loading");

// Render different components based on game state
return (
  <div className="game-container">
    {gameState === "loading" && <LoadingScreen />}
    {gameState === "title" && (
      <TitleScreen onStart={() => setGameState("playing")} />
    )}
    {gameState === "playing" && (
      <GameplayScreen onPause={() => setGameState("paused")} />
    )}
    {gameState === "paused" && (
      <PauseScreen onResume={() => setGameState("playing")} />
    )}
    {gameState === "gameOver" && (
      <GameOverScreen onRestart={() => setGameState("playing")} />
    )}
  </div>
);
```

### Entity Component System

For complex games, consider implementing an entity component system:

```tsx
interface Entity {
  id: number;
  components: {
    position?: { x: number; y: number };
    velocity?: { x: number; y: number };
    sprite?: { src: string; width: number; height: number };
    collider?: { width: number; height: number };
    // Add more component types as needed
  };
}
```

### Camera Systems

For larger game worlds, implement a camera system:

```tsx
const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });

// Update camera to follow player
useEffect(() => {
  setCameraPosition({
    x: playerPosition.x - window.innerWidth / 2,
    y: playerPosition.y - window.innerHeight / 2,
  });
}, [playerPosition]);

// Apply camera transform to game elements
<div
  style={{
    transform: `translate(${-cameraPosition.x}px, ${-cameraPosition.y}px)`,
  }}
>
  {/* Game elements go here */}
</div>;
```

## Conclusion

This guide provides a framework for AI assistants to create games using the provided Next.js game framework. Start with simple mechanics and progressively add more features to build engaging and interactive games. Refer to the existing example games in the repository for inspiration and implementation details.

Remember to:

1. Start with the landing page
2. Implement your game using the GameWrapper
3. Utilize the event loop for game updates
4. Add physics and collision systems as needed
5. Generate images to enhance the visual experience

Happy game development!

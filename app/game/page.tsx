"use client";
import GameWrapper, {
  useKeyState,
  useGameLoop,
  GameEventType,
} from "../../components/GameWrapper";
import { useState, useEffect, useRef } from "react";
import "./Game.css";

export default function Game() {
  return (
    <GameWrapper>
      {/* Put your game in here to access all useGameLoop and useKeyState hooks */}
    </GameWrapper>
  );
}

// Example implementation of a game using the new event loop
function GameExample() {
  // useKeyState gives you a bunch of booleans for if the keys are pressed
  const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = useKeyState();
  const { deltaTime } = useGameLoop();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Game loop to update position using the game loop's deltaTime
  useEffect(() => {
    const tick = () => {
      setPosition((prev) => {
        const baseSpeed = 120; // units per second
        const speed = Space ? baseSpeed * 2.5 : baseSpeed;
        const frameSpeed = speed * deltaTime; // scale by deltaTime for smooth movement

        let x = prev.x;
        let y = prev.y;

        if (ArrowUp) y -= frameSpeed;
        if (ArrowDown) y += frameSpeed;
        if (ArrowLeft) x -= frameSpeed;
        if (ArrowRight) x += frameSpeed;

        return { x, y };
      });
    };

    // Only update when deltaTime changes (which happens every frame)
    tick();
  }, [ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space, deltaTime]);

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

// Demonstration of the event subscription system
function EventDemo() {
  const { subscribe, emit } = useGameLoop();
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      size: number;
      life: number;
    }>
  >([]);
  const nextParticleId = useRef(0);
  const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = useKeyState();

  // Subscribe to tick events to update particles
  useEffect(() => {
    const unsubscribe = subscribe("tick", (event) => {
      const dt = event.payload.deltaTime;

      setParticles((prev) => {
        // Update existing particles
        return prev
          .map((p) => ({
            ...p,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0); // Remove expired particles
      });
    });

    return unsubscribe;
  }, [subscribe]);

  // Subscribe to keyChange events to create particles when keys are pressed
  useEffect(() => {
    const unsubscribe = subscribe("keyChange", (event) => {
      if (event.payload?.pressed) {
        // Create a new particle for each key press
        const key = event.payload.key;

        // Emit a custom event
        emit("custom", {
          message: `Key pressed: ${key}`,
          timestamp: new Date().toISOString(),
        });

        setParticles((prev) => {
          // Create a new particle
          const particle = {
            id: nextParticleId.current++,
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            color: getRandomColor(),
            size: Math.random() * 20 + 10,
            life: Math.random() * 2 + 1, // Random lifetime between 1-3 seconds
          };

          return [...prev, particle];
        });
      }
    });

    return unsubscribe;
  }, [subscribe, emit]);

  // Subscribe to custom events for demonstration
  useEffect(() => {
    const unsubscribe = subscribe("custom", (event) => {
      console.log("Custom event received:", event.payload);
    });

    return unsubscribe;
  }, [subscribe]);

  // Helper function to generate random colors
  const getRandomColor = () => {
    const colors = ["#50fa7b", "#bd93f9", "#ff79c6", "#ffb86c", "#f1fa8c"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="event-demo">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.life > 1 ? 1 : p.life,
            transform: `scale(${p.life > 1 ? 1 : p.life * 0.8 + 0.2})`,
          }}
        />
      ))}
      <div className="instruction">Press arrow keys to create particles</div>
    </div>
  );
}

/**
 * Platform Game with Physics and Collisions
 *
 * This component implements a 2D platformer with realistic physics including:
 * - Gravity and jumping
 * - Platform collision detection
 * - Character movement with proper friction
 * - Visual effects like dust particles
 *
 * It uses the GameWrapper's event system to handle physics updates and
 * communicate between different game systems.
 */
function PlatformerDemo() {
  // Get keyboard input state from GameWrapper context
  const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = useKeyState();

  // Get timing and event system from GameWrapper context
  const { deltaTime, subscribe, emit } = useGameLoop();

  /**
   * Player State
   *
   * Contains all properties related to the player character:
   * - Position (x, y)
   * - Dimensions (width, height)
   * - Physics properties (velocityX, velocityY)
   * - State flags (isJumping, isOnGround, etc.)
   */
  const [player, setPlayer] = useState({
    x: 0,
    y: 180, // Start above the ground platform
    width: 40, // Player hitbox width
    height: 60, // Player hitbox height
    velocityX: 0, // Horizontal velocity in pixels/second
    velocityY: 0, // Vertical velocity in pixels/second
    isJumping: false, // Is player currently in a jump
    isOnGround: false, // Is player touching ground/platform
    facingLeft: false, // Direction player is facing
    canJump: false, // Track if player can jump (prevents multiple jumps in one press)
    jumpPressed: false, // Track if jump button is being held
  });

  /**
   * Platform Definitions
   *
   * Each platform has:
   * - Unique ID for tracking collisions
   * - Position (x, y) representing the center point
   * - Dimensions (width, height)
   * - Color for visual distinction
   *
   * The coordinate system is centered in the middle of the screen:
   * - Positive Y is downward
   * - Positive X is rightward
   */
  const platforms = [
    // Main ground platform (wide platform at the bottom)
    { id: "ground", x: 0, y: 250, width: 800, height: 40, color: "#50fa7b" },

    // Mid-level platforms
    {
      id: "platform1",
      x: -200,
      y: 150,
      width: 200,
      height: 30,
      color: "#bd93f9",
    },
    {
      id: "platform2",
      x: 200,
      y: 100,
      width: 200,
      height: 30,
      color: "#ffb86c",
    },

    // Upper platforms
    { id: "platform3", x: 0, y: 0, width: 120, height: 30, color: "#ff79c6" },
    {
      id: "platform4",
      x: -300,
      y: -100,
      width: 150,
      height: 30,
      color: "#f1fa8c",
    },
    {
      id: "platform5",
      x: 300,
      y: -150,
      width: 150,
      height: 30,
      color: "#8be9fd",
    },
  ];

  /**
   * Physics Constants
   *
   * These values control the "feel" of the game's physics.
   * Adjusting these will change how the character moves and jumps.
   */
  const gravity = 1500; // Downward acceleration (pixels/sec²)
  const jumpForce = 600; // Initial jump velocity (pixels/sec)
  const moveSpeed = 250; // Horizontal movement speed (pixels/sec)
  const friction = 10; // Velocity reduction factor when not moving
  const terminalVelocity = 1000; // Maximum falling speed (pixels/sec)

  /**
   * Debug Mode
   *
   * When enabled, shows collision boxes and physics information
   * to help understand what's happening behind the scenes.
   */
  const [debugMode, setDebugMode] = useState(false);

  /**
   * Jump Input Handling
   *
   * This effect detects jump input and applies jump velocity.
   * It handles the following logic:
   * - Only jump when on ground
   * - Prevent jumping again until jump button is released
   * - Apply immediate upward velocity when jumping
   */
  useEffect(() => {
    // Combine up arrow and space bar for jump input
    const jumpInput = ArrowUp || Space;

    setPlayer((prev) => {
      // Only allow jumping when:
      // 1. Jump button is pressed
      // 2. Player is on the ground
      // 3. Jump button wasn't already pressed (prevents holding)
      if (jumpInput && prev.isOnGround && !prev.jumpPressed) {
        // Play jump sound or effect here (future enhancement)

        // Apply jump velocity and update state
        return {
          ...prev,
          jumpPressed: true, // Mark jump button as pressed
          isJumping: true, // Set jumping state
          canJump: true, // Enable jump capability
          velocityY: -jumpForce, // Apply upward velocity (negative is up)
          isOnGround: false, // No longer on ground
        };
      } else if (!jumpInput && prev.jumpPressed) {
        // Jump button released - reset jump pressed state
        // This allows jumping again once player lands and presses jump
        return {
          ...prev,
          jumpPressed: false,
        };
      }
      return prev; // No change needed
    });
  }, [ArrowUp, Space]); // Only re-run when jump inputs change

  /**
   * Collision Detection
   *
   * Checks if the player is colliding with any platforms and
   * adjusts position and velocity accordingly.
   *
   * @param newX - Proposed new X position
   * @param newY - Proposed new Y position
   * @param velocityY - Current vertical velocity
   * @returns Object containing corrected position, velocity, and ground state
   */
  const checkCollisions = (newX: number, newY: number, velocityY: number) => {
    let isOnGround = false; // Tracks if player is standing on a platform
    let correctedY = newY; // Y position after collision resolution
    let correctedVelocityY = velocityY; // Vertical velocity after collision

    // Calculate player bounding box at the proposed position
    const playerLeft = newX - player.width / 2;
    const playerRight = newX + player.width / 2;
    const playerTop = newY - player.height / 2;
    const playerBottom = newY + player.height / 2;

    // Check against each platform for collisions
    for (const platform of platforms) {
      // Calculate platform bounding box
      const platformLeft = platform.x - platform.width / 2;
      const platformRight = platform.x + platform.width / 2;
      const platformTop = platform.y - platform.height / 2;
      const platformBottom = platform.y + platform.height / 2;

      // First check horizontal overlap - player must be at least partially over platform
      if (playerRight > platformLeft && playerLeft < platformRight) {
        // Then check for top collision (landing on platform)
        // This works by checking if:
        // 1. Player was above the platform in previous frame
        // 2. Player's bottom is now at or below the platform top
        // 3. Player hasn't fallen far through the platform (collision grace of 30px)
        const wasAbovePlatform = player.y + player.height / 2 <= platformTop;

        if (
          wasAbovePlatform &&
          playerBottom >= platformTop &&
          playerBottom <= platformTop + 30
        ) {
          // Collision from above - player is landing on platform

          // Set on-ground state
          isOnGround = true;

          // Adjust position to be exactly on top of platform
          correctedY = platformTop - player.height / 2;

          // Stop vertical velocity (landing)
          correctedVelocityY = 0;

          // Only emit landing event for significant impacts
          if (Math.abs(player.velocityY) > 200) {
            // Emit collision event for other systems (like dust particles)
            emit("collision", {
              type: "land",
              platform: platform.id,
              position: { x: newX, y: correctedY },
            });
          }

          // Once player is on a platform, no need to check others
          break;
        }
      }
    }

    // Return collision results
    return {
      correctedY,
      correctedVelocityY,
      isOnGround,
    };
  };

  /**
   * Main Physics Update Loop
   *
   * This effect runs on every frame to:
   * 1. Apply physics (gravity, movement)
   * 2. Calculate new positions
   * 3. Handle collisions
   * 4. Update player state
   */
  useEffect(() => {
    const tick = () => {
      setPlayer((prev) => {
        // Limit delta time to prevent physics issues during lag spikes
        const dt = Math.min(deltaTime, 0.05);

        // ===== HORIZONTAL MOVEMENT =====
        let velocityX = prev.velocityX;

        // Apply movement from input
        if (ArrowLeft) {
          velocityX = -moveSpeed; // Move left
        } else if (ArrowRight) {
          velocityX = moveSpeed; // Move right
        } else {
          // No input - apply friction to gradually slow down
          velocityX *= 1 - Math.min(friction * dt, 0.9);

          // Stop completely if moving very slowly
          if (Math.abs(velocityX) < 10) velocityX = 0;
        }

        // ===== VERTICAL MOVEMENT (GRAVITY) =====
        let velocityY = prev.velocityY;

        // Apply gravity acceleration
        velocityY += gravity * dt;

        // Limit falling speed to terminal velocity
        if (velocityY > terminalVelocity) velocityY = terminalVelocity;

        // ===== POSITION CALCULATION =====
        // Calculate new position based on velocity and time
        const newX = prev.x + velocityX * dt;
        const newY = prev.y + velocityY * dt;

        // ===== COLLISION DETECTION =====
        // Check and resolve collisions
        const { correctedY, correctedVelocityY, isOnGround } = checkCollisions(
          newX,
          newY,
          velocityY
        );

        // ===== VISUAL STATE UPDATES =====
        // Determine player facing direction based on movement
        const facingLeft = ArrowLeft
          ? true
          : ArrowRight
          ? false
          : prev.facingLeft;

        // Determine if jumping (moving upward)
        const isJumping = velocityY < 0;

        // Reset jump capability when landing on ground
        const canJump = !prev.isOnGround && isOnGround ? false : prev.canJump;

        // Return updated player state
        return {
          ...prev,
          x: newX, // New horizontal position
          y: correctedY, // Collision-corrected vertical position
          velocityX, // New horizontal velocity
          velocityY: correctedVelocityY, // Collision-corrected vertical velocity
          isOnGround, // Whether player is on a platform
          isJumping, // Whether player is in a jump
          facingLeft, // Direction player is facing
          canJump, // Whether player can jump
        };
      });
    };

    // Run physics tick every frame
    tick();
  }, [deltaTime, ArrowLeft, ArrowRight, emit]);

  /**
   * Dust Particle System
   *
   * Creates visual dust effects when player lands on platforms.
   */
  // State for dust particles
  const [dustParticles, setDustParticles] = useState<
    Array<{
      id: number; // Unique ID for React key
      x: number; // X position
      y: number; // Y position
      size: number; // Particle size
      life: number; // Remaining lifetime in seconds
      opacity: number; // Visual opacity
    }>
  >([]);
  const nextDustId = useRef(0); // Counter for unique dust particle IDs

  /**
   * Collision Event Subscription
   *
   * Listens for 'collision' events and creates dust particles
   * when the player lands on a platform.
   */
  useEffect(() => {
    const unsubscribe = subscribe("collision", (event) => {
      // Only create dust for landing events
      if (event.payload?.type === "land") {
        // Get landing position from event
        const landPos = event.payload.position;

        // Create 8 random dust particles
        const newParticles = Array.from({ length: 8 }, () => ({
          id: nextDustId.current++, // Unique ID
          x: landPos.x + (Math.random() * 40 - 20), // Random X offset
          y: landPos.y + player.height / 2, // At player's feet
          size: Math.random() * 8 + 4, // Random size
          life: Math.random() * 0.5 + 0.2, // Random lifetime (0.2-0.7s)
          opacity: Math.random() * 0.5 + 0.5, // Random opacity
        }));

        // Add new particles to state
        setDustParticles((prev) => [...prev, ...newParticles]);
      }
    });

    // Cleanup subscription when component unmounts
    return unsubscribe;
  }, [subscribe, player.height]);

  /**
   * Dust Particle Animation
   *
   * Updates dust particles every frame to animate them:
   * - Decreases their remaining lifetime
   * - Fades them out as they age
   * - Removes them when expired
   */
  useEffect(() => {
    const unsubscribe = subscribe("tick", (event) => {
      const dt = event.payload.deltaTime;

      setDustParticles((prev) => {
        return (
          prev
            // Update each particle
            .map((p) => ({
              ...p,
              life: p.life - dt, // Decrease lifetime
              // Fade out particles near end of life
              opacity: p.life > 0.1 ? p.opacity : p.life * 5 * p.opacity,
            }))
            // Remove expired particles
            .filter((p) => p.life > 0)
        );
      });
    });

    // Cleanup subscription when component unmounts
    return unsubscribe;
  }, [subscribe]);

  /**
   * Debug Mode Toggle
   *
   * Enables/disables debug visualization when pressing 'D'.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Player Visual Representation
   *
   * Determines the emoji to use based on player state.
   */
  const getPlayerEmoji = () => {
    if (player.isJumping) return "🦘"; // Jumping
    if (Math.abs(player.velocityX) > 10) return "🏃"; // Running
    return "🧍"; // Standing still
  };

  /**
   * Player Collision Box
   *
   * Used for debug visualization of the player's hitbox.
   */
  const playerBox = {
    left: player.x - player.width / 2,
    top: player.y - player.height / 2,
    right: player.x + player.width / 2,
    bottom: player.y + player.height / 2,
  };

  /**
   * Component Rendering
   *
   * Renders the entire game scene including:
   * - Player character
   * - Platforms
   * - Dust particles
   * - Debug visualization
   * - Instructions
   */
  return (
    <div className="platformer-game">
      {/* Player Character */}
      <div
        className="platformer-player"
        style={{
          transform: `translate(${player.x}px, ${player.y}px) scaleX(${
            player.facingLeft ? -1 : 1
          })`,
          width: player.width,
          height: player.height,
        }}
      >
        {getPlayerEmoji()}

        {/* Debug outline for player hitbox */}
        {debugMode && <div className="debug-outline"></div>}
      </div>

      {/* Platforms */}
      {platforms.map((platform) => (
        <div
          key={platform.id}
          className={`platform ${debugMode ? "debug" : ""}`}
          style={{
            left: `calc(50% + ${platform.x - platform.width / 2}px)`,
            top: `calc(50% + ${platform.y - platform.height / 2}px)`,
            width: platform.width,
            height: platform.height,
            backgroundColor: platform.color,
          }}
        />
      ))}

      {/* Dust Particles */}
      {dustParticles.map((dust) => (
        <div
          key={dust.id}
          className="dust-particle"
          style={{
            left: `calc(50% + ${dust.x}px)`,
            top: `calc(50% + ${dust.y}px)`,
            width: dust.size,
            height: dust.size,
            opacity: dust.opacity,
          }}
        />
      ))}

      {/* Debug Information Display */}
      {debugMode && (
        <div className="debug-info">
          <div>
            x: {Math.round(player.x)}, y: {Math.round(player.y)}
          </div>
          <div>
            vx: {Math.round(player.velocityX)}, vy:{" "}
            {Math.round(player.velocityY)}
          </div>
          <div>on ground: {player.isOnGround ? "yes" : "no"}</div>
          <div>jumping: {player.isJumping ? "yes" : "no"}</div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="platformer-instruction">
        <div>Use Arrow Left/Right to move</div>
        <div>Press Up Arrow or Space to jump</div>
        <div>Press D to toggle debug mode</div>
      </div>
    </div>
  );
}

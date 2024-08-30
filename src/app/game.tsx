"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw } from "lucide-react";

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const SHIP_SIZE = 20;
const TARGET_SIZE = 10;
const STAR_SIZE = 15;
const CANVAS_SIZE = 500;
const SPEED_BOOST_DURATION = 3000;
const SPEED_BOOST_MULTIPLIER = 2;

// Custom hook for keyboard input
const useKeyPress = () => {
  const [keys, setKeys] = useState({
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    " ": false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (keys.hasOwnProperty(e.key)) {
        setKeys((prev) => ({ ...prev, [e.key]: true }));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (keys.hasOwnProperty(e.key)) {
        setKeys((prev) => ({ ...prev, [e.key]: false }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keys]);

  return keys;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

// Custom hook for particle system
const useParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const addParticle = useCallback((x: number, y: number, color: string) => {
    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2 + 1,
      life: 30,
      color,
    };
    setParticles((prev) => [...prev, particle]);
  }, []);

  const addExplosion = useCallback((x: number, y: number, color: string) => {
    const explosionParticles: Particle[] = Array.from({ length: 20 }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 30 + Math.random() * 20,
      color,
    }));
    setParticles((prev) => [...prev, ...explosionParticles]);
  }, []);

  const updateParticles = useCallback((deltaTime: number) => {
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx * (deltaTime / FRAME_TIME),
          y: p.y + p.vy * (deltaTime / FRAME_TIME),
          life: p.life - 1,
        }))
        .filter((p) => p.life > 0)
    );
  }, []);

  const resetParticles = useCallback(() => {
    setParticles([]);
  }, []);

  return {
    particles,
    addParticle,
    addExplosion,
    updateParticles,
    resetParticles,
  };
};

type Target = {
  x: number;
  y: number;
  opacity: number;
  isStar: boolean;
};

export function RocketshipGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeyPress();
  const {
    particles,
    addParticle,
    addExplosion,
    updateParticles,
    resetParticles,
  } = useParticles();

  const [ship, setShip] = useState({
    x: CANVAS_SIZE / 2,
    y: CANVAS_SIZE / 2,
    rotation: 0,
    vx: 0,
    vy: 0,
    speedBoostEndTime: 0,
  });

  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const addTarget = useCallback(() => {
    if (!isPaused) {
      const newTarget: Target = {
        x: Math.random() * (CANVAS_SIZE - TARGET_SIZE * 2) + TARGET_SIZE,
        y: Math.random() * (CANVAS_SIZE - TARGET_SIZE * 2) + TARGET_SIZE,
        opacity: 0,
        isStar: Math.random() < 0.2, // 20% chance of being a star
      };
      setTargets((prev) => [...prev, newTarget]);
    }
  }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(addTarget, 2000);
    return () => clearInterval(interval);
  }, [addTarget]);

  const updateGame = useCallback(
    (deltaTime: number) => {
      if (!isPaused) {
        const currentTime = performance.now();
        const isSpeedBoosted = currentTime < ship.speedBoostEndTime;
        const speedMultiplier = isSpeedBoosted ? SPEED_BOOST_MULTIPLIER : 1;

        setShip((prev) => {
          const rotationSpeed = 0.1 * (deltaTime / FRAME_TIME);
          const thrustPower = 0.05 * (deltaTime / FRAME_TIME) * speedMultiplier;

          let newRotation = prev.rotation;
          if (keys.ArrowLeft) newRotation -= rotationSpeed;
          if (keys.ArrowRight) newRotation += rotationSpeed;

          let newVx = prev.vx;
          let newVy = prev.vy;
          if (keys[" "]) {
            newVx += Math.cos(newRotation) * thrustPower;
            newVy += Math.sin(newRotation) * thrustPower;
            addParticle(
              prev.x - Math.cos(newRotation) * SHIP_SIZE,
              prev.y - Math.sin(newRotation) * SHIP_SIZE,
              "rgba(255, 100, 0, 0.5)"
            );
          }

          // Apply inertia
          const inertia = 1 - 0.01 * (deltaTime / FRAME_TIME);
          newVx *= inertia;
          newVy *= inertia;

          let newX = prev.x + newVx * (deltaTime / FRAME_TIME);
          let newY = prev.y + newVy * (deltaTime / FRAME_TIME);

          // Keep ship within bounds
          newX = Math.max(
            SHIP_SIZE / 2,
            Math.min(CANVAS_SIZE - SHIP_SIZE / 2, newX)
          );
          newY = Math.max(
            SHIP_SIZE / 2,
            Math.min(CANVAS_SIZE - SHIP_SIZE / 2, newY)
          );

          return {
            ...prev,
            x: newX,
            y: newY,
            rotation: newRotation,
            vx: newVx,
            vy: newVy,
          };
        });

        updateParticles(deltaTime);

        setTargets((prev) => {
          return prev.map((target) => ({
            ...target,
            opacity: Math.min(
              1,
              target.opacity + 0.02 * (deltaTime / FRAME_TIME)
            ),
          }));
        });

        // Check for collisions
        setTargets((prev) => {
          return prev.filter((target) => {
            const dx = target.x - ship.x;
            const dy = target.y - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionSize = target.isStar ? STAR_SIZE : TARGET_SIZE;
            if (distance <= SHIP_SIZE / 2 + collisionSize / 2) {
              addExplosion(target.x, target.y, target.isStar ? "gold" : "lime");
              setScore((s) => s + (target.isStar ? 2 : 1));
              if (target.isStar) {
                setShip((s) => ({
                  ...s,
                  speedBoostEndTime: currentTime + SPEED_BOOST_DURATION,
                }));
              }
              return false;
            }
            return true;
          });
        });
      }
    },
    [
      keys,
      addParticle,
      updateParticles,
      ship.x,
      ship.y,
      addExplosion,
      isPaused,
      ship.speedBoostEndTime,
    ]
  );

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const render = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      updateGame(deltaTime);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw targets
        targets.forEach((target) => {
          if (target.isStar) {
            // Draw star
            const spikes = 5;
            const outerRadius = STAR_SIZE;
            const innerRadius = STAR_SIZE / 2;
            let rot = (Math.PI / 2) * 3;
            let x = target.x;
            let y = target.y;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(target.x, target.y - outerRadius);
            for (let i = 0; i < spikes; i++) {
              x = target.x + Math.cos(rot) * outerRadius;
              y = target.y + Math.sin(rot) * outerRadius;
              ctx.lineTo(x, y);
              rot += step;

              x = target.x + Math.cos(rot) * innerRadius;
              y = target.y + Math.sin(rot) * innerRadius;
              ctx.lineTo(x, y);
              rot += step;
            }
            ctx.lineTo(target.x, target.y - outerRadius);
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 215, 0, ${target.opacity})`;
            ctx.fill();
          } else {
            // Draw circle
            ctx.beginPath();
            ctx.arc(target.x, target.y, TARGET_SIZE, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 200, 100, ${target.opacity})`;
            ctx.fill();
          }
        });

        // Draw particles
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });

        // Draw ship
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.rotation);
        ctx.beginPath();
        ctx.moveTo(SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 2);
        ctx.lineTo(-SHIP_SIZE / 2, -SHIP_SIZE / 2);
        ctx.closePath();
        ctx.fillStyle =
          performance.now() < ship.speedBoostEndTime ? "gold" : "white";
        ctx.fill();
        ctx.restore();

        // Draw paused text
        if (isPaused) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.font = "40px Arial";
          ctx.textAlign = "center";
          ctx.fillText("PAUSED", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [updateGame, particles, ship, targets, isPaused]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const resetGame = () => {
    setShip({
      x: CANVAS_SIZE / 2,
      y: CANVAS_SIZE / 2,
      rotation: 0,
      vx: 0,
      vy: 0,
      speedBoostEndTime: 0,
    });
    setTargets([]);
    setScore(0);
    resetParticles();
    setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-8 max-w-full md:max-w-lg mx-auto">
      <div className="w-full flex justify-between items-center">
        <p className="text-white text-xl">Score: {score}</p>
        <div className="flex gap-2">
          <Button
            onClick={togglePause}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={resetGame}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="border border-gray-700 w-full mx-auto"
      />
      <div className="text-white text-center">
        <p>Use arrow keys to rotate and spacebar to throttle.</p>
        <p>
          Collect green circles for 1 point and gold stars for 2 points and a
          speed boost!
        </p>
      </div>
    </div>
  );
}

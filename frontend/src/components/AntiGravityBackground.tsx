import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

export function AntiGravityBackground() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const mouseBodyRef = useRef<Matter.Body | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Composite = Matter.Composite,
      Bodies = Matter.Bodies,
      Body = Matter.Body;

    // Create engine with anti-gravity (upwards)
    const engine = Engine.create({
      gravity: { x: 0, y: -0.05, scale: 0.001 },
    });
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: "transparent",
        wireframes: false,
        pixelRatio: window.devicePixelRatio,
      },
    });

    // Create boundaries to keep shapes somewhat contained
    const wallOptions = {
      isStatic: true,
      render: { visible: false },
      friction: 0,
      restitution: 0.5,
    };

    // We leave the bottom open so shapes can spawn there and float up
    const walls = [
      Bodies.rectangle(
        window.innerWidth / 2,
        -150,
        window.innerWidth * 2,
        100,
        wallOptions,
      ), // Ceiling
      Bodies.rectangle(
        -50,
        window.innerHeight / 2,
        100,
        window.innerHeight * 2,
        wallOptions,
      ), // Left
      Bodies.rectangle(
        window.innerWidth + 50,
        window.innerHeight / 2,
        100,
        window.innerHeight * 2,
        wallOptions,
      ), // Right
    ];

    Composite.add(engine.world, walls);

    // Mouse interactive body (invisible)
    const mouseBody = Bodies.circle(-1000, -1000, 50, {
      isStatic: true,
      render: { visible: false },
    });
    mouseBodyRef.current = mouseBody;
    Composite.add(engine.world, mouseBody);

    const shapes: Matter.Body[] = [];
    const colors = ["#3B82F6", "#EBF3FF", "#1A1C1E", "#F8F9FA"]; // Theme colors

    const addShape = () => {
      const x = Math.random() * window.innerWidth;
      const y = window.innerHeight + 50; // Spawn just below screen
      const size = Math.random() * 40 + 20;
      const t = Math.random();

      const rawColor = colors[Math.floor(Math.random() * colors.length)];
      // Add slight opacity to colors so they are super subtle in the background
      const isWhite = rawColor === "#F8F9FA";

      let body;
      const shapeOptions = {
        restitution: 0.9,
        frictionAir: 0.02,
        render: {
          fillStyle: rawColor,
          strokeStyle: "#E0E0E0",
          lineWidth: isWhite ? 1 : 0,
          opacity: 0.2, // Make them very subtle to not disrupt reading
        },
      };

      if (t < 0.33) {
        body = Bodies.circle(x, y, size / 2, shapeOptions);
      } else if (t < 0.66) {
        body = Bodies.rectangle(x, y, size, size, shapeOptions);
      } else {
        body = Bodies.polygon(
          x,
          y,
          Math.floor(Math.random() * 3) + 3,
          size / 1.5,
          shapeOptions,
        );
      }

      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: -Math.random() * 2 - 1,
      });

      shapes.push(body);
      Composite.add(engine.world, body);
    };

    // Initial shapes
    for (let i = 0; i < 30; i++) {
      addShape();
      // distribute them randomly vertically initially
      Body.setPosition(shapes[i], {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      });
    }

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Loop to clean up high-flying shapes and respawn them at bottom
    const loopInterval = setInterval(() => {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.position.y < -100) {
          Body.setPosition(shape, {
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
          });
          Body.setVelocity(shape, { x: 0, y: 0 });
        }
      }
    }, 500);

    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Matter.Body.setPosition(walls[0], { x: window.innerWidth / 2, y: -150 });
      Matter.Body.setPosition(walls[1], { x: -50, y: window.innerHeight / 2 });
      Matter.Body.setPosition(walls[2], {
        x: window.innerWidth + 50,
        y: window.innerHeight / 2,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseBodyRef.current) {
        Body.setPosition(mouseBodyRef.current, { x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(loopInterval);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-1000"
      style={{ overflow: "hidden" }}
    />
  );
}

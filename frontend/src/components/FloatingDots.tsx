import React, { useEffect, useRef } from 'react';

const FloatingDots = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Hiresnix brand colors
    const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#60a5fa', '#a78bfa', '#ffffff'];
    const particles: Particle[] = [];
    const particleCount = 80;

    class Particle {
      x: number; y: number; size: number; color: string; vx: number; vy: number; opacity: number;

      constructor() {
        this.x       = Math.random() * canvas!.width;
        this.y       = Math.random() * canvas!.height;
        this.size    = Math.random() * 2.5 + 1;
        this.color   = colors[Math.floor(Math.random() * colors.length)];
        this.vx      = (Math.random() - 0.5) * 0.4;
        this.vy      = -(Math.random() * 0.3 + 0.1);
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.globalAlpha = this.opacity;
        ctx!.fillStyle = this.color;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -10)                        { this.y = canvas!.height + 10; this.x = Math.random() * canvas!.width; }
        if (this.x < -10)                         this.x = canvas!.width + 10;
        if (this.x > canvas!.width + 10)          this.x = -10;
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none',
        backgroundColor: 'transparent',
      }}
    />
  );
};

export default FloatingDots;

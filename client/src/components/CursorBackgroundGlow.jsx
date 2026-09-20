import React, { useEffect, useRef } from 'react';

const CursorBackgroundGlow = () => {
  const canvasRef = useRef(null);
  const glowLightRef = useRef(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool for moving trail
    const particles = [];
    const maxParticles = 45;
    let mouse = { x: -500, y: -500, prevX: -500, prevY: -500, speed: 0 };
    let isMoving = false;
    let moveTimeout = null;

    // Smoothed coordinates for the ambient spotlight
    let smoothX = -500;
    let smoothY = -500;
    let smoothSpeed = 0;

    const handleMouseMove = (e) => {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.speed = speed;

      // Dynamically update card spotlight reflection
      const card = e.target && e.target.closest && e.target.closest('.neo-card, .neo-card-sm');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }

      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 120);

      // Spawn subtle trailing particles when moving
      if (speed > 2 && particles.length < maxParticles) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 12,
          y: e.clientY + (Math.random() - 0.5) * 12,
          radius: Math.random() * 4 + 2,
          alpha: Math.min(0.35, speed * 0.015),
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          color: Math.random() > 0.4 ? '224, 85, 4' : '250, 161, 33' // Flame Terracotta or Sunburst Amber
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animId;
    const animate = () => {
      // Smoothly interpolate spotlight position
      const ease = 0.12;
      smoothX += (mouse.x - smoothX) * ease;
      smoothY += (mouse.y - smoothY) * ease;
      smoothSpeed += ((isMoving ? mouse.speed : 0) - smoothSpeed) * 0.08;

      // Update ambient CSS spotlight element directly for high performance
      if (glowLightRef.current) {
        const radius = Math.min(680, 500 + smoothSpeed * 4);
        const opacity = Math.min(0.22, 0.11 + smoothSpeed * 0.003);
        glowLightRef.current.style.background = `radial-gradient(${radius}px circle at ${smoothX}px ${smoothY}px, rgba(224, 85, 4, ${opacity}), rgba(250, 161, 33, ${opacity * 0.7}) 40%, transparent 75%)`;
      }

      // Draw subtle trail on canvas
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.92;
        p.radius *= 0.97;

        if (p.alpha < 0.01 || p.radius < 0.5) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(moveTimeout);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Dynamic Luminous Ambient Spotlight Layer */}
      <div
        ref={glowLightRef}
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 will-change-transform"
        style={{
          background: 'radial-gradient(500px circle at -500px -500px, rgba(224, 85, 4, 0.12), transparent 70%)'
        }}
      />

      {/* Luminous Trailing Light Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 will-change-transform opacity-70"
      />
    </>
  );
};

export default CursorBackgroundGlow;

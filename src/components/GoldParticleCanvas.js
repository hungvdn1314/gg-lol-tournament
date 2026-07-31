"use client";

import { useEffect, useRef } from "react";

export default function GoldParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle pool
    const particleCount = 35;
    const particles = Array.from({ length: particleCount }, () => createParticle(canvas.width, canvas.height));

    function createParticle(w, h) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.5 + 0.8,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseDirection: Math.random() > 0.5 ? 1 : -1,
      };
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;

        p.opacity += p.pulseSpeed * p.pulseDirection;
        if (p.opacity >= 0.8) p.pulseDirection = -1;
        if (p.opacity <= 0.15) p.pulseDirection = 1;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Gold glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, `rgba(255, 224, 130, ${p.opacity})`);
        gradient.addColorStop(0.5, `rgba(245, 176, 65, ${p.opacity * 0.7})`);
        gradient.addColorStop(1, "rgba(245, 176, 65, 0)");

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#F5B041";
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.7,
      }}
    />
  );
}

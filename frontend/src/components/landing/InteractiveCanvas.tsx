import React, { useEffect, useRef, useCallback, useState } from "react";

// Particle interface
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  baseOpacity: number;
  size: number;
  baseSize: number;
  targetOpacity: number;
  targetSize: number;
}

// Mouse position interface
interface MousePosition {
  x: number;
  y: number;
}

// Configuration constants
const CONFIG = {
  PARTICLES_DESKTOP: 85,
  PARTICLES_MOBILE: 50,
  MOBILE_BREAKPOINT: 768,
  MOUSE_INFLUENCE_RADIUS: 120,
  BASE_OPACITY: 0.45,
  HOVER_OPACITY: 1.0,
  PARTICLE_SPEED: 0.5,
  CONNECTION_DISTANCE: 130,
  TARGET_FPS: 30,
  PARTICLE_RADIUS: 2.5,
  HOVER_PARTICLE_RADIUS: 4.0,
  INTERACTION_SMOOTHNESS: 0.15, // Lower = slower transition
  NAVBAR_HEIGHT: 80,
  FOOTER_HEIGHT: 120,
  COLORS: {
    PARTICLE: "#6b7280",
    PARTICLE_HOVER: "#fb923c",
    CONNECTION: "#9ca3af",
    CONNECTION_HOVER: "#fb923c",
  },
} as const;

const InteractiveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MousePosition>({ x: -1000, y: -1000 });
  const lastTimeRef = useRef<number>(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize particles
  const initializeParticles = useCallback(
    (width: number, height: number, mobile: boolean) => {
      const particleCount = mobile
        ? CONFIG.PARTICLES_MOBILE
        : CONFIG.PARTICLES_DESKTOP;
      const particles: Particle[] = [];
      const maxY = height - CONFIG.FOOTER_HEIGHT; // Avoid footer area

      for (let i = 0; i < particleCount; i++) {
        const baseOpacity = CONFIG.BASE_OPACITY + Math.random() * 0.2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * maxY, // Keep particles out of footer
          vx: (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED,
          vy: (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED,
          opacity: baseOpacity,
          baseOpacity,
          size: CONFIG.PARTICLE_RADIUS,
          baseSize: CONFIG.PARTICLE_RADIUS,
          targetOpacity: baseOpacity,
          targetSize: CONFIG.PARTICLE_RADIUS,
        });
      }

      particlesRef.current = particles;
    },
    []
  );

  // Handle window resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { innerWidth, innerHeight } = window;
    const mobile = innerWidth < CONFIG.MOBILE_BREAKPOINT;

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    setDimensions({ width: innerWidth, height: innerHeight });

    // Reinitialize particles with new dimensions
    initializeParticles(innerWidth, innerHeight, mobile);
  }, [initializeParticles]);

  // Calculate distance between two points
  const getDistance = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Update particle positions and handle mouse interaction
  const updateParticles = useCallback((width: number, height: number) => {
    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    const maxY = height - CONFIG.FOOTER_HEIGHT; // Avoid footer area

    particles.forEach((particle) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges (avoid footer area)
      if (particle.x <= 0 || particle.x >= width) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      if (particle.y <= 0 || particle.y >= maxY) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(maxY, particle.y));
      }

      // Enhanced mouse interaction with smooth transitions
      const distanceToMouse = getDistance(
        particle.x,
        particle.y,
        mouse.x,
        mouse.y
      );
      if (distanceToMouse < CONFIG.MOUSE_INFLUENCE_RADIUS) {
        const influence = 1 - distanceToMouse / CONFIG.MOUSE_INFLUENCE_RADIUS;

        // Set target values based on influence
        particle.targetOpacity =
          particle.baseOpacity +
          (CONFIG.HOVER_OPACITY - particle.baseOpacity) * influence;
        particle.targetSize =
          particle.baseSize +
          (CONFIG.HOVER_PARTICLE_RADIUS - particle.baseSize) * influence;
      } else {
        // Return to base values
        particle.targetOpacity = particle.baseOpacity;
        particle.targetSize = particle.baseSize;
      }

      // Smooth interpolation to target values
      particle.opacity +=
        (particle.targetOpacity - particle.opacity) *
        CONFIG.INTERACTION_SMOOTHNESS;
      particle.size +=
        (particle.targetSize - particle.size) * CONFIG.INTERACTION_SMOOTHNESS;
    });
  }, []);

  // Draw particles and connections
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Draw connections first (behind particles)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const distance = getDistance(p1.x, p1.y, p2.x, p2.y);

          if (distance < CONFIG.CONNECTION_DISTANCE) {
            const connectionOpacity =
              (1 - distance / CONFIG.CONNECTION_DISTANCE) * 0.4;
            const avgOpacity = Math.min(p1.opacity, p2.opacity);

            // Check if either particle is near mouse for enhanced connection
            const p1MouseDist = getDistance(p1.x, p1.y, mouse.x, mouse.y);
            const p2MouseDist = getDistance(p2.x, p2.y, mouse.x, mouse.y);
            const isNearMouse =
              p1MouseDist < CONFIG.MOUSE_INFLUENCE_RADIUS ||
              p2MouseDist < CONFIG.MOUSE_INFLUENCE_RADIUS;

            if (isNearMouse) {
              // Enhanced connection appearance
              ctx.strokeStyle = CONFIG.COLORS.CONNECTION_HOVER;
              ctx.lineWidth = 2.5;
              ctx.globalAlpha = connectionOpacity * avgOpacity * 1.2;
            } else {
              // Normal connection appearance
              ctx.strokeStyle = CONFIG.COLORS.CONNECTION;
              ctx.lineWidth = 1;
              ctx.globalAlpha = connectionOpacity * avgOpacity;
            }

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles with enhanced appearance
      particles.forEach((particle) => {
        const mouseDistance = getDistance(
          particle.x,
          particle.y,
          mouse.x,
          mouse.y
        );
        const isNearMouse = mouseDistance < CONFIG.MOUSE_INFLUENCE_RADIUS;

        ctx.globalAlpha = particle.opacity;

        if (isNearMouse) {
          // Enhanced particle appearance with glow effect
          const influence = 1 - mouseDistance / CONFIG.MOUSE_INFLUENCE_RADIUS;

          // Outer glow
          if (influence > 0.3) {
            ctx.fillStyle = CONFIG.COLORS.PARTICLE_HOVER;
            ctx.globalAlpha = particle.opacity * 0.3;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size + 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Main particle
          ctx.fillStyle = CONFIG.COLORS.PARTICLE_HOVER;
          ctx.globalAlpha = particle.opacity;
        } else {
          // Normal particle appearance
          ctx.fillStyle = CONFIG.COLORS.PARTICLE;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1; // Reset alpha
    },
    []
  );

  // Animation loop with FPS throttling
  const animate = useCallback(
    (currentTime: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // FPS throttling
      const elapsed = currentTime - lastTimeRef.current;
      const targetInterval = 1000 / CONFIG.TARGET_FPS;

      if (elapsed > targetInterval) {
        updateParticles(dimensions.width, dimensions.height);
        draw(ctx, dimensions.width, dimensions.height);
        lastTimeRef.current = currentTime - (elapsed % targetInterval);
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [dimensions.width, dimensions.height, updateParticles, draw]
  );

  // Mouse move handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }, []);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  // Initialize canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [animate, handleResize, handleMouseMove, handleMouseLeave]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 1,
        background: "transparent",
      }}
      aria-hidden="true"
    />
  );
};

export default InteractiveCanvas;

"use client";

import React, { useEffect, useRef } from "react";
import { SpacingToken } from "../types";
import { DisplayProps } from "../interfaces";
import { Flex } from ".";

interface ParticleProps extends React.ComponentProps<typeof Flex> {
  density?: number;
  color?: string;
  size?: SpacingToken;
  speed?: number;
  interactive?: boolean;
  mode?: "repel" | "attract";
  intensity?: number;
  opacity?: DisplayProps["opacity"];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Particle = React.forwardRef<HTMLDivElement, ParticleProps>(
  (
    {
      density = 100,
      color = "brand-on-background-weak",
      size = "2",
      speed = 0.3,
      interactive = false,
      mode = "repel",
      intensity = 20,
      opacity = 100,
      children,
      className,
      style,
      ...rest
    },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (forwardedRef && "current" in forwardedRef) {
        forwardedRef.current = containerRef.current;
      } else if (typeof forwardedRef === "function") {
        forwardedRef(containerRef.current);
      }
    }, [forwardedRef]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const particles: HTMLElement[] = [];
      const particlePositions = new Map<HTMLElement, { x: number; y: number }>();
      const initialPositions = new Map<HTMLElement, { x: number; y: number }>();
      let mousePosition = { x: -1000, y: -1000 };
      let animationFrameId: number;
      let containerRect = container.getBoundingClientRect();

      const parsedSize = `var(--static-space-${size})`;
      const parsedOpacity = `${opacity}%`;
      const movementSpeed = speed * 0.08;
      const repulsionStrength = 0.15 * (speed || 1);

      const handleResize = () => {
        containerRect = container.getBoundingClientRect();
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      const handleMouseMove = (e: MouseEvent) => {
        mousePosition = {
          x: ((e.clientX - containerRect.left) / containerRect.width) * 100,
          y: ((e.clientY - containerRect.top) / containerRect.height) * 100,
        };
      };

      const createParticle = () => {
        const particleEl = document.createElement("div");
        particleEl.style.position = "absolute";
        particleEl.style.width = parsedSize;
        particleEl.style.height = parsedSize;
        particleEl.style.background = `var(--${color})`;
        particleEl.style.borderRadius = "50%";
        particleEl.style.pointerEvents = "none";
        particleEl.style.opacity = parsedOpacity;
        particleEl.style.left = "0";
        particleEl.style.top = "0";
        particleEl.style.willChange = "transform";

        const initialX = 10 + Math.random() * 80;
        const initialY = 10 + Math.random() * 80;

        const pxX = (initialX / 100) * containerRect.width;
        const pxY = (initialY / 100) * containerRect.height;
        particleEl.style.transform = `translate3d(${pxX}px, ${pxY}px, 0)`;

        initialPositions.set(particleEl, { x: initialX, y: initialY });
        particlePositions.set(particleEl, { x: initialX, y: initialY });

        container.appendChild(particleEl);
        particles.push(particleEl);
        return particleEl;
      };

      const updateParticles = () => {
        const cw = containerRect.width;
        const ch = containerRect.height;

        for (let index = 0; index < particles.length; index++) {
          const particleEl = particles[index];
          const currentPos = particlePositions.get(particleEl);
          const initial = initialPositions.get(particleEl);
          if (!currentPos || !initial) continue;

          const currentX = currentPos.x;
          const currentY = currentPos.y;

          const time = Date.now() * 0.001 * speed;
          const baseNoiseX = Math.sin(time + index) * 0.5;
          const baseNoiseY = Math.cos(time + index * 1.2) * 0.5;

          let targetX = initial.x + baseNoiseX;
          let targetY = initial.y + baseNoiseY;

          if (interactive) {
            const dx = mousePosition.x - currentX;
            const dy = mousePosition.y - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < intensity) {
              const angle = Math.atan2(dy, dx);

              if (mode === "attract") {
                // Attract: move towards cursor
                const minDistance = 8;

                if (distance <= minDistance) {
                  targetX = mousePosition.x;
                  targetY = mousePosition.y;
                } else {
                  const normalizedDistance = Math.min(distance / intensity, 1);
                  const force = distance * repulsionStrength * normalizedDistance * 0.3;
                  targetX = currentX + Math.cos(angle) * force;
                  targetY = currentY + Math.sin(angle) * force;
                }
              } else {
                // Repel: move away from cursor
                const force = (intensity - distance) * repulsionStrength;
                targetX -= Math.cos(angle) * force;
                targetY -= Math.sin(angle) * force;
              }
            }
          }

          targetX = Math.max(5, Math.min(95, targetX));
          targetY = Math.max(5, Math.min(95, targetY));

          const newX = currentX + (targetX - currentX) * movementSpeed;
          const newY = currentY + (targetY - currentY) * movementSpeed;

          particlePositions.set(particleEl, { x: newX, y: newY });
          particleEl.style.transform = `translate3d(${(newX / 100) * cw}px, ${(newY / 100) * ch}px, 0)`;
        }

        animationFrameId = requestAnimationFrame(updateParticles);
      };

      if (interactive) {
        document.addEventListener("mousemove", handleMouseMove);
      }

      for (let i = 0; i < density; i++) {
        createParticle();
      }

      updateParticles();

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        resizeObserver.disconnect();
        cancelAnimationFrame(animationFrameId);
        particles.forEach((particleEl) => {
          particleEl.remove();
          particlePositions.delete(particleEl);
          initialPositions.delete(particleEl);
        });
      };
    }, [color, size, speed, interactive, intensity, opacity, density, containerRef]);

    return (
      <Flex
        ref={containerRef}
        fill
        pointerEvents="none"
        className={className}
        style={style}
        {...rest}
      >
        {children}
      </Flex>
    );
  },
);

Particle.displayName = "Particle";
export { Particle };

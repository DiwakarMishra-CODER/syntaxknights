"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const CTAFlowField: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create subtle flowing lines
    const lineCount = 12;
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const materials = [
      new THREE.LineBasicMaterial({ color: 0xe6cda8, transparent: true, opacity: 0.15 }),
      new THREE.LineBasicMaterial({ color: 0x48d8be, transparent: true, opacity: 0.08 }),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 }),
    ];

    const lines: THREE.Line[] = [];
    const pointsData: { speed: number; offset: number; amp: number }[] = [];

    for (let i = 0; i < lineCount; i++) {
      const points = [];
      for (let j = 0; j <= 50; j++) {
        points.push(new THREE.Vector3((j / 50) * 16 - 8, 0, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, materials[i % 3]);
      
      linesGroup.add(line);
      lines.push(line);
      pointsData.push({
        speed: 0.5 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        amp: 0.2 + Math.random() * 0.8,
      });
    }

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      lines.forEach((line, i) => {
        const data = pointsData[i];
        const positions = line.geometry.attributes.position.array as Float32Array;
        
        for (let j = 0; j <= 50; j++) {
          const x = (j / 50) * 16 - 8;
          // Complex wave math
          const y = Math.sin(x * 0.5 + t * data.speed + data.offset) * data.amp * Math.sin(t * 0.2 + i);
          positions[j * 3 + 1] = y;
        }
        line.geometry.attributes.position.needsUpdate = true;
        
        // Subtle vertical bob
        line.position.y = Math.sin(t * 0.1 + i) * 0.5;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.5rem]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#12171B] via-transparent to-[#12171B] pointer-events-none" />
    </div>
  );
};

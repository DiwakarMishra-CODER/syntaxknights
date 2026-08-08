"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const ConversationField: React.FC = () => {
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

    // Create subtle flowing warm gold & amber line field
    const lineCount = 14;
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const materials = [
      new THREE.LineBasicMaterial({ color: 0xd4a359, transparent: true, opacity: 0.22 }),
      new THREE.LineBasicMaterial({ color: 0xe5b869, transparent: true, opacity: 0.16 }),
      new THREE.LineBasicMaterial({ color: 0xf5f2eb, transparent: true, opacity: 0.08 }),
    ];

    const lines: THREE.Line[] = [];
    const pointsData: { speed: number; offset: number; amp: number }[] = [];

    for (let i = 0; i < lineCount; i++) {
      const points = [];
      for (let j = 0; j <= 60; j++) {
        points.push(new THREE.Vector3((j / 60) * 18 - 9, 0, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, materials[i % 3]);
      
      linesGroup.add(line);
      lines.push(line);
      pointsData.push({
        speed: 0.4 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
        amp: 0.25 + Math.random() * 0.6,
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
        
        for (let j = 0; j <= 60; j++) {
          const x = (j / 60) * 18 - 9;
          const y = Math.sin(x * 0.4 + t * data.speed + data.offset) * data.amp * Math.sin(t * 0.15 + i);
          positions[j * 3 + 1] = y;
        }
        line.geometry.attributes.position.needsUpdate = true;
        line.position.y = Math.sin(t * 0.1 + i) * 0.4;
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
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-[#0A0A0A] pointer-events-none" />
    </div>
  );
};

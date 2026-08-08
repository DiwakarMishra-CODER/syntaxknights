"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface NodeData {
  id: string;
  label: string;
  color: string;
  angle: number; // in radians
  rx: number;
  ry: number;
  yOffset: number;
}

const NODES: NodeData[] = [
  { id: "retrieval", label: "Retrieval", color: "#10B981", angle: -2.3, rx: 3.2, ry: 1.6, yOffset: -0.2 },
  { id: "rag", label: "RAG", color: "#06B6D4", angle: -1.4, rx: 3.4, ry: 1.7, yOffset: 0.4 },
  { id: "agents", label: "Agents", color: "#A855F7", angle: -0.5, rx: 3.2, ry: 1.6, yOffset: 0.7 },
  { id: "mcp", label: "MCP", color: "#38BDF8", angle: 0.4, rx: 3.3, ry: 1.65, yOffset: 0.3 },
  { id: "prompting", label: "Prompting", color: "#F59E0B", angle: 1.3, rx: 3.2, ry: 1.6, yOffset: -0.3 },
  { id: "production", label: "Production", color: "#3B82F6", angle: 2.2, rx: 3.4, ry: 1.7, yOffset: -0.6 },
];

export const MockMateOrbital: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const tealPointLight = new THREE.PointLight(0x10b981, 2, 10);
    tealPointLight.position.set(0, 0.5, 2);
    scene.add(tealPointLight);

    // Group for mouse parallax
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Platform Disc
    const platformGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.25, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      metalness: 0.9,
      roughness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, -1.1, 0);
    mainGroup.add(platform);

    // Platform Emissive Ring
    const ringGeo = new THREE.RingGeometry(1.4, 1.55, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const platformRing = new THREE.Mesh(ringGeo, ringMat);
    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.set(0, -0.97, 0);
    mainGroup.add(platformRing);

    // 2. Central MockMate "M" Cube
    const cubeGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
    
    // Create Texture for "M" Logo on face
    const mCanvas = document.createElement("canvas");
    mCanvas.width = 512;
    mCanvas.height = 512;
    const ctx = mCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0a101d";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#10B981";
      ctx.font = "bold 260px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#10B981";
      ctx.shadowBlur = 30;
      ctx.fillText("M", 256, 256);
    }
    const mTexture = new THREE.CanvasTexture(mCanvas);

    const cubeMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x0d1527, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0d1527, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0d1527, map: mTexture, emissive: 0x10b981, emissiveIntensity: 0.3 }), // top
      new THREE.MeshStandardMaterial({ color: 0x0d1527, metalness: 0.8, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0d1527, map: mTexture, emissive: 0x10b981, emissiveIntensity: 0.4 }), // front
      new THREE.MeshStandardMaterial({ color: 0x0d1527, metalness: 0.8, roughness: 0.2 }),
    ];

    const cube = new THREE.Mesh(cubeGeo, cubeMaterials);
    cube.position.set(0, 0.2, 0);
    cube.rotation.x = 0.35;
    cube.rotation.y = -0.45;
    mainGroup.add(cube);

    // 3. Elliptical Orbit Rings
    const orbitPoints: THREE.Vector3[] = [];
    const orbitSegments = 128;
    for (let i = 0; i <= orbitSegments; i++) {
      const theta = (i / orbitSegments) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * 3.3, Math.sin(theta) * 0.3, Math.sin(theta) * 1.65));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.position.set(0, -0.1, 0);
    mainGroup.add(orbitLine);

    // 4. Orbital Nodes Meshes
    const nodeGroupMap: Record<string, THREE.Group> = {};

    NODES.forEach((nd) => {
      const nodeGroup = new THREE.Group();

      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(0.22, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(nd.color),
        emissive: new THREE.Color(nd.color),
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.5,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphere);

      // Outer Glow Halo
      const haloGeo = new THREE.SphereGeometry(0.34, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(nd.color),
        transparent: true,
        opacity: 0.25,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(halo);

      // Position
      const x = Math.cos(nd.angle) * nd.rx;
      const z = Math.sin(nd.angle) * nd.ry;
      const y = nd.yOffset;
      nodeGroup.position.set(x, y, z);

      mainGroup.add(nodeGroup);
      nodeGroupMap[nd.id] = nodeGroup;
    });

    // Mouse Interaction
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      targetMouseX = (relX / width) * 2 - 1;
      targetMouseY = -(relY / height) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      mainGroup.rotation.y = currentMouseX * 0.25 + elapsedTime * 0.05;
      mainGroup.rotation.x = -currentMouseY * 0.15;

      // Floating Cube animation
      cube.position.y = 0.2 + Math.sin(elapsedTime * 1.5) * 0.08;
      cube.rotation.y = -0.45 + Math.sin(elapsedTime * 0.8) * 0.05;

      // Pulse Orbit line
      orbitMat.opacity = 0.2 + Math.sin(elapsedTime * 2) * 0.08;

      // Calculate 2D Screen Positions for HTML Labels
      const positions: Record<string, { x: number; y: number; visible: boolean }> = {};
      const tempVec = new THREE.Vector3();

      NODES.forEach((nd) => {
        const ng = nodeGroupMap[nd.id];
        if (ng) {
          ng.getWorldPosition(tempVec);
          tempVec.project(camera);

          const screenX = ((tempVec.x + 1) * width) / 2;
          const screenY = ((-tempVec.y + 1) * height) / 2;
          const isVisible = tempVec.z < 1;

          positions[nd.id] = { x: screenX, y: screenY, visible: isVisible };
        }
      });

      setNodePositions(positions);
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[480px] sm:h-[580px] flex items-center justify-center">
      {/* Three.js WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Dynamic 2D HTML Node Labels floating in 3D Space */}
      {NODES.map((nd) => {
        const pos = nodePositions[nd.id];
        if (!pos || !pos.visible) return null;

        const isHovered = hoveredNode === nd.id;

        return (
          <div
            key={nd.id}
            onMouseEnter={() => setHoveredNode(nd.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -100%) translateY(-14px)",
            }}
            className={`absolute pointer-events-auto transition-all duration-200 cursor-pointer ${
              isHovered ? "scale-110 z-20" : "scale-100 z-10"
            }`}
          >
            <div className="flex items-center gap-2 bg-[#0B101D]/90 border border-slate-700/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
              <span
                className="w-2.5 h-2.5 rounded-full animate-node-pulse"
                style={{ backgroundColor: nd.color, boxShadow: `0 0 10px ${nd.color}` }}
              />
              <span className="text-xs font-sans font-semibold text-slate-200 tracking-wide">
                {nd.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface NodeData {
  id: string;
  label: string;
  color: string;
  angle: number;
  radius: number;
  height: number;
  description: string;
}

const NODES: NodeData[] = [
  { id: "answer", label: "Candidate Answer", color: "#36E6B0", angle: -2.2, radius: 3.2, height: -0.2, description: "Raw natural language transcript & code logic" },
  { id: "understand", label: "Understand", color: "#159B78", angle: -1.3, radius: 3.4, height: 0.4, description: "Extracts system boundary trade-offs" },
  { id: "evaluate", label: "Evaluate", color: "#36E6B0", angle: -0.4, radius: 3.2, height: 0.6, description: "Assesses architectural depth & edge cases" },
  { id: "adapt", label: "Adapt", color: "#D8A85B", angle: 0.5, radius: 3.3, height: 0.3, description: "Calibrates question difficulty dynamically" },
  { id: "followup", label: "Follow-up", color: "#36E6B0", angle: 1.4, radius: 3.2, height: -0.3, description: "Targeted probe on identified weak point" },
  { id: "deeper", label: "Deeper Question", color: "#38BDF8", angle: 2.3, radius: 3.4, height: -0.5, description: "Explores staff-engineer level failure modes" },
];

export const AdaptiveInterviewScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [clickedNode, setClickedNode] = useState<NodeData | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const tealDirLight = new THREE.DirectionalLight(0x36e6b0, 1.8);
    tealDirLight.position.set(5, 8, 5);
    scene.add(tealDirLight);

    const rimLight = new THREE.DirectionalLight(0x159b78, 1.2);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Floating Platform
    const platformGeo = new THREE.CylinderGeometry(1.6, 1.85, 0.2, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x091713,
      metalness: 0.85,
      roughness: 0.25,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, -1.1, 0);
    mainGroup.add(platform);

    const ringGeo = new THREE.RingGeometry(1.45, 1.58, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x36e6b0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const platformRing = new THREE.Mesh(ringGeo, ringMat);
    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.set(0, -0.98, 0);
    mainGroup.add(platformRing);

    // 2. Central Rounded MockMate "M" Cube
    const cubeGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);

    const mCanvas = document.createElement("canvas");
    mCanvas.width = 512;
    mCanvas.height = 512;
    const ctx = mCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#06100D";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#36E6B0";
      ctx.font = "bold 260px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#36E6B0";
      ctx.shadowBlur = 35;
      ctx.fillText("M", 256, 256);
    }
    const mTexture = new THREE.CanvasTexture(mCanvas);

    const cubeMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x0f231d, metalness: 0.7, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0f231d, metalness: 0.7, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0f231d, map: mTexture, emissive: 0x36e6b0, emissiveIntensity: 0.35 }),
      new THREE.MeshStandardMaterial({ color: 0x0f231d, metalness: 0.7, roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x0f231d, map: mTexture, emissive: 0x36e6b0, emissiveIntensity: 0.45 }),
      new THREE.MeshStandardMaterial({ color: 0x0f231d, metalness: 0.7, roughness: 0.2 }),
    ];

    const cube = new THREE.Mesh(cubeGeo, cubeMaterials);
    cube.position.set(0, 0.2, 0);
    cube.rotation.x = 0.35;
    cube.rotation.y = -0.45;
    mainGroup.add(cube);

    // 3. Orbital Path Lines
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * 3.3, Math.sin(theta) * 0.25, Math.sin(theta) * 1.65));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x36e6b0,
      transparent: true,
      opacity: 0.25,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.position.set(0, -0.1, 0);
    mainGroup.add(orbitLine);

    // 4. Adaptive Nodes Meshes
    const nodeGroupMap: Record<string, THREE.Group> = {};

    NODES.forEach((nd) => {
      const nodeGroup = new THREE.Group();

      const sphereGeo = new THREE.SphereGeometry(0.2, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(nd.color),
        emissive: new THREE.Color(nd.color),
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.5,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphere);

      const haloGeo = new THREE.SphereGeometry(0.32, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(nd.color),
        transparent: true,
        opacity: 0.2,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(halo);

      const x = Math.cos(nd.angle) * nd.radius;
      const z = Math.sin(nd.angle) * 1.65;
      const y = nd.height;
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

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      mainGroup.rotation.y = currentMouseX * 0.2 + elapsedTime * 0.04;
      mainGroup.rotation.x = -currentMouseY * 0.12;

      cube.position.y = 0.2 + Math.sin(elapsedTime * 1.5) * 0.07;
      cube.rotation.y = -0.45 + Math.sin(elapsedTime * 0.8) * 0.04;

      orbitMat.opacity = 0.2 + Math.sin(elapsedTime * 2) * 0.06;

      // Project 2D screen positions for HTML labels
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
    <div ref={containerRef} className="relative w-full h-[460px] sm:h-[560px] flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* HTML Labels matching adaptive nodes */}
      {NODES.map((nd) => {
        const pos = nodePositions[nd.id];
        if (!pos || !pos.visible) return null;

        const isHovered = hoveredNode === nd.id;

        return (
          <div
            key={nd.id}
            onMouseEnter={() => setHoveredNode(nd.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => setClickedNode(clickedNode?.id === nd.id ? null : nd)}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -100%) translateY(-14px)",
            }}
            className={`absolute pointer-events-auto transition-all duration-200 cursor-pointer ${
              isHovered ? "scale-110 z-20" : "scale-100 z-10"
            }`}
          >
            <div className="flex items-center gap-2 bg-[#0F231D]/90 border border-[#4BDCB4]/30 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
              <span
                className="w-2.5 h-2.5 rounded-full animate-node-pulse"
                style={{ backgroundColor: nd.color, boxShadow: `0 0 10px ${nd.color}` }}
              />
              <span className="text-xs font-sans font-semibold text-[#F3F7F5] tracking-wide">
                {nd.label}
              </span>
            </div>

            {/* Click Tooltip */}
            {clickedNode?.id === nd.id && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-3 rounded-xl bg-[#06100D] border border-[#36E6B0]/40 text-[11px] font-sans text-slate-300 shadow-2xl z-30">
                <div className="font-semibold text-[#36E6B0] mb-1">{nd.label} Stage</div>
                {nd.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

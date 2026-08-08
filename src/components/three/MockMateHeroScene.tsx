"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface MockMateHeroSceneProps {
  activeStage?: string;
  onStageChange?: (stage: string) => void;
}

export const MockMateHeroScene: React.FC<MockMateHeroSceneProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 9.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: reduceMotion ? "low-power" : "high-performance",
    });
    renderer.setSize(width, height);
    const pixelRatioCap = width < 640 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    renderer.setClearColor(0x000000, 0);

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    // --- Warm Studio Lighting Setup ----------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const warmKeyLight = new THREE.DirectionalLight(0xfff5e6, 3.6); // Warm key
    warmKeyLight.position.set(5, 7, 5);
    scene.add(warmKeyLight);

    const neutralFill = new THREE.DirectionalLight(0xffffff, 0.8);
    neutralFill.position.set(-4, -2, 4);
    scene.add(neutralFill);

    const amberRimLight = new THREE.DirectionalLight(0xe5b869, 2.8); // Warm amber rim
    amberRimLight.position.set(-6, 3, -5);
    scene.add(amberRimLight);

    const mainGroup = new THREE.Group();
    mainGroup.position.set(0, 0, 0);
    scene.add(mainGroup);

    // --- Pedestal Platform -------------------------------------------------
    const platformGroup = new THREE.Group();
    platformGroup.position.set(0, -1.3, 0);

    const tierHeights = [0.12, 0.08, 0.06];
    const tierRadii = [1.8, 1.45, 1.1];

    tierRadii.forEach((r, i) => {
      const tierGeo = new THREE.CylinderGeometry(r, r + 0.1, tierHeights[i], 64);
      const tierMat = new THREE.MeshPhysicalMaterial({
        color: i === 0 ? 0x181512 : 0x0a0a0a,
        roughness: 0.18,
        transmission: i === 0 ? 0.35 : 0.0,
        transparent: true,
      });
      disposableGeometries.push(tierGeo);
      disposableMaterials.push(tierMat);
      const tierMesh = new THREE.Mesh(tierGeo, tierMat);
      tierMesh.position.y = -i * 0.08;
      platformGroup.add(tierMesh);
    });

    const ringGeoGold = new THREE.RingGeometry(1.4, 1.43, 64);
    const ringMatGold = new THREE.MeshBasicMaterial({
      color: 0xd4a359,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    disposableGeometries.push(ringGeoGold);
    disposableMaterials.push(ringMatGold);
    const ringGold = new THREE.Mesh(ringGeoGold, ringMatGold);
    ringGold.rotation.x = Math.PI / 2;
    ringGold.position.y = 0.062;
    platformGroup.add(ringGold);

    mainGroup.add(platformGroup);

    // --- Central Warm Glass Squircle Artifact ------------------------------
    const centralMGroup = new THREE.Group();
    centralMGroup.position.set(0, 0.15, 0);

    const size = 1.1;
    const radius = 0.28;
    const squircleShape = new THREE.Shape();
    squircleShape.moveTo(-size / 2 + radius, -size / 2);
    squircleShape.lineTo(size / 2 - radius, -size / 2);
    squircleShape.quadraticCurveTo(size / 2, -size / 2, size / 2, -size / 2 + radius);
    squircleShape.lineTo(size / 2, size / 2 - radius);
    squircleShape.quadraticCurveTo(size / 2, size / 2, size / 2 - radius, size / 2);
    squircleShape.lineTo(-size / 2 + radius, size / 2);
    squircleShape.quadraticCurveTo(-size / 2, size / 2, -size / 2, size / 2 - radius);
    squircleShape.lineTo(-size / 2, -size / 2 + radius);
    squircleShape.quadraticCurveTo(-size / 2, -size / 2, -size / 2 + radius, -size / 2);

    const extrudeSettings = {
      steps: 1,
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelOffset: 0,
      bevelSegments: 8,
    };
    const squircleGeo = new THREE.ExtrudeGeometry(squircleShape, extrudeSettings);
    squircleGeo.center();
    disposableGeometries.push(squircleGeo);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.05,
      thickness: 0.35,
      ior: 1.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      metalness: 0.0,
      transparent: true,
      depthWrite: false,
    });
    const goldBevelMat = new THREE.MeshStandardMaterial({
      color: 0xd4a359,
      metalness: 0.95,
      roughness: 0.15,
    });
    disposableMaterials.push(glassMat, goldBevelMat);

    const centralSquircle = new THREE.Mesh(squircleGeo, [glassMat, goldBevelMat]);
    centralSquircle.rotation.x = 0.35;
    centralSquircle.rotation.y = -0.45;
    centralMGroup.add(centralSquircle);

    // Recessed Crisp Warm Cream 3D M Logo
    const mShape = new THREE.Shape();
    mShape.moveTo(-0.28, -0.28);
    mShape.lineTo(-0.18, -0.28);
    mShape.lineTo(-0.18, 0.16);
    mShape.lineTo(0, -0.12);
    mShape.lineTo(0.18, 0.16);
    mShape.lineTo(0.18, -0.28);
    mShape.lineTo(0.28, -0.28);
    mShape.lineTo(0.28, 0.28);
    mShape.lineTo(0.16, 0.28);
    mShape.lineTo(0, 0.02);
    mShape.lineTo(-0.16, 0.28);
    mShape.lineTo(-0.28, 0.28);
    mShape.closePath();

    const mLogoGeo = new THREE.ExtrudeGeometry(mShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    mLogoGeo.center();
    disposableGeometries.push(mLogoGeo);

    const mLogoMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2eb,
      emissive: 0xf5f2eb,
      emissiveIntensity: 3.2,
      roughness: 0.1,
      metalness: 0.1,
    });
    disposableMaterials.push(mLogoMat);

    const mLogoMesh = new THREE.Mesh(mLogoGeo, mLogoMat);
    mLogoMesh.rotation.x = 0.35;
    mLogoMesh.rotation.y = -0.45;
    mLogoMesh.position.z = 0.01;
    centralMGroup.add(mLogoMesh);

    // Warm Interior Point Light
    const mLight = new THREE.PointLight(0xffe8c5, 5.0, 6);
    mLight.position.set(0, 0, 0.5);
    centralMGroup.add(mLight);

    mainGroup.add(centralMGroup);

    // --- Orbital Rings -----------------------------------------------------
    const orbitGroup = new THREE.Group();

    const createOrbitLine = (
      rx: number,
      ry: number,
      rotX: number,
      rotZ: number,
      colorHex: number,
      opacity: number
    ) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * rx, 0, Math.sin(theta) * ry));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
      });
      disposableGeometries.push(geo);
      disposableMaterials.push(mat);
      const line = new THREE.Line(geo, mat);
      line.rotation.x = rotX;
      line.rotation.z = rotZ;
      return line;
    };

    orbitGroup.add(createOrbitLine(3.4, 1.9, 0.25, -0.15, 0xd4a359, 0.28));
    orbitGroup.add(createOrbitLine(2.9, 1.5, -0.3, 0.2, 0xe5b869, 0.45));
    orbitGroup.add(createOrbitLine(3.8, 2.2, 0.35, 0.1, 0x24201a, 0.2));

    mainGroup.add(orbitGroup);

    // --- Orbiting Glass Spheres --------------------------------------------
    const spherePositions: [number, number, number][] = [
      [2.4, 0.4, 0.6],
      [1.2, 1.3, -0.8],
      [-2.2, 0.2, 0.8],
      [-0.8, -1.4, 1.2],
    ];

    spherePositions.forEach((pos, idx) => {
      const nodeGeo = new THREE.SphereGeometry(idx === 0 ? 0.15 : 0.12, 32, 32);
      const nodeMat = new THREE.MeshPhysicalMaterial({
        color: idx === 0 ? 0xe5b869 : 0xf5f2eb,
        emissive: idx === 0 ? 0xe5b869 : 0xf5f2eb,
        emissiveIntensity: idx === 0 ? 0.95 : 0.4,
        roughness: 0.15,
        metalness: 0.65,
        transmission: 0.5,
        transparent: true,
      });
      disposableGeometries.push(nodeGeo);
      disposableMaterials.push(nodeMat);
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(...pos);
      mainGroup.add(nodeMesh);
    });

    // --- Mouse Parallax Handling -------------------------------------------
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      targetMouseX = (relX / width) * 2 - 1;
      targetMouseY = -(relY / height) * 2 + 1;
    };

    if (!reduceMotion) {
      container.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    const isVisibleRef = { current: true };
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(container);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      const elapsedTime = clock.getElapsedTime();

      if (!reduceMotion) {
        currentMouseX += (targetMouseX - currentMouseX) * 0.04;
        currentMouseY += (targetMouseY - currentMouseY) * 0.04;
        mainGroup.rotation.y = currentMouseX * 0.06 + Math.sin(elapsedTime * 0.12) * 0.02;
        mainGroup.rotation.x = -currentMouseY * 0.04;
        centralMGroup.position.y = 0.15 + Math.sin(elapsedTime * 1.2) * 0.04;
        centralSquircle.rotation.y = -0.45 + Math.sin(elapsedTime * 0.4) * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const doResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 640 ? 1.5 : 2));
    };
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(doResize, 120);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      observer.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] sm:h-[560px] lg:h-[600px] flex items-center justify-center select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Signature 3D artifact visualization of MockMate's adaptive interviewer"
        className="w-full h-full block bg-transparent"
      />
    </div>
  );
};

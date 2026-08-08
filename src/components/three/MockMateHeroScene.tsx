"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";

export const MockMateHeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [sequencePhase, setSequencePhase] = useState<number>(0);
  const [nodePositions, setNodePositions] = useState<{ x: number; y: number }[]>([]);

  // The 4 major curriculum hubs from the hackathon statement
  const hubLabels = ["RAG & VECTOR DBs", "PROMPT ENGINEERING", "AGENTIC AI", "MCP & DEPLOYMENT"];
  
  // Track sequence phase over time (24-second loop)
  useEffect(() => {
    const loopTime = 25000;
    
    const tick = () => {
      const now = Date.now() % loopTime;
      if (now < 3000) setSequencePhase(1);       // Profile Ingestion (31-Day Cohort)
      else if (now < 7000) setSequencePhase(2);  // Curriculum Map Formation
      else if (now < 12000) setSequencePhase(3); // The Probe (Agentic AI)
      else if (now < 17000) setSequencePhase(4); // Adaptive Follow-up (RAG)
      else if (now < 21000) setSequencePhase(5); // Knowledge Gap (MCP)
      else setSequencePhase(6);                  // Celebration: Interview Ready
    };

    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, []);

  // Three.js scene setup
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050806, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // ─── Setup Particles ───
    const particleCount = 200;
    const particles = new Float32Array(particleCount * 3);
    const particleTargets = new Float32Array(particleCount * 3);
    const expandedTargets = new Float32Array(particleCount * 3); // For Phase 5
    const celebrationTargets = new Float32Array(particleCount * 3); // For Phase 6
    
    // Define 4 hubs
    const hubs = [
      new THREE.Vector3(-2.2, 1.8, 0),   // 0: RAG & Vector DBs (Top Left)
      new THREE.Vector3(-2.5, -1.2, 1),  // 1: Prompt Engineering (Bottom Left)
      new THREE.Vector3(2.2, -1.8, -0.5),// 2: Agentic AI (Bottom Right)
      new THREE.Vector3(2.5, 1.2, 0.5)   // 3: MCP & Deployment (Top Right)
    ];

    for (let i = 0; i < particleCount; i++) {
      // Start clustered at center
      particles[i * 3] = (Math.random() - 0.5) * 0.5;
      particles[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      particles[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      // Assign to a hub for State 2, 3, 4
      const hubIdx = i % 4;
      particleTargets[i * 3] = hubs[hubIdx].x + (Math.random() - 0.5) * 1.2;
      particleTargets[i * 3 + 1] = hubs[hubIdx].y + (Math.random() - 0.5) * 1.2;
      particleTargets[i * 3 + 2] = hubs[hubIdx].z + (Math.random() - 0.5) * 1.2;

      // Assign expanded outward target for State 5
      const expandDir = new THREE.Vector3(particleTargets[i*3], particleTargets[i*3+1], particleTargets[i*3+2]).normalize();
      expandedTargets[i * 3] = particleTargets[i * 3] + expandDir.x * 2.0;
      expandedTargets[i * 3 + 1] = particleTargets[i * 3 + 1] + expandDir.y * 2.0;
      expandedTargets[i * 3 + 2] = particleTargets[i * 3 + 2] + expandDir.z * 2.0;

      // Celebration target (explosion / starburst shape)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 3 + Math.random() * 2; // radius of burst
      celebrationTargets[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      celebrationTargets[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      celebrationTargets[i * 3 + 2] = r * Math.cos(phi);
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(particles, 3));
    
    // Base material
    const pMat = new THREE.PointsMaterial({
      color: 0x73f0a0,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const pSystem = new THREE.Points(pGeo, pMat);
    mainGroup.add(pSystem);

    // ─── Setup Lines ───
    const lineGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(6 * 3); // 6 lines between 4 hubs
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1fd16a, transparent: true, opacity: 0 });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    mainGroup.add(lineMesh);

    // Signal Particle (The Probe)
    const signalGeo = new THREE.BufferGeometry();
    signalGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
    const signalMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const signalMesh = new THREE.Points(signalGeo, signalMat);
    mainGroup.add(signalMesh);

    let currentPhase = 0;
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const loopTime = Date.now() % 25000;

      // Update active phase internally for smooth transitions
      if (loopTime < 3000) currentPhase = 1;
      else if (loopTime < 7000) currentPhase = 2;
      else if (loopTime < 12000) currentPhase = 3;
      else if (loopTime < 17000) currentPhase = 4;
      else if (loopTime < 21000) currentPhase = 5;
      else currentPhase = 6;

      mainGroup.rotation.y = t * 0.05;
      mainGroup.rotation.x = Math.sin(t * 0.2) * 0.1;

      const positions = pSystem.geometry.attributes.position.array as Float32Array;

      // Phase 1: Clustered in center -> Dissolve
      if (currentPhase === 1) {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += (0 - positions[i * 3]) * 0.1;
          positions[i * 3 + 1] += (0 - positions[i * 3 + 1]) * 0.1;
          positions[i * 3 + 2] += (0 - positions[i * 3 + 2]) * 0.1;
        }
        lineMat.opacity = Math.max(0, lineMat.opacity - 0.05);
        signalMat.opacity = Math.max(0, signalMat.opacity - 0.05);
        pMat.color.setHex(0x73f0a0);
      } 
      // Phase 2, 3, 4: Move to Hubs (Curriculum Map)
      else if (currentPhase >= 2 && currentPhase <= 4) {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += (particleTargets[i * 3] - positions[i * 3]) * 0.04;
          positions[i * 3 + 1] += (particleTargets[i * 3 + 1] - positions[i * 3 + 1]) * 0.04;
          positions[i * 3 + 2] += (particleTargets[i * 3 + 2] - positions[i * 3 + 2]) * 0.04;
        }
        lineMat.opacity = Math.min(0.2, lineMat.opacity + 0.01);
        pMat.color.setHex(0x73f0a0);
      }
      // Phase 5: Map Expansion (Gap Search)
      else if (currentPhase === 5) {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += (expandedTargets[i * 3] - positions[i * 3]) * 0.02;
          positions[i * 3 + 1] += (expandedTargets[i * 3 + 1] - positions[i * 3 + 1]) * 0.02;
          positions[i * 3 + 2] += (expandedTargets[i * 3 + 2] - positions[i * 3 + 2]) * 0.02;
        }
        lineMat.opacity = Math.max(0.05, lineMat.opacity - 0.005);
        pMat.color.setHex(0xf59e0b); // Amber for gap detected
      }
      // Phase 6: Celebration (Explosion / Shield formation)
      else if (currentPhase === 6) {
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += (celebrationTargets[i * 3] - positions[i * 3]) * 0.05;
          positions[i * 3 + 1] += (celebrationTargets[i * 3 + 1] - positions[i * 3 + 1]) * 0.05;
          positions[i * 3 + 2] += (celebrationTargets[i * 3 + 2] - positions[i * 3 + 2]) * 0.05;
        }
        lineMat.opacity = Math.max(0, lineMat.opacity - 0.02);
        
        // Fast rotation for celebration
        mainGroup.rotation.y += 0.03;
      }

      pSystem.geometry.attributes.position.needsUpdate = true;

      // Draw lines between hubs dynamically
      if (currentPhase < 6) {
        let idx = 0;
        for (let i = 0; i < 4; i++) {
          for (let j = i + 1; j < 4; j++) {
            linePos[idx++] = hubs[i].x; linePos[idx++] = hubs[i].y; linePos[idx++] = hubs[i].z;
            linePos[idx++] = hubs[j].x; linePos[idx++] = hubs[j].y; linePos[idx++] = hubs[j].z;
          }
        }
        lineMesh.geometry.attributes.position.needsUpdate = true;
      } else {
        // Clear lines in phase 6
        lineMat.opacity = 0;
      }

      // Signal Behavior (The active probe)
      if (currentPhase === 3) {
        signalMat.opacity = Math.min(1, signalMat.opacity + 0.05);
        // Pulse Hub 2 (Agentic AI)
        const pulse = Math.sin(t * 8) * 0.2;
        const signalPos = signalMesh.geometry.attributes.position.array as Float32Array;
        signalPos[0] = hubs[2].x;
        signalPos[1] = hubs[2].y;
        signalPos[2] = hubs[2].z;
        signalMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
        signalMesh.geometry.attributes.position.needsUpdate = true;
      } else if (currentPhase === 4) {
        // Move to Hub 0 (RAG & Vector DBs)
        const progress = Math.min(1, (loopTime - 12000) / 1000); // travel fast
        const signalPos = signalMesh.geometry.attributes.position.array as Float32Array;
        signalPos[0] += (hubs[0].x - signalPos[0]) * 0.1;
        signalPos[1] += (hubs[0].y - signalPos[1]) * 0.1;
        signalPos[2] += (hubs[0].z - signalPos[2]) * 0.1;
        
        const pulse = Math.sin(t * 12) * 0.3;
        signalMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
        signalMesh.geometry.attributes.position.needsUpdate = true;
      } else if (currentPhase === 5) {
        // Move to Hub 3 (MCP)
        const signalPos = signalMesh.geometry.attributes.position.array as Float32Array;
        signalPos[0] += (hubs[3].x - signalPos[0]) * 0.1;
        signalPos[1] += (hubs[3].y - signalPos[1]) * 0.1;
        signalPos[2] += (hubs[3].z - signalPos[2]) * 0.1;
        
        signalMat.color.setHex(0xf59e0b); // Amber signal
        signalMesh.geometry.attributes.position.needsUpdate = true;
      } else if (currentPhase === 6 || currentPhase === 1 || currentPhase === 2) {
        signalMat.opacity = Math.max(0, signalMat.opacity - 0.1);
        signalMat.color.setHex(0xffffff); // Reset
      }

      renderer.render(scene, camera);

      // Project Hub 3D coordinates to 2D for HTML overlays
      if (currentPhase >= 2 && frameId % 3 === 0) {
        const screenCoords = hubs.map(hub => {
          const vector = hub.clone();
          vector.applyMatrix4(mainGroup.matrixWorld);
          vector.project(camera);
          return {
            x: (vector.x * 0.5 + 0.5) * width,
            y: (-(vector.y * 0.5) + 0.5) * height,
          };
        });
        setNodePositions(screenCoords);
      }
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      pGeo.dispose();
      pMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      signalGeo.dispose();
      signalMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[600px] flex items-center justify-center pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      <AnimatePresence>
        {/* Phase 1: Cohort Data Ingestion */}
        {sequencePhase === 1 && (
          <motion.div
            key="profile-card"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
            transition={{ duration: 0.6 }}
            className="absolute z-10 flex flex-col items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="glass-card-green px-6 py-4 rounded-xl flex items-center gap-3">
              <span className="text-[#1FD16A]">📚</span>
              <div className="flex flex-col">
                <span className="text-sm font-pixel tracking-widest text-[#F5F7F4]">31-DAY AI COHORT</span>
                <span className="text-[10px] font-mono text-[#7E8B84]">Extracting Missions & Signals</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-[#1FD16A]/50 my-2" />
            <div className="bg-[#101813] border border-[#1FD16A]/30 px-3 py-1 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(31,209,106,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A] animate-pulse" />
              <span className="text-[10px] font-mono text-[#73F0A0]">MAPPING CURRICULUM</span>
            </div>
          </motion.div>
        )}

        {/* Phase 2+: Map Formation Labels */}
        {sequencePhase >= 2 && sequencePhase < 6 && nodePositions.length === 4 && (
          <motion.div
            key="node-labels"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-10"
          >
            {nodePositions.map((pos, idx) => (
              <div
                key={idx}
                className={`absolute text-[10px] font-mono text-[#73F0A0] bg-[#101813]/80 px-2 py-1 rounded border border-[#1FD16A]/20 backdrop-blur-md whitespace-nowrap transition-all duration-1000 ${sequencePhase === 5 ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -150%)",
                }}
              >
                {hubLabels[idx]}
                
                {/* Specific active label targeting Agentic AI during phase 3 */}
                {idx === 2 && sequencePhase === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#0A0A0A] border border-[rgba(31,209,106,0.3)] px-3 py-1.5 rounded text-[9px] text-[#D6E0D9] whitespace-nowrap flex items-center gap-1.5"
                  >
                    Module 4 <span className="text-[#1FD16A]">→</span> Day 22
                  </motion.div>
                )}

                {/* Signal fragment during phase 3 */}
                {idx === 2 && sequencePhase === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1FD16A]/10 border border-[#1FD16A] px-2 py-1 rounded text-[9px] text-[#1FD16A] whitespace-nowrap shadow-[0_0_10px_rgba(31,209,106,0.4)] transition-opacity duration-1000`}
                  >
                    Signal: 3 Attempts (Struggled)
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Phase 3: The Probe / Interview Question (Attached to Hub 2: Agentic AI) */}
        {sequencePhase === 3 && nodePositions.length === 4 && (
          <motion.div
            key="question-1"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="absolute z-40 w-[280px] glass-card-green p-4 rounded-xl shadow-2xl"
            style={{
              left: nodePositions[2].x,
              top: nodePositions[2].y,
              transform: "translate(-110%, -50%)"
            }}
          >
            <div className="text-[10px] font-mono text-[#73F0A0] mb-2 uppercase">Day 22 Probe</div>
            <p className="text-sm text-[#F5F7F4] leading-relaxed">
              &ldquo;I see you took three attempts to pass the Multi-Agent Orchestration module. Walk me through the race condition you hit.&rdquo;
            </p>
          </motion.div>
        )}

        {/* Phase 4: Adaptive Follow-up (Attached to Hub 0: RAG) */}
        {sequencePhase === 4 && nodePositions.length === 4 && (
          <motion.div
            key="question-2"
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="absolute z-40 w-[280px] glass-card-green p-4 rounded-xl border-[#1FD16A]/40 shadow-2xl"
            style={{
              left: nodePositions[0].x,
              top: nodePositions[0].y,
              transform: "translate(10%, -50%)"
            }}
          >
            <div className="text-[10px] font-mono text-[#1FD16A] mb-2 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1FD16A] animate-pulse" />
              Adaptive Reaction
            </div>
            <p className="text-sm text-[#F5F7F4] leading-relaxed">
              &ldquo;Exactly. Now, if one of those agents needed to invoke a vector database tool, how would you manage the state lock?&rdquo;
            </p>
          </motion.div>
        )}

        {/* Phase 5: Knowledge gap / Topic Shift (Attached to Hub 3: MCP) */}
        {sequencePhase === 5 && nodePositions.length === 4 && (
          <motion.div
            key="question-3"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute z-40 w-[280px] glass-card-green p-4 rounded-xl border-amber-500/40 shadow-2xl"
            style={{
              left: nodePositions[3].x,
              top: nodePositions[3].y,
              transform: "translate(-110%, -50%)"
            }}
          >
            <div className="text-[10px] font-mono text-amber-400 mb-2 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Skipped Topic Detected
            </div>
            <p className="text-sm text-[#F5F7F4] leading-relaxed">
              &ldquo;Candidate skipped Observability on Day 29. Pivoting to ask how they would monitor this MCP integration in production...&rdquo;
            </p>
          </motion.div>
        )}

        {/* Phase 6: Celebration / Interview Ready */}
        {sequencePhase === 6 && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="absolute z-50 flex flex-col items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-[#051109]/90 p-6 rounded-2xl border border-[#1FD16A]/50 shadow-[0_0_50px_rgba(31,209,106,0.3)] backdrop-blur-xl"
          >
            <div className="bg-[#1FD16A] text-[#051109] rounded-full p-4 mb-4 shadow-[0_0_40px_rgba(31,209,106,0.8)]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-3xl text-center font-pixel text-transparent bg-clip-text bg-gradient-to-r from-white to-[#73F0A0] tracking-wider drop-shadow-lg mb-2">
              INTERVIEW READY
            </h2>
            <div className="mt-2 flex gap-2 w-full justify-center">
              <span className="bg-[#101813] border border-[#1FD16A]/30 px-3 py-1 rounded-full text-[9px] font-mono text-[#73F0A0] whitespace-nowrap">
                Context Loaded
              </span>
              <span className="bg-[#101813] border border-[#1FD16A]/30 px-3 py-1 rounded-full text-[9px] font-mono text-[#73F0A0] whitespace-nowrap">
                Agent Calibrated
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

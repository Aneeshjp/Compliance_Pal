"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function HeroMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);

  useFrame(({ mouse, clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15 + mouse.x * 0.3;
      meshRef.current.rotation.x = t * 0.08 + mouse.y * 0.2;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.12 + mouse.x * 0.25;
      wireRef.current.rotation.x = t * 0.06 + mouse.y * 0.15;
      wireRef.current.scale.setScalar(1.02 + Math.sin(t * 0.8) * 0.03);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color="#7c6aff"
          metalness={0.5}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[2.1, 1]} />
        <meshBasicMaterial
          color="#2dd4bf"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

export default function DashboardHero() {
  return (
    <div className="w-full h-[260px] relative">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.4} color="#c4b5fd" />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#7c6aff" />
        <pointLight position={[-4, -3, 3]} intensity={0.6} color="#2dd4bf" />
        <pointLight position={[0, -5, -3]} intensity={0.3} color="#f472b6" />
        <HeroMesh />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f1729] pointer-events-none" />
    </div>
  );
}

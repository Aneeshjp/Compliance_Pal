"use client";

import { Canvas } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Environment, ContactShadows, Lightformer } from "@react-three/drei";

function AnimatedSphere() {
  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <Sphere args={[1, 64, 64]} scale={2} position={[2, 0.5, -1]}>
        <MeshDistortMaterial
          color="#a855f7"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
    </Float>
  );
}

function GlassSphere() {
  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere args={[1, 64, 64]} scale={1.4} position={[-2, -1, 1]}>
        <MeshDistortMaterial
          color="#14b8a6"
          attach="material"
          distort={0.5}
          speed={2.5}
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.9}
          thickness={1.5}
          ior={1.5}
        />
      </Sphere>
    </Float>
  );
}

function SmallAccentSphere() {
  return (
    <Float speed={3} rotationIntensity={2} floatIntensity={3}>
      <Sphere args={[0.5, 32, 32]} position={[0, 2, 2]}>
        <MeshDistortMaterial
          color="#ec4899"
          attach="material"
          distort={0.3}
          speed={3}
          roughness={0.2}
          metalness={0.9}
        />
      </Sphere>
    </Float>
  );
}

export default function HeroAbstract() {
  return (
    <div className="absolute inset-0 z-0 opacity-80 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={2} color="#ec4899" />
        <AnimatedSphere />
        <GlassSphere />
        <SmallAccentSphere />
        <Environment preset="city">
          <Lightformer intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
          <Lightformer rotation-y={Math.PI / 2} position={[10, 5, 0]} scale={[20, 1, 1]} />
        </Environment>
        <ContactShadows position={[0, -3, 0]} opacity={0.6} scale={20} blur={2.5} far={4} color="#6d5cff" />
      </Canvas>
    </div>
  );
}

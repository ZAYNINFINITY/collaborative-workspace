/**
 * AuthBackground.jsx
 *
 * Shared Three.js animated background used by Login and Signup.
 * Extracted into one component so only ONE WebGL canvas ever exists.
 * Two Canvas instances on Login → Signup navigation caused
 * "THREE.WebGLRenderer: Context Lost" on mobile / low-end GPUs.
 *
 * Usage:
 *   import AuthBackground from "../components/AuthBackground";
 *   <AuthBackground />   ← renders the full-screen canvas layer
 */

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float, Sphere, MeshDistortMaterial } from "@react-three/drei";

const Scene = () => {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.4;
  });

  return (
    <group ref={groupRef}>
      <Stars
        radius={100}
        depth={50}
        count={4000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.9}>
        {/* Wireframe octahedron — purple */}
        <mesh position={[7, 2, -12]}>
          <octahedronGeometry args={[2.2, 0]} />
          <meshBasicMaterial
            color="#9333ea"
            wireframe
            transparent
            opacity={0.13}
          />
        </mesh>

        {/* Wireframe icosahedron — cyan */}
        <mesh position={[-6, -2, -14]}>
          <icosahedronGeometry args={[2.8, 0]} />
          <meshBasicMaterial
            color="#00d9ff"
            wireframe
            transparent
            opacity={0.12}
          />
        </mesh>

        {/* Distorted sphere — indigo */}
        <Sphere args={[1.4, 32, 32]} position={[1, 4, -9]}>
          <MeshDistortMaterial
            color="#6366f1"
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.9}
            roughness={0.1}
            distort={0.35}
            speed={1.8}
            transparent
            opacity={0.28}
          />
        </Sphere>
      </Float>
    </group>
  );
};

const AuthBackground = () => (
  <div
    className="pointer-events-none absolute inset-0 z-0"
    aria-hidden="true"
  >
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      // Prevent context loss: preserve the drawing buffer and use
      // low-power GPU preference on mobile
      gl={{ preserveDrawingBuffer: false, powerPreference: "low-power" }}
      // Limit pixel ratio to 2 — prevents excessive GPU usage on retina screens
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.5} />
      <Scene />
    </Canvas>
  </div>
);

export default AuthBackground;

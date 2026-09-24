import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

interface AgentNodeProps {
  position: [number, number, number];
  rotationY: number;
  name: string;
  role: string;
  model: string;
  color: string;
}

function HolographicKnightAvatar({ position, rotationY, name, role, model, color }: AgentNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (headRef.current) {
      headRef.current.position.y = 1.1 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.03;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} ref={groupRef}>
      {/* Base Sitting Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[0.65, 0.72, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Seated Torso Wireframe */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 0.8, 12, 4, true]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.7} />
      </mesh>

      {/* Floating Holographic Head */}
      <mesh ref={headRef} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.85} />
      </mesh>

      {/* Individual Terminal Screen Facing Agent */}
      <mesh position={[0, 0.6, -0.75]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshBasicMaterial color={color} wireframe side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>

      {/* Agent Data Badge */}
      <group position={[0, 1.7, 0]} rotation={[0, -rotationY, 0]}>
        <Text fontSize={0.18} color={color} anchorX="center" anchorY="middle">
          {name.toUpperCase()}
        </Text>
        <Text position={[0, -0.18, 0]} fontSize={0.11} color="#94A3B8" anchorX="center" anchorY="middle">
          {`${role} • ${model}`}
        </Text>
      </group>
    </group>
  );
}

function HolographicRoundTable() {
  const mainRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (mainRingRef.current) {
      mainRingRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Outer Holographic Table Rim */}
      <mesh ref={mainRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0]}>
        <ringGeometry args={[2.8, 2.92, 64]} />
        <meshBasicMaterial color="#00F0FF" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>

      {/* Grid Floor */}
      <gridHelper args={[10, 20, "#00F0FF", "#0A1224"]} position={[0, -0.22, 0]} />

      {/* Center Curved Orchestrator Screen */}
      <mesh position={[0, 0.5, -0.2]}>
        <cylinderGeometry args={[1.4, 1.4, 1.0, 32, 1, true, -Math.PI / 3, (2 * Math.PI) / 3]} />
        <meshBasicMaterial color="#00F0FF" side={THREE.DoubleSide} wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export default function RoundTableCanvas() {
  const agents = [
    { name: 'Arthur', role: 'Orchestrator', model: 'Kimi K3', color: '#00F0FF', pos: [0, 0, -2.2], rot: 0 },
    { name: 'Lancelot', role: 'Lead Dev', model: 'MiMo V2.6', color: '#E5C158', pos: [2.0, 0, -0.8], rot: -Math.PI / 3 },
    { name: 'Tristan', role: 'Math/Physics', model: 'Tencent Hy4', color: '#00A8FF', pos: [1.6, 0, 1.5], rot: (-2 * Math.PI) / 3 },
    { name: 'Gawain', role: 'Frontend', model: 'Qwen Coder', color: '#00E676', pos: [-1.6, 0, 1.5], rot: (2 * Math.PI) / 3 },
    { name: 'Galahad', role: 'Security Gate', model: 'Bespoke Nimble', color: '#FF1744', pos: [-2.0, 0, -0.8], rot: Math.PI / 3 },
  ];

  return (
    <div className="w-full h-full min-h-[500px] bg-[#02040A] relative overflow-hidden rounded-xl">
      <div className="absolute top-4 left-4 z-10 font-mono text-xs text-cyan-400 tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        HOLOGRAPHIC VIEWPORT: KING ARTHUR'S ROUND TABLE
      </div>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 3.8, 5.8]} fov={50} />
        <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2.05} minDistance={2.5} maxDistance={10} />
        <ambientLight intensity={0.9} />
        <HolographicRoundTable />
        {agents.map((agent, index) => (
          <HolographicKnightAvatar
            key={index}
            position={agent.pos as [number, number, number]}
            rotationY={agent.rot}
            name={agent.name}
            role={agent.role}
            model={agent.model}
            color={agent.color}
          />
        ))}
      </Canvas>
    </div>
  );
}

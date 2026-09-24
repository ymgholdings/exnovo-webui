import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

interface AgentNode {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  color: string;
  hasSonar: boolean;
}

const AGENTS: AgentNode[] = [
  { id: 'arthur', name: 'ARTHUR', role: 'Orchestrator • Kimi K3', position: [0, 1.2, 0], color: '#00f0ff', hasSonar: true },
  { id: 'lancelot', name: 'LANCELOT', role: 'Lead Dev • MiMo V2.6', position: [2.5, 0.5, 1.2], color: '#ffd700', hasSonar: true },
  { id: 'tristan', name: 'TRISTAN', role: 'Mathematics • Tencent Hy4', position: [2.2, 0.5, -1.8], color: '#3b82f6', hasSonar: false },
  { id: 'gawain', name: 'GAWAIN', role: 'Frontend • Qwen Coder', position: [-2.2, 0.5, 1.8], color: '#10b981', hasSonar: true },
  { id: 'galahad', name: 'GALAHAD', role: 'Security Gate • Nimble', position: [-2.5, 0.5, -1.2], color: '#ef4444', hasSonar: true },
];

function HolographicNode({ node }: { node: AgentNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.5;
    }
    if (ringRef.current && node.hasSonar) {
      const scale = 1 + (Math.sin(t * 3) + 1) * 0.25;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 - (scale - 1);
    }
  });

  return (
    <group position={node.position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.35, 2]} />
        <meshBasicMaterial color={node.color} wireframe transparent opacity={0.85} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.15} />
      </mesh>

      {node.hasSonar && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function TableGrid() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[0.1, 3.2, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]}>
        <ringGeometry args={[3.15, 3.2, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      <gridHelper args={[20, 40, '#00f0ff', '#1e293b']} position={[0, -0.5, 0]} />
    </group>
  );
}

function ConnectionEdges() {
  const arthurPos = AGENTS[0].position;

  return (
    <group>
      {AGENTS.slice(1).map((agent) => {
        const points: [number, number, number][] = [
          arthurPos,
          [(arthurPos[0] + agent.position[0]) / 2, 0.8, (arthurPos[2] + agent.position[2]) / 2],
          agent.position
        ];
        return (
          <Line
            key={agent.id}
            points={points}
            color={agent.color}
            lineWidth={1.5}
            transparent
            opacity={0.6}
            dashed
            dashScale={5}
            dashSize={0.2}
            dashGap={0.1}
          />
        );
      })}
    </group>
  );
}

export function RoundTableCanvas() {
  return (
    <div className="w-full h-full min-h-[550px] relative bg-[#0B111E] rounded-xl overflow-hidden border border-cyan-500/20 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
      <div className="absolute top-4 left-4 z-10 text-xs font-mono text-cyan-400 tracking-wider flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded border border-cyan-500/30">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        HOLOGRAPHIC VIEWPORT: KING ARTHUR'S ROUND TABLE
      </div>

      <Canvas camera={{ position: [0, 4.5, 7.5], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#0B111E']} />
        <ambientLight intensity={0.5} />
        <TableGrid />
        <ConnectionEdges />
        {AGENTS.map((agent) => (
          <HolographicNode key={agent.id} node={agent} />
        ))}
        <OrbitControls enablePan={true} maxPolarAngle={Math.PI / 2.1} minDistance={3} maxDistance={15} />
      </Canvas>
    </div>
  );
}

export default RoundTableCanvas;

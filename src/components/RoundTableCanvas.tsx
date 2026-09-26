import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface AgentNode {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  color: string;
  hasSonar: boolean;
  codeSnippet: string[];
}

const AGENTS: AgentNode[] = [
  {
    id: 'arthur',
    name: 'ORCHESTRATOR ARTHUR',
    role: 'Orchestrator • Kimi K3',
    position: [0, 1.2, 0],
    color: '#00f0ff',
    hasSonar: true,
    codeSnippet: ['import orchestrator', 'def sync_agents():', '  return active_nodes']
  },
  {
    id: 'lancelot',
    name: 'SIR LANCELOT',
    role: 'Lead Dev • MiMo V2.6',
    position: [3.2, 0.4, 1.5],
    color: '#ffd700',
    hasSonar: true,
    codeSnippet: ['const build = vite()', 'await deploy(target)']
  },
  {
    id: 'tristan',
    name: 'SIR TRISTAN',
    role: 'Mathematics • Tencent Hy4',
    position: [2.8, 0.4, -2.2],
    color: '#3b82f6',
    hasSonar: false,
    codeSnippet: ['P(s) = ∫ f(p) dp', 'predictive_trend = true']
  },
  {
    id: 'gawain',
    name: 'SIR GAWAIN',
    role: 'Frontend • Qwen Coder',
    position: [-2.8, 0.4, 2.2],
    color: '#10b981',
    hasSonar: true,
    codeSnippet: ['<Canvas dpr={[1, 2]}>', '  <EffectComposer />']
  },
  {
    id: 'galahad',
    name: 'SIR GALAHAD',
    role: 'Security Gate • Nimble',
    position: [-3.2, 0.4, -1.5],
    color: '#ef4444',
    hasSonar: true,
    codeSnippet: ['verify_tokens()', 'gate_status = OPTIMAL']
  }
];

function HolographicAvatar({ node }: { node: AgentNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = node.position[1] + Math.sin(t * 1.5 + node.position[0]) * 0.08;
    }
    if (ringRef.current && node.hasSonar) {
      const scale = 1 + (Math.sin(t * 2.5) + 1) * 0.3;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - (scale - 1));
    }
  });

  return (
    <group position={node.position} ref={groupRef}>
      {/* Head Sphere Mesh */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={node.color} wireframe transparent opacity={0.9} />
      </mesh>

      {/* Torso Cone Mesh */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.15, 0.35, 0.8, 12, 4, true]} />
        <meshBasicMaterial color={node.color} wireframe transparent opacity={0.7} />
      </mesh>

      {/* Chair / Base Platform Ring */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.6, 32]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Sonar Pulsing Ring */}
      {node.hasSonar && (
        <mesh ref={ringRef} position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.65, 32]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating Holographic 3D Code Screen */}
      <Html position={[0, 1.25, 0]} center transform distanceFactor={8}>
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 p-2 rounded text-[10px] font-mono shadow-[0_0_15px_rgba(0,240,255,0.2)] pointer-events-none min-w-[140px]">
          <div className="text-[9px] font-bold tracking-wider mb-1" style={{ color: node.color }}>
            {node.name}
          </div>
          {node.codeSnippet.map((line, idx) => (
            <div key={idx} className="text-slate-300 leading-tight">
              {line}
            </div>
          ))}
        </div>
      </Html>
    </group>
  );
}

function RoundTableFloor() {
  return (
    <group>
      {/* Inner Holographic Table Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[3.8, 64]} />
        <meshBasicMaterial color="#0b172a" transparent opacity={0.85} />
      </mesh>

      {/* Table Outer Neon Border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[3.75, 3.85, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Secondary Accent Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[2.2, 2.24, 64]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Deep Cyberpunk Grid Floor */}
      <gridHelper args={[30, 60, '#00f0ff', '#1e293b']} position={[0, -0.8, 0]} />
    </group>
  );
}

function DataStreams() {
  const arthurPos = AGENTS[0].position;

  return (
    <group>
      {AGENTS.slice(1).map((agent) => {
        const midX = (arthurPos[0] + agent.position[0]) / 2;
        const midZ = (arthurPos[2] + agent.position[2]) / 2;
        const points: [number, number, number][] = [arthurPos, [midX, 1.1, midZ], agent.position];

        return (
          <Line
            key={agent.id}
            points={points}
            color={agent.color}
            lineWidth={2}
            transparent
            opacity={0.7}
            dashed
            dashScale={8}
            dashSize={0.3}
            gapSize={0.15}
          />
        );
      })}
    </group>
  );
}

export function RoundTableCanvas() {
  return (
    <div className="w-full h-full min-h-[600px] relative bg-[#070b14] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.12)]">
      <div className="absolute top-4 left-4 z-20 text-xs font-mono text-cyan-400 tracking-widest flex items-center gap-2 bg-slate-950/90 px-3.5 py-2 rounded-lg border border-cyan-500/40 shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        HERMES AGENTIC OS — KING ARTHUR'S ROUND TABLE
      </div>

      <Canvas camera={{ position: [0, 5.2, 8.5], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#070b14']} />
        <ambientLight intensity={0.6} />

        <RoundTableFloor />
        <DataStreams />
        {AGENTS.map((agent) => (
          <HolographicAvatar key={agent.id} node={agent} />
        ))}

        {/* Post-Processing Bloom for Sci-Fi Neon Glow */}
        <EffectComposer>
          <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>

        <OrbitControls enablePan={true} maxPolarAngle={Math.PI / 2.05} minDistance={4} maxDistance={18} />
      </Canvas>
    </div>
  );
}

export default RoundTableCanvas;

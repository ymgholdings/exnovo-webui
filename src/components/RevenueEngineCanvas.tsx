import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const BAR_DATA = [
  { month: 'Jan', val: 2.2, color: '#00f0ff' },
  { month: 'Feb', val: 3.1, color: '#00f0ff' },
  { month: 'Mar', val: 2.8, color: '#00f0ff' },
  { month: 'Apr', val: 4.2, color: '#00f0ff' },
  { month: 'May', val: 5.5, color: '#00f0ff' },
  { month: 'Jun', val: 6.8, color: '#ffd700' },
  { month: 'Jul', val: 8.4, color: '#ffd700' },
];

function BarPillar({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={position}>
      {/* Volumetric Glowing Pillar */}
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[0.45, height, 0.45]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.8} />
      </mesh>
      
      {/* Solid Inner Core */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.38, height, 0.38]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export function RevenueEngineCanvas() {
  return (
    <div className="w-full h-56 relative rounded-xl overflow-hidden border border-amber-500/20 bg-[#060a12]">
      <Canvas camera={{ position: [6, 6, 8], fov: 38 }}>
        <color attach="background" args={['#060a12']} />
        <ambientLight intensity={0.5} />
        
        {/* Isometric Grid Base */}
        <gridHelper args={[12, 24, '#ffd700', '#1e293b']} position={[0, 0, 0]} />
        
        {BAR_DATA.map((d, i) => (
          <BarPillar key={i} position={[(i - 3) * 0.85, 0, 0]} height={d.val} color={d.color} />
        ))}

        <EffectComposer>
          <Bloom intensity={1.2} luminanceThreshold={0.2} />
        </EffectComposer>
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}

export default RevenueEngineCanvas;

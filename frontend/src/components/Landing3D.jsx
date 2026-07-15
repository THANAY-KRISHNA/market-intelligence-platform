import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Line, Float, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ----------------- CONFIG & DATA -----------------
const EXCHANGES = [
  { name: 'NYSE', coords: [2.0, 1.2, 1.8], color: '#00f2fe' },
  { name: 'NASDAQ', coords: [1.8, 1.5, 1.5], color: '#a855f7' },
  { name: 'LSE (London)', coords: [0.2, 2.2, 2.0], color: '#ec4899' },
  { name: 'TSE (Tokyo)', coords: [-2.2, 0.8, -1.8], color: '#f43f5e' },
  { name: 'SGX (Singapore)', coords: [-2.5, -0.2, -1.5], color: '#10b981' },
  { name: 'BSE (Mumbai)', coords: [-1.2, 0.5, -2.5], color: '#facc15' }
];

const ORBIT_TICKERS = [
  { symbol: '$AAPL', logo: '🍎', color: '#ffffff', radius: 4.5, speed: 0.8 },
  { symbol: '$NVDA', logo: '💚', color: '#10b981', radius: 5.0, speed: 0.6 },
  { symbol: '$TSLA', logo: '⚡', color: '#00f2fe', radius: 5.5, speed: 0.5 },
  { symbol: '$MSFT', logo: '🪟', color: '#a855f7', radius: 6.0, speed: 0.4 },
  { symbol: '$AMZN', logo: '📦', color: '#f59e0b', radius: 6.5, speed: 0.3 }
];

// ----------------- ORBITING ASSETS & LOGOS -----------------
function OrbitingAssets() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    // Rotate each child ticker mesh independently
    groupRef.current.children.forEach((child, i) => {
      const config = ORBIT_TICKERS[i];
      if (!config) return;
      
      const angle = t * config.speed + i * 2.0;
      child.position.x = Math.cos(angle) * config.radius;
      child.position.z = Math.sin(angle) * config.radius;
      child.position.y = Math.sin(t + i) * 0.5; // Slight wave drift
    });
  });

  return (
    <group ref={groupRef}>
      {ORBIT_TICKERS.map((ticker, idx) => (
        <group key={idx}>
          {/* Glowing particle ring around the ticker */}
          <Html distanceFactor={8} center>
            <div className="flex items-center gap-1 bg-zinc-950/90 border border-white/10 px-2 py-1 rounded-full text-[9px] font-bold text-white whitespace-nowrap shadow-lg">
              <span>{ticker.logo}</span>
              <span className="font-mono" style={{ color: ticker.color }}>{ticker.symbol}</span>
            </div>
          </Html>
          {/* Subtle trail particle */}
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={ticker.color} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ----------------- DATA PIPELINE VISUALIZATION -----------------
function DataPipelineFlow() {
  const tweetGroup = useRef();
  const kafkaPackets = useRef();
  const sparkNode = useRef();
  const databaseGrid = useRef();
  const candlesticks = useRef();

  // Create static paths
  const pipelinePath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, 2, -2),  // Ingestion Source
      new THREE.Vector3(-3.5, 1.5, 0), // AI Brain Node
      new THREE.Vector3(0, 0, 0),      // Kafka Broker
      new THREE.Vector3(3.5, -1.5, 0), // Spark Engine
      new THREE.Vector3(6, -2, -2)     // Database target
    ]);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Inbound Tweets flying from left into the core
    if (tweetGroup.current) {
      tweetGroup.current.children.forEach((tweet, i) => {
        tweet.position.x += 0.08;
        if (tweet.position.x > -3.5) {
          tweet.position.x = -8.0; // Reset
          tweet.position.y = 1.5 + (Math.random() - 0.5) * 1.5;
        }
      });
    }

    // 2. Kafka Data packets moving along the pipeline path
    if (kafkaPackets.current) {
      kafkaPackets.current.children.forEach((packet, i) => {
        const offset = (t * 0.2 + i * 0.25) % 1.0;
        const pos = pipelinePath.getPointAt(offset);
        packet.position.copy(pos);
      });
    }

    // 3. Spark Spinning executors
    if (sparkNode.current) {
      sparkNode.current.rotation.y = t * 1.2;
      sparkNode.current.rotation.x = t * 0.5;
    }

    // 4. Database pulsing cubes
    if (databaseGrid.current) {
      databaseGrid.current.children.forEach((cube, i) => {
        cube.scale.setScalar(1.0 + Math.sin(t * 3 + i) * 0.08);
      });
    }

    // 5. Emerging Candlestick heights
    if (candlesticks.current) {
      candlesticks.current.children.forEach((candle, i) => {
        candle.scale.y = 1.0 + Math.sin(t * 2 + i) * 0.5;
      });
    }
  });

  return (
    <group>
      {/* Visual Pipeline Route Line */}
      <Line
        points={pipelinePath.getPoints(50)}
        color="#2563eb"
        lineWidth={1.5}
        transparent
        opacity={0.25}
      />

      {/* 1. Tweet streams entering core (represented as green/red floating cards) */}
      <group ref={tweetGroup}>
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={i} position={[-8 - i * 2.5, 1.5 + (Math.random() - 0.5) * 1.5, 1]}>
            <Html distanceFactor={8} center>
              <div className={`px-2 py-0.5 border text-[7px] font-bold rounded whitespace-nowrap ${i % 2 === 0 ? 'bg-emerald-950/90 border-emerald-500/20 text-emerald-400' : 'bg-rose-950/90 border-rose-500/20 text-rose-400'}`}>
                {i % 2 === 0 ? '📈 $NVDA breakout!' : '📉 $TSLA downgrades...'}
              </div>
            </Html>
            <mesh>
              <planeGeometry args={[0.4, 0.15]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#10b981' : '#f43f5e'} transparent opacity={0.1} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 2. Streaming Kafka Packets (Glow spheres traveling) */}
      <group ref={kafkaPackets}>
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={i}>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color="#3b82f6" blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh scale={[1.5, 1.5, 1.5]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. Spark Node Cluster (glowing multi-faceted node) */}
      <group position={[3.5, -1.5, 0]}>
        <mesh ref={sparkNode}>
          <octahedronGeometry args={[0.45, 0]} />
          <meshBasicMaterial color="#10b981" wireframe />
        </mesh>
        <mesh scale={[1.4, 1.4, 1.4]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.1} />
        </mesh>
        <Html distanceFactor={6} center>
          <span className="text-[7px] font-mono font-bold text-emerald-400 bg-zinc-950/95 border border-emerald-500/20 px-1.5 py-0.5 rounded whitespace-nowrap">
            ⚡ SPARK AGGREGATION
          </span>
        </Html>
      </group>

      {/* 4. Database Grid (Grid of glowing database nodes) */}
      <group ref={databaseGrid} position={[6, -2, -2]}>
        <group position={[-0.3, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshBasicMaterial color="#8b5cf6" wireframe />
          </mesh>
        </group>
        <group position={[0.3, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshBasicMaterial color="#8b5cf6" wireframe />
          </mesh>
        </group>
        <Html distanceFactor={6} center>
          <span className="text-[7px] font-mono font-bold text-purple-400 bg-zinc-950/95 border border-purple-500/20 px-1.5 py-0.5 rounded whitespace-nowrap">
            📦 RELATIONAL STORE
          </span>
        </Html>
      </group>

      {/* 5. Animated Candlestick Charts emerging from the ground */}
      <group ref={candlesticks} position={[0, -3.2, 1]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const isGreen = i % 2 === 0;
          return (
            <group key={i} position={[(i - 2.5) * 0.8, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.15, 1, 0.15]} />
                <meshBasicMaterial color={isGreen ? '#10b981' : '#f43f5e'} transparent opacity={0.3} />
              </mesh>
              {/* Wick line */}
              <Line
                points={[[0, -0.8, 0], [0, 0.8, 0]]}
                color={isGreen ? '#10b981' : '#f43f5e'}
                lineWidth={0.5}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ----------------- FLOATING 3D SIGNALS & TELEMETRY WIDGETS -----------------
function Floating3DWidgets() {
  return (
    <group>
      {/* Interactive BUY signal floating on the right */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5} position={[2.5, 2.2, 1]}>
        <Html distanceFactor={6} center>
          <div className="bg-zinc-950/95 border border-emerald-500/20 p-3 rounded-lg shadow-xl shadow-emerald-500/5 text-center min-w-[110px] whitespace-nowrap backdrop-blur-md">
            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Real-time Signal</span>
            <span className="text-emerald-400 font-extrabold text-sm block tracking-wide mt-0.5 animate-pulse">🟢 BUY $NVDA</span>
            <span className="text-[8px] font-mono text-zinc-400">Confidence: 96%</span>
          </div>
        </Html>
      </Float>

      {/* Interactive SELL signal floating on the left */}
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6} position={[-2.8, -1.8, 1.5]}>
        <Html distanceFactor={6} center>
          <div className="bg-zinc-950/95 border border-rose-500/20 p-3 rounded-lg shadow-xl shadow-rose-500/5 text-center min-w-[110px] whitespace-nowrap backdrop-blur-md">
            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Real-time Signal</span>
            <span className="text-rose-400 font-extrabold text-sm block tracking-wide mt-0.5">🔴 SELL $TSLA</span>
            <span className="text-[8px] font-mono text-zinc-400">Confidence: 85%</span>
          </div>
        </Html>
      </Float>
    </group>
  );
}

// ----------------- DIGITAL GLOBAL EXCHANGE GLOBE -----------------
function ExchangeGlobe({ chapter }) {
  const globeRef = useRef();

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
      globeRef.current.rotation.x += 0.0003;
    }
  });

  return (
    <group ref={globeRef}>
      {/* High-res Grid Earth Globe */}
      <mesh>
        <sphereGeometry args={[2.5, 36, 36]} />
        <meshBasicMaterial 
          color="#1e3a8a" 
          wireframe 
          transparent 
          opacity={chapter >= 8 ? 0.03 : 0.08} 
        />
      </mesh>

      {/* Global Exchange pulsing markers */}
      {EXCHANGES.map((ex, i) => (
        <group key={i} position={ex.coords}>
          <mesh>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color={ex.color} />
          </mesh>
          <mesh scale={[1.5, 1.5, 1.5]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial 
              color={ex.color} 
              transparent 
              opacity={0.12} 
              blending={THREE.AdditiveBlending} 
            />
          </mesh>
        </group>
      ))}

      {/* Dynamic bezier connect routes */}
      {EXCHANGES.map((ex, i) => {
        const nextEx = EXCHANGES[(i + 1) % EXCHANGES.length];
        return (
          <Line
            key={i}
            points={[ex.coords, nextEx.coords]}
            color={ex.color}
            lineWidth={0.8}
            dashed
            dashScale={5}
            dashSize={0.4}
            transparent
            opacity={0.25}
          />
        );
      })}
    </group>
  );
}

// ----------------- CAMERA CHOREOGRAPHY RIG -----------------
function CameraRig({ chapter }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 7.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    switch (chapter) {
      case 1: // Hero Overview (Pan out to show all flows)
        targetPos.current.set(0, 0, 7.2);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 2: // The Problem (Social tweets focus)
        targetPos.current.set(-4.0, 1.5, 3.5);
        targetLookAt.current.set(-6, 2, -2);
        break;
      case 3: // Kafka Ingestion
        targetPos.current.set(-1.0, 0.5, 3.0);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 4: // Spark workers
        targetPos.current.set(2.2, -1.0, 3.2);
        targetLookAt.current.set(3.5, -1.5, 0);
        break;
      case 5: // AI Sentiment nodes
        targetPos.current.set(-1.5, 1.0, 3.0);
        targetLookAt.current.set(-3.5, 1.5, 0);
        break;
      case 6: // Correlation graph
        targetPos.current.set(2.0, 1.5, 3.5);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 7: // Signals BUY/SELL
        targetPos.current.set(1.5, 1.2, 2.5);
        targetLookAt.current.set(2.5, 2.2, 1);
        break;
      default: // Terminal Dashboard background flat mode
        targetPos.current.set(0, 0, 12.0);
        targetLookAt.current.set(0, 0, 0);
        break;
    }
  }, [chapter]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.05);
    
    const currentLookAt = new THREE.Vector3(0, 0, 0);
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(5).add(camera.position);
    currentLookAt.lerp(targetLookAt.current, 0.05);
    camera.lookAt(currentLookAt);
  });

  return null;
}

// ----------------- MASTER CANVAS BACKDROP -----------------
export default function Landing3D({ chapter }) {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 bg-[#030303] overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 7.2], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={['#030303']} />
        
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.8} color="#2563eb" />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#10b981" />
        
        {/* Particle System Starfield */}
        <Stars radius={120} depth={50} count={2000} factor={6} saturation={0.5} fade speed={1.5} />
        {chapter === 5 && <Sparkles count={100} scale={4} size={2} speed={1.0} color="#a78bfa" />}
        
        {/* Immersive Financial Assets */}
        <ExchangeGlobe chapter={chapter} />
        <OrbitingAssets />
        <DataPipelineFlow />
        <Floating3DWidgets />
        
        {/* Camera management */}
        <CameraRig chapter={chapter} />
      </Canvas>
      
      {/* Dark gradient overlay layers */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80"></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#030303]/50 via-transparent to-[#030303]/50"></div>
    </div>
  );
}

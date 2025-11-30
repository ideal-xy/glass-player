// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Globe, Circle, Activity, Zap, Command, ListMusic, X, Trash2, Music, Aperture, Layers, Dna } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- 1. 核心：Three.js 3D 粒子引擎 (修复版) ---
// const ThreeVisualizer = ({ audioRef, isPlaying, currentShapeName }) => {
//   const mountRef = useRef(null);
//   const [engineState, setEngineState] = useState('initializing'); // initializing, ready, error
//   const analyserRef = useRef(null);
//   const dataArrayRef = useRef(null);
//   const sourceRef = useRef(null);
//   const audioContextRef = useRef(null);
  
//   // 保持引用，避免闭包陷阱
//   const particleSystemRef = useRef(null);
//   const geometryRef = useRef(null);
//   const materialRef = useRef(null);
//   const targetPositionsRef = useRef(null);
//   const isTransitioningRef = useRef(false);
//   const transitionProgressRef = useRef(0);
  
//   const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, lastMove: Date.now() });
//   const autoCruiseTimeRef = useRef(0);

//   // --- A. 稳健的动态脚本加载器 ---
//   useEffect(() => {
//     const loadScripts = async () => {
//       // 如果全局已有，直接复用
//       if (window.THREE && window.THREE.EffectComposer && window.THREE.UnrealBloomPass) {
//         setEngineState('ready');
//         return;
//       }

//       // 辅助函数：加载单个脚本
//       const loadScript = (src) => {
//         return new Promise((resolve, reject) => {
//           // 检查是否已存在该脚本标签
//           let script = document.querySelector(`script[src="${src}"]`);
//           if (script) {
//             if (script.dataset.loaded === 'true') {
//               resolve();
//             } else {
//               // 如果正在加载，添加监听器
//               script.addEventListener('load', () => resolve());
//               script.addEventListener('error', () => reject(new Error(`Script load error: ${src}`)));
//             }
//             return;
//           }

//           script = document.createElement('script');
//           script.src = src;
//           script.async = false; // 关键：禁用异步，强制按顺序执行
//           script.dataset.loaded = 'false';
          
//           script.onload = () => {
//             script.dataset.loaded = 'true';
//             resolve();
//           };
//           script.onerror = () => reject(new Error(`Failed to load ${src}`));
          
//           document.head.appendChild(script);
//         });
//       };

//       try {
//         // 1. 核心库
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');
        
//         // 2. 后期处理依赖 (严格顺序)
//         // CopyShader 是 EffectComposer 的基础
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js');
//         // LuminosityHighPassShader 是 UnrealBloomPass 的基础
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js');
//         // 核心合成器
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js');
//         // RenderPass 负责渲染基础场景
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js');
//         // ShaderPass 负责处理着色器
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js');
//         // 最终的辉光滤镜
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js');

//         // 双重检查确保构造函数存在
//         if (window.THREE && window.THREE.EffectComposer && window.THREE.RenderPass) {
//             setEngineState('ready');
//         } else {
//             throw new Error("Three.js classes not found after loading.");
//         }
//       } catch (err) {
//         console.error("3D Engine Init Failed:", err);
//         setEngineState('error');
//       }
//     };

//     loadScripts();
//   }, []);

//   // 监听形状切换
//   useEffect(() => {
//     if(engineState === 'ready' && particleSystemRef.current) {
//         transformShape(currentShapeName);
//     }
//   }, [currentShapeName, engineState]);

//   // --- B. 数学形态计算 ---
//   const calculateShapePositions = (shapeName, count) => {
//       const positions = new Float32Array(count * 3);
      
//       if (shapeName === 'mandelbulb') {
//           // Mandelbulb 简化版 (点云)
//           const dim = 1200;
//           for(let i=0; i<count; i++) {
//               let found = false;
//               let iter = 0;
//               while(!found && iter < 10) {
//                   const r = Math.random() * dim;
//                   const theta = Math.random() * Math.PI;
//                   const phi = Math.random() * Math.PI * 2;
//                   const dr = Math.pow(r/dim, 8) * dim; 
//                   const distortion = Math.sin(theta*8) * Math.cos(phi*8);
//                   const finalR = (dim * 0.4) + distortion * 100;

//                   positions[i*3] = finalR * Math.sin(theta) * Math.cos(phi);
//                   positions[i*3+1] = finalR * Math.sin(theta) * Math.sin(phi);
//                   positions[i*3+2] = finalR * Math.cos(theta);
//                   found = true; 
//                   iter++;
//               }
//           }
//       } else if (shapeName === 'dna') {
//           // DNA 双螺旋
//           const radius = 300;
//           const height = 2000;
//           const turns = 10;
//           for(let i=0; i<count; i++) {
//               const p = i / count;
//               const angle = p * Math.PI * 2 * turns;
//               const y = p * height - height/2;
              
//               const isChainA = Math.random() > 0.5;
//               const offset = isChainA ? 0 : Math.PI;
//               const isLink = Math.random() < 0.1;
              
//               if (isLink) {
//                   const linkProg = Math.random();
//                   const x1 = Math.cos(angle) * radius;
//                   const z1 = Math.sin(angle) * radius;
//                   const x2 = Math.cos(angle + Math.PI) * radius;
//                   const z2 = Math.sin(angle + Math.PI) * radius;
                  
//                   positions[i*3] = x1 + (x2-x1)*linkProg;
//                   positions[i*3+1] = y;
//                   positions[i*3+2] = z1 + (z2-z1)*linkProg;
//               } else {
//                   const rRandom = radius + (Math.random()-0.5) * 60;
//                   positions[i*3] = Math.cos(angle + offset) * rRandom;
//                   positions[i*3+1] = y + (Math.random()-0.5) * 20;
//                   positions[i*3+2] = Math.sin(angle + offset) * rRandom;
//               }
//           }
//       } else if (shapeName === 'lorenz') {
//           // 洛伦兹吸引子
//           let x = 0.1, y = 0, z = 0;
//           const dt = 0.004;
//           const sigma = 10, rho = 28, beta = 8/3;
//           const scale = 40; 
//           for (let i = 0; i < count; i++) {
//               let dx = sigma * (y - x);
//               let dy = x * (rho - z) - y;
//               let dz = x * y - beta * z;
//               x += dx * dt;
//               y += dy * dt;
//               z += dz * dt;
//               const spread = 5.0; 
//               positions[i*3] = x * scale + (Math.random() - 0.5) * spread;
//               positions[i*3+1] = y * scale + (Math.random() - 0.5) * spread;
//               positions[i*3+2] = (z - 25) * scale + (Math.random() - 0.5) * spread;
//           }
//       } else if (shapeName === 'mobius') {
//           // 莫比乌斯带
//           for (let i = 0; i < count; i++) {
//               const t = (i / count) * Math.PI * 14; 
//               const width = (Math.random() - 0.5) * 400; 
//               const radius = 700; 
//               const x = (radius + width * Math.cos(t/2)) * Math.cos(t);
//               const y = (radius + width * Math.cos(t/2)) * Math.sin(t);
//               const z = width * Math.sin(t/2);
//               positions[i*3] = x;
//               positions[i*3+1] = y;
//               positions[i*3+2] = z;
//           }
//       } else if (shapeName === 'torus') {
//           // 环面 (甜甜圈)
//           const R = 600; 
//           const r = 250; 
//           for (let i = 0; i < count; i++) {
//               const u = Math.random() * Math.PI * 2;
//               const v = Math.random() * Math.PI * 2;
//               positions[i*3] = (R + r * Math.cos(v)) * Math.cos(u);
//               positions[i*3+1] = (R + r * Math.cos(v)) * Math.sin(u);
//               positions[i*3+2] = r * Math.sin(v);
//           }
//       } else { 
//           // 默认: 星系 (Galaxy)
//           const arms = 5;
//           const armWidth = 1.5;
//           for (let i = 0; i < count; i++) {
//               const spin = i / count * arms * Math.PI * 2;
//               const distance = (i / count) * 1800; 
//               const randomOffset = (Math.random() - 0.5) * distance * armWidth;
//               positions[i*3] = (distance + randomOffset) * Math.cos(spin + distance * 0.005);
//               positions[i*3+1] = (Math.random() - 0.5) * (500 - distance * 0.15); 
//               positions[i*3+2] = (distance + randomOffset) * Math.sin(spin + distance * 0.005);
//           }
//       }
//       return positions;
//   };

//   const transformShape = (shapeName) => {
//       if (!targetPositionsRef.current) return;
//       const count = geometryRef.current.attributes.position.count;
//       const newPos = calculateShapePositions(shapeName, count);
//       targetPositionsRef.current.set(newPos);
//       isTransitioningRef.current = true;
//       transitionProgressRef.current = 0;
//   };

//   // --- C. 场景渲染循环 ---
//   useEffect(() => {
//     if (engineState !== 'ready' || !mountRef.current) return;

//     const THREE = window.THREE;
//     const width = window.innerWidth;
//     const height = window.innerHeight;

//     // 1. 场景
//     const scene = new THREE.Scene();
//     scene.fog = new THREE.FogExp2(0x000000, 0.0002);

//     const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 6000);
//     camera.position.z = 1800;

//     const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
//     renderer.setSize(width, height);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以优化性能
//     renderer.toneMapping = THREE.ReinhardToneMapping;
    
//     // 清理并挂载
//     mountRef.current.innerHTML = '';
//     mountRef.current.appendChild(renderer.domElement);

//     // 2. 后期处理 (Bloom)
//     // 确保所有 Pass 类都已存在
//     if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) {
//         console.error("Post-processing modules missing");
//         return;
//     }

//     const renderScene = new THREE.RenderPass(scene, camera);
//     const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
//     bloomPass.threshold = 0.1;
//     bloomPass.strength = 1.8;
//     bloomPass.radius = 0.5;

//     const composer = new THREE.EffectComposer(renderer);
//     composer.addPass(renderScene);
//     composer.addPass(bloomPass);

//     // 3. 粒子系统
//     const particleCount = 40000;
//     const geometry = new THREE.BufferGeometry();
//     geometryRef.current = geometry;

//     const initialPos = calculateShapePositions('galaxy', particleCount);
//     geometry.setAttribute('position', new THREE.BufferAttribute(initialPos, 3));
//     targetPositionsRef.current = new Float32Array(initialPos);

//     const colors = new Float32Array(particleCount * 3);
//     const sizes = new Float32Array(particleCount);
    
//     // 颜色配置 (Neon Palette)
//     const color1 = new THREE.Color(0x00FFFF); // Cyan
//     const color2 = new THREE.Color(0xFF3366); // Neon Pink
//     const color3 = new THREE.Color(0xFFD700); // Gold

//     for (let i = 0; i < particleCount; i++) {
//         const r = Math.random();
//         let c;
//         if (r < 0.2) c = color3;
//         else c = color1.clone().lerp(color2, Math.random());
//         c.multiplyScalar(2.0); 

//         colors[i * 3] = c.r;
//         colors[i * 3 + 1] = c.g;
//         colors[i * 3 + 2] = c.b;
//         sizes[i] = Math.random() * 2;
//     }
//     geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
//     geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

//     const material = new THREE.PointsMaterial({
//       size: 6,
//       vertexColors: true,
//       map: createGlowTexture(THREE),
//       transparent: true,
//       opacity: 1.0,
//       blending: THREE.AdditiveBlending,
//       depthWrite: false,
//       sizeAttenuation: true
//     });
//     materialRef.current = material;

//     const particleSystem = new THREE.Points(geometry, material);
//     particleSystemRef.current = particleSystem;
//     scene.add(particleSystem);

//     // 4. 交互
//     const handleMouseMove = (event) => {
//         const windowHalfX = window.innerWidth / 2;
//         const windowHalfY = window.innerHeight / 2;
//         mouseRef.current.x = (event.clientX - windowHalfX) * 1.5;
//         mouseRef.current.y = (event.clientY - windowHalfY) * 1.5;
//         mouseRef.current.lastMove = Date.now();
//     };
//     document.addEventListener('mousemove', handleMouseMove);

//     // 5. 动画循环
//     let animationFrameId;
//     const animate = () => {
//         animationFrameId = requestAnimationFrame(animate);

//         let audioData = 0;
//         let highFreq = 0;
//         if (analyserRef.current && isPlaying) {
//             const bufferLength = analyserRef.current.frequencyBinCount;
//             if (!dataArrayRef.current) dataArrayRef.current = new Uint8Array(bufferLength);
//             analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
//             let sum = 0;
//             for(let i=0; i<30; i++) sum += dataArrayRef.current[i];
//             audioData = sum / 30;

//             let highSum = 0;
//             for(let i=100; i<200; i++) highSum += dataArrayRef.current[i];
//             highFreq = highSum / 100;
//         }

//         if (isTransitioningRef.current && targetPositionsRef.current) {
//             transitionProgressRef.current += 0.015;
//             if (transitionProgressRef.current >= 1) {
//                 transitionProgressRef.current = 1;
//                 isTransitioningRef.current = false;
//             }
//             const positions = geometry.attributes.position.array;
//             const targets = targetPositionsRef.current;
//             for (let i = 0; i < positions.length; i++) {
//                 positions[i] += (targets[i] - positions[i]) * 0.08;
//             }
//             geometry.attributes.position.needsUpdate = true;
//         }

//         // Bloom Pulse
//         bloomPass.strength = 1.2 + (audioData / 255) * 1.5;
//         bloomPass.radius = 0.4 + (highFreq / 255) * 0.2;

//         const pulse = 1 + (audioData / 255) * 0.5;
//         particleSystem.scale.setScalar(pulse);
//         particleSystem.rotation.y += 0.002;

//         // Auto Cruise
//         const now = Date.now();
//         const timeIdle = now - mouseRef.current.lastMove;
        
//         if (timeIdle > 3000) {
//             autoCruiseTimeRef.current += 0.0005;
//             const t = autoCruiseTimeRef.current;
//             const dist = 1800 + Math.sin(t * 2) * 500;
//             const cx = Math.sin(t) * dist;
//             const cz = Math.cos(t) * dist;
//             const cy = Math.sin(t * 0.5) * 800;
//             camera.position.x += (cx - camera.position.x) * 0.02;
//             camera.position.y += (cy - camera.position.y) * 0.02;
//             camera.position.z += (cz - camera.position.z) * 0.02;
//             camera.lookAt(0, 0, 0);
//         } else {
//             autoCruiseTimeRef.current = 0;
//             camera.position.x += (mouseRef.current.x - camera.position.x) * 0.05;
//             camera.position.y += (-mouseRef.current.y - camera.position.y) * 0.05;
//             camera.position.z += (1800 - camera.position.z) * 0.05;
//             camera.lookAt(scene.position);
//         }

//         composer.render();
//     };

//     animate();

//     const handleResize = () => {
//         const w = window.innerWidth;
//         const h = window.innerHeight;
//         camera.aspect = w / h;
//         camera.updateProjectionMatrix();
//         renderer.setSize(w, h);
//         composer.setSize(w, h);
//     };
//     window.addEventListener('resize', handleResize);

//     return () => {
//         document.removeEventListener('mousemove', handleMouseMove);
//         window.removeEventListener('resize', handleResize);
//         cancelAnimationFrame(animationFrameId);
//         if (mountRef.current) mountRef.current.innerHTML = '';
//         // 资源释放
//         geometry.dispose();
//         material.dispose();
//         renderer.dispose();
//     };
//   }, [engineState]);

//   // Audio Context Logic
//   useEffect(() => {
//     if (!audioRef.current) return;
//     if (!audioContextRef.current) {
//         const AudioContext = window.AudioContext || window.webkitAudioContext;
//         audioContextRef.current = new AudioContext();
//         analyserRef.current = audioContextRef.current.createAnalyser();
//         analyserRef.current.fftSize = 512;
//         try {
//             sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
//             sourceRef.current.connect(analyserRef.current);
//             analyserRef.current.connect(audioContextRef.current.destination);
//         } catch(e) {}
//     }
//     if (isPlaying && audioContextRef.current.state === 'suspended') {
//         audioContextRef.current.resume();
//     }
//   }, [audioRef, isPlaying]);

//   return (
//     <div className="fixed inset-0 z-0 bg-black">
//         <div ref={mountRef} className="w-full h-full" />
//         {engineState === 'initializing' && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6CB8FF] font-mono gap-4 pointer-events-none">
//                 <div className="w-8 h-8 border-2 border-[#FF3366] border-t-transparent rounded-full animate-spin"></div>
//                 <div className="tracking-widest animate-pulse">INITIALIZING CORE...</div>
//             </div>
//         )}
//         {engineState === 'error' && (
//             <div className="absolute inset-0 flex items-center justify-center text-red-500 font-mono pointer-events-none">
//                 3D ENGINE FAILURE. CHECK NETWORK OR NPM INSTALL THREE.
//             </div>
//         )}
//     </div>
//   );
// };

// // 辅助：生成发光纹理
// function createGlowTexture(THREE) {
//     const canvas = document.createElement('canvas');
//     canvas.width = 64;
//     canvas.height = 64;
//     const context = canvas.getContext('2d');
//     const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
//     gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
//     gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)'); 
//     gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
//     context.fillStyle = gradient;
//     context.fillRect(0, 0, 64, 64);
//     const texture = new THREE.Texture(canvas);
//     texture.needsUpdate = true;
//     return texture;
// }

// const DEMO_TRACKS = [
//   { id: 'demo-1', title: "Cosmic Algorithms", artist: "The Math Engine", audioSrc: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg" },
//   { id: 'demo-2', title: "Lorenz Pulse", artist: "Chaos Theory", audioSrc: "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/ateapill.ogg" }
// ];

// // --- 侧边栏组件 ---
// const PlaylistSidebar = ({ tracks, currentTrackIndex, onPlay, onDelete, onClose }) => {
//     return (
//         <motion.div 
//             initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
//             className="fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
//         >
//             <div className="flex justify-between items-center mb-8">
//                 <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
//                     <ListMusic size={20} className="text-[#6CB8FF]" /> PLAYLIST
//                 </h2>
//                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
//                     <X size={20} />
//                 </button>
//             </div>
//             <div className="space-y-3">
//                 {tracks.map((track, index) => (
//                     <div 
//                         key={track.id} 
//                         className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between
//                             ${index === currentTrackIndex ? 'bg-white/10 border-[#6CB8FF]/50 shadow-[0_0_15px_rgba(108,184,255,0.2)]' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20'}`}
//                         onClick={() => onPlay(index)}
//                     >
//                         <div className="flex items-center gap-3 overflow-hidden">
//                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === currentTrackIndex ? 'bg-[#6CB8FF] text-black' : 'bg-white/10 text-white/30'}`}>
//                                 {index === currentTrackIndex ? <Activity size={14} className="animate-pulse"/> : <Music size={14} />}
//                             </div>
//                             <div className="flex flex-col overflow-hidden">
//                                 <span className={`text-sm font-bold truncate ${index === currentTrackIndex ? 'text-white' : 'text-white/70'}`}>{track.title}</span>
//                                 <span className="text-xs text-white/40 truncate">{track.artist}</span>
//                             </div>
//                         </div>
//                         <button onClick={(e) => { e.stopPropagation(); onDelete(index); }} className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
//                             <Trash2 size={14} />
//                         </button>
//                     </div>
//                 ))}
//             </div>
//         </motion.div>
//     );
// };

// const VisualsSidebar = ({ currentShape, onSelect, onClose }) => {
//     const effects = [
//         { id: 'galaxy', label: 'GALAXY', icon: <Globe size={16}/>, desc: "Spiral galaxy structure" },
//         { id: 'lorenz', label: 'LORENZ ATTRACTOR', icon: <Activity size={16}/>, desc: "Chaos theory visualization" },
//         { id: 'mobius', label: 'MOBIUS STRIP', icon: <Zap size={16}/>, desc: "Non-orientable surface" },
//         { id: 'torus', label: 'TORUS KNOT', icon: <Circle size={16}/>, desc: "Geometric donut shape" },
//         { id: 'dna', label: 'DNA HELIX', icon: <Dna size={16}/>, desc: "Biological double helix" },
//         { id: 'mandelbulb', label: 'MANDELBULB', icon: <Layers size={16}/>, desc: "3D Fractal Structure" },
//     ];

//     return (
//         <motion.div 
//             initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
//             className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
//         >
//             <div className="flex justify-between items-center mb-8">
//                 <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
//                     <Aperture size={20} className="text-[#FF3366]" /> VISUALS
//                 </h2>
//                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
//                     <X size={20} />
//                 </button>
//             </div>
//             <div className="space-y-3">
//                 {effects.map((effect) => (
//                     <div 
//                         key={effect.id} 
//                         onClick={() => onSelect(effect.id)}
//                         className={`p-4 rounded-xl border transition-all cursor-pointer hover:bg-white/5 
//                             ${currentShape === effect.id ? 'bg-white/10 border-[#FF3366] text-white' : 'border-white/5 text-white/50'}`}
//                     >
//                         <div className="flex items-center gap-3 mb-1">
//                             {effect.icon}
//                             <span className="font-bold tracking-wider">{effect.label}</span>
//                         </div>
//                         <p className="text-xs opacity-50 ml-7">{effect.desc}</p>
//                     </div>
//                 ))}
//             </div>
//         </motion.div>
//     );
// };

// const DraggableProgressBar = ({ currentTime, duration, onSeekStart, onSeekEnd, onSeek }) => {
//   const progressBarRef = useRef(null);
//   const [isHovering, setIsHovering] = useState(false);
//   const calculateProgress = (e) => {
//       const rect = progressBarRef.current.getBoundingClientRect();
//       const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
//       return x / rect.width;
//   };
//   const handleMouseDown = (e) => {
//     onSeekStart();
//     const percentage = calculateProgress(e);
//     onSeek(percentage * duration);
//     const handleMouseMove = (moveEvent) => onSeek(calculateProgress(moveEvent) * duration);
//     const handleMouseUp = (upEvent) => {
//         onSeekEnd(calculateProgress(upEvent) * duration);
//         document.removeEventListener('mousemove', handleMouseMove);
//         document.removeEventListener('mouseup', handleMouseUp);
//     };
//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);
//   };
//   const progress = duration ? (currentTime / duration) * 100 : 0;
//   return (
//     <div className="absolute top-0 left-6 right-6 h-6 -mt-3 group/progress cursor-pointer z-50 flex items-center"
//       onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onMouseDown={handleMouseDown} ref={progressBarRef}>
//       <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm relative transition-all group-hover/progress:h-1.5">
//          <div className="h-full bg-gradient-to-r from-[#6CB8FF] to-[#FF3366] shadow-[0_0_15px_rgba(255,51,102,0.8)] relative" style={{ width: `${progress}%` }}>
//             <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-200 ${isHovering ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover/progress:scale-100 group-hover/progress:opacity-100'}`} />
//          </div>
//       </div>
//     </div>
//   );
// };

// const VolumeControl = ({ volume, onVolumeChange }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const sliderRef = useRef(null);
//   const handleVolumeDrag = (e) => {
//       e.stopPropagation(); 
//       if (!sliderRef.current) return;
//       const rect = sliderRef.current.getBoundingClientRect();
//       const y = Math.max(0, Math.min(rect.bottom - e.clientY, rect.height));
//       onVolumeChange(y / rect.height);
//   };
//   const handleMouseDown = (e) => {
//       handleVolumeDrag(e);
//       const handleMouseMove = (ev) => handleVolumeDrag(ev);
//       const handleMouseUp = () => {
//           document.removeEventListener('mousemove', handleMouseMove);
//           document.removeEventListener('mouseup', handleMouseUp);
//       };
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//   };
//   return (
//     <div className="relative flex items-center justify-center h-full w-10" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute bottom-full left-1/2 -translate-x-1/2 pb-6 z-50">
//              <div className="w-12 h-40 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-4 flex justify-center shadow-2xl">
//                 <div ref={sliderRef} className="relative w-2 h-full bg-white/20 rounded-full overflow-hidden cursor-pointer" onMouseDown={handleMouseDown}>
//                     <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#6CB8FF] to-[#FF3366] rounded-full transition-all duration-75" style={{ height: `${volume * 100}%` }} />
//                 </div>
//              </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="p-2 text-white/70 hover:text-white transition-colors">
//         {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
//       </button>
//     </div>
//   );
// };

// export default function AppleGlassPlayer() {
//   const [tracks, setTracks] = useState(DEMO_TRACKS);
//   const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [volume, setVolume] = useState(0.6);
//   const [isDragging, setIsDragging] = useState(false);
//   const [currentShape, setCurrentShape] = useState('galaxy');
//   const [showPlaylist, setShowPlaylist] = useState(false);
//   const [showVisuals, setShowVisuals] = useState(false);
  
//   const audioRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const currentTrack = tracks[currentTrackIndex];

//   useEffect(() => { if(audioRef.current) audioRef.current.volume = volume; }, [volume]);
  
//   useEffect(() => {
//     const audio = audioRef.current;
//     if (!audio) return;
//     const playAudio = async () => {
//       try {
//         if (isPlaying) await audio.play();
//         else audio.pause();
//       } catch (error) { console.warn("Playback error:", error); }
//     };
//     playAudio();
//   }, [isPlaying, currentTrackIndex]);

//   const togglePlay = () => setIsPlaying(!isPlaying);
//   const playNext = () => { setCurrentTrackIndex((prev) => (prev + 1) % tracks.length); setIsPlaying(true); };
//   const playPrev = () => { setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length); setIsPlaying(true); };

//   const handleTimeUpdate = () => { if (!isDragging && audioRef.current) setCurrentTime(audioRef.current.currentTime); };
//   const handleSeekStart = () => setIsDragging(true);
//   const handleSeek = (time) => setCurrentTime(time);
//   const handleSeekEnd = (time) => {
//     if (isFinite(time) && audioRef.current) audioRef.current.currentTime = time;
//     setIsDragging(false);
//     if (isPlaying) audioRef.current?.play().catch(console.warn);
//   };

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     e.target.value = '';
//     const fileUrl = URL.createObjectURL(file);
//     const newTrack = {
//       id: Date.now().toString(),
//       title: file.name.replace(/\.[^/.]+$/, ""),
//       artist: "Local Track",
//       audioSrc: fileUrl,
//     };
//     setTracks(prev => [...prev, newTrack]);
//     setShowPlaylist(true);
//   };

//   const deleteTrack = (index) => {
//       if (tracks.length <= 1) return;
//       const newTracks = tracks.filter((_, i) => i !== index);
//       setTracks(newTracks);
//       if (index === currentTrackIndex) {
//           setCurrentTrackIndex(0);
//           setIsPlaying(false);
//       } else if (index < currentTrackIndex) {
//           setCurrentTrackIndex(prev => prev - 1);
//       }
//   };

//   const formatTime = (time) => {
//     const min = Math.floor(time / 60);
//     const sec = Math.floor(time % 60);
//     return `${min}:${sec < 10 ? '0' : ''}${sec}`;
//   };

//   return (
//     <div className="relative w-full h-screen overflow-hidden font-sans text-white select-none bg-black">
//       <ThreeVisualizer 
//         audioRef={audioRef} 
//         isPlaying={isPlaying} 
//         currentShapeName={currentShape}
//       />

//       <div className="absolute top-0 left-0 right-0 h-16 z-40 flex justify-between items-center px-8 opacity-80 hover:opacity-100 transition-opacity">
//           <div className="flex items-center gap-2">
//             <Aperture size={18} className="text-[#FF3366]" />
//             <span className="text-sm font-bold tracking-[0.2em] text-[#6CB8FF]">HYPERSPACE OS</span>
//           </div>
//           <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors backdrop-blur-md border border-white/5 group">
//               <Upload size={14} className="text-white"/>
//               <span className="text-xs font-bold tracking-wider text-white">UPLOAD</span>
//               <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.m4b" className="hidden" onChange={handleFileUpload} />
//           </label>
//       </div>

//       <AnimatePresence>
//         {showPlaylist && (
//             <PlaylistSidebar 
//                 tracks={tracks} 
//                 currentTrackIndex={currentTrackIndex} 
//                 onPlay={(idx) => { setCurrentTrackIndex(idx); setIsPlaying(true); }} 
//                 onDelete={deleteTrack}
//                 onClose={() => setShowPlaylist(false)} 
//             />
//         )}
//         {showVisuals && (
//             <VisualsSidebar 
//                 currentShape={currentShape}
//                 onSelect={(shape) => { setCurrentShape(shape); }}
//                 onClose={() => setShowVisuals(false)}
//             />
//         )}
//       </AnimatePresence>

//       <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-4">
//         <div className="w-full max-w-[500px] h-[80px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center px-8 gap-4 relative group hover:bg-black/60 transition-colors">
//             <DraggableProgressBar currentTime={currentTime} duration={duration} onSeekStart={handleSeekStart} onSeekEnd={handleSeekEnd} onSeek={handleSeek} />
            
//             <div className="flex items-center gap-3 justify-start absolute left-8">
//                <button onClick={() => setShowVisuals(!showVisuals)} className={`p-2 hover:text-white transition-colors ${showVisuals ? 'text-[#FF3366]' : 'text-white/40'}`}>
//                    <Aperture size={20}/>
//                </button>
//             </div>

//             <div className="flex-1 flex justify-center items-center gap-6">
//                <button onClick={playPrev} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"><SkipBack size={24} /></button>
//                <motion.button 
//                  whileTap={{ scale: 0.9 }} onClick={togglePlay}
//                  className="w-12 h-12 bg-gradient-to-br from-[#6CB8FF] to-[#FF3366] rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,51,102,0.4)]"
//                >
//                  {isPlaying ? <Pause size={20} fill="black" className="text-black" /> : <Play size={20} fill="black" className="ml-1 text-black" />}
//                </motion.button>
//                <button onClick={playNext} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"><SkipForward size={24} /></button>
//             </div>

//             <div className="flex items-center gap-3 justify-end absolute right-8">
//                <button onClick={() => setShowPlaylist(!showPlaylist)} className={`p-2 hover:text-white transition-colors ${showPlaylist ? 'text-[#6CB8FF]' : 'text-white/40'}`}><ListMusic size={20}/></button>
//                <VolumeControl volume={volume} onVolumeChange={setVolume} />
//             </div>
//         </div>
//       </div>

//       <audio ref={audioRef} src={currentTrack.audioSrc} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={(e) => setDuration(e.target.duration)} onEnded={playNext} crossOrigin="anonymous" />
//     </div>
//   );
// }

// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Globe, Circle, Activity, Zap, Command, ListMusic, X, Trash2, Music, Aperture, Layers, Dna, Palette } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- 0. 配色方案定义 ---
// const COLOR_PALETTES = {
//   neon: { 
//     id: 'neon', 
//     name: 'NEON CYBER', 
//     desc: 'Classic Cyberpunk',
//     colors: [0x00FFFF, 0xFF3366, 0xFFD700], // 青, 粉, 金
//     bgGradient: 'from-[#00FFFF] to-[#FF3366]' 
//   },
//   gold: { 
//     id: 'gold', 
//     name: 'BLACK GOLD', 
//     desc: 'Luxury & Elegant',
//     colors: [0xFFD700, 0xBF953F, 0xFFFFFF], // 金, 暗金, 白
//     bgGradient: 'from-[#FFD700] to-[#BF953F]'
//   },
//   ice: { 
//     id: 'ice', 
//     name: 'GLACIER', 
//     desc: 'Cold & Clean',
//     colors: [0x00FFFF, 0x0080FF, 0xE0FFFF], // 青, 蓝, 淡蓝
//     bgGradient: 'from-[#00FFFF] to-[#0080FF]'
//   },
//   fire: { 
//     id: 'fire', 
//     name: 'INFERNO', 
//     desc: 'Hot & Intense',
//     colors: [0xFF4500, 0xFFA500, 0xFFD700], // 红橙, 橙, 黄
//     bgGradient: 'from-[#FF4500] to-[#FFA500]'
//   },
//   matrix: { 
//     id: 'matrix', 
//     name: 'THE MATRIX', 
//     desc: 'Digital Rain',
//     colors: [0x00FF00, 0x008800, 0xCCFFCC], // 亮绿, 深绿, 极淡绿
//     bgGradient: 'from-[#00FF00] to-[#003300]'
//   },
//   deep: { 
//     id: 'deep', 
//     name: 'DEEP SPACE', 
//     desc: 'Mysterious Violet',
//     colors: [0x8A2BE2, 0x4B0082, 0xFF00FF], // 紫罗兰, 靛蓝, 
//     bgGradient: 'from-[#8A2BE2] to-[#4B0082]'
//   }
// };

// // --- 1. 核心：Three.js 3D 粒子引擎 (修复版) ---
// const ThreeVisualizer = ({ audioRef, isPlaying, currentShapeName, currentPaletteId }) => {
//   const mountRef = useRef(null);
//   const [engineState, setEngineState] = useState('initializing');
//   const analyserRef = useRef(null);
//   const dataArrayRef = useRef(null);
//   const sourceRef = useRef(null);
//   const audioContextRef = useRef(null);
  
//   const particleSystemRef = useRef(null);
//   const geometryRef = useRef(null);
//   const materialRef = useRef(null);
//   const targetPositionsRef = useRef(null);
//   const isTransitioningRef = useRef(false);
//   const transitionProgressRef = useRef(0);
  
//   const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, lastMove: Date.now() });
//   const autoCruiseTimeRef = useRef(0);

//   // 动态加载 Three.js (稳健版)
//   useEffect(() => {
//     const loadEngine = async () => {
//       // 检查全局对象是否已完全就绪
//       if (window.THREE && window.THREE.EffectComposer && window.THREE.UnrealBloomPass) {
//         setEngineState('ready');
//         return;
//       }

//       // 辅助函数：加载单个脚本 (防竞争条件)
//       const loadScript = (src) => {
//         return new Promise((resolve, reject) => {
//           let script = document.querySelector(`script[src="${src}"]`);
          
//           if (script) {
//             // 如果脚本已存在
//             if (script.dataset.loaded === 'true') {
//               resolve(); // 已加载完成
//             } else {
//               // 正在加载中，添加监听器
//               const originalOnLoad = script.onload;
//               script.onload = () => {
//                 if (originalOnLoad) originalOnLoad();
//                 resolve();
//               };
//               const originalOnError = script.onerror;
//               script.onerror = (e) => {
//                 if (originalOnError) originalOnError(e);
//                 reject(new Error(`Script load error: ${src}`));
//               }
//             }
//             return;
//           }

//           // 创建新脚本
//           script = document.createElement('script');
//           script.src = src;
//           script.async = false; // 强制顺序
//           script.dataset.loaded = 'false';
          
//           script.onload = () => {
//             script.dataset.loaded = 'true';
//             resolve();
//           };
//           script.onerror = () => reject(new Error(`Failed to load ${src}`));
          
//           document.head.appendChild(script);
//         });
//       };

//       try {
//         // 使用 unpkg，版本 0.128.0
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js');
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js');
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js');
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js');
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js');
//         await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js');

//         // 双重检查构造函数
//         if (window.THREE && window.THREE.RenderPass && window.THREE.UnrealBloomPass) {
//             setEngineState('ready');
//         } else {
//             throw new Error("Three.js classes missing after load");
//         }
//       } catch (err) {
//         console.error("Three.js Load Error:", err);
//         setEngineState('error');
//       }
//     };

//     loadEngine();
//   }, []);

//   // 监听形状切换
//   useEffect(() => {
//     if(engineState === 'ready' && particleSystemRef.current) {
//         transformShape(currentShapeName);
//     }
//   }, [currentShapeName, engineState]);

//   // 监听颜色切换
//   useEffect(() => {
//     if (engineState === 'ready' && geometryRef.current) {
//       updateParticleColors(currentPaletteId);
//     }
//   }, [currentPaletteId, engineState]);

//   // 更新粒子颜色函数
//   const updateParticleColors = (paletteId) => {
//     const THREE = window.THREE;
//     const palette = COLOR_PALETTES[paletteId];
//     if (!palette || !geometryRef.current) return;

//     const count = geometryRef.current.attributes.position.count;
//     const colors = geometryRef.current.attributes.color.array;
    
//     const c1 = new THREE.Color(palette.colors[0]);
//     const c2 = new THREE.Color(palette.colors[1]);
//     const c3 = new THREE.Color(palette.colors[2]);

//     for (let i = 0; i < count; i++) {
//         const r = Math.random();
//         let c;
//         if (r < 0.2) c = c3; 
//         else c = c1.clone().lerp(c2, Math.random()); 
//         c.multiplyScalar(1.5);

//         colors[i * 3] = c.r;
//         colors[i * 3 + 1] = c.g;
//         colors[i * 3 + 2] = c.b;
//     }
//     geometryRef.current.attributes.color.needsUpdate = true;
//   };

//   // 数学形态计算
//   const calculateShapePositions = (shapeName, count) => {
//       const positions = new Float32Array(count * 3);
      
//       if (shapeName === 'mandelbulb') {
//           const dim = 1200;
//           for(let i=0; i<count; i++) {
//               let found = false;
//               let iter = 0;
//               while(!found && iter < 10) {
//                   const r = Math.random() * dim;
//                   const theta = Math.random() * Math.PI;
//                   const phi = Math.random() * Math.PI * 2;
//                   const distortion = Math.sin(theta*8) * Math.cos(phi*8);
//                   const finalR = (dim * 0.4) + distortion * 100;
//                   positions[i*3] = finalR * Math.sin(theta) * Math.cos(phi);
//                   positions[i*3+1] = finalR * Math.sin(theta) * Math.sin(phi);
//                   positions[i*3+2] = finalR * Math.cos(theta);
//                   found = true; 
//                   iter++;
//               }
//           }
//       } else if (shapeName === 'dna') {
//           const radius = 300;
//           const height = 2000;
//           const turns = 10;
//           for(let i=0; i<count; i++) {
//               const p = i / count;
//               const angle = p * Math.PI * 2 * turns;
//               const y = p * height - height/2;
//               const isChainA = Math.random() > 0.5;
//               const offset = isChainA ? 0 : Math.PI;
//               const isLink = Math.random() < 0.1;
//               if (isLink) {
//                   const linkProg = Math.random();
//                   const x1 = Math.cos(angle) * radius;
//                   const z1 = Math.sin(angle) * radius;
//                   const x2 = Math.cos(angle + Math.PI) * radius;
//                   const z2 = Math.sin(angle + Math.PI) * radius;
//                   positions[i*3] = x1 + (x2-x1)*linkProg;
//                   positions[i*3+1] = y;
//                   positions[i*3+2] = z1 + (z2-z1)*linkProg;
//               } else {
//                   const rRandom = radius + (Math.random()-0.5) * 60;
//                   positions[i*3] = Math.cos(angle + offset) * rRandom;
//                   positions[i*3+1] = y + (Math.random()-0.5) * 20;
//                   positions[i*3+2] = Math.sin(angle + offset) * rRandom;
//               }
//           }
//       } else if (shapeName === 'lorenz') {
//           let x = 0.1, y = 0, z = 0;
//           const dt = 0.004;
//           const sigma = 10, rho = 28, beta = 8/3;
//           const scale = 45; 
//           for (let i = 0; i < count; i++) {
//               let dx = sigma * (y - x);
//               let dy = x * (rho - z) - y;
//               let dz = x * y - beta * z;
//               x += dx * dt;
//               y += dy * dt;
//               z += dz * dt;
//               const spread = 5.0; 
//               positions[i*3] = x * scale + (Math.random() - 0.5) * spread;
//               positions[i*3+1] = y * scale + (Math.random() - 0.5) * spread;
//               positions[i*3+2] = (z - 25) * scale + (Math.random() - 0.5) * spread;
//           }
//       } else if (shapeName === 'mobius') {
//           for (let i = 0; i < count; i++) {
//               const t = (i / count) * Math.PI * 14; 
//               const width = (Math.random() - 0.5) * 400; 
//               const radius = 700; 
//               const x = (radius + width * Math.cos(t/2)) * Math.cos(t);
//               const y = (radius + width * Math.cos(t/2)) * Math.sin(t);
//               const z = width * Math.sin(t/2);
//               positions[i*3] = x;
//               positions[i*3+1] = y;
//               positions[i*3+2] = z;
//           }
//       } else if (shapeName === 'torus') {
//           const R = 600; 
//           const r = 250; 
//           for (let i = 0; i < count; i++) {
//               const u = Math.random() * Math.PI * 2;
//               const v = Math.random() * Math.PI * 2;
//               positions[i*3] = (R + r * Math.cos(v)) * Math.cos(u);
//               positions[i*3+1] = (R + r * Math.cos(v)) * Math.sin(u);
//               positions[i*3+2] = r * Math.sin(v);
//           }
//       } else { 
//           const arms = 5;
//           const armWidth = 1.5;
//           for (let i = 0; i < count; i++) {
//               const spin = i / count * arms * Math.PI * 2;
//               const distance = (i / count) * 1800; 
//               const randomOffset = (Math.random() - 0.5) * distance * armWidth;
//               positions[i*3] = (distance + randomOffset) * Math.cos(spin + distance * 0.005);
//               positions[i*3+1] = (Math.random() - 0.5) * (500 - distance * 0.15); 
//               positions[i*3+2] = (distance + randomOffset) * Math.sin(spin + distance * 0.005);
//           }
//       }
//       return positions;
//   };

//   const transformShape = (shapeName) => {
//       if (!targetPositionsRef.current) return;
//       const count = geometryRef.current.attributes.position.count;
//       const newPos = calculateShapePositions(shapeName, count);
//       targetPositionsRef.current.set(newPos);
//       isTransitioningRef.current = true;
//       transitionProgressRef.current = 0;
//   };

//   useEffect(() => {
//     if (engineState !== 'ready' || !mountRef.current) return;

//     const THREE = window.THREE;
//     const width = window.innerWidth;
//     const height = window.innerHeight;

//     const scene = new THREE.Scene();
//     scene.fog = new THREE.FogExp2(0x000000, 0.0002);

//     const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 6000);
//     camera.position.z = 1800;

//     const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
//     renderer.setSize(width, height);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比优化性能
//     renderer.toneMapping = THREE.ReinhardToneMapping;
//     mountRef.current.innerHTML = '';
//     mountRef.current.appendChild(renderer.domElement);

//     const renderScene = new THREE.RenderPass(scene, camera);
//     const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
//     bloomPass.threshold = 0.1;
//     bloomPass.strength = 1.8;
//     bloomPass.radius = 0.5;

//     const composer = new THREE.EffectComposer(renderer);
//     composer.addPass(renderScene);
//     composer.addPass(bloomPass);

//     const particleCount = 40000;
//     const geometry = new THREE.BufferGeometry();
//     geometryRef.current = geometry;

//     const initialPos = calculateShapePositions('galaxy', particleCount);
//     geometry.setAttribute('position', new THREE.BufferAttribute(initialPos, 3));
//     targetPositionsRef.current = new Float32Array(initialPos);

//     const colors = new Float32Array(particleCount * 3);
//     const sizes = new Float32Array(particleCount);
//     geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
//     geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
//     updateParticleColors(currentPaletteId);

//     const material = new THREE.PointsMaterial({
//       size: 6,
//       vertexColors: true,
//       map: createGlowTexture(THREE),
//       transparent: true,
//       opacity: 1.0,
//       blending: THREE.AdditiveBlending,
//       depthWrite: false,
//       sizeAttenuation: true
//     });
//     materialRef.current = material;

//     const particleSystem = new THREE.Points(geometry, material);
//     particleSystemRef.current = particleSystem;
//     scene.add(particleSystem);

//     const handleMouseMove = (event) => {
//         const windowHalfX = window.innerWidth / 2;
//         const windowHalfY = window.innerHeight / 2;
//         mouseRef.current.x = (event.clientX - windowHalfX) * 1.5;
//         mouseRef.current.y = (event.clientY - windowHalfY) * 1.5;
//         mouseRef.current.lastMove = Date.now();
//     };
//     document.addEventListener('mousemove', handleMouseMove);

//     const animate = () => {
//         requestAnimationFrame(animate);

//         let audioData = 0;
//         let highFreq = 0;
//         if (analyserRef.current && isPlaying) {
//             const bufferLength = analyserRef.current.frequencyBinCount;
//             if (!dataArrayRef.current) dataArrayRef.current = new Uint8Array(bufferLength);
//             analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
//             let sum = 0;
//             for(let i=0; i<30; i++) sum += dataArrayRef.current[i];
//             audioData = sum / 30;

//             let highSum = 0;
//             for(let i=100; i<200; i++) highSum += dataArrayRef.current[i];
//             highFreq = highSum / 100;
//         }

//         if (isTransitioningRef.current && targetPositionsRef.current) {
//             transitionProgressRef.current += 0.015;
//             if (transitionProgressRef.current >= 1) {
//                 transitionProgressRef.current = 1;
//                 isTransitioningRef.current = false;
//             }
//             const positions = geometry.attributes.position.array;
//             const targets = targetPositionsRef.current;
//             for (let i = 0; i < positions.length; i++) {
//                 positions[i] += (targets[i] - positions[i]) * 0.08;
//             }
//             geometry.attributes.position.needsUpdate = true;
//         }

//         bloomPass.strength = 1.2 + (audioData / 255) * 1.5;
//         bloomPass.radius = 0.4 + (highFreq / 255) * 0.2;

//         const pulse = 1 + (audioData / 255) * 0.5;
//         particleSystem.scale.setScalar(pulse);
//         particleSystem.rotation.y += 0.002;

//         const now = Date.now();
//         const timeIdle = now - mouseRef.current.lastMove;
        
//         if (timeIdle > 3000) {
//             autoCruiseTimeRef.current += 0.0005;
//             const t = autoCruiseTimeRef.current;
//             const dist = 1800 + Math.sin(t * 2) * 500;
//             const cx = Math.sin(t) * dist;
//             const cz = Math.cos(t) * dist;
//             const cy = Math.sin(t * 0.5) * 800;
//             camera.position.x += (cx - camera.position.x) * 0.02;
//             camera.position.y += (cy - camera.position.y) * 0.02;
//             camera.position.z += (cz - camera.position.z) * 0.02;
//             camera.lookAt(0, 0, 0);
//         } else {
//             autoCruiseTimeRef.current = 0;
//             camera.position.x += (mouseRef.current.x - camera.position.x) * 0.05;
//             camera.position.y += (-mouseRef.current.y - camera.position.y) * 0.05;
//             camera.position.z += (1800 - camera.position.z) * 0.05;
//             camera.lookAt(scene.position);
//         }

//         composer.render();
//     };

//     animate();

//     const handleResize = () => {
//         const w = window.innerWidth;
//         const h = window.innerHeight;
//         camera.aspect = w / h;
//         camera.updateProjectionMatrix();
//         renderer.setSize(w, h);
//         composer.setSize(w, h);
//     };
//     window.addEventListener('resize', handleResize);

//     return () => {
//         document.removeEventListener('mousemove', handleMouseMove);
//         window.removeEventListener('resize', handleResize);
//         if (mountRef.current) mountRef.current.innerHTML = '';
//     };
//   }, [engineState]);

//   // Audio Context Logic
//   useEffect(() => {
//     if (!audioRef.current) return;
//     if (!audioContextRef.current) {
//         const AudioContext = window.AudioContext || window.webkitAudioContext;
//         audioContextRef.current = new AudioContext();
//         analyserRef.current = audioContextRef.current.createAnalyser();
//         analyserRef.current.fftSize = 512;
//         try {
//             sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
//             sourceRef.current.connect(analyserRef.current);
//             analyserRef.current.connect(audioContextRef.current.destination);
//         } catch(e) {}
//     }
//     if (isPlaying && audioContextRef.current.state === 'suspended') {
//         audioContextRef.current.resume();
//     }
//   }, [audioRef, isPlaying]);

//   return (
//     <div className="fixed inset-0 z-0 bg-black">
//         <div ref={mountRef} className="w-full h-full" />
//         {engineState === 'initializing' && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6CB8FF] font-mono gap-4 pointer-events-none">
//                 <div className="w-8 h-8 border-2 border-[#FF3366] border-t-transparent rounded-full animate-spin"></div>
//                 <div className="tracking-widest animate-pulse">INITIALIZING CORE...</div>
//             </div>
//         )}
//         {engineState === 'error' && (
//             <div className="absolute inset-0 flex items-center justify-center text-red-500 font-mono pointer-events-none">
//                 3D ENGINE FAILURE. CHECK NETWORK OR NPM INSTALL THREE.
//             </div>
//         )}
//     </div>
//   );
// };

// function createGlowTexture(THREE) {
//     const canvas = document.createElement('canvas');
//     canvas.width = 64;
//     canvas.height = 64;
//     const context = canvas.getContext('2d');
//     const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
//     gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
//     gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)'); 
//     gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
//     context.fillStyle = gradient;
//     context.fillRect(0, 0, 64, 64);
//     const texture = new THREE.Texture(canvas);
//     texture.needsUpdate = true;
//     return texture;
// }

// const DEMO_TRACKS = [
//   { id: 'demo-1', title: "Cosmic Algorithms", artist: "The Math Engine", audioSrc: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg" },
//   { id: 'demo-2', title: "Lorenz Pulse", artist: "Chaos Theory", audioSrc: "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/ateapill.ogg" }
// ];

// // --- 侧边栏：播放列表 ---
// const PlaylistSidebar = ({ tracks, currentTrackIndex, onPlay, onDelete, onClose }) => {
//     return (
//         <motion.div 
//             initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
//             className="fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
//         >
//             <div className="flex justify-between items-center mb-8">
//                 <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
//                     <ListMusic size={20} className="text-[#6CB8FF]" /> PLAYLIST
//                 </h2>
//                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
//                     <X size={20} />
//                 </button>
//             </div>
//             <div className="space-y-3">
//                 {tracks.map((track, index) => (
//                     <div 
//                         key={track.id} 
//                         className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between
//                             ${index === currentTrackIndex ? 'bg-white/10 border-[#6CB8FF]/50 shadow-[0_0_15px_rgba(108,184,255,0.2)]' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20'}`}
//                         onClick={() => onPlay(index)}
//                     >
//                         <div className="flex items-center gap-3 overflow-hidden">
//                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === currentTrackIndex ? 'bg-[#6CB8FF] text-black' : 'bg-white/10 text-white/30'}`}>
//                                 {index === currentTrackIndex ? <Activity size={14} className="animate-pulse"/> : <Music size={14} />}
//                             </div>
//                             <div className="flex flex-col overflow-hidden">
//                                 <span className={`text-sm font-bold truncate ${index === currentTrackIndex ? 'text-white' : 'text-white/70'}`}>{track.title}</span>
//                                 <span className="text-xs text-white/40 truncate">{track.artist}</span>
//                             </div>
//                         </div>
//                         <button onClick={(e) => { e.stopPropagation(); onDelete(index); }} className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
//                             <Trash2 size={14} />
//                         </button>
//                     </div>
//                 ))}
//             </div>
//         </motion.div>
//     );
// };

// // --- 侧边栏：视觉特效 ---
// const VisualsSidebar = ({ currentShape, onSelect, onClose }) => {
//     const effects = [
//         { id: 'galaxy', label: 'GALAXY', icon: <Globe size={16}/>, desc: "Spiral galaxy structure" },
//         { id: 'lorenz', label: 'LORENZ ATTRACTOR', icon: <Activity size={16}/>, desc: "Chaos theory visualization" },
//         { id: 'mobius', label: 'MOBIUS STRIP', icon: <Zap size={16}/>, desc: "Non-orientable surface" },
//         { id: 'torus', label: 'TORUS KNOT', icon: <Circle size={16}/>, desc: "Geometric donut shape" },
//         { id: 'dna', label: 'DNA HELIX', icon: <Dna size={16}/>, desc: "Biological double helix" },
//         { id: 'mandelbulb', label: 'MANDELBULB', icon: <Layers size={16}/>, desc: "3D Fractal Structure" },
//     ];

//     return (
//         <motion.div 
//             initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
//             className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
//         >
//             <div className="flex justify-between items-center mb-8">
//                 <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
//                     <Aperture size={20} className="text-[#FF3366]" /> VISUALS
//                 </h2>
//                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
//                     <X size={20} />
//                 </button>
//             </div>
//             <div className="space-y-3">
//                 {effects.map((effect) => (
//                     <div 
//                         key={effect.id} 
//                         onClick={() => onSelect(effect.id)}
//                         className={`p-4 rounded-xl border transition-all cursor-pointer hover:bg-white/5 
//                             ${currentShape === effect.id ? 'bg-white/10 border-[#FF3366] text-white' : 'border-white/5 text-white/50'}`}
//                     >
//                         <div className="flex items-center gap-3 mb-1">
//                             {effect.icon}
//                             <span className="font-bold tracking-wider">{effect.label}</span>
//                         </div>
//                         <p className="text-xs opacity-50 ml-7">{effect.desc}</p>
//                     </div>
//                 ))}
//             </div>
//         </motion.div>
//     );
// };

// // --- 新增：侧边栏：调色板 ---
// const ThemesSidebar = ({ currentPaletteId, onSelect, onClose }) => {
//     return (
//         <motion.div 
//             initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
//             className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
//         >
//             <div className="flex justify-between items-center mb-8">
//                 <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
//                     <Palette size={20} className="text-[#00FFFF]" /> THEMES
//                 </h2>
//                 <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
//                     <X size={20} />
//                 </button>
//             </div>
//             <div className="space-y-4">
//                 {Object.values(COLOR_PALETTES).map((theme) => (
//                     <div 
//                         key={theme.id} 
//                         onClick={() => onSelect(theme.id)}
//                         className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-105
//                             ${currentPaletteId === theme.id ? 'border-white bg-white/10' : 'border-white/5 bg-transparent'}`}
//                     >
//                         <div className={`h-20 w-full rounded-lg bg-gradient-to-r ${theme.bgGradient} mb-3 shadow-lg`} />
//                         <div className="flex justify-between items-center">
//                             <span className="font-bold tracking-wider text-white">{theme.name}</span>
//                             {currentPaletteId === theme.id && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"/>}
//                         </div>
//                         <p className="text-xs text-white/40 mt-1">{theme.desc}</p>
//                     </div>
//                 ))}
//             </div>
//         </motion.div>
//     );
// };

// const DraggableProgressBar = ({ currentTime, duration, onSeekStart, onSeekEnd, onSeek, paletteId }) => {
//   const progressBarRef = useRef(null);
//   const [isHovering, setIsHovering] = useState(false);
//   const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.neon;

//   const calculateProgress = (e) => {
//       const rect = progressBarRef.current.getBoundingClientRect();
//       const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
//       return x / rect.width;
//   };
//   const handleMouseDown = (e) => {
//     onSeekStart();
//     const percentage = calculateProgress(e);
//     onSeek(percentage * duration);
//     const handleMouseMove = (moveEvent) => onSeek(calculateProgress(moveEvent) * duration);
//     const handleMouseUp = (upEvent) => {
//         onSeekEnd(calculateProgress(upEvent) * duration);
//         document.removeEventListener('mousemove', handleMouseMove);
//         document.removeEventListener('mouseup', handleMouseUp);
//     };
//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);
//   };
//   const progress = duration ? (currentTime / duration) * 100 : 0;
//   return (
//     <div className="absolute top-0 left-6 right-6 h-6 -mt-3 group/progress cursor-pointer z-50 flex items-center"
//       onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onMouseDown={handleMouseDown} ref={progressBarRef}>
//       <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm relative transition-all group-hover/progress:h-1.5">
//          {/* 动态渐变进度条 */}
//          <div className={`h-full bg-gradient-to-r ${palette.bgGradient} shadow-[0_0_15px_rgba(255,255,255,0.5)] relative`} style={{ width: `${progress}%` }}>
//             <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-200 ${isHovering ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover/progress:scale-100 group-hover/progress:opacity-100'}`} />
//          </div>
//       </div>
//     </div>
//   );
// };

// const VolumeControl = ({ volume, onVolumeChange, paletteId }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const sliderRef = useRef(null);
//   const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.neon;

//   const handleVolumeDrag = (e) => {
//       e.stopPropagation(); 
//       if (!sliderRef.current) return;
//       const rect = sliderRef.current.getBoundingClientRect();
//       const y = Math.max(0, Math.min(rect.bottom - e.clientY, rect.height));
//       onVolumeChange(y / rect.height);
//   };
//   const handleMouseDown = (e) => {
//       handleVolumeDrag(e);
//       const handleMouseMove = (ev) => handleVolumeDrag(ev);
//       const handleMouseUp = () => {
//           document.removeEventListener('mousemove', handleMouseMove);
//           document.removeEventListener('mouseup', handleMouseUp);
//       };
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//   };
//   return (
//     <div className="relative flex items-center justify-center h-full w-10" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute bottom-full left-1/2 -translate-x-1/2 pb-6 z-50">
//              <div className="w-12 h-40 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-4 flex justify-center shadow-2xl">
//                 <div ref={sliderRef} className="relative w-2 h-full bg-white/20 rounded-full overflow-hidden cursor-pointer" onMouseDown={handleMouseDown}>
//                     <div className={`absolute bottom-0 w-full bg-gradient-to-t ${palette.bgGradient} rounded-full transition-all duration-75`} style={{ height: `${volume * 100}%` }} />
//                 </div>
//              </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="p-2 text-white/70 hover:text-white transition-colors">
//         {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
//       </button>
//     </div>
//   );
// };

// export default function AppleGlassPlayer() {
//   const [tracks, setTracks] = useState(DEMO_TRACKS);
//   const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [volume, setVolume] = useState(0.6);
//   const [isDragging, setIsDragging] = useState(false);
//   const [currentShape, setCurrentShape] = useState('galaxy');
//   const [currentPalette, setCurrentPalette] = useState('neon'); // 默认主题
//   const [showPlaylist, setShowPlaylist] = useState(false);
//   const [showVisuals, setShowVisuals] = useState(false);
//   const [showThemes, setShowThemes] = useState(false); // 新增主题侧边栏状态
  
//   const audioRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const currentTrack = tracks[currentTrackIndex];

//   useEffect(() => { if(audioRef.current) audioRef.current.volume = volume; }, [volume]);
  
//   useEffect(() => {
//     const audio = audioRef.current;
//     if (!audio) return;
//     const playAudio = async () => {
//       try {
//         if (isPlaying) await audio.play();
//         else audio.pause();
//       } catch (error) { console.warn("Playback error:", error); }
//     };
//     playAudio();
//   }, [isPlaying, currentTrackIndex]);

//   const togglePlay = () => setIsPlaying(!isPlaying);
//   const playNext = () => { setCurrentTrackIndex((prev) => (prev + 1) % tracks.length); setIsPlaying(true); };
//   const playPrev = () => { setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length); setIsPlaying(true); };

//   const handleTimeUpdate = () => { if (!isDragging && audioRef.current) setCurrentTime(audioRef.current.currentTime); };
//   const handleSeekStart = () => setIsDragging(true);
//   const handleSeek = (time) => setCurrentTime(time);
//   const handleSeekEnd = (time) => {
//     if (isFinite(time) && audioRef.current) audioRef.current.currentTime = time;
//     setIsDragging(false);
//     if (isPlaying) audioRef.current?.play().catch(console.warn);
//   };

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     e.target.value = '';
//     const fileUrl = URL.createObjectURL(file);
//     const newTrack = {
//       id: Date.now().toString(),
//       title: file.name.replace(/\.[^/.]+$/, ""),
//       artist: "Local Track",
//       audioSrc: fileUrl,
//     };
//     setTracks(prev => [...prev, newTrack]);
//     setShowPlaylist(true);
//   };

//   const deleteTrack = (index) => {
//       if (tracks.length <= 1) return;
//       const newTracks = tracks.filter((_, i) => i !== index);
//       setTracks(newTracks);
//       if (index === currentTrackIndex) {
//           setCurrentTrackIndex(0);
//           setIsPlaying(false);
//       } else if (index < currentTrackIndex) {
//           setCurrentTrackIndex(prev => prev - 1);
//       }
//   };

//   const formatTime = (time) => {
//     const min = Math.floor(time / 60);
//     const sec = Math.floor(time % 60);
//     return `${min}:${sec < 10 ? '0' : ''}${sec}`;
//   };

//   // 根据当前调色板获取按钮颜色
//   const themeColor = COLOR_PALETTES[currentPalette].colors[0]; // 主色
//   const hexColor = '#' + themeColor.toString(16).padStart(6, '0');

//   return (
//     <div className="relative w-full h-screen overflow-hidden font-sans text-white select-none bg-black">
      
//       {/* 3D 视觉层 */}
//       <ThreeVisualizer 
//         audioRef={audioRef} 
//         isPlaying={isPlaying} 
//         currentShapeName={currentShape}
//         currentPaletteId={currentPalette} // 传入当前调色板 ID
//       />

//       {/* 顶部 Header */}
//       <div className="absolute top-0 left-0 right-0 h-16 z-40 flex justify-between items-center px-8 opacity-80 hover:opacity-100 transition-opacity">
//           <div className="flex items-center gap-2">
//             <Aperture size={18} style={{ color: hexColor }} />
//             <span className="text-sm font-bold tracking-[0.2em] text-white/80">HYPERSPACE OS</span>
//           </div>
//           <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors backdrop-blur-md border border-white/5 group">
//               <Upload size={14} className="text-white"/>
//               <span className="text-xs font-bold tracking-wider text-white">UPLOAD</span>
//               <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.m4b" className="hidden" onChange={handleFileUpload} />
//           </label>
//       </div>

//       {/* 侧边栏 */}
//       <AnimatePresence>
//         {showPlaylist && <PlaylistSidebar tracks={tracks} currentTrackIndex={currentTrackIndex} onPlay={(idx) => { setCurrentTrackIndex(idx); setIsPlaying(true); }} onDelete={deleteTrack} onClose={() => setShowPlaylist(false)} />}
//         {showVisuals && <VisualsSidebar currentShape={currentShape} onSelect={(shape) => setCurrentShape(shape)} onClose={() => setShowVisuals(false)} />}
//         {showThemes && <ThemesSidebar currentPaletteId={currentPalette} onSelect={(id) => setCurrentPalette(id)} onClose={() => setShowThemes(false)} />}
//       </AnimatePresence>

//       {/* 底部控制栏 */}
//       <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-4">
//         <div className="w-full max-w-[500px] h-[80px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center px-8 gap-4 relative group hover:bg-black/60 transition-colors">
//             <DraggableProgressBar currentTime={currentTime} duration={duration} onSeekStart={handleSeekStart} onSeekEnd={handleSeekEnd} onSeek={handleSeek} paletteId={currentPalette} />
            
//             {/* 左侧功能区：特效 + 调色板 */}
//             <div className="flex items-center gap-3 justify-start absolute left-8">
//                <button onClick={() => { setShowVisuals(!showVisuals); setShowThemes(false); }} className={`p-2 hover:text-white transition-colors ${showVisuals ? 'text-white' : 'text-white/40'}`}>
//                    <Aperture size={20}/>
//                </button>
//                <button onClick={() => { setShowThemes(!showThemes); setShowVisuals(false); }} className={`p-2 hover:text-white transition-colors ${showThemes ? 'text-white' : 'text-white/40'}`}>
//                    <Palette size={20}/>
//                </button>
//             </div>

//             {/* 播放控制 (按钮颜色随主题变) */}
//             <div className="flex-1 flex justify-center items-center gap-6">
//                <button onClick={playPrev} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"><SkipBack size={24} /></button>
//                <motion.button 
//                  whileTap={{ scale: 0.9 }} onClick={togglePlay}
//                  className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
//                  style={{ background: `linear-gradient(135deg, ${'#' + COLOR_PALETTES[currentPalette].colors[0].toString(16).padStart(6,'0')}, ${'#' + COLOR_PALETTES[currentPalette].colors[1].toString(16).padStart(6,'0')})` }}
//                >
//                  {isPlaying ? <Pause size={20} fill="black" className="text-black" /> : <Play size={20} fill="black" className="ml-1 text-black" />}
//                </motion.button>
//                <button onClick={playNext} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"><SkipForward size={24} /></button>
//             </div>

//             {/* 右侧：列表 + 音量 */}
//             <div className="flex items-center gap-3 justify-end absolute right-8">
//                <button onClick={() => setShowPlaylist(!showPlaylist)} className={`p-2 hover:text-white transition-colors ${showPlaylist ? 'text-white' : 'text-white/40'}`}><ListMusic size={20}/></button>
//                <VolumeControl volume={volume} onVolumeChange={setVolume} paletteId={currentPalette} />
//             </div>
//         </div>
//       </div>

//       <audio ref={audioRef} src={currentTrack.audioSrc} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={(e) => setDuration(e.target.duration)} onEnded={playNext} crossOrigin="anonymous" />
//     </div>
//   );
// }


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Globe, Circle, Activity, Zap, Command, ListMusic, X, Trash2, Music, Aperture, Layers, Dna, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 0. 配色方案定义 ---
const COLOR_PALETTES = {
  neon: { 
    id: 'neon', 
    name: 'NEON CYBER', 
    desc: 'Classic Cyberpunk',
    colors: [0x00FFFF, 0xFF3366, 0xFFD700], // 青, 粉, 金
    bgGradient: 'from-[#00FFFF] to-[#FF3366]' 
  },
  gold: { 
    id: 'gold', 
    name: 'BLACK GOLD', 
    desc: 'Luxury & Elegant',
    colors: [0xFFD700, 0xBF953F, 0xFFFFFF], // 金, 暗金, 白
    bgGradient: 'from-[#FFD700] to-[#BF953F]'
  },
  ice: { 
    id: 'ice', 
    name: 'GLACIER', 
    desc: 'Cold & Clean',
    colors: [0x00FFFF, 0x0080FF, 0xE0FFFF], // 青, 蓝, 淡蓝
    bgGradient: 'from-[#00FFFF] to-[#0080FF]'
  },
  fire: { 
    id: 'fire', 
    name: 'INFERNO', 
    desc: 'Hot & Intense',
    colors: [0xFF4500, 0xFFA500, 0xFFD700], // 红橙, 橙, 黄
    bgGradient: 'from-[#FF4500] to-[#FFA500]'
  },
  matrix: { 
    id: 'matrix', 
    name: 'THE MATRIX', 
    desc: 'Digital Rain',
    colors: [0x00FF00, 0x008800, 0xCCFFCC], // 亮绿, 深绿, 极淡绿
    bgGradient: 'from-[#00FF00] to-[#003300]'
  },
  deep: { 
    id: 'deep', 
    name: 'DEEP SPACE', 
    desc: 'Mysterious Violet',
    colors: [0x8A2BE2, 0x4B0082, 0xFF00FF], // 紫罗兰, 靛蓝, 
    bgGradient: 'from-[#8A2BE2] to-[#4B0082]'
  }
};

// --- 1. 核心：Three.js 3D 粒子引擎 (修复版) ---
const ThreeVisualizer = ({ audioRef, isPlaying, currentShapeName, currentPaletteId }) => {
  const mountRef = useRef(null);
  const [engineState, setEngineState] = useState('initializing');
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const particleSystemRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const targetPositionsRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(0);
  
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, lastMove: Date.now() });
  const autoCruiseTimeRef = useRef(0);

  // 动态加载 Three.js (稳健版)
  useEffect(() => {
    const loadEngine = async () => {
      // 检查全局对象是否已完全就绪
      if (window.THREE && window.THREE.EffectComposer && window.THREE.UnrealBloomPass) {
        setEngineState('ready');
        return;
      }

      // 辅助函数：加载单个脚本 (防竞争条件)
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          let script = document.querySelector(`script[src="${src}"]`);
          
          if (script) {
            // 如果脚本已存在
            if (script.dataset.loaded === 'true') {
              resolve(); // 已加载完成
            } else {
              // 正在加载中，添加监听器
              const originalOnLoad = script.onload;
              script.onload = () => {
                if (originalOnLoad) originalOnLoad();
                resolve();
              };
              const originalOnError = script.onerror;
              script.onerror = (e) => {
                if (originalOnError) originalOnError(e);
                reject(new Error(`Script load error: ${src}`));
              }
            }
            return;
          }

          // 创建新脚本
          script = document.createElement('script');
          script.src = src;
          script.async = false; // 强制顺序
          script.dataset.loaded = 'false';
          
          script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
          };
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          
          document.head.appendChild(script);
        });
      };

      try {
        // 使用 unpkg，版本 0.128.0
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js');

        // 双重检查构造函数
        if (window.THREE && window.THREE.RenderPass && window.THREE.UnrealBloomPass) {
            setEngineState('ready');
        } else {
            throw new Error("Three.js classes missing after load");
        }
      } catch (err) {
        console.error("Three.js Load Error:", err);
        setEngineState('error');
      }
    };

    loadEngine();
  }, []);

  // 监听形状切换
  useEffect(() => {
    if(engineState === 'ready' && particleSystemRef.current) {
        transformShape(currentShapeName);
    }
  }, [currentShapeName, engineState]);

  // 监听颜色切换
  useEffect(() => {
    if (engineState === 'ready' && geometryRef.current) {
      updateParticleColors(currentPaletteId);
    }
  }, [currentPaletteId, engineState]);

  // 更新粒子颜色函数
  const updateParticleColors = (paletteId) => {
    const THREE = window.THREE;
    const palette = COLOR_PALETTES[paletteId];
    if (!palette || !geometryRef.current) return;

    const count = geometryRef.current.attributes.position.count;
    const colors = geometryRef.current.attributes.color.array;
    
    const c1 = new THREE.Color(palette.colors[0]);
    const c2 = new THREE.Color(palette.colors[1]);
    const c3 = new THREE.Color(palette.colors[2]);

    for (let i = 0; i < count; i++) {
        const r = Math.random();
        let c;
        if (r < 0.2) c = c3; 
        else c = c1.clone().lerp(c2, Math.random()); 
        c.multiplyScalar(1.5);

        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geometryRef.current.attributes.color.needsUpdate = true;
  };

  // 数学形态计算
  const calculateShapePositions = (shapeName, count) => {
      const positions = new Float32Array(count * 3);
      
      if (shapeName === 'mandelbulb') {
          // Mandelbulb 简化版 (点云)
          const dim = 1200;
          for(let i=0; i<count; i++) {
              let found = false;
              let iter = 0;
              while(!found && iter < 10) {
                  const r = Math.random() * dim;
                  const theta = Math.random() * Math.PI;
                  const phi = Math.random() * Math.PI * 2;
                  const dr = Math.pow(r/dim, 8) * dim; 
                  const distortion = Math.sin(theta*8) * Math.cos(phi*8);
                  const finalR = (dim * 0.4) + distortion * 100;

                  positions[i*3] = finalR * Math.sin(theta) * Math.cos(phi);
                  positions[i*3+1] = finalR * Math.sin(theta) * Math.sin(phi);
                  positions[i*3+2] = finalR * Math.cos(theta);
                  found = true; 
                  iter++;
              }
          }
      } else if (shapeName === 'dna') {
          // DNA 双螺旋
          const radius = 300;
          const height = 2000;
          const turns = 10;
          for(let i=0; i<count; i++) {
              const p = i / count;
              const angle = p * Math.PI * 2 * turns;
              const y = p * height - height/2;
              
              const isChainA = Math.random() > 0.5;
              const offset = isChainA ? 0 : Math.PI;
              const isLink = Math.random() < 0.1;
              
              if (isLink) {
                  const linkProg = Math.random();
                  const x1 = Math.cos(angle) * radius;
                  const z1 = Math.sin(angle) * radius;
                  const x2 = Math.cos(angle + Math.PI) * radius;
                  const z2 = Math.sin(angle + Math.PI) * radius;
                  
                  positions[i*3] = x1 + (x2-x1)*linkProg;
                  positions[i*3+1] = y;
                  positions[i*3+2] = z1 + (z2-z1)*linkProg;
              } else {
                  const rRandom = radius + (Math.random()-0.5) * 60;
                  positions[i*3] = Math.cos(angle + offset) * rRandom;
                  positions[i*3+1] = y + (Math.random()-0.5) * 20;
                  positions[i*3+2] = Math.sin(angle + offset) * rRandom;
              }
          }
      } else if (shapeName === 'lorenz') {
          // 洛伦兹吸引子
          let x = 0.1, y = 0, z = 0;
          const dt = 0.004;
          const sigma = 10, rho = 28, beta = 8/3;
          const scale = 45; 
          for (let i = 0; i < count; i++) {
              let dx = sigma * (y - x);
              let dy = x * (rho - z) - y;
              let dz = x * y - beta * z;
              x += dx * dt;
              y += dy * dt;
              z += dz * dt;
              const spread = 5.0; 
              positions[i*3] = x * scale + (Math.random() - 0.5) * spread;
              positions[i*3+1] = y * scale + (Math.random() - 0.5) * spread;
              positions[i*3+2] = (z - 25) * scale + (Math.random() - 0.5) * spread;
          }
      } else if (shapeName === 'mobius') {
          // 莫比乌斯带
          for (let i = 0; i < count; i++) {
              const t = (i / count) * Math.PI * 14; 
              const width = (Math.random() - 0.5) * 400; 
              const radius = 700; 
              const x = (radius + width * Math.cos(t/2)) * Math.cos(t);
              const y = (radius + width * Math.cos(t/2)) * Math.sin(t);
              const z = width * Math.sin(t/2);
              positions[i*3] = x;
              positions[i*3+1] = y;
              positions[i*3+2] = z;
          }
      } else if (shapeName === 'torus') {
          // 环面 (甜甜圈)
          const R = 600; 
          const r = 250; 
          for (let i = 0; i < count; i++) {
              const u = Math.random() * Math.PI * 2;
              const v = Math.random() * Math.PI * 2;
              positions[i*3] = (R + r * Math.cos(v)) * Math.cos(u);
              positions[i*3+1] = (R + r * Math.cos(v)) * Math.sin(u);
              positions[i*3+2] = r * Math.sin(v);
          }
      } else { 
          // 默认: 星系 (Galaxy)
          const arms = 5;
          const armWidth = 1.5;
          for (let i = 0; i < count; i++) {
              const spin = i / count * arms * Math.PI * 2;
              const distance = (i / count) * 1800; 
              const randomOffset = (Math.random() - 0.5) * distance * armWidth;
              positions[i*3] = (distance + randomOffset) * Math.cos(spin + distance * 0.005);
              positions[i*3+1] = (Math.random() - 0.5) * (500 - distance * 0.15); 
              positions[i*3+2] = (distance + randomOffset) * Math.sin(spin + distance * 0.005);
          }
      }
      return positions;
  };

  const transformShape = (shapeName) => {
      if (!targetPositionsRef.current) return;
      const count = geometryRef.current.attributes.position.count;
      const newPos = calculateShapePositions(shapeName, count);
      targetPositionsRef.current.set(newPos);
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0;
  };

  // --- C. 场景渲染循环 ---
  useEffect(() => {
    if (engineState !== 'ready' || !mountRef.current) return;

    const THREE = window.THREE;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. 场景
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0002);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 6000);
    camera.position.z = 1800;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以优化性能
    renderer.toneMapping = THREE.ReinhardToneMapping;
    
    // 清理并挂载
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 2. 后期处理 (Bloom)
    // 确保所有 Pass 类都已存在
    if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) {
        console.error("Post-processing modules missing");
        return;
    }

    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.8;
    bloomPass.radius = 0.5;

    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 3. 粒子系统
    const particleCount = 40000;
    const geometry = new THREE.BufferGeometry();
    geometryRef.current = geometry;

    const initialPos = calculateShapePositions('galaxy', particleCount);
    geometry.setAttribute('position', new THREE.BufferAttribute(initialPos, 3));
    targetPositionsRef.current = new Float32Array(initialPos);

    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // 颜色配置 (Neon Palette)
    const color1 = new THREE.Color(0x00FFFF); // Cyan
    const color2 = new THREE.Color(0xFF3366); // Neon Pink
    const color3 = new THREE.Color(0xFFD700); // Gold

    for (let i = 0; i < particleCount; i++) {
        const r = Math.random();
        let c;
        if (r < 0.2) c = color3;
        else c = color1.clone().lerp(color2, Math.random());
        c.multiplyScalar(2.0); 

        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        sizes[i] = Math.random() * 2;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 6,
      vertexColors: true,
      map: createGlowTexture(THREE),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    materialRef.current = material;

    const particleSystem = new THREE.Points(geometry, material);
    particleSystemRef.current = particleSystem;
    scene.add(particleSystem);

    // 4. 交互
    const handleMouseMove = (event) => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        mouseRef.current.x = (event.clientX - windowHalfX) * 1.5;
        mouseRef.current.y = (event.clientY - windowHalfY) * 1.5;
        mouseRef.current.lastMove = Date.now();
    };
    document.addEventListener('mousemove', handleMouseMove);

    // 5. 动画循环
    let animationFrameId;
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        let audioData = 0;
        let highFreq = 0;
        if (analyserRef.current && isPlaying) {
            const bufferLength = analyserRef.current.frequencyBinCount;
            if (!dataArrayRef.current) dataArrayRef.current = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            let sum = 0;
            for(let i=0; i<30; i++) sum += dataArrayRef.current[i];
            audioData = sum / 30;

            let highSum = 0;
            for(let i=100; i<200; i++) highSum += dataArrayRef.current[i];
            highFreq = highSum / 100;
        }

        if (isTransitioningRef.current && targetPositionsRef.current) {
            transitionProgressRef.current += 0.015;
            if (transitionProgressRef.current >= 1) {
                transitionProgressRef.current = 1;
                isTransitioningRef.current = false;
            }
            const positions = geometry.attributes.position.array;
            const targets = targetPositionsRef.current;
            for (let i = 0; i < positions.length; i++) {
                positions[i] += (targets[i] - positions[i]) * 0.08;
            }
            geometry.attributes.position.needsUpdate = true;
        }

        // Bloom Pulse
        bloomPass.strength = 1.2 + (audioData / 255) * 1.5;
        bloomPass.radius = 0.4 + (highFreq / 255) * 0.2;

        const pulse = 1 + (audioData / 255) * 0.5;
        particleSystem.scale.setScalar(pulse);
        particleSystem.rotation.y += 0.002;

        // Auto Cruise
        const now = Date.now();
        const timeIdle = now - mouseRef.current.lastMove;
        
        if (timeIdle > 3000) {
            autoCruiseTimeRef.current += 0.0005;
            const t = autoCruiseTimeRef.current;
            const dist = 1800 + Math.sin(t * 2) * 500;
            const cx = Math.sin(t) * dist;
            const cz = Math.cos(t) * dist;
            const cy = Math.sin(t * 0.5) * 800;
            camera.position.x += (cx - camera.position.x) * 0.02;
            camera.position.y += (cy - camera.position.y) * 0.02;
            camera.position.z += (cz - camera.position.z) * 0.02;
            camera.lookAt(0, 0, 0);
        } else {
            autoCruiseTimeRef.current = 0;
            camera.position.x += (mouseRef.current.x - camera.position.x) * 0.05;
            camera.position.y += (-mouseRef.current.y - camera.position.y) * 0.05;
            camera.position.z += (1800 - camera.position.z) * 0.05;
            camera.lookAt(scene.position);
        }

        composer.render();
    };

    animate();

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        if (mountRef.current) mountRef.current.innerHTML = '';
        geometry.dispose();
        material.dispose();
        renderer.dispose();
    };
  }, [engineState]);

  // Audio Context Logic
  useEffect(() => {
    if (!audioRef.current) return;
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        try {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
        } catch(e) {}
    }
    if (isPlaying && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  }, [audioRef, isPlaying]);

  return (
    <div className="fixed inset-0 z-0 bg-black">
        <div ref={mountRef} className="w-full h-full" />
        {engineState === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6CB8FF] font-mono gap-4 pointer-events-none">
                <div className="w-8 h-8 border-2 border-[#FF3366] border-t-transparent rounded-full animate-spin"></div>
                <div className="tracking-widest animate-pulse">INITIALIZING CORE...</div>
            </div>
        )}
        {engineState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-mono pointer-events-none">
                3D ENGINE FAILURE. CHECK NETWORK OR NPM INSTALL THREE.
            </div>
        )}
    </div>
  );
};

// 辅助：生成发光纹理
function createGlowTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)'); 
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

const DEMO_TRACKS = [
  { id: 'demo-1', title: "Cosmic Algorithms", artist: "The Math Engine", audioSrc: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg" },
  { id: 'demo-2', title: "Lorenz Pulse", artist: "Chaos Theory", audioSrc: "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/ateapill.ogg" }
];

// --- 侧边栏：播放列表 ---
const PlaylistSidebar = ({ tracks, currentTrackIndex, onPlay, onDelete, onClose }) => {
    return (
        <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                    <ListMusic size={20} className="text-[#6CB8FF]" /> PLAYLIST
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
            <div className="space-y-3">
                {tracks.map((track, index) => (
                    <div 
                        key={track.id} 
                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between
                            ${index === currentTrackIndex ? 'bg-white/10 border-[#6CB8FF]/50 shadow-[0_0_15px_rgba(108,184,255,0.2)]' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20'}`}
                        onClick={() => onPlay(index)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === currentTrackIndex ? 'bg-[#6CB8FF] text-black' : 'bg-white/10 text-white/30'}`}>
                                {index === currentTrackIndex ? <Activity size={14} className="animate-pulse"/> : <Music size={14} />}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className={`text-sm font-bold truncate ${index === currentTrackIndex ? 'text-white' : 'text-white/70'}`}>{track.title}</span>
                                <span className="text-xs text-white/40 truncate">{track.artist}</span>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(index); }} className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// --- 侧边栏：视觉特效 ---
const VisualsSidebar = ({ currentShape, onSelect, onClose }) => {
    const effects = [
        { id: 'galaxy', label: 'GALAXY', icon: <Globe size={16}/>, desc: "Spiral galaxy structure" },
        { id: 'lorenz', label: 'LORENZ ATTRACTOR', icon: <Activity size={16}/>, desc: "Chaos theory visualization" },
        { id: 'mobius', label: 'MOBIUS STRIP', icon: <Zap size={16}/>, desc: "Non-orientable surface" },
        { id: 'torus', label: 'TORUS KNOT', icon: <Circle size={16}/>, desc: "Geometric donut shape" },
        { id: 'dna', label: 'DNA HELIX', icon: <Dna size={16}/>, desc: "Biological double helix" },
        { id: 'mandelbulb', label: 'MANDELBULB', icon: <Layers size={16}/>, desc: "3D Fractal Structure" },
    ];

    return (
        <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                    <Aperture size={20} className="text-[#FF3366]" /> VISUALS
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
            <div className="space-y-3">
                {effects.map((effect) => (
                    <div 
                        key={effect.id} 
                        onClick={() => onSelect(effect.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:bg-white/5 
                            ${currentShape === effect.id ? 'bg-white/10 border-[#FF3366] text-white' : 'border-white/5 text-white/50'}`}
                    >
                        <div className="flex items-center gap-3 mb-1">
                            {effect.icon}
                            <span className="font-bold tracking-wider">{effect.label}</span>
                        </div>
                        <p className="text-xs opacity-50 ml-7">{effect.desc}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// --- 新增：侧边栏：调色板 ---
const ThemesSidebar = ({ currentPaletteId, onSelect, onClose }) => {
    return (
        <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                    <Palette size={20} className="text-[#00FFFF]" /> THEMES
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
            <div className="space-y-4">
                {Object.values(COLOR_PALETTES).map((theme) => (
                    <div 
                        key={theme.id} 
                        onClick={() => onSelect(theme.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-105
                            ${currentPaletteId === theme.id ? 'border-white bg-white/10' : 'border-white/5 bg-transparent'}`}
                    >
                        <div className={`h-20 w-full rounded-lg bg-gradient-to-r ${theme.bgGradient} mb-3 shadow-lg`} />
                        <div className="flex justify-between items-center">
                            <span className="font-bold tracking-wider text-white">{theme.name}</span>
                            {currentPaletteId === theme.id && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"/>}
                        </div>
                        <p className="text-xs text-white/40 mt-1">{theme.desc}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const DraggableProgressBar = ({ currentTime, duration, onSeekStart, onSeekEnd, onSeek, paletteId }) => {
  const progressBarRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.neon;

  const calculateProgress = (e) => {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      return x / rect.width;
  };
  const handleMouseDown = (e) => {
    onSeekStart();
    const percentage = calculateProgress(e);
    onSeek(percentage * duration);
    const handleMouseMove = (moveEvent) => onSeek(calculateProgress(moveEvent) * duration);
    const handleMouseUp = (upEvent) => {
        onSeekEnd(calculateProgress(upEvent) * duration);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const progress = duration ? (currentTime / duration) * 100 : 0;
  return (
    <div className="absolute top-0 left-6 right-6 h-6 -mt-3 group/progress cursor-pointer z-50 flex items-center"
      onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onMouseDown={handleMouseDown} ref={progressBarRef}>
      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm relative transition-all group-hover/progress:h-1.5">
         {/* 动态渐变进度条 */}
         <div className={`h-full bg-gradient-to-r ${palette.bgGradient} shadow-[0_0_15px_rgba(255,255,255,0.5)] relative`} style={{ width: `${progress}%` }}>
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-200 ${isHovering ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover/progress:scale-100 group-hover/progress:opacity-100'}`} />
         </div>
      </div>
    </div>
  );
};

const VolumeControl = ({ volume, onVolumeChange, paletteId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sliderRef = useRef(null);
  const palette = COLOR_PALETTES[paletteId] || COLOR_PALETTES.neon;

  const handleVolumeDrag = (e) => {
      e.stopPropagation(); 
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(rect.bottom - e.clientY, rect.height));
      onVolumeChange(y / rect.height);
  };
  const handleMouseDown = (e) => {
      handleVolumeDrag(e);
      const handleMouseMove = (ev) => handleVolumeDrag(ev);
      const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };
  return (
    <div className="relative flex items-center justify-center h-full w-10" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute bottom-full left-1/2 -translate-x-1/2 pb-6 z-50">
             <div className="w-12 h-40 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-4 flex justify-center shadow-2xl">
                <div ref={sliderRef} className="relative w-2 h-full bg-white/20 rounded-full overflow-hidden cursor-pointer" onMouseDown={handleMouseDown}>
                    <div className={`absolute bottom-0 w-full bg-gradient-to-t ${palette.bgGradient} rounded-full transition-all duration-75`} style={{ height: `${volume * 100}%` }} />
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="p-2 text-white/70 hover:text-white transition-colors">
        {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};

export default function AppleGlassPlayer() {
  const [tracks, setTracks] = useState(DEMO_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const [isDragging, setIsDragging] = useState(false);
  const [currentShape, setCurrentShape] = useState('galaxy');
  const [currentPalette, setCurrentPalette] = useState('neon'); // 默认主题
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [showThemes, setShowThemes] = useState(false); // 新增主题侧边栏状态
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => { if(audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const playAudio = async () => {
      try {
        if (isPlaying) await audio.play();
        else audio.pause();
      } catch (error) { console.warn("Playback error:", error); }
    };
    playAudio();
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const playNext = () => { setCurrentTrackIndex((prev) => (prev + 1) % tracks.length); setIsPlaying(true); };
  const playPrev = () => { setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length); setIsPlaying(true); };
  const handleTimeUpdate = () => { if (!isDragging && audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleSeekStart = () => setIsDragging(true);
  const handleSeek = (time) => setCurrentTime(time);
  const handleSeekEnd = (time) => {
    if (isFinite(time) && audioRef.current) audioRef.current.currentTime = time;
    setIsDragging(false);
    if (isPlaying) audioRef.current?.play().catch(console.warn);
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const fileUrl = URL.createObjectURL(file);
    const newTrack = { id: Date.now().toString(), title: file.name.replace(/\.[^/.]+$/, ""), artist: "Local Track", audioSrc: fileUrl };
    setTracks(prev => [...prev, newTrack]);
    setShowPlaylist(true);
  };
  const deleteTrack = (index) => {
      if (tracks.length <= 1) return;
      const newTracks = tracks.filter((_, i) => i !== index);
      setTracks(newTracks);
      if (index === currentTrackIndex) { setCurrentTrackIndex(0); setIsPlaying(false); } else if (index < currentTrackIndex) { setCurrentTrackIndex(prev => prev - 1); }
  };
  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const themeColor = COLOR_PALETTES[currentPalette].colors[0];
  const hexColor = '#' + themeColor.toString(16).padStart(6, '0');

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-white select-none bg-black">
      <ThreeVisualizer audioRef={audioRef} isPlaying={isPlaying} currentShapeName={currentShape} currentPaletteId={currentPalette} />
      <div className="absolute top-0 left-0 right-0 h-16 z-40 flex justify-between items-center px-8 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2"><Aperture size={18} style={{ color: hexColor }} /><span className="text-sm font-bold tracking-[0.2em] text-white/80">HYPERSPACE OS</span></div>
          <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors backdrop-blur-md border border-white/5 group">
              <Upload size={14} className="text-white"/><span className="text-xs font-bold tracking-wider text-white">UPLOAD</span>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </label>
      </div>
      <AnimatePresence>
        {showPlaylist && <PlaylistSidebar tracks={tracks} currentTrackIndex={currentTrackIndex} onPlay={(idx) => { setCurrentTrackIndex(idx); setIsPlaying(true); }} onDelete={deleteTrack} onClose={() => setShowPlaylist(false)} />}
        {showVisuals && <VisualsSidebar currentShape={currentShape} onSelect={(shape) => setCurrentShape(shape)} onClose={() => setShowVisuals(false)} />}
        {showThemes && <ThemesSidebar currentPaletteId={currentPalette} onSelect={(id) => setCurrentPalette(id)} onClose={() => setShowThemes(false)} />}
      </AnimatePresence>
      <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-[500px] h-[80px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center px-8 gap-4 relative group hover:bg-black/60 transition-colors">
            <DraggableProgressBar currentTime={currentTime} duration={duration} onSeekStart={handleSeekStart} onSeekEnd={handleSeekEnd} onSeek={handleSeek} paletteId={currentPalette} />
            <div className="flex items-center gap-3 justify-start absolute left-8">
               <button onClick={() => { setShowVisuals(!showVisuals); setShowThemes(false); }} className={`p-2 hover:text-white transition-colors ${showVisuals ? 'text-white' : 'text-white/40'}`}><Aperture size={20}/></button>
               <button onClick={() => { setShowThemes(!showThemes); setShowVisuals(false); }} className={`p-2 hover:text-white transition-colors ${showThemes ? 'text-white' : 'text-white/40'}`}><Palette size={20}/></button>
            </div>
            <div className="flex-1 flex justify-center items-center gap-6">
               <button onClick={playPrev} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"><SkipBack size={24} /></button>
               <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay} className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg" style={{ background: `linear-gradient(135deg, ${'#' + COLOR_PALETTES[currentPalette].colors[0].toString(16).padStart(6,'0')}, ${'#' + COLOR_PALETTES[currentPalette].colors[1].toString(16).padStart(6,'0')})` }}>
                 {isPlaying ? <Pause size={20} fill="black" className="text-black" /> : <Play size={20} fill="black" className="ml-1 text-black" />}
               </motion.button>
               <button onClick={playNext} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"><SkipForward size={24} /></button>
            </div>
            <div className="flex items-center gap-3 justify-end absolute right-8">
               <button onClick={() => setShowPlaylist(!showPlaylist)} className={`p-2 hover:text-white transition-colors ${showPlaylist ? 'text-white' : 'text-white/40'}`}><ListMusic size={20}/></button>
               <VolumeControl volume={volume} onVolumeChange={setVolume} paletteId={currentPalette} />
            </div>
        </div>
      </div>
      <audio ref={audioRef} src={currentTrack.audioSrc} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={(e) => setDuration(e.target.duration)} onEnded={playNext} crossOrigin="anonymous" />
    </div>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import './components/car-controls.ts';

export default function App() {
  const [speed, setSpeed] = useState(0);
  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState("Welcome to Adverssity. Drive carefully.");
  const [tip, setTip] = useState("Tip: Reduce speed in low visibility.");
  const [highBeam, setHighBeam] = useState(false);
  const [isOverSpeed, setIsOverSpeed] = useState(false);

  useEffect(() => {
    let car: any = null;
    let tipInterval: any = null;
    let listenersAttached = false;

    const handleSpeed = (e: any) => {
      const currentSpeed = parseInt(e.detail.speed);
      setSpeed(currentSpeed);
      if (currentSpeed > 80) {
        setIsOverSpeed(true);
        // Penalty for speeding - 5 points per update
        setPoints(prev => Math.max(0, prev - 5));
      } else {
        setIsOverSpeed(false);
      }
    };

    const handleCollision = () => {
      setMessage("CRASH! -100 Points");
      setPoints(prev => Math.max(0, prev - 100));
      setTimeout(() => setMessage("Drive carefully."), 2000);
    };

    const handleEvasion = () => {
      console.log("Evasion success event received");
      setPoints(prev => prev + 20); // Increased reward for successful passing
    };

    const handleBlinding = () => {
      // Penalty for blinding oncoming traffic with High Beam
      setPoints(prev => Math.max(0, prev - 10));
      setMessage("BLINDING TRAFFIC! Switch to Low Beam.");
      setTimeout(() => setMessage("Drive carefully."), 2000);
    };

    const handleBeam = (e: any) => {
      setHighBeam(e.detail.highBeam);
    };

    const attachListeners = () => {
      if (listenersAttached) return;
      car = document.querySelector('#player-car');
      if (car) {
        car.addEventListener('speed-update', handleSpeed);
        car.addEventListener('collision-alert', handleCollision);
        car.addEventListener('evasion-success', handleEvasion);
        car.addEventListener('blinding-penalty', handleBlinding);
        car.addEventListener('beam-toggle', handleBeam);
        listenersAttached = true;
        console.log("Listeners attached to car");
      }
    };

    const checkInterval = setInterval(attachListeners, 500);

    // Cycle tips
    const tips = [
      "Tip: Reduce speed in low visibility.",
      "Tip: Watch for pedestrians crossing.",
      "Tip: Maintain lane discipline.",
      "Tip: Use headlights to spot hazards early."
    ];
    let tipIdx = 0;
    tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % tips.length;
      setTip(tips[tipIdx]);
    }, 8000);

    return () => {
      clearInterval(checkInterval);
      if (car) {
        car.removeEventListener('speed-update', handleSpeed);
        car.removeEventListener('collision-alert', handleCollision);
        car.removeEventListener('evasion-success', handleEvasion);
        car.removeEventListener('blinding-penalty', handleBlinding);
        car.removeEventListener('beam-toggle', handleBeam);
      }
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div className="w-full h-screen relative font-sans overflow-hidden">
      {/* HUD Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none space-y-4">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Speed</div>
          <div className="text-4xl font-mono text-white leading-none">{speed} <span className="text-sm opacity-50">KM/H</span></div>
          {isOverSpeed && (
            <div className="text-red-500 text-[10px] font-bold mt-2 animate-pulse uppercase tracking-tighter">Over Speedlimit!</div>
          )}
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-yellow-400 font-bold mb-1">Points</div>
          <div className="text-4xl font-mono text-white leading-none">{points}</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <div className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-1">Headlights</div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${highBeam ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
            <div className="text-xl font-mono text-white leading-none uppercase">{highBeam ? 'High Beam' : 'Low Beam'}</div>
          </div>
          <div className="text-[10px] text-white/40 mt-2 uppercase tracking-tighter">Press [E] to Toggle</div>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl max-w-xs">
          <div className="text-xs uppercase tracking-widest text-white/50 font-bold mb-1">Status</div>
          <div className="text-sm text-white font-medium">{message}</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl max-w-xs">
          <div className="text-xs uppercase tracking-widest text-white/50 font-bold mb-1">Rules</div>
          <div className="text-[9px] text-white/70 space-y-1">
            <div>• Pass Traffic: <span className="text-emerald-400">+20 pts</span></div>
            <div>• Collision: <span className="text-red-400">-100 pts</span></div>
            <div>• Speeding (&gt;80): <span className="text-red-400">-5 pts/sec</span></div>
            <div>• Blinding Traffic: <span className="text-red-400">-10 pts</span></div>
          </div>
        </div>
      </div>

      {/* A-Frame Scene */}
      <a-scene 
        fog="type: exponential; color: #0a0a0f; density: 0.01"
        background="color: #0a0a0f"
        renderer="antialias: true; colorManagement: true"
        className="w-full h-full"
      >
        <a-assets>
          {/* Textures and Models */}
          <img id="road-texture" src="https://cdn.jsdelivr.net/gh/aframevr/sample-assets@master/assets/images/textures/ground/asphalt.jpg" crossOrigin="anonymous" />
          <img id="sky-texture" src="https://cdn.jsdelivr.net/gh/aframevr/sample-assets@master/assets/images/textures/skies/night.jpg" crossOrigin="anonymous" />
          <img id="window-texture" src="https://st3.depositphotos.com/1350793/18461/v/450/depositphotos_184611504-stock-illustration-seamless-pattern-night-windows-city.jpg" crossOrigin="anonymous" />
          
          {/* Car Model (Using a more robust model) */}
          <a-asset-item id="car-model" src="https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models/2.0/SciFiHelmet/glTF/SciFiHelmet.gltf"></a-asset-item>
          {/* Actually, let's use a real car model if we can find a stable one, otherwise primitives are safer for a "body" feel */}
          <a-asset-item id="sedan-model" src="https://cdn.aframe.io/test-models/models/glTF-2.0/virtualcity/models/car1.gltf"></a-asset-item>
        </a-assets>

        {/* Environment */}
        <a-sky src="#sky-texture" rotation="0 -90 0" follow-player="axis: both"></a-sky>
        
        {/* Highway - Very long for "Infinite" feel */}
        <a-plane 
          id="highway"
          position="0 0 -10000" 
          rotation="-90 0 0" 
          width="24" 
          height="20000" 
          src="#road-texture" 
          repeat="1 2000"
          material="roughness: 0.8; metalness: 0.2"
        ></a-plane>

        {/* Road Markings */}
        <a-entity position="0 0.01 0">
          {/* Center Dashed Line */}
          {Array.from({ length: 200 }).map((_, i) => (
            <a-plane 
              key={`dash-${i}`}
              position={`0 0 ${-i * 100}`} 
              rotation="-90 0 0" 
              width="0.2" 
              height="10" 
              color="#FFFFFF"
            ></a-plane>
          ))}
          {/* Side Solid Lines */}
          <a-plane position="-11.5 0 -10000" rotation="-90 0 0" width="0.3" height="20000" color="#FFFFFF"></a-plane>
          <a-plane position="11.5 0 -10000" rotation="-90 0 0" width="0.3" height="20000" color="#FFFFFF"></a-plane>
          <a-plane position="-11 0 -10000" rotation="-90 0 0" width="0.1" height="20000" color="#FFD700"></a-plane>
          <a-plane position="11 0 -10000" rotation="-90 0 0" width="0.1" height="20000" color="#FFD700"></a-plane>
        </a-entity>

        {/* Street Lights */}
        <a-entity>
          {Array.from({ length: 100 }).map((_, i) => (
            <a-entity key={i} position={`8 0 ${-i * 200}`}>
              <a-cylinder radius="0.1" height="8" color="#333"></a-cylinder>
              <a-box position="0 4 1" width="0.2" height="0.2" depth="2" color="#333"></a-box>
              {/* Visual only - no actual light source to prevent "too many uniforms" error */}
              <a-sphere position="0 4 2" radius="0.2" color="#FFFFA0" material="emissive: #FFFFA0; emissiveIntensity: 3"></a-sphere>
            </a-entity>
          ))}
        </a-entity>

        {/* Oncoming Traffic (Headlight Hazards) */}
        <a-entity>
          {Array.from({ length: 5 }).map((_, i) => (
            <a-entity key={i} position={`-4 0.5 ${-i * 150 - 50}`} animation="property: position; to: -4 0.5 50; dur: 10000; loop: true; easing: linear">
              <a-box width="2" height="1" depth="4" color="#444"></a-box>
              <a-light type="spot" position="0.8 0 -2" rotation="0 180 0" intensity="0.5" color="#FFF" distance="30"></a-light>
              <a-light type="spot" position="-0.8 0 -2" rotation="0 180 0" intensity="0.5" color="#FFF" distance="30"></a-light>
            </a-entity>
          ))}
        </a-entity>

        {/* Buildings / Props */}
        <a-entity>
          {Array.from({ length: 100 }).map((_, i) => (
            <a-box 
              key={i}
              position={`${i % 2 === 0 ? -25 : 25} 10 ${-i * 200}`} 
              width="15" 
              height="20" 
              depth="15" 
              color="#111"
              material="roughness: 1; metalness: 0"
            >
              {/* Windows with texture */}
              <a-plane position="0 5 7.6" width="12" height="8" color="#FFF" opacity="0.4" src="#window-texture" repeat="4 2"></a-plane>
              <a-plane position="0 -5 7.6" width="12" height="8" color="#FFF" opacity="0.4" src="#window-texture" repeat="4 2"></a-plane>
              <a-plane position="7.6 0 0" rotation="0 90 0" width="12" height="18" color="#FFF" opacity="0.3" src="#window-texture" repeat="4 4"></a-plane>
            </a-box>
          ))}
        </a-entity>

        {/* Trees / Foliage */}
        <a-entity>
          {Array.from({ length: 200 }).map((_, i) => (
            <a-entity key={i} position={`${i % 2 === 0 ? -12 : 12} 0 ${-i * 100}`}>
              <a-cylinder radius="0.2" height="4" color="#2b1d0e"></a-cylinder>
              <a-cone position="0 3 0" radius-bottom="1.5" radius-top="0" height="3" color="#0a1a0a"></a-cone>
            </a-entity>
          ))}
        </a-entity>

        {/* Player Car */}
        <a-entity 
          id="player-car" 
          car-controls 
          collision-detector
          position="0 0 0"
        >
          {/* External Car Body Model */}
          <a-entity gltf-model="#sedan-model" scale="1.0 1.0 1.0" rotation="0 180 0" position="0 0 0"></a-entity>
          
          {/* Interior / Cockpit (Guaranteed Visibility from Camera) */}
          <a-entity position="0 0.8 0">
            {/* Dashboard */}
            <a-box position="0 0.1 -0.5" width="1.4" height="0.3" depth="0.6" color="#111"></a-box>
            {/* Hood (Visible in front of driver) */}
            <a-box position="0 -0.2 -1.5" width="1.4" height="0.15" depth="2.5" color="#222"></a-box>
            {/* Steering Wheel */}
            <a-cylinder position="0.4 0.3 -0.4" rotation="60 0 0" radius="0.15" height="0.04" color="#000"></a-cylinder>
          </a-entity>

          {/* Physical Headlights (Visual) */}
          <a-sphere id="headlight-left" position="-0.6 0.5 -1.8" radius="0.15" color="#FFF" material="emissive: #FFF; emissiveIntensity: 5"></a-sphere>
          <a-sphere id="headlight-right" position="0.6 0.5 -1.8" radius="0.15" color="#FFF" material="emissive: #FFF; emissiveIntensity: 5"></a-sphere>
          
          {/* Tail Lights */}
          <a-box position="-0.6 0.5 1.8" width="0.4" height="0.2" depth="0.1" color="#900" material="emissive: #F00; emissiveIntensity: 2"></a-box>
          <a-box position="0.6 0.5 1.8" width="0.4" height="0.2" depth="0.1" color="#900" material="emissive: #F00; emissiveIntensity: 2"></a-box>

          {/* Light Beams */}
          <a-light type="spot" position="-0.6 0.5 -1.8" rotation="0 180 0" intensity="3.0" color="#FFF" distance="60" angle="45"></a-light>
          <a-light type="spot" position="0.6 0.5 -1.8" rotation="0 180 0" intensity="3.0" color="#FFF" distance="60" angle="45"></a-light>
          
          {/* Dashboard Camera - Positioned to see the hood and dashboard */}
          <a-entity camera position="0 1.5 0.8" look-controls="pointerLockEnabled: true">
            <a-cursor color="#FFF" opacity="0.5"></a-cursor>
          </a-entity>
        </a-entity>

        {/* Traffic System */}
        <a-entity traffic-system></a-entity>

        {/* Lighting */}
        <a-light type="ambient" color="#FFF" intensity="0.8"></a-light>
        <a-light type="directional" position="-1 10 1" intensity="0.5" color="#FFF"></a-light>
        {/* Speed Limit Signs */}
        <a-entity>
          {Array.from({ length: 50 }).map((_, i) => (
            <a-entity key={i} position={`-10 0 ${-i * 400}`}>
              <a-cylinder radius="0.1" height="4" color="#555"></a-cylinder>
              <a-circle position="0 3.5 0.1" radius="0.6" color="white" material="side: double">
                <a-text value="80" color="black" align="center" width="4" position="0 0 0.01"></a-text>
              </a-circle>
              <a-circle position="0 3.5 0.05" radius="0.7" color="red" material="side: double"></a-circle>
            </a-entity>
          ))}
        </a-entity>
      </a-scene>
    </div>
  );
}

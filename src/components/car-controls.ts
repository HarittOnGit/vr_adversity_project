/**
 * Car Controls Component for A-Frame
 * Handles movement, steering, and basic physics
 */

declare const AFRAME: any;

AFRAME.registerComponent('car-controls', {
  schema: {
    acceleration: { type: 'number', default: 0.5 },
    maxSpeed: { type: 'number', default: 2.0 },
    steeringSpeed: { type: 'number', default: 1.5 },
    friction: { type: 'number', default: 0.98 }
  },

  init: function () {
    this.velocity = 0;
    this.steering = 0;
    this.keys = {};
    this.highBeam = false;

    window.addEventListener('keydown', (e) => { 
      const key = e.key.toLowerCase();
      this.keys[key] = true; 
      
      // Toggle High Beam
      if (key === 'e') {
        this.highBeam = !this.highBeam;
        this.updateHeadlights();
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    console.log("Car controls initialized");
  },

  updateHeadlights: function() {
    const headlights = this.el.querySelectorAll('a-light[type="spot"]');
    const headlightVisuals = this.el.querySelectorAll('a-sphere[id^="headlight-"]');
    
    const intensity = this.highBeam ? 25.0 : 4.0;
    const distance = this.highBeam ? 500 : 80;
    const angle = this.highBeam ? 60 : 35;
    const emissiveIntensity = this.highBeam ? 30 : 6;

    headlights.forEach((light: any) => {
      light.setAttribute('intensity', intensity);
      light.setAttribute('distance', distance);
      light.setAttribute('angle', angle);
    });

    headlightVisuals.forEach((sphere: any) => {
      sphere.setAttribute('material', 'emissiveIntensity', emissiveIntensity);
    });

    this.el.emit('beam-toggle', { highBeam: this.highBeam });
  },

  tick: function (time: number, timeDelta: number) {
    const delta = timeDelta / 1000;
    const data = this.data;

    // Acceleration / Braking
    if (this.keys['w']) {
      this.velocity += data.acceleration * delta;
    } else if (this.keys['s']) {
      this.velocity -= data.acceleration * 1.5 * delta; // Stronger braking
    } else {
      this.velocity *= 0.99; // Less aggressive friction for smoother coasting
    }

    // Clamp speed
    this.velocity = Math.max(-data.maxSpeed / 3, Math.min(this.velocity, data.maxSpeed));

    // Steering - More gradual and smoother
    const steeringTarget = this.keys['a'] ? 1.0 : (this.keys['d'] ? -1.0 : 0);
    this.steering += (steeringTarget - this.steering) * 0.1; // Lerp steering

    // Apply rotation
    const rotation = this.el.getAttribute('rotation');
    if (!rotation) return;
    rotation.y += this.steering * this.velocity * 10;
    (this.el as any).setAttribute('rotation', rotation);

    // Apply movement
    const position = this.el.getAttribute('position');
    if (!position) return;
    const angle = rotation.y * (Math.PI / 180);
    
    // In A-Frame, forward is usually negative Z, but we'll stick to a consistent coordinate system
    position.x -= Math.sin(angle) * this.velocity;
    position.z -= Math.cos(angle) * this.velocity;
    
    (this.el as any).setAttribute('position', position);

    // Emit speed for UI
    this.el.emit('speed-update', { speed: Math.abs(this.velocity * 50).toFixed(0) });
  }
});

/**
 * Traffic System Component
 * Spawns and moves obstacles/traffic
 */
AFRAME.registerComponent('traffic-system', {
  init: function () {
    this.spawnTimer = 0;
    this.obstacles = [];
    this.playerCar = document.querySelector('#player-car');
    this.lastPlayerZ = 0;
    console.log("Traffic system initialized. Waiting for player car...");
  },

  tick: function (time: number, timeDelta: number) {
    if (!this.playerCar) {
      this.playerCar = document.querySelector('#player-car');
      if (!this.playerCar) return;
    }

    // Ensure object3D is ready
    if (!this.playerCar.object3D) return;

    const playerPos = this.playerCar.object3D.position;
    if (!playerPos) return;

    // Continuous spawning every 2.5 seconds
    this.spawnTimer += timeDelta;
    if (this.spawnTimer > 2500) {
      // Limit obstacles to prevent performance issues
      if (this.obstacles.length < 20) {
        this.spawnObstacle();
      }
      this.spawnTimer = 0;
    }

    // Move obstacles and check collision
    const playerControls = this.playerCar.components['car-controls'];
    const isHighBeam = playerControls ? playerControls.highBeam : false;
    const dt = timeDelta / 1000;
    const trafficSpeed = 25; // Units per second

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      try {
        const obj = this.obstacles[i];
        if (!obj || !obj.parentNode || !obj.object3D) {
          this.obstacles.splice(i, 1);
          continue;
        }
        
        const pos = obj.object3D.position;
        
        // Move towards the player (oncoming traffic moves in +Z)
        pos.z += trafficSpeed * dt; 

        // Simple collision detection
        const dist = Math.sqrt(
          Math.pow(pos.x - playerPos.x, 2) +
          Math.pow(pos.z - playerPos.z, 2)
        );

        // High Beam Penalty Logic:
        // If car is oncoming (ahead of player) and within 40m and high beam is on
        if (isHighBeam && pos.z < playerPos.z && pos.z > playerPos.z - 40) {
          // Only penalize if in the oncoming lane (left side, x < 0)
          if (pos.x < 0 && !obj.hasPenalized) {
            obj.hasPenalized = true;
            this.playerCar.emit('blinding-penalty');
          }
        }

        // Collision check
        if (dist < 3.5) {
          this.playerCar.emit('collision-alert');
          if (obj.parentNode) obj.parentNode.removeChild(obj);
          this.obstacles.splice(i, 1);
          continue;
        }

        // Evasion Success - Use a flag to ensure it only fires once
        if (!obj.hasPassed && pos.z > playerPos.z) {
          obj.hasPassed = true;
          this.playerCar.emit('evasion-success');
        }

        // Cleanup: Remove if far behind or way too far ahead
        if (pos.z > playerPos.z + 50 || pos.z < playerPos.z - 600) {
          if (obj.parentNode) obj.parentNode.removeChild(obj);
          this.obstacles.splice(i, 1);
        }
      } catch (e) {
        console.error("Error in traffic tick for obstacle:", e);
        this.obstacles.splice(i, 1);
      }
    }
    this.lastPlayerZ = playerPos.z;
  },

  spawnObstacle: function () {
    try {
      const sceneEl = this.el.sceneEl;
      if (!sceneEl) return;
      
      const obstacle = document.createElement('a-entity');
      
      // Random lane
      const xPos = (Math.random() - 0.5) * 12;
      // Spawn ahead of the player's current position
      if (!this.playerCar || !this.playerCar.object3D) return;
      const playerPos = this.playerCar.object3D.position;
      const zPos = playerPos.z - 250; // Spawn further ahead

      (obstacle as any).setAttribute('position', { x: xPos, y: 0, z: zPos });
      obstacle.setAttribute('class', 'obstacle');
      
      // Use GLB model for traffic
      obstacle.setAttribute('gltf-model', '#sedan-model');
      obstacle.setAttribute('scale', '1.0 1.0 1.0'); // Match player car scale
      
      // Add a colored overlay or just a light to distinguish
      const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // Fallback box in case model fails to load or is invisible
      const fallback = document.createElement('a-box');
      fallback.setAttribute('width', '1.8');
      fallback.setAttribute('height', '1.0');
      fallback.setAttribute('depth', '4');
      fallback.setAttribute('color', randomColor);
      fallback.setAttribute('opacity', '0.3');
      obstacle.appendChild(fallback);
      
      // Add glowing tail lights to traffic
      const tailLightLeft = document.createElement('a-box');
      tailLightLeft.setAttribute('position', '-0.7 0.6 -2');
      tailLightLeft.setAttribute('width', '0.4');
      tailLightLeft.setAttribute('height', '0.2');
      tailLightLeft.setAttribute('depth', '0.1');
      tailLightLeft.setAttribute('color', '#900');
      tailLightLeft.setAttribute('material', 'emissive: #F00; emissiveIntensity: 1');
      obstacle.appendChild(tailLightLeft);

      const tailLightRight = document.createElement('a-box');
      tailLightRight.setAttribute('position', '0.7 0.6 -2');
      tailLightRight.setAttribute('width', '0.4');
      tailLightRight.setAttribute('height', '0.2');
      tailLightRight.setAttribute('depth', '0.1');
      tailLightRight.setAttribute('color', '#900');
      tailLightRight.setAttribute('material', 'emissive: #F00; emissiveIntensity: 1');
      obstacle.appendChild(tailLightRight);

      sceneEl.appendChild(obstacle);
      this.obstacles.push(obstacle);
      console.log("Spawned car at Z:", zPos);
    } catch (e) {
      console.error("Error spawning obstacle:", e);
    }
  }
});

/**
 * Collision Feedback Component
 */
AFRAME.registerComponent('collision-detector', {
  init: function () {
    this.el.addEventListener('collide', (e: any) => {
      const target = e.detail.body.el;
      if (target && target.classList.contains('obstacle')) {
        this.el.emit('collision-alert');
      }
    });
  }
});

/**
 * Follow Player Component
 * Keeps an entity (like sky or road) centered on the player's Z-axis
 */
AFRAME.registerComponent('follow-player', {
  schema: {
    target: { type: 'selector', default: '#player-car' },
    axis: { type: 'string', default: 'z' }
  },
  tick: function () {
    if (!this.data.target) return;
    const targetPos = this.data.target.getAttribute('position');
    const currentPos = this.el.getAttribute('position');
    if (!targetPos || !currentPos) return;
    
    if (this.data.axis === 'z') {
      currentPos.z = targetPos.z;
    } else if (this.data.axis === 'both') {
      currentPos.x = targetPos.x;
      currentPos.z = targetPos.z;
    }
    
    (this.el as any).setAttribute('position', currentPos);
  }
});

// plexGraph.js - TheBrain-inspired 3D Plex Graph Layout & Node Engine

class PlexGraph {
  constructor(engine) {
    this.engine = engine;
    this.graphGroup = new THREE.Group();
    this.engine.scene.add(this.graphGroup);

    this.nodes = [];
    this.links = [];
    this.childLinks = [];
    this.animatedRings = [];
    this.labelSprites = [];
    this.dataPulses = [];
    this.syncWaves = [];
    this.orbitTracks = [];

    this.orbitTracksGroup = new THREE.Group();
    this.graphGroup.add(this.orbitTracksGroup);

    this.dataPulseGroup = new THREE.Group();
    this.graphGroup.add(this.dataPulseGroup);

    this.syncPulseGroup = new THREE.Group();
    this.graphGroup.add(this.syncPulseGroup);

    this.currentData = null;
    this.showRings = true;
    this.showLabels = true;
    this.showDataPulses = true;
    this.showSyncPulses = true;
    this.showOrbitTracks = true;
    this.maxOrbitRadius = 80;
    this.pulseSpeedFactor = 1.0;

    // Palette of glowing Sci-Fi colors
    this.colors = {
      system: 0x00f0ff,
      drive: 0x38bdf8,
      folder: 0xffb700,
      executable: 0xff0055,
      code: 0x00ff9d,
      document: 0x60a5fa,
      image: 0xb026ff,
      video: 0xa855f7,
      audio: 0xec4899,
      archive: 0xf97316,
      window: 0xd946ef,
      file: 0x94a3b8
    };
  }

  clear() {
    while (this.graphGroup.children.length > 0) {
      const obj = this.graphGroup.children[0];
      this.graphGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    this.orbitTracksGroup = new THREE.Group();
    this.orbitTracksGroup.visible = this.showOrbitTracks;
    this.graphGroup.add(this.orbitTracksGroup);

    this.dataPulseGroup = new THREE.Group();
    this.dataPulseGroup.visible = this.showDataPulses;
    this.graphGroup.add(this.dataPulseGroup);

    this.syncPulseGroup = new THREE.Group();
    this.syncPulseGroup.visible = this.showSyncPulses;
    this.graphGroup.add(this.syncPulseGroup);

    this.nodes = [];
    this.links = [];
    this.childLinks = [];
    this.animatedRings = [];
    this.labelSprites = [];
    this.dataPulses = [];
    this.syncWaves = [];
    this.orbitTracks = [];
    this.engine.interactiveObjects = [];
  }

  loadData(payload) {
    this.clear();
    this.currentData = payload;

    const centerNodeData = payload.currentNode || { name: "System", itemType: "system" };
    centerNodeData.role = "center";

    // 1. Center Active Thought (The Core)
    const centerMesh = this.createNodeMesh(centerNodeData, new THREE.Vector3(0, 0, 0), true);
    this.graphGroup.add(centerMesh);
    this.nodes.push(centerMesh);

    // 2. Parents Upward (+Y)
    const parents = payload.parents || [];
    let prevParentPos = centerMesh.position;
    for (let i = 0; i < parents.length; i++) {
      const pData = parents[i];
      pData.role = "parent";
      const yOffset = 18 + i * 14;
      const xOffset = Math.sin(i * 0.4) * 5;
      const zOffset = Math.cos(i * 0.4) * 4;
      const pPos = new THREE.Vector3(xOffset, yOffset, zOffset);

      const pMesh = this.createNodeMesh(pData, pPos, false, 0.85);
      this.graphGroup.add(pMesh);
      this.nodes.push(pMesh);

      // Link between parent and child
      const link = this.createLink(prevParentPos, pPos, 0x00f0ff, 0.5, true);
      this.graphGroup.add(link);
      this.links.push(link);
      prevParentPos = pPos;
    }

    // 3. Concentric Planetary Orbits around the Root Element
    const allChildren = payload.children || [];
    const dirs = allChildren.filter(c => c.isDirectory || c.isDrive);
    const files = allChildren.filter(c => !c.isDirectory && !c.isDrive);
    const windows = payload.windows || [];

    let r1 = 0, r2 = 0, r3 = 0;

    // Orbit 1: Folders / Subdirectories / Drives (Primary tier)
    if (dirs.length > 0) {
      r1 = Math.max(20, Math.min(36, 15 + dirs.length * 1.1));
      this.createOrbitTrack(r1, 0xffb700, 0.22);

      for (let i = 0; i < dirs.length; i++) {
        const cData = dirs[i];
        cData.role = "child";
        const angle = (i / dirs.length) * Math.PI * 2;
        const posX = Math.cos(angle) * r1;
        const posZ = Math.sin(angle) * r1;
        const posY = Math.sin(angle * 2) * 1.2;

        const cPos = new THREE.Vector3(posX, posY, posZ);
        const cMesh = this.createNodeMesh(cData, cPos, false, 0.7);
        this.graphGroup.add(cMesh);
        this.nodes.push(cMesh);

        const linkColor = this.colors[cData.itemType] || 0xffb700;
        const link = this.createLink(new THREE.Vector3(0, 0, 0), cPos, linkColor, 0.35);
        this.graphGroup.add(link);
        this.links.push(link);
      }
    }

    // Orbit 2: Files / Documents / Media (Secondary tier)
    if (files.length > 0) {
      const baseR2 = dirs.length > 0 ? (r1 + 18) : 24;
      r2 = baseR2 + Math.min(22, files.length * 0.35);
      this.createOrbitTrack(r2, 0x00f0ff, 0.18);

      for (let i = 0; i < files.length; i++) {
        const cData = files[i];
        cData.role = "child";
        const angle = (i / files.length) * Math.PI * 2;
        const posX = Math.cos(angle) * r2;
        const posZ = Math.sin(angle) * r2;
        const posY = Math.sin(angle * 3) * 1.8;

        const cPos = new THREE.Vector3(posX, posY, posZ);
        const cMesh = this.createNodeMesh(cData, cPos, false, 0.6);
        this.graphGroup.add(cMesh);
        this.nodes.push(cMesh);

        const linkColor = this.colors[cData.itemType] || 0x00f0ff;
        const link = this.createLink(new THREE.Vector3(0, 0, 0), cPos, linkColor, 0.3);
        this.graphGroup.add(link);
        this.links.push(link);
      }
    }

    // Orbit 3: Active Application Windows (Outer Peripheral Tier)
    const winCount = Math.min(windows.length, 12);
    if (winCount > 0) {
      const maxInnerRadius = Math.max(r1, r2, 24);
      r3 = Math.max(maxInnerRadius + 22, 54);
      this.createOrbitTrack(r3, 0xd946ef, 0.16);

      for (let i = 0; i < winCount; i++) {
        const w = windows[i];
        const wData = {
          name: w.title.length > 22 ? w.title.substring(0, 20) + "..." : w.title,
          fullPath: w.processName,
          itemType: "window",
          role: "window",
          windowHandle: w.hwnd,
          processName: w.processName,
          processId: w.processId
        };

        const angle = -Math.PI / 3 + (i / Math.max(1, winCount - 1)) * (Math.PI * 0.7);
        const posX = Math.cos(angle) * r3 + 12;
        const posZ = Math.sin(angle) * r3;
        const posY = (i - winCount / 2) * 4;

        const wPos = new THREE.Vector3(posX, posY, posZ);
        const wMesh = this.createNodeMesh(wData, wPos, false, 0.75);
        this.graphGroup.add(wMesh);
        this.nodes.push(wMesh);

        const link = this.createLink(new THREE.Vector3(0, 0, 0), wPos, 0xd946ef, 0.4);
        this.graphGroup.add(link);
        this.links.push(link);
      }
    }

    const outerRadius = Math.max(r1, r2, r3, 42);

    // Setup synchronized concentric wave pulses propagating outward along child links
    this.setupSyncWaves(outerRadius);

    // Automatically transition camera to encompass the planetary system
    this.engine.flyCameraTo(
      new THREE.Vector3(0, Math.max(34, outerRadius * 0.75), outerRadius * 1.35 + 24),
      new THREE.Vector3(0, 0, 0)
    );
  }

  /* =========================================================================
   * SPATIAL CONTINUITY TRANSITIONS (Constellation / Plex)
   * ========================================================================= */

  // 1. Dive towards selected planet and transition into new system
  animateDiveIn(targetMesh, onComplete) {
    if (!targetMesh) {
      if (onComplete) onComplete();
      return;
    }

    const targetPos = new THREE.Vector3();
    targetMesh.getWorldPosition(targetPos);

    // Camera zooms into target planet
    const camTarget = new THREE.Vector3(targetPos.x, targetPos.y + 1.2, targetPos.z + 4.5);
    this.engine.flyCameraTo(camTarget, targetPos, 450);

    const startTime = performance.now();
    const duration = 400;

    const animateOut = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease = progress * progress;

      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        if (n !== targetMesh && n.userData !== targetMesh.userData) {
          n.scale.setScalar(Math.max(0.01, 1.0 - ease));
        }
      }

      for (let i = 0; i < this.links.length; i++) {
        if (this.links[i].material) {
          this.links[i].material.opacity = Math.max(0, 0.4 * (1.0 - ease));
        }
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateOut);
      } else {
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateOut);
  }

  // 2. Ascend to parent constellation: contract current planets inward
  animateAscend(onComplete) {
    // Elevate camera back and up
    const currentCam = this.engine.camera.position;
    const backCam = new THREE.Vector3(currentCam.x * 0.4, currentCam.y + 40, currentCam.z * 1.5 + 35);
    this.engine.flyCameraTo(backCam, new THREE.Vector3(0, 0, 0), 500);

    const startTime = performance.now();
    const duration = 450;

    const nodePositions = this.nodes.map(n => ({
      mesh: n,
      startPos: n.position.clone()
    }));

    const animateContract = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease = progress * progress;

      for (let i = 0; i < nodePositions.length; i++) {
        const item = nodePositions[i];
        item.mesh.position.lerpVectors(item.startPos, new THREE.Vector3(0, 0, 0), ease);
        item.mesh.scale.setScalar(Math.max(0.01, 1.0 - ease));
      }

      for (let i = 0; i < this.links.length; i++) {
        if (this.links[i].material) {
          this.links[i].material.opacity = Math.max(0, 0.4 * (1.0 - ease));
        }
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateContract);
      } else {
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateContract);
  }

  createNodeMesh(data, position, isCenter = false, scaleFactor = 1.0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.userData = { nodeData: data, isCenter: isCenter };

    const colorHex = this.colors[data.itemType] || 0x00f0ff;

    // Escala dinámica del planeta según tamaño en disco
    let sizeScale = 1.0;
    if (!isCenter) {
      if (data.isDirectory || data.isDrive) {
        const count = data.childCount || 0;
        sizeScale = 0.85 + Math.min(0.55, Math.log10(Math.max(1, count) + 1) * 0.22);
      } else if (data.sizeBytes !== undefined && data.sizeBytes !== null) {
        const bytes = Math.max(0, Number(data.sizeBytes) || 0);
        if (bytes <= 0) {
          sizeScale = 0.72;
        } else {
          // Escala logarítmica suave: 1KB ~ 0.85x, 1MB ~ 1.1x, 100MB ~ 1.35x, 1GB+ ~ 1.65x
          const logVal = Math.log10(bytes);
          sizeScale = Math.max(0.68, Math.min(1.68, 0.68 + (logVal / 9) * 0.95));
        }
      }
    }

    const baseRadius = isCenter ? 2.8 : 1.45 * scaleFactor * sizeScale;

    // 1. Core Geometry
    let geometry;
    if (data.itemType === "folder" || data.itemType === "drive") {
      geometry = new THREE.SphereGeometry(baseRadius, 24, 24);
    } else if (data.itemType === "executable") {
      geometry = new THREE.OctahedronGeometry(baseRadius * 1.1, 0);
    } else if (data.itemType === "code") {
      geometry = new THREE.DodecahedronGeometry(baseRadius, 0);
    } else if (data.itemType === "window") {
      geometry = new THREE.BoxGeometry(baseRadius * 2.0, baseRadius * 1.1, baseRadius * 1.1);
    } else {
      geometry = new THREE.SphereGeometry(baseRadius, 16, 16);
    }

    // Material with refined emissive intensity (not too bright / blinding)
    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: isCenter ? 0.45 : 0.28,
      roughness: 0.35,
      metalness: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // 2. Sleek Torus Orbital Ring (Clean and high-tech, replacing jagged wireframe)
    const ringGeo = new THREE.TorusGeometry(baseRadius * 1.38, 0.035, 6, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: isCenter ? 0.6 : 0.35
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.visible = this.showRings;
    group.add(ring);
    this.animatedRings.push({ mesh: ring, speed: (Math.random() - 0.5) * 0.015 + 0.008 });

    // 3. Floating Text Sprite (with constant screen-space size scaling)
    const labelSprite = this.createTextSprite(data.name, colorHex, isCenter);
    labelSprite.position.set(0, isCenter ? -baseRadius - 2.2 : -baseRadius - 1.5, 0);
    labelSprite.visible = this.showLabels;
    group.add(labelSprite);
    this.labelSprites.push({ sprite: labelSprite, isCenter: isCenter, group: group });

    // 4. Hover Animations
    group.onHoverEnter = () => {
      mesh.scale.set(1.2, 1.2, 1.2);
      material.emissiveIntensity = isCenter ? 0.75 : 0.6;
      ring.scale.set(1.2, 1.2, 1.2);
      ringMat.opacity = 0.8;
      if (!this.showLabels && labelSprite) labelSprite.visible = true;
    };

    group.onHoverExit = () => {
      mesh.scale.set(1, 1, 1);
      material.emissiveIntensity = isCenter ? 0.45 : 0.28;
      ring.scale.set(1, 1, 1);
      ringMat.opacity = isCenter ? 0.6 : 0.35;
      if (!this.showLabels && labelSprite) labelSprite.visible = false;
    };

    mesh.userData = group.userData;
    ring.userData = group.userData;
    this.engine.interactiveObjects.push(mesh);
    this.engine.interactiveObjects.push(ring);
    return group;
  }

  createTextSprite(text, colorHex, isCenter = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background pill
    ctx.fillStyle = isCenter ? 'rgba(0, 240, 255, 0.25)' : 'rgba(3, 7, 18, 0.65)';
    ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = isCenter ? 4 : 2;

    const cornerRadius = 18;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(16, 20, 480, 88, cornerRadius);
    } else {
      ctx.rect(16, 20, 480, 88);
    }
    ctx.fill();
    ctx.stroke();

    // Text formatting
    ctx.font = isCenter ? 'bold 36px Segoe UI' : '30px Segoe UI';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let displayText = text || 'Unnamed';
    if (displayText.length > 24) displayText = displayText.substring(0, 22) + '...';
    ctx.fillText(displayText, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    const spriteScale = isCenter ? 8.5 : 6.0;
    sprite.scale.set(spriteScale, spriteScale * 0.25, 1);

    return sprite;
  }

  createDataPulseForLink(curve, colorHex) {
    if (!curve) return;

    if (!this.dataPulseGeometry) {
      this.dataPulseGeometry = new THREE.SphereGeometry(0.09, 6, 6);
    }

    // Spawn 2 pulses per curve with staggered phases for continuous asynchronous neural traffic
    for (let p = 0; p < 2; p++) {
      const material = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });

      const mesh = new THREE.Mesh(this.dataPulseGeometry, material);
      mesh.visible = this.showDataPulses;
      this.dataPulseGroup.add(mesh);

      this.dataPulses.push({
        mesh: mesh,
        curve: curve,
        progress: (p * 0.5 + Math.random() * 0.15) % 1.0,
        speed: 0.006 + Math.random() * 0.003
      });
    }
  }

  createLink(start, end, colorHex, opacity = 0.4, isParent = false) {
    const points = [];
    points.push(start);

    // Add subtle curvature for organic aesthetic
    if (!isParent) {
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mid.y += Math.sin(start.distanceTo(end) * 0.05) * 2;
      points.push(mid);
    }
    points.push(end);

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(24);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const material = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: opacity,
      linewidth: 1
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { curve: curve, isParent: isParent };

    // If connecting outward to a child, register for synchronized pulses & create async stream
    if (!isParent) {
      const distance = start.distanceTo(end);
      this.childLinks.push({
        curve: curve,
        distance: Math.max(1, distance),
        colorHex: colorHex
      });
      this.createDataPulseForLink(curve, colorHex);
    }

    return line;
  }

  filterNodes(query) {
    if (!query) {
      this.nodes.forEach(n => n.visible = true);
      this.links.forEach(l => l.visible = true);
      return;
    }

    const q = query.toLowerCase();
    this.nodes.forEach(n => {
      const d = n.userData.nodeData;
      if (n.userData.isCenter) {
        n.visible = true;
      } else if (d && d.name && d.name.toLowerCase().includes(q)) {
        n.visible = true;
      } else {
        n.visible = false;
      }
    });
  }

  createOrbitTrack(radius, colorHex = 0x00f0ff, opacity = 0.2) {
    const segments = 128;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending
    });
    const track = new THREE.Line(geometry, material);
    track.visible = this.showOrbitTracks;
    this.orbitTracksGroup.add(track);
    this.orbitTracks.push(track);
    return track;
  }

  setupSyncWaves(maxRadius) {
    this.maxOrbitRadius = Math.max(25, maxRadius + 2);
    this.syncWaves = [];

    if (!this.syncPulseGeometry) {
      this.syncPulseGeometry = new THREE.SphereGeometry(0.11, 6, 6);
    }

    // 2 concentric wave fronts with staggered phases (0.0 and 0.5)
    // so an expanding ring of particles is continuously travelling outward
    const wavePhases = [0.0, 0.5];

    wavePhases.forEach((initPhase, waveIdx) => {
      const waveParticles = [];

      for (let i = 0; i < this.childLinks.length; i++) {
        const linkInfo = this.childLinks[i];
        const mat = new THREE.MeshBasicMaterial({
          color: linkInfo.colorHex || 0x00f0ff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const mesh = new THREE.Mesh(this.syncPulseGeometry, mat);
        mesh.visible = false;
        this.syncPulseGroup.add(mesh);

        waveParticles.push({
          mesh: mesh,
          curve: linkInfo.curve,
          distance: linkInfo.distance,
          colorHex: linkInfo.colorHex
        });
      }

      this.syncWaves.push({
        progress: initPhase,
        speed: 0.004,
        particles: waveParticles
      });
    });
  }

  setOrbitTracksVisible(visible) {
    this.showOrbitTracks = visible;
    if (this.orbitTracksGroup) {
      this.orbitTracksGroup.visible = visible;
    }
  }

  setRingsVisible(visible) {
    this.showRings = visible;
    this.animatedRings.forEach(r => {
      if (r.mesh) r.mesh.visible = visible;
    });
  }

  setLabelsVisible(visible) {
    this.showLabels = visible;
    this.labelSprites.forEach(l => {
      if (l.sprite) l.sprite.visible = visible;
    });
  }

  setDataPulsesVisible(visible) {
    this.showDataPulses = visible;
    if (this.dataPulseGroup) {
      this.dataPulseGroup.visible = visible;
    }
    if (this.dataPulses) {
      this.dataPulses.forEach(p => {
        if (p.mesh) p.mesh.visible = visible;
      });
    }
  }

  setSyncPulsesVisible(visible) {
    this.showSyncPulses = visible;
    if (this.syncPulseGroup) {
      this.syncPulseGroup.visible = visible;
    }
    if (this.syncWaves) {
      this.syncWaves.forEach(w => {
        if (w.particles) {
          w.particles.forEach(p => {
            if (p.mesh) p.mesh.visible = visible;
          });
        }
      });
    }
  }

  setPulsesVisible(visible) {
    this.setDataPulsesVisible(visible);
    this.setSyncPulsesVisible(visible);
  }

  setPulseSpeed(factor) {
    this.pulseSpeedFactor = Math.max(0.05, factor);
  }

  onRenderFrame(time) {
    // 1. Animate holographic node rings
    if (this.showRings) {
      for (let i = 0; i < this.animatedRings.length; i++) {
        const ringObj = this.animatedRings[i];
        if (ringObj.mesh && ringObj.mesh.visible) {
          ringObj.mesh.rotation.z += ringObj.speed;
        }
      }
    }

    // 2. Maintain constant screen size for text label sprites (Zoom-invariant labels)
    if (this.engine.camera && this.labelSprites) {
      const camPos = this.engine.camera.position;
      for (let i = 0; i < this.labelSprites.length; i++) {
        const item = this.labelSprites[i];
        if (item.sprite && item.sprite.visible && item.group) {
          const dist = camPos.distanceTo(item.group.position);
          // Scale proportional to distance so visual screen size remains constant
          const s = Math.max(0.5, dist * 0.046);
          const w = item.isCenter ? s * 4.2 : s * 3.4;
          const h = item.isCenter ? s * 1.05 : s * 0.85;
          item.sprite.scale.set(w, h, 1);
        }
      }
    }

    // 3. Animate asynchronous data stream pulses along link lines
    if (this.showDataPulses && this.dataPulses && this.dataPulses.length > 0) {
      for (let i = 0; i < this.dataPulses.length; i++) {
        const pulse = this.dataPulses[i];
        if (!pulse.curve || !pulse.mesh) continue;

        pulse.progress = (pulse.progress + pulse.speed * this.pulseSpeedFactor) % 1.0;
        const pos = pulse.curve.getPointAt(pulse.progress);
        pulse.mesh.position.copy(pos);

        // Smooth fade-in near center and fade-out near target
        let alpha = 1.0;
        if (pulse.progress < 0.18) {
          alpha = pulse.progress / 0.18;
        } else if (pulse.progress > 0.82) {
          alpha = (1.0 - pulse.progress) / 0.18;
        }
        pulse.mesh.material.opacity = alpha * 0.85;

        // Subtle pulsation in scale
        const s = 0.85 + Math.sin(time * 0.006 + i) * 0.25;
        pulse.mesh.scale.set(s, s, s);
      }
    }

    // 4. Animate Synchronized Concentric Wave Particles (moving outward in unison along lines)
    if (this.showSyncPulses && this.syncWaves && this.syncWaves.length > 0) {
      for (let w = 0; w < this.syncWaves.length; w++) {
        const wave = this.syncWaves[w];
        wave.progress = (wave.progress + wave.speed * this.pulseSpeedFactor) % 1.0;

        const currentRadius = wave.progress * this.maxOrbitRadius;

        for (let p = 0; p < wave.particles.length; p++) {
          const item = wave.particles[p];
          if (!item.mesh || !item.curve) continue;

          // If the wave has not yet reached the end of this link
          if (currentRadius <= item.distance) {
            item.mesh.visible = true;
            const u = Math.max(0.001, Math.min(0.999, currentRadius / item.distance));
            const pos = item.curve.getPointAt(u);
            item.mesh.position.copy(pos);

            // Opacity envelope: smooth fade-in at root, brilliant in transit, smooth fade-out at node
            let alpha = 1.0;
            if (u < 0.12) {
              alpha = u / 0.12;
            } else if (u > 0.85) {
              alpha = (1.0 - u) / 0.15;
            }
            item.mesh.material.opacity = alpha * 0.95;

            // Breathing scale of the wavefront particles
            const s = 1.0 + Math.sin(wave.progress * Math.PI * 4 + w) * 0.25;
            item.mesh.scale.set(s, s, s);
          } else {
            // Wave reached this node; hide until wave wraps around
            item.mesh.visible = false;
          }
        }
      }
    }
  }
}

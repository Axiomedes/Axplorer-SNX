// neuralNetwork.js - Organic 3D Neural Network & Nebula Navigation Mode for Axplorer SNX

class NeuralNetwork {
  constructor(engine, bridge) {
    this.engine = engine;
    this.bridge = bridge;

    // Main 3D container group in Three.js scene
    this.neuralGroup = new THREE.Group();
    this.neuralGroup.visible = false;
    this.engine.scene.add(this.neuralGroup);

    // Dedicated Subgroups for layering and performance
    this.nebulaParticleGroup = new THREE.Group();
    this.synapseGroup = new THREE.Group();
    this.synapseParticleGroup = new THREE.Group();
    this.concentricWaveGroup = new THREE.Group();
    this.actionPotentialGroup = new THREE.Group();
    this.neuronGroup = new THREE.Group();
    this.labelGroup = new THREE.Group();
    this.warpGroup = new THREE.Group();
    this.conduitGroup = new THREE.Group();

    this.neuralGroup.add(this.nebulaParticleGroup);
    this.neuralGroup.add(this.synapseGroup);
    this.neuralGroup.add(this.synapseParticleGroup);
    this.neuralGroup.add(this.concentricWaveGroup);
    this.neuralGroup.add(this.actionPotentialGroup);
    this.neuralGroup.add(this.neuronGroup);
    this.neuralGroup.add(this.labelGroup);
    this.neuralGroup.add(this.warpGroup);
    this.neuralGroup.add(this.conduitGroup);

    // State collections
    this.currentData = null;
    this.neurons = [];
    this.nebulas = [];
    this.synapses = [];
    this.nebulaClouds = [];
    this.labelSprites = [];
    this.activeNodes = [];
    this.concentricWaves = [];
    this.conduitParticles = [];
    this.conduitRingMesh = null;
    this.ascendPortalMesh = null;
    this.warpActive = false;

    // Settings
    this.showLabels = true;
    this.pulseSpeedFactor = 1.0;
    this.maxNetworkRadius = 75;

    // Color Palette for Neural Elements
    this.colors = {
      rootNebula: 0x00f0ff,     // Electric Cyan Core
      folderNebula: 0xbd00ff,   // Bio-Violet / Magenta Neural Ganglia
      drive: 0x38bdf8,          // Sky Blue
      system: 0x00f0ff,         // Cyan
      code: 0x00ffaa,           // Emerald / Mint Synapse
      document: 0x60a5fa,       // Electric Blue
      image: 0xd946ef,          // Fuchsia / Violet
      video: 0xa855f7,          // Purple
      audio: 0xf43f5e,          // Rose / Coral
      archive: 0xf59e0b,        // Amber
      executable: 0xff0055,     // Hot Crimson
      file: 0x94a3b8            // Slate
    };

    // Shared geometries for efficiency
    this.sharedParticleGeo = new THREE.BufferGeometry();
    this.sharedSphereGeo = new THREE.SphereGeometry(1, 16, 16);
    this.sharedSmallPulseGeo = new THREE.SphereGeometry(0.12, 6, 6);
  }

  /* =========================================================================
   * CLEAR / DISPOSE
   * ========================================================================= */
  clear() {
    const disposeGroup = (group) => {
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      }
    };

    disposeGroup(this.nebulaParticleGroup);
    disposeGroup(this.synapseGroup);
    disposeGroup(this.synapseParticleGroup);
    disposeGroup(this.concentricWaveGroup);
    disposeGroup(this.actionPotentialGroup);
    disposeGroup(this.neuronGroup);
    disposeGroup(this.labelGroup);
    disposeGroup(this.warpGroup);
    disposeGroup(this.conduitGroup);

    this.neurons = [];
    this.nebulas = [];
    this.synapses = [];
    this.nebulaClouds = [];
    this.labelSprites = [];
    this.activeNodes = [];
    this.concentricWaves = [];
    this.conduitParticles = [];
    this.conduitRingMesh = null;
    this.ascendPortalMesh = null;

    // Reset interactive objects when clearing neural mode
    if (this.neuralGroup.visible) {
      this.engine.interactiveObjects = [];
    }
  }

  /* =========================================================================
   * LOAD DATA & CONSTRUCT NEURAL NETWORK
   * ========================================================================= */
  loadData(payload) {
    this.clear();
    this.currentData = payload;

    const rootData = payload.currentNode || { name: "Neural Root", itemType: "system", isDirectory: true };
    rootData.isRoot = true;

    // 1. Central Core Nebula (Root Directory)
    const rootNebulaMesh = this.createCentralNebula(rootData, new THREE.Vector3(0, 0, 0));
    this.neuronGroup.add(rootNebulaMesh);
    this.nebulas.push(rootNebulaMesh);

    // 2. Separate Directories (Sub-nebulas) and Files (Neurons)
    const children = payload.children || [];
    const dirNodes = children.filter(c => c.isDirectory || c.isDrive);
    const fileNodes = children.filter(c => !c.isDirectory && !c.isDrive);

    // Find nodes with recent activity (within 14 days or newest timestamps)
    const now = new Date();
    const recentThreshold = 14 * 24 * 60 * 60 * 1000; // 14 days in ms
    children.forEach(c => {
      if (c.modifiedDate) {
        const d = new Date(c.modifiedDate);
        if (!isNaN(d.getTime()) && (now - d) < recentThreshold) {
          c.hasRecentActivity = true;
        }
      }
    });

    // If no nodes had dates, pick the first 3 files to exhibit neural firing demo activity
    const activeCandidates = children.filter(c => c.hasRecentActivity);
    if (activeCandidates.length === 0 && fileNodes.length > 0) {
      for (let i = 0; i < Math.min(3, fileNodes.length); i++) {
        fileNodes[i].hasRecentActivity = true;
      }
    }

    // 3. Position Sub-Nebulas (Folders) in 3D Organic Cluster
    const numDirs = dirNodes.length;
    const subNebulaMeshes = [];
    let maxDist = 25;

    if (numDirs > 0) {
      const radiusBase = Math.max(22, Math.min(42, 18 + numDirs * 1.5));
      for (let i = 0; i < numDirs; i++) {
        const dirData = dirNodes[i];
        dirData.isSubNebula = true;

        // Spherical golden spiral distribution for organic 3D brain-like positioning
        const phi = Math.acos(1 - 2 * (i + 0.5) / Math.max(1, numDirs));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = radiusBase * (0.85 + Math.sin(i * 1.7) * 0.2);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi) * 0.65; // slightly flattened for better viewing angle
        const z = r * Math.sin(phi) * Math.sin(theta);
        const pos = new THREE.Vector3(x, y, z);

        const subNebulaMesh = this.createSubNebula(dirData, pos);
        this.neuronGroup.add(subNebulaMesh);
        this.nebulas.push(subNebulaMesh);
        subNebulaMeshes.push({ mesh: subNebulaMesh, pos: pos, data: dirData });

        // Organic curved synapse connecting Root Nebula to Sub-Nebula
        const synapseColor = this.colors.folderNebula;
        const link = this.createCurvedSynapse(new THREE.Vector3(0, 0, 0), pos, synapseColor, true, dirData);
        this.synapseGroup.add(link.line);
        this.synapses.push(link);

        maxDist = Math.max(maxDist, pos.length());
      }
    }

    // 4. Position Neurons (Files)
    const numFiles = fileNodes.length;
    if (numFiles > 0) {
      // Stratify files into dendritic layers
      const fileRadiusBase = numDirs > 0 ? maxDist + 14 : 22;
      for (let i = 0; i < numFiles; i++) {
        const fileData = fileNodes[i];
        fileData.isNeuron = true;

        // Distribute files in an organic synaptic shell
        const phi = Math.acos(1 - 2 * (i + 0.5) / Math.max(1, numFiles));
        const theta = Math.PI * 1.61803398875 * i * 2.3;
        const r = fileRadiusBase * (0.82 + Math.sin(i * 2.3 + 1.2) * 0.22);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi) * 0.72;
        const z = r * Math.sin(phi) * Math.sin(theta);
        const pos = new THREE.Vector3(x, y, z);

        const neuronMesh = this.createNeuron(fileData, pos);
        this.neuronGroup.add(neuronMesh);
        this.neurons.push(neuronMesh);

        // Find nearest sub-nebula or connect to root nebula
        let parentPos = new THREE.Vector3(0, 0, 0);
        let parentData = rootData;

        if (subNebulaMeshes.length > 0 && Math.random() > 0.35) {
          // Connect to the closest sub-nebula
          let closestDist = Infinity;
          let closest = null;
          for (const sub of subNebulaMeshes) {
            const d = pos.distanceTo(sub.pos);
            if (d < closestDist) {
              closestDist = d;
              closest = sub;
            }
          }
          if (closest) {
            parentPos = closest.pos;
            parentData = closest.data;
          }
        }

        const fileColor = this.colors[fileData.itemType] || this.colors.file;
        const link = this.createCurvedSynapse(parentPos, pos, fileColor, false, fileData);
        this.synapseGroup.add(link.line);
        this.synapses.push(link);

        maxDist = Math.max(maxDist, pos.length());
      }
    }

    this.maxNetworkRadius = maxDist + 15;

    // 5. Setup Concentric Neural Waves expanding from Root
    this.setupConcentricWaves();

    // 6. Build Ascend Conduit Tube if parent exists
    const hasParent = payload.parents && payload.parents.length > 0;
    const isNotRoot = payload.currentNode && payload.currentNode.fullPath &&
                      payload.currentNode.fullPath !== "root" &&
                      payload.currentNode.fullPath !== "welcome";

    if (hasParent || isNotRoot) {
      const parentName = (payload.parents && payload.parents[0] && payload.parents[0].name) ||
                         (payload.breadcrumbs && payload.breadcrumbs.length > 1 && payload.breadcrumbs[payload.breadcrumbs.length - 2].name) ||
                         "Carpeta Superior";
      const parentFullPath = (payload.parents && payload.parents[0] && payload.parents[0].fullPath) ||
                             (payload.breadcrumbs && payload.breadcrumbs.length > 1 && payload.breadcrumbs[payload.breadcrumbs.length - 2].path) ||
                             "";
      this.createAscendConduit(parentName, parentFullPath);
    }

    // 7. Camera framing (Soft cinematic overview)
    this.engine.flyCameraTo(
      new THREE.Vector3(0, Math.max(35, this.maxNetworkRadius * 0.65), this.maxNetworkRadius * 1.35 + 20),
      new THREE.Vector3(0, 0, 0),
      850
    );
  }

  /* =========================================================================
   * 1. CENTRAL NEBULA GENERATION (Root Element)
   * ========================================================================= */
  createCentralNebula(data, position) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.userData = { nodeData: data, isNebula: true, isRoot: true };

    // A. Central Luminous Nucleus (Plexus Core)
    const nucleusGeo = new THREE.SphereGeometry(2.4, 24, 24);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00a3cc,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.85
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    group.add(nucleus);

    // B. Outer Iridescent Bio-Shield
    const shieldGeo = new THREE.SphereGeometry(3.1, 20, 20);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0xb026ff,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(shield);

    // C. Volumetric Swirling Nebula Dust Cloud (160 particles)
    const cloudParticles = this.createVolumetricNebulaCloud(group, 160, 9.5, 0x00f0ff, 0xbd00ff);
    this.nebulaClouds.push(cloudParticles);

    // D. Text Sprite Label
    const labelSprite = this.createNeuralLabel(data.name || "Mi PC", 0x00f0ff, true);
    labelSprite.position.set(0, -4.2, 0);
    labelSprite.visible = this.showLabels;
    group.add(labelSprite);
    this.labelSprites.push({ sprite: labelSprite, isCenter: true, group: group });

    // Interactive Hover Animations
    group.onHoverEnter = () => {
      nucleus.scale.set(1.15, 1.15, 1.15);
      nucleusMat.emissiveIntensity = 1.2;
      shieldMat.opacity = 0.55;
    };
    group.onHoverExit = () => {
      nucleus.scale.set(1, 1, 1);
      nucleusMat.emissiveIntensity = 0.85;
      shieldMat.opacity = 0.28;
    };

    nucleus.userData = group.userData;
    shield.userData = group.userData;
    this.engine.interactiveObjects.push(nucleus);
    this.engine.interactiveObjects.push(shield);

    return group;
  }

  /* =========================================================================
   * 2. SUB-NEBULA GENERATION (Folders & Drives)
   * ========================================================================= */
  createSubNebula(data, position) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.userData = { nodeData: data, isNebula: true, isSubNebula: true };

    const colorHex = data.isDrive ? this.colors.drive : this.colors.folderNebula;

    // A. Sub-Nebula Ganglion Nucleus
    const somaGeo = new THREE.SphereGeometry(1.6, 20, 20);
    const somaMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.65,
      roughness: 0.3,
      metalness: 0.7
    });
    const soma = new THREE.Mesh(somaGeo, somaMat);
    group.add(soma);

    // B. Pulsing Neural Halo Ring
    const haloGeo = new THREE.TorusGeometry(2.4, 0.04, 6, 36);
    const haloMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2.3;
    group.add(halo);

    // C. Local Mini-Nebula Particle Cloud (60 particles)
    const cloudParticles = this.createVolumetricNebulaCloud(group, 60, 5.0, colorHex, 0x00f0ff);
    this.nebulaClouds.push(cloudParticles);

    // D. Action Potential Surge if Recently Active
    if (data.hasRecentActivity) {
      this.registerActiveNode(group, somaMat, colorHex);
    }

    // E. Label Sprite
    const labelSprite = this.createNeuralLabel(data.name, colorHex, false);
    labelSprite.position.set(0, -2.7, 0);
    labelSprite.visible = this.showLabels;
    group.add(labelSprite);
    this.labelSprites.push({ sprite: labelSprite, isCenter: false, group: group });

    // Hover Animation
    group.onHoverEnter = () => {
      soma.scale.set(1.22, 1.22, 1.22);
      somaMat.emissiveIntensity = 1.1;
      halo.scale.set(1.2, 1.2, 1.2);
      haloMat.opacity = 0.85;
    };
    group.onHoverExit = () => {
      soma.scale.set(1, 1, 1);
      somaMat.emissiveIntensity = 0.65;
      halo.scale.set(1, 1, 1);
      haloMat.opacity = 0.45;
    };

    soma.userData = group.userData;
    halo.userData = group.userData;
    this.engine.interactiveObjects.push(soma);
    this.engine.interactiveObjects.push(halo);

    return group;
  }

  /* =========================================================================
   * 3. NEURON GENERATION (Files)
   * ========================================================================= */
  createNeuron(data, position) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.userData = { nodeData: data, isNeuron: true };

    const colorHex = this.colors[data.itemType] || this.colors.file;

    // A. Neuron Soma (Cell body)
    const somaRadius = data.hasRecentActivity ? 1.05 : 0.85;
    const somaGeo = new THREE.SphereGeometry(somaRadius, 16, 16);
    const somaMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: data.hasRecentActivity ? 0.75 : 0.42,
      roughness: 0.35,
      metalness: 0.6
    });
    const soma = new THREE.Mesh(somaGeo, somaMat);
    group.add(soma);

    // B. Dendritic Receptor Ring
    const ringGeo = new THREE.TorusGeometry(somaRadius * 1.38, 0.025, 4, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    group.add(ring);

    // C. Activity Firing Registration (for recent files)
    if (data.hasRecentActivity) {
      this.registerActiveNode(group, somaMat, colorHex);
    }

    // D. Text Sprite Label
    const labelSprite = this.createNeuralLabel(data.name, colorHex, false);
    labelSprite.position.set(0, -somaRadius - 1.25, 0);
    labelSprite.visible = this.showLabels;
    group.add(labelSprite);
    this.labelSprites.push({ sprite: labelSprite, isCenter: false, group: group });

    // Hover Animation
    group.onHoverEnter = () => {
      soma.scale.set(1.25, 1.25, 1.25);
      somaMat.emissiveIntensity = 0.95;
      ringMat.opacity = 0.75;
    };
    group.onHoverExit = () => {
      soma.scale.set(1, 1, 1);
      somaMat.emissiveIntensity = data.hasRecentActivity ? 0.75 : 0.42;
      ringMat.opacity = 0.35;
    };

    soma.userData = group.userData;
    ring.userData = group.userData;
    this.engine.interactiveObjects.push(soma);
    this.engine.interactiveObjects.push(ring);

    return group;
  }

  /* =========================================================================
   * 4. VOLUMETRIC NEBULA CLOUD PARTICLES
   * ========================================================================= */
  createVolumetricNebulaCloud(parentGroup, count, radius, colorHexA, colorHexB) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseOffsets = [];

    const colA = new THREE.Color(colorHexA);
    const colB = new THREE.Color(colorHexB);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Spherical distribution with density falloff towards perimeter
      const u = Math.random();
      const dist = radius * (0.25 + 0.75 * Math.pow(u, 0.5));
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const px = dist * Math.sin(phi) * Math.cos(theta);
      const py = dist * Math.cos(phi) * 0.75;
      const pz = dist * Math.sin(phi) * Math.sin(theta);

      positions[idx] = px;
      positions[idx + 1] = py;
      positions[idx + 2] = pz;

      baseOffsets.push({
        dist: dist,
        theta: theta,
        phi: phi,
        speed: (Math.random() - 0.5) * 0.008 + 0.003
      });

      const mixVal = Math.random();
      const mixedCol = colA.clone().lerp(colB, mixVal);
      colors[idx] = mixedCol.r;
      colors[idx + 1] = mixedCol.g;
      colors[idx + 2] = mixedCol.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    parentGroup.add(points);

    return {
      points: points,
      geometry: geometry,
      positions: positions,
      offsets: baseOffsets,
      count: count
    };
  }

  /* =========================================================================
   * 5. ORGANIC CURVED SYNAPSE CREATION
   * ========================================================================= */
  createCurvedSynapse(start, end, colorHex, isPrimaryAxon = false, targetData = null) {
    const points = [];
    points.push(start.clone());

    // Organic Catmull-Rom curvature in 3D
    const dist = start.distanceTo(end);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Lateral and vertical organic displacement
    const cross = new THREE.Vector3().crossVectors(end.clone().sub(start), new THREE.Vector3(0, 1, 0)).normalize();
    const sag = Math.sin(dist * 0.08) * (isPrimaryAxon ? 2.5 : 1.8);
    mid.addScaledVector(cross, (Math.random() - 0.5) * sag * 1.5);
    mid.y += (Math.random() > 0.5 ? 1 : -1) * sag * 0.6;

    points.push(mid);
    points.push(end.clone());

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(28);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const material = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: isPrimaryAxon ? 0.45 : 0.28,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geometry, material);

    // Floating Neurotransmitter Particles along this curve (2 per synapse, 3 for primary axons)
    const particleCount = isPrimaryAxon ? 3 : 2;
    const curveParticles = [];

    for (let p = 0; p < particleCount; p++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const pMesh = new THREE.Mesh(this.sharedSmallPulseGeo, pMat);
      this.synapseParticleGroup.add(pMesh);

      curveParticles.push({
        mesh: pMesh,
        progress: (p / particleCount + Math.random() * 0.2) % 1.0,
        speed: (isPrimaryAxon ? 0.005 : 0.007) * (0.85 + Math.random() * 0.3)
      });
    }

    return {
      line: line,
      curve: curve,
      distance: dist,
      colorHex: colorHex,
      particles: curveParticles,
      isPrimary: isPrimaryAxon,
      targetData: targetData
    };
  }

  /* =========================================================================
   * 6. RECENT ACTIVITY REGISTRATION & ACTION POTENTIAL EMISSION
   * ========================================================================= */
  registerActiveNode(group, material, colorHex) {
    // Shockwave burst ring for electrical action potential discharges
    const ringGeo = new THREE.RingGeometry(0.3, 0.45, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const burstRing = new THREE.Mesh(ringGeo, ringMat);
    group.add(burstRing);

    this.activeNodes.push({
      group: group,
      material: material,
      baseEmissive: material.emissiveIntensity,
      burstRing: burstRing,
      colorHex: colorHex,
      lastFireTime: Math.random() * 5000,
      fireInterval: 2200 + Math.random() * 2600, // Periodic firing every ~2.5 - 4.5s
      isFiring: false,
      fireProgress: 0
    });
  }

  /* =========================================================================
   * 7. CONCENTRIC BRAINWAVE PULSES (Neural Resonance Waves)
   * ========================================================================= */
  setupConcentricWaves() {
    this.concentricWaves = [];

    // 2 staggered expanding concentric neural wave fronts
    const phases = [0.0, 0.5];

    phases.forEach((initPhase) => {
      // Anillo delgado y elegante (1.5% de grosor relativo en vez de disco masivo)
      const ringGeo = new THREE.RingGeometry(0.985, 1.0, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const waveMesh = new THREE.Mesh(ringGeo, ringMat);
      waveMesh.rotation.x = Math.PI / 2;
      this.concentricWaveGroup.add(waveMesh);

      this.concentricWaves.push({
        mesh: waveMesh,
        progress: initPhase,
        speed: 0.0035,
        maxRadius: this.maxNetworkRadius
      });
    });
  }

  /* =========================================================================
   * 8. ZOOM-INVARIANT NEURAL LABEL SPRITE
   * ========================================================================= */
  createNeuralLabel(text, colorHex, isCenter = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Glowing Bio-Pill background
    ctx.fillStyle = isCenter ? 'rgba(0, 240, 255, 0.22)' : 'rgba(4, 9, 24, 0.72)';
    ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = isCenter ? 3.5 : 2;

    const radius = 16;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(18, 22, 476, 84, radius);
    } else {
      ctx.rect(18, 22, 476, 84);
    }
    ctx.fill();
    ctx.stroke();

    // Text formatting
    ctx.font = isCenter ? 'bold 34px Segoe UI, system-ui' : '28px Segoe UI, system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let labelText = text || 'Elemento';
    if (labelText.length > 24) labelText = labelText.substring(0, 22) + '...';
    ctx.fillText(labelText, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    const scale = isCenter ? 8.0 : 5.8;
    sprite.scale.set(scale, scale * 0.25, 1);

    return sprite;
  }

  /* =========================================================================
   * 9. HYPER-SPEED WARP DIVE TRANSITION (Double Click Effect)
   * ========================================================================= */
  animateWarpDive(targetMesh, targetData, onComplete) {
    if (!targetMesh || this.warpActive) {
      if (onComplete) onComplete();
      return;
    }

    this.warpActive = true;
    const targetPos = new THREE.Vector3();
    targetMesh.getWorldPosition(targetPos);

    const camera = this.engine.camera;
    const originalFov = camera.fov;
    const warpFov = 84; // Relativistic FOV expansion

    // 1. Create Warp Streak Particles travelling towards camera
    const streakCount = 180;
    const streakPositions = new Float32Array(streakCount * 6); // 2 vertices per streak line
    const streakColors = new Float32Array(streakCount * 6);
    const travelDir = targetPos.clone().sub(camera.position).normalize();

    for (let i = 0; i < streakCount; i++) {
      const idx = i * 6;
      // Distribute streaks in a cone around travel vector
      const spread = (Math.random() - 0.5) * 45;
      const spreadY = (Math.random() - 0.5) * 35;
      const startDist = 5 + Math.random() * 40;

      const p1 = camera.position.clone()
        .addScaledVector(travelDir, startDist)
        .add(new THREE.Vector3(spread, spreadY, (Math.random() - 0.5) * 40));
      const p2 = p1.clone().addScaledVector(travelDir, 8.0);

      streakPositions[idx] = p1.x;
      streakPositions[idx + 1] = p1.y;
      streakPositions[idx + 2] = p1.z;
      streakPositions[idx + 3] = p2.x;
      streakPositions[idx + 4] = p2.y;
      streakPositions[idx + 5] = p2.z;

      const col = Math.random() > 0.5 ? new THREE.Color(0x00f0ff) : new THREE.Color(0xbd00ff);
      streakColors[idx] = col.r; streakColors[idx + 1] = col.g; streakColors[idx + 2] = col.b;
      streakColors[idx + 3] = col.r; streakColors[idx + 4] = col.g; streakColors[idx + 5] = col.b;
    }

    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
    streakGeo.setAttribute('color', new THREE.BufferAttribute(streakColors, 3));
    const streakMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const streakLines = new THREE.LineSegments(streakGeo, streakMat);
    this.warpGroup.add(streakLines);

    // 2. Camera Acceleration & Warp Dive
    const camTargetPos = targetPos.clone().add(new THREE.Vector3(0, 1.2, 3.8));
    this.engine.flyCameraTo(camTargetPos, targetPos, 500);

    const startTime = performance.now();
    const warpDuration = 520; // ms

    const animateWarpFrame = () => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(1.0, elapsed / warpDuration);

      // FOV curve: rise fast, peak at 60%, ease out
      if (p < 0.6) {
        camera.fov = originalFov + (warpFov - originalFov) * (p / 0.6);
      } else {
        camera.fov = warpFov - (warpFov - originalFov) * ((p - 0.6) / 0.4);
      }
      camera.updateProjectionMatrix();

      // Dissolve/fade other nodes smoothly
      const fadeProgress = Math.pow(p, 1.5);
      this.neuronGroup.children.forEach(n => {
        if (n !== targetMesh && n.userData !== targetMesh.userData) {
          n.scale.setScalar(Math.max(0.01, 1.0 - fadeProgress));
        }
      });
      this.synapseGroup.children.forEach(l => {
        if (l.material) l.material.opacity = Math.max(0, 0.4 * (1.0 - fadeProgress));
      });

      // Streaks opacity
      streakMat.opacity = Math.max(0, 0.9 * (1.0 - p));

      if (p < 1.0) {
        requestAnimationFrame(animateWarpFrame);
      } else {
        camera.fov = originalFov;
        camera.updateProjectionMatrix();
        this.warpGroup.remove(streakLines);
        streakGeo.dispose();
        streakMat.dispose();
        this.warpActive = false;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateWarpFrame);
  }

  /* =========================================================================
   * 10. ASCEND CONDUIT TUBE (Tubo de trazos semitransparentes hacia atrás)
   * ========================================================================= */
  createAscendConduit(parentName, parentFullPath) {
    const startPos = new THREE.Vector3(0, 1.5, 0);
    const mid1 = new THREE.Vector3(0, 15, -6);
    const mid2 = new THREE.Vector3(0, 30, -14);
    const endPos = new THREE.Vector3(0, 46, -22);

    const spineCurve = new THREE.CatmullRomCurve3([startPos, mid1, mid2, endPos]);

    const numStrands = 10;
    const strandSteps = 40;
    const baseRadius = 1.8;
    const endRadius = 4.6;

    const baseCol = new THREE.Color(0x00f0ff);
    const fadeCol = new THREE.Color(0xbd00ff);

    // 1. Trazos longitudinales semitransparentes que se difuminan hasta desaparecer
    for (let s = 0; s < numStrands; s++) {
      const strandAngleOffset = (s / numStrands) * Math.PI * 2;
      const positions = new Float32Array(strandSteps * 3);
      const colors = new Float32Array(strandSteps * 3);

      for (let i = 0; i < strandSteps; i++) {
        const t = i / (strandSteps - 1);
        const center = spineCurve.getPointAt(t);

        // Expansión gradual en embudo a lo largo del tubo
        const r = baseRadius + (endRadius - baseRadius) * Math.pow(t, 1.25);
        // Torsión helicoidal orgánica
        const angle = strandAngleOffset + t * Math.PI * 0.85;

        const x = center.x + Math.cos(angle) * r;
        const y = center.y;
        const z = center.z + Math.sin(angle) * r;

        const idx = i * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;

        // Gradiente: visible en el centro (~0.42) difuminándose hasta casi desaparecer (~0.015) en el extremo
        const alpha = Math.max(0.012, (1.0 - t * 0.94) * 0.42);
        const col = baseCol.clone().lerp(fadeCol, t);
        colors[idx] = col.r * alpha;
        colors[idx + 1] = col.g * alpha;
        colors[idx + 2] = col.b * alpha;
      }

      const strandGeo = new THREE.BufferGeometry();
      strandGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      strandGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const strandMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const strandLine = new THREE.Line(strandGeo, strandMat);
      this.conduitGroup.add(strandLine);
    }

    // 2. Anillos concéntricos sutiles de estructura a lo largo del tubo
    const ringSteps = [0.18, 0.40, 0.65, 0.88];
    ringSteps.forEach(t => {
      const center = spineCurve.getPointAt(t);
      const r = baseRadius + (endRadius - baseRadius) * Math.pow(t, 1.25);
      const ringPoints = [];
      const segs = 32;
      for (let j = 0; j <= segs; j++) {
        const a = (j / segs) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(center.x + Math.cos(a) * r, center.y, center.z + Math.sin(a) * r));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const alpha = Math.max(0.02, (1.0 - t) * 0.25);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: alpha,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const rib = new THREE.Line(ringGeo, ringMat);
      this.conduitGroup.add(rib);
    });

    // 3. Partículas de impulso que viajan hacia afuera a lo largo del tubo
    for (let p = 0; p < 4; p++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const pMesh = new THREE.Mesh(this.sharedSmallPulseGeo, pMat);
      this.conduitGroup.add(pMesh);

      this.conduitParticles.push({
        mesh: pMesh,
        curve: spineCurve,
        progress: (p / 4) % 1.0,
        speed: 0.0055
      });
    }

    // 4. Extremo interactivo fuera de la nebulosa (Portal de ascenso)
    const portalGroup = new THREE.Group();
    portalGroup.position.copy(endPos);
    portalGroup.userData = {
      isAscendPortal: true,
      nodeData: {
        isAscendPortal: true,
        name: `⬆️ ${parentName || 'Carpeta Superior'}`,
        itemType: 'folder',
        fullPath: parentFullPath || ''
      }
    };

    // Anillo exterior de portal
    const portalRingGeo = new THREE.TorusGeometry(2.4, 0.07, 8, 48);
    const portalRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8
    });
    const portalRing = new THREE.Mesh(portalRingGeo, portalRingMat);
    portalRing.rotation.x = Math.PI / 3.5;
    portalGroup.add(portalRing);

    // Orbe central del portal
    const portalOrbGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const portalOrbMat = new THREE.MeshStandardMaterial({
      color: 0xbd00ff,
      emissive: 0xbd00ff,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const portalOrb = new THREE.Mesh(portalOrbGeo, portalOrbMat);
    portalGroup.add(portalOrb);

    // Etiqueta flotante
    const labelSprite = this.createNeuralLabel(`⬆️ ${parentName || 'Carpeta Superior'}`, 0x00f0ff, true);
    labelSprite.position.set(0, 3.2, 0);
    portalGroup.add(labelSprite);
    this.labelSprites.push({ sprite: labelSprite, isCenter: true, group: portalGroup });

    // Animaciones de hover interactivo
    portalGroup.onHoverEnter = () => {
      portalRing.scale.set(1.25, 1.25, 1.25);
      portalOrb.scale.set(1.2, 1.2, 1.2);
      portalRingMat.emissiveIntensity = 1.4;
      portalOrbMat.emissiveIntensity = 1.5;
    };
    portalGroup.onHoverExit = () => {
      portalRing.scale.set(1, 1, 1);
      portalOrb.scale.set(1, 1, 1);
      portalRingMat.emissiveIntensity = 0.85;
      portalOrbMat.emissiveIntensity = 0.9;
    };

    portalRing.userData = portalGroup.userData;
    portalOrb.userData = portalGroup.userData;
    this.engine.interactiveObjects.push(portalRing);
    this.engine.interactiveObjects.push(portalOrb);

    this.conduitGroup.add(portalGroup);
    this.ascendPortalMesh = portalGroup;
    this.conduitRingMesh = portalRing;
  }

  /* =========================================================================
   * 11. ASCEND WARP TRANSITION (Retorno a la carpeta superior)
   * ========================================================================= */
  animateAscend(onComplete) {
    if (this.warpActive) {
      if (onComplete) onComplete();
      return;
    }

    this.warpActive = true;
    const targetPos = this.ascendPortalMesh
      ? this.ascendPortalMesh.position.clone()
      : new THREE.Vector3(0, 46, -22);

    const camera = this.engine.camera;
    const originalFov = camera.fov;
    const warpFov = 80;

    // Vuelo de cámara ascendiendo por el tubo hacia el portal exterior
    const camTargetPos = targetPos.clone().add(new THREE.Vector3(0, 2, 5));
    this.engine.flyCameraTo(camTargetPos, targetPos, 480);

    const startTime = performance.now();
    const duration = 480;

    const animateAscendFrame = () => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(1.0, elapsed / duration);

      if (p < 0.6) {
        camera.fov = originalFov + (warpFov - originalFov) * (p / 0.6);
      } else {
        camera.fov = warpFov - (warpFov - originalFov) * ((p - 0.6) / 0.4);
      }
      camera.updateProjectionMatrix();

      // Desvanecer red actual
      const fadeProgress = Math.pow(p, 1.4);
      this.neuronGroup.children.forEach(n => {
        n.scale.setScalar(Math.max(0.01, 1.0 - fadeProgress));
      });
      this.synapseGroup.children.forEach(l => {
        if (l.material) l.material.opacity = Math.max(0, 0.4 * (1.0 - fadeProgress));
      });
      this.conduitGroup.children.forEach(c => {
        if (c.material) c.material.opacity = Math.max(0, (c.material.opacity || 0.4) * (1.0 - fadeProgress));
      });

      if (p < 1.0) {
        requestAnimationFrame(animateAscendFrame);
      } else {
        camera.fov = originalFov;
        camera.updateProjectionMatrix();
        this.warpActive = false;
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateAscendFrame);
  }

  /* =========================================================================
   * 12. NODE FILTERING (Search Query)
   * ========================================================================= */
  filterNodes(query) {
    if (!query) {
      this.neurons.forEach(n => n.visible = true);
      this.nebulas.forEach(n => n.visible = true);
      this.synapses.forEach(s => s.line.visible = true);
      return;
    }

    const q = query.toLowerCase();
    this.nebulas.forEach(n => {
      if (n.userData.isRoot) {
        n.visible = true;
      } else {
        const d = n.userData.nodeData;
        n.visible = d && d.name && d.name.toLowerCase().includes(q);
      }
    });

    this.neurons.forEach(n => {
      const d = n.userData.nodeData;
      n.visible = d && d.name && d.name.toLowerCase().includes(q);
    });
  }

  /* =========================================================================
   * 11. PER-FRAME RENDER LOOP ANIMATIONS
   * ========================================================================= */
  onRenderFrame(time) {
    if (!this.neuralGroup.visible) return;

    // 1. Animate Volumetric Nebula Particle Clouds (Sinusoidal orbital breathing)
    for (let c = 0; c < this.nebulaClouds.length; c++) {
      const cloud = this.nebulaClouds[c];
      const posAttr = cloud.geometry.attributes.position;
      const arr = posAttr.array;
      const count = cloud.count;

      for (let i = 0; i < count; i++) {
        const off = cloud.offsets[i];
        off.theta += off.speed;

        const idx = i * 3;
        const breathing = off.dist * (1.0 + Math.sin(time * 0.0012 + i) * 0.08);
        arr[idx] = breathing * Math.sin(off.phi) * Math.cos(off.theta);
        arr[idx + 1] = breathing * Math.cos(off.phi) * 0.75;
        arr[idx + 2] = breathing * Math.sin(off.phi) * Math.sin(off.theta);
      }
      posAttr.needsUpdate = true;
    }

    // 2. Animate Neurotransmitter Particles along Synaptic Curves
    for (let s = 0; s < this.synapses.length; s++) {
      const synapse = this.synapses[s];
      if (!synapse.curve || !synapse.particles) continue;

      for (let p = 0; p < synapse.particles.length; p++) {
        const item = synapse.particles[p];
        item.progress = (item.progress + item.speed * this.pulseSpeedFactor) % 1.0;
        const pos = synapse.curve.getPointAt(item.progress);
        item.mesh.position.copy(pos);

        // Opacity envelope
        let alpha = 1.0;
        if (item.progress < 0.15) {
          alpha = item.progress / 0.15;
        } else if (item.progress > 0.85) {
          alpha = (1.0 - item.progress) / 0.15;
        }
        item.mesh.material.opacity = alpha * 0.85;

        const scale = 0.85 + Math.sin(time * 0.005 + p) * 0.25;
        item.mesh.scale.set(scale, scale, scale);
      }
    }

    // 3. Animate Electrical Action Potentials in Recent Active Nodes
    const now = performance.now();
    for (let a = 0; a < this.activeNodes.length; a++) {
      const node = this.activeNodes[a];

      // Check if it is time to trigger an action potential
      if (!node.isFiring && (now - node.lastFireTime) > node.fireInterval) {
        node.isFiring = true;
        node.fireProgress = 0;
        node.lastFireTime = now;
      }

      if (node.isFiring) {
        node.fireProgress += 0.045;
        const p = node.fireProgress;

        if (p < 1.0) {
          // Emissive flash peak then decay
          const intensity = node.baseEmissive + Math.sin(p * Math.PI) * 1.35;
          node.material.emissiveIntensity = intensity;

          // Expanding shockwave burst ring
          if (node.burstRing) {
            const ringScale = 1.0 + p * 3.5;
            node.burstRing.scale.set(ringScale, ringScale, ringScale);
            node.burstRing.material.opacity = (1.0 - p) * 0.85;
            node.burstRing.rotation.z += 0.04;
          }
        } else {
          node.isFiring = false;
          node.material.emissiveIntensity = node.baseEmissive;
          if (node.burstRing) node.burstRing.material.opacity = 0;
        }
      }
    }

    // 4. Animate Concentric Neural Resonance Waves
    for (let w = 0; w < this.concentricWaves.length; w++) {
      const wave = this.concentricWaves[w];
      wave.progress = (wave.progress + wave.speed * this.pulseSpeedFactor) % 1.0;

      const currentRadius = wave.progress * wave.maxRadius;
      const scale = Math.max(0.1, currentRadius);
      wave.mesh.scale.set(scale, scale, scale);

      // Envolvente de opacidad sutil (máximo 8% de visibilidad, tal como solicitó el usuario: 5%-10%)
      let alpha = 1.0;
      if (wave.progress < 0.15) {
        alpha = wave.progress / 0.15;
      } else if (wave.progress > 0.70) {
        alpha = (1.0 - wave.progress) / 0.30;
      }
      wave.mesh.material.opacity = alpha * 0.08;
    }

    // 5. Zoom-Invariant Text Labels
    if (this.showLabels && this.engine.camera) {
      const camPos = this.engine.camera.position;
      for (let l = 0; l < this.labelSprites.length; l++) {
        const item = this.labelSprites[l];
        if (item.sprite && item.sprite.visible && item.group) {
          const dist = camPos.distanceTo(item.group.position);
          const s = Math.max(0.5, dist * 0.044);
          const w = item.isCenter ? s * 4.4 : s * 3.4;
          const h = item.isCenter ? s * 1.1 : s * 0.85;
          item.sprite.scale.set(w, h, 1);
        }
      }
    }

    // 6. Animate Ascend Conduit particles and portal ring rotation
    if (this.conduitRingMesh) {
      this.conduitRingMesh.rotation.z += 0.012;
    }
    if (this.conduitParticles && this.conduitParticles.length > 0) {
      for (let cp = 0; cp < this.conduitParticles.length; cp++) {
        const p = this.conduitParticles[cp];
        p.progress = (p.progress + p.speed * this.pulseSpeedFactor) % 1.0;
        const pos = p.curve.getPointAt(p.progress);
        p.mesh.position.copy(pos);
        // Fading opacity as it travels outward towards the terminus
        p.mesh.material.opacity = Math.max(0.04, (1.0 - p.progress * 0.85) * 0.85);
      }
    }
  }
}

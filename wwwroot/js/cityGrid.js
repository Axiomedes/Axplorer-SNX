// cityGrid.js - Procedural 3D City-Grid and Storage Hub Engine for aXplorer Win11

class CityGrid {
  constructor(engine, bridge) {
    this.engine = engine;
    this.bridge = bridge;

    this.cityGroup = new THREE.Group();
    this.engine.scene.add(this.cityGroup);

    this.interactiveMeshes = [];
    this.buildings = [];
    this.animatingBuildings = [];
    this.labelSprites = [];
    this.showLabels = true;
    this.selectedMesh = null;
    this.currentPayload = null;
    this.currentViewMode = "welcome"; // "welcome", "mypc", "city"

    // Strict color specifications requested by user
    this.colors = {
      folder: 0xeab308,      // Amarillo
      document: 0x3b82f6,    // Azul
      image: 0x22c55e,       // Verde
      audio: 0xa855f7,       // Morado
      video: 0x06b6d4,       // Celeste / Calipso
      code: 0x00f0ff,        // Cian
      archive: 0x64748b,     // Gris
      executable: 0xef4444,  // Rojo
      unknown: 0xe2e8f0,     // Blanco / Gris claro
      drive: 0x0284c7,       // Azul eléctrico para unidades
      network: 0x8b5cf6,     // Púrpura para redes
      system: 0x00f0ff       // Cian brillante para sistema
    };

    // Shared reusable geometries & materials
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.selectionBox = null;
    this.createSelectionHighlight();

    // City street grid traffic system
    this.trafficEnabled = true;
    this.trafficMesh = null;
    this.vehicles = [];
    this.trafficGridSize = 120;
    this.trafficDivisions = 40;
    this.trafficSpeedMultiplier = 1.0;
    this.dummyTransform = new THREE.Object3D();
  }

  clear() {
    this.disposeTraffic();

    // Cleanly dispose of all 3D objects in the city group
    while (this.cityGroup.children.length > 0) {
      const obj = this.cityGroup.children[0];
      this.cityGroup.remove(obj);
      this.disposeObject(obj);
    }
    this.interactiveMeshes = [];
    this.buildings = [];
    this.animatingBuildings = [];
    this.labelSprites = [];
    this.selectedMesh = null;
    this.engine.interactiveObjects = [];
  }

  setLabelsVisible(visible) {
    this.showLabels = visible;
    for (let i = 0; i < this.labelSprites.length; i++) {
      if (this.labelSprites[i]) {
        this.labelSprites[i].visible = visible;
      }
    }
  }

  disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children && obj.children.length > 0) {
      obj.children.forEach(c => this.disposeObject(c));
    }
  }

  createSelectionHighlight() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    this.selectionBox = new THREE.LineSegments(edges, mat);
    this.selectionBox.visible = false;
  }

  /* =========================================================================
   * NIVEL 0: Pantalla Inicial - Caja Única "Mi PC"
   * ========================================================================= */
  buildWelcomeView(payload) {
    this.clear();
    this.currentPayload = payload;
    this.currentViewMode = "welcome";

    // Inform HUD
    if (window.hudOverlay) {
      window.hudOverlay.setViewMode("welcome");
      window.hudOverlay.updateBreadcrumbs([
        { name: "Mi PC", path: "welcome" }
      ]);
    }

    const group = new THREE.Group();
    group.position.set(0, 4, 0);

    const nodeData = {
      name: "Mi PC",
      fullPath: "root",
      itemType: "system",
      isDirectory: true,
      description: "Punto de entrada al sistema de archivos"
    };
    group.userData = { nodeData: nodeData, isWelcomeBox: true };

    // 1. Sleek High-Tech Core Box
    const boxSize = 10.0;
    const coreGeo = new THREE.BoxGeometry(boxSize, boxSize * 0.85, boxSize);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.18
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // 2. Holographic Glowing Wireframe Cage
    const edgesGeo = new THREE.EdgesGeometry(coreGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85
    });
    const wireframe = new THREE.LineSegments(edgesGeo, edgeMat);
    group.add(wireframe);

    // 3. Central Neon Core Glyph
    const innerGeo = new THREE.OctahedronGeometry(3.2, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerCore);

    // 4. Floating Concentric Halo Ring
    const haloGeo = new THREE.RingGeometry(boxSize * 0.75, boxSize * 0.82, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -boxSize * 0.42;
    group.add(halo);

    // 5. Floating Text Badge Label
    const labelSprite = this.createTextBadge("MI PC", "Doble clic para ingresar", 0x00f0ff);
    labelSprite.position.set(0, boxSize * 0.75 + 1.5, 0);
    group.add(labelSprite);

    // Hover and Click Animation Handlers
    group.onHoverEnter = () => {
      coreMesh.scale.set(1.06, 1.06, 1.06);
      coreMat.emissiveIntensity = 0.55;
      wireframe.scale.set(1.06, 1.06, 1.06);
      edgeMat.color.setHex(0x38bdf8);
      document.body.style.cursor = "pointer";
    };

    group.onHoverExit = () => {
      coreMesh.scale.set(1, 1, 1);
      coreMat.emissiveIntensity = 0.18;
      wireframe.scale.set(1, 1, 1);
      edgeMat.color.setHex(0x00f0ff);
      document.body.style.cursor = "default";
    };

    group.onDoubleClick = () => {
      this.executeWelcomeBoxOpen(group);
    };

    this.cityGroup.add(group);
    this.engine.interactiveObjects = [coreMesh];
    coreMesh.userData = group.userData;

    // Camera Framing for Welcome Box
    this.engine.flyCameraTo(
      new THREE.Vector3(0, 18, 38),
      new THREE.Vector3(0, 4, 0),
      900
    );

    this.welcomeBoxObj = {
      group: group,
      innerCore: innerCore,
      halo: halo
    };
  }

  executeWelcomeBoxOpen(boxGroup) {
    // Smooth expansion animation before navigating into Mi PC hub
    const targetScale = new THREE.Vector3(2.5, 2.5, 2.5);
    const startTime = performance.now();
    const duration = 450;

    const animateOpen = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      const ease = t * (2 - t); // Ease-out

      boxGroup.scale.lerp(targetScale, 0.15);
      this.engine.camera.position.lerp(new THREE.Vector3(0, 5, 8), 0.12);

      if (t < 1.0) {
        requestAnimationFrame(animateOpen);
      } else {
        this.bridge.sendMessage("navigate", "root");
      }
    };
    requestAnimationFrame(animateOpen);
  }

  /* =========================================================================
   * NIVEL 1: Vista "Mi PC" - Hub de Unidades y Bibliotecas del Sistema
   * ========================================================================= */
  buildMyPcHub(payload) {
    this.clear();
    this.currentPayload = payload;
    this.currentViewMode = "mypc";

    if (window.hudOverlay) {
      window.hudOverlay.setViewMode("mypc");
      window.hudOverlay.updateBreadcrumbs([
        { name: "Mi PC", path: "root" }
      ]);
    }

    // Add floor grid
    const gridHelper = new THREE.GridHelper(160, 40, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = -0.05;
    this.cityGroup.add(gridHelper);

    // Setup city street traffic on grid lines
    this.setupTraffic(160, 40);

    const allItems = payload.children || [];
    const drives = allItems.filter(i => i.isDrive || i.isNetwork);
    const libraries = allItems.filter(i => !i.isDrive && !i.isNetwork);

    const boxWidth = 9.0;
    const boxDepth = 7.5;
    const boxHeight = 2.8;
    const spacingX = 14.0;
    const spacingZ = 13.0;

    // 1. Render Drives Row (front tier)
    const drivesPerRow = Math.max(1, Math.min(4, drives.length));
    const driveStartX = -((drivesPerRow - 1) * spacingX) / 2;

    drives.forEach((d, idx) => {
      const row = Math.floor(idx / drivesPerRow);
      const col = idx % drivesPerRow;
      const posX = driveStartX + col * spacingX;
      const posZ = 6 + row * spacingZ;

      const driveBox = this.createDrivePlatformBox(d, posX, posZ, boxWidth, boxHeight, boxDepth);
      this.cityGroup.add(driveBox);
      this.buildings.push(driveBox);
    });

    // 2. Render Libraries Tier (rear tier)
    const libsPerRow = Math.max(1, Math.min(4, libraries.length));
    const libStartX = -((libsPerRow - 1) * spacingX) / 2;

    libraries.forEach((lib, idx) => {
      const row = Math.floor(idx / libsPerRow);
      const col = idx % libsPerRow;
      const posX = libStartX + col * spacingX;
      const posZ = -12 - row * spacingZ;

      const libBox = this.createLibraryPlatformBox(lib, posX, posZ, boxWidth, boxHeight, boxDepth);
      this.cityGroup.add(libBox);
      this.buildings.push(libBox);
    });

    // Camera Framing for Storage Hub
    this.engine.flyCameraTo(
      new THREE.Vector3(0, 42, 58),
      new THREE.Vector3(0, 0, 0),
      950
    );
  }

  createDrivePlatformBox(data, x, z, width, height, depth) {
    const group = new THREE.Group();
    group.position.set(x, height / 2, z);
    group.userData = { nodeData: data };

    const colorHex = data.isNetwork ? this.colors.network : this.colors.drive;

    // Platform base box
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.65,
      emissive: colorHex,
      emissiveIntensity: 0.16
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = group.userData;
    group.add(mesh);

    // Glowing rim
    const edges = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75 });
    const wire = new THREE.LineSegments(edges, edgeMat);
    group.add(wire);

    // Capacity Bar Visual on top surface
    const percent = Math.min(100, Math.max(0, data.percentUsed || 0));
    const barWidth = width * 0.82;
    const barHeight = 0.55;
    const barDepth = 0.9;

    // Background bar
    const barBgGeo = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
    const barBgMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const barBgMesh = new THREE.Mesh(barBgGeo, barBgMat);
    barBgMesh.position.set(0, height / 2 + 0.1, depth * 0.12);
    group.add(barBgMesh);

    // Used portion bar
    if (percent > 0) {
      const fillW = Math.max(0.2, (barWidth * (percent / 100)));
      const barFillGeo = new THREE.BoxGeometry(fillW, barHeight + 0.05, barDepth + 0.05);
      const barColor = percent > 88 ? 0xef4444 : (percent > 70 ? 0xf59e0b : colorHex);
      const barFillMat = new THREE.MeshBasicMaterial({ color: barColor });
      const barFillMesh = new THREE.Mesh(barFillGeo, barFillMat);
      barFillMesh.position.set(-barWidth / 2 + fillW / 2, height / 2 + 0.12, depth * 0.12);
      group.add(barFillMesh);
    }

    // Drive label sprite
    const capacityText = data.totalSpace ? `${data.freeSpace || ''} libres de ${data.totalSpace}` : `${percent}% ocupado`;
    const labelSprite = this.createTextBadge(data.name, `${data.driveTypeDescription || 'Disco'} • ${capacityText}`, colorHex);
    labelSprite.position.set(0, height / 2 + 2.8, 0);
    group.add(labelSprite);

    // Hover & Selection handlers
    group.onHoverEnter = () => {
      mesh.scale.set(1.05, 1.05, 1.05);
      mat.emissiveIntensity = 0.45;
      document.body.style.cursor = "pointer";
    };

    group.onHoverExit = () => {
      mesh.scale.set(1, 1, 1);
      mat.emissiveIntensity = 0.16;
      document.body.style.cursor = "default";
    };

    group.onDoubleClick = () => {
      this.bridge.sendMessage("navigate", data.fullPath);
    };

    this.engine.interactiveObjects.push(mesh);
    return group;
  }

  createLibraryPlatformBox(data, x, z, width, height, depth) {
    const group = new THREE.Group();
    group.position.set(x, height / 2, z);
    group.userData = { nodeData: data };

    const colorHex = this.colors[data.itemType] || 0xeab308;

    // Platform box
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.6,
      emissive: colorHex,
      emissiveIntensity: 0.14
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = group.userData;
    group.add(mesh);

    // Glowing edges
    const edges = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 });
    group.add(new THREE.LineSegments(edges, edgeMat));

    // Top icon/badge
    const labelSprite = this.createTextBadge(data.name, "Biblioteca del Sistema", colorHex);
    labelSprite.position.set(0, height / 2 + 2.2, 0);
    group.add(labelSprite);

    group.onHoverEnter = () => {
      mesh.scale.set(1.05, 1.05, 1.05);
      mat.emissiveIntensity = 0.45;
      document.body.style.cursor = "pointer";
    };

    group.onHoverExit = () => {
      mesh.scale.set(1, 1, 1);
      mat.emissiveIntensity = 0.14;
      document.body.style.cursor = "default";
    };

    group.onDoubleClick = () => {
      this.bridge.sendMessage("navigate", data.fullPath);
    };

    this.engine.interactiveObjects.push(mesh);
    return group;
  }

  /* =========================================================================
   * NIVEL 2: Vista City-Grid - Ciudad 3D Organizada en Manzanas y Calles
   * ========================================================================= */
  buildCityGrid(payload) {
    this.clear();
    this.currentPayload = payload;
    this.currentViewMode = "city";

    if (window.hudOverlay) {
      window.hudOverlay.setViewMode("city");
      window.hudOverlay.updateBreadcrumbs(payload.breadcrumbs || []);
    }

    const items = payload.children || [];
    if (items.length === 0) {
      this.renderEmptyDirectoryNotice(payload.currentNode);
      return;
    }

    // Protection for huge directories: cap at 144 items in 3D (e.g. 9 blocks of 4x4)
    // and guide user to list view for complete enumeration
    const max3DItems = 144;
    const displayItems = items.slice(0, max3DItems);

    // City Layout Metrics:
    // Items grouped into blocks (manzanas) of 4 x 4 buildings
    const blockItemsX = 4;
    const blockItemsZ = 4;
    const buildingW = 3.6;
    const buildingD = 3.6;
    const streetWidth = 2.2;   // Calles dentro de una manzana
    const avenueWidth = 7.5;   // Avenidas amplias entre manzanas

    const blockStrideX = blockItemsX * (buildingW + streetWidth) + avenueWidth;
    const blockStrideZ = blockItemsZ * (buildingD + streetWidth) + avenueWidth;

    // Sort: Folders first (alphabetical), then files (alphabetical)
    const folders = displayItems.filter(i => i.isDirectory);
    const files = displayItems.filter(i => !i.isDirectory);
    const sortedList = [...folders, ...files];

    // Calculate grid dimensions
    const totalItems = sortedList.length;
    const itemsPerBlock = blockItemsX * blockItemsZ; // 16
    const totalBlocks = Math.ceil(totalItems / itemsPerBlock);
    const blocksPerRow = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(totalBlocks))));
    const blocksPerCol = Math.ceil(totalBlocks / blocksPerRow);

    const totalCityWidth = blocksPerRow * blockStrideX;
    const totalCityDepth = blocksPerCol * blockStrideZ;

    // Ground Plane with Cyber Grid
    const groundSize = Math.max(120, Math.max(totalCityWidth, totalCityDepth) + 40);
    const divisions = Math.floor(groundSize / 3.5);
    const grid = new THREE.GridHelper(groundSize, divisions, 0x00f0ff, 0x1e293b);
    grid.position.y = -0.05;
    this.cityGroup.add(grid);

    // Add city street avenue lines
    this.createAvenueLines(blocksPerRow, blocksPerCol, blockStrideX, blockStrideZ, totalCityWidth, totalCityDepth);

    // Setup city street traffic on grid lines
    this.setupTraffic(groundSize, divisions);

    // Build Buildings
    sortedList.forEach((data, index) => {
      // Find block coordinate
      const blockIndex = Math.floor(index / itemsPerBlock);
      const bRow = Math.floor(blockIndex / blocksPerRow);
      const bCol = blockIndex % blocksPerRow;

      // Find slot within block
      const itemInBlock = index % itemsPerBlock;
      const iRow = Math.floor(itemInBlock / blockItemsX);
      const iCol = itemInBlock % blockItemsX;

      // Position calculations centered around (0,0,0)
      const blockOriginX = -totalCityWidth / 2 + bCol * blockStrideX + (blockStrideX - avenueWidth) / 2;
      const blockOriginZ = -totalCityDepth / 2 + bRow * blockStrideZ + (blockStrideZ - avenueWidth) / 2;

      const posX = blockOriginX - ((blockItemsX - 1) * (buildingW + streetWidth)) / 2 + iCol * (buildingW + streetWidth);
      const posZ = blockOriginZ - ((blockItemsZ - 1) * (buildingD + streetWidth)) / 2 + iRow * (buildingD + streetWidth);

      // Logarithmic building height calculation
      const height = this.calculateBuildingHeight(data);

      const building = this.createBuildingMesh(data, posX, posZ, buildingW, height, buildingD, index);
      building.scale.y = 0.01;
      this.cityGroup.add(building);
      this.buildings.push(building);

      const dist = Math.sqrt(posX * posX + posZ * posZ);
      this.animatingBuildings.push({
        mesh: building,
        startTime: performance.now(),
        delay: Math.min(450, dist * 3.5),
        duration: 550
      });
    });

    // Camera Transition: encompass the entire city grid at an elegant 3D isometric angle
    const camDist = Math.max(45, Math.max(totalCityWidth, totalCityDepth) * 0.95 + 18);
    this.engine.flyCameraTo(
      new THREE.Vector3(camDist * 0.65, camDist * 0.75, camDist * 0.85),
      new THREE.Vector3(0, 2, 0),
      1000
    );
  }

  /* =========================================================================
   * SPATIAL CONTINUITY TRANSITIONS (City-Grid)
   * ========================================================================= */

  // 1. Descend and dive into a folder building
  animateDescendIntoFolder(nodeData, nodeMesh, onComplete) {
    if (!nodeMesh) {
      if (onComplete) onComplete();
      return;
    }

    const targetPos = new THREE.Vector3();
    nodeMesh.getWorldPosition(targetPos);

    // Smoothly dive camera towards target building entrance/roof
    const camTarget = new THREE.Vector3(targetPos.x, targetPos.y + 3.2, targetPos.z + 5.5);
    this.engine.flyCameraTo(camTarget, targetPos, 450);

    // Shrink and fade other buildings
    const startTime = performance.now();
    const duration = 400;

    const animateOut = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease = progress * progress;

      for (let i = 0; i < this.buildings.length; i++) {
        const b = this.buildings[i];
        if (b !== nodeMesh && b.userData !== nodeMesh.userData) {
          b.scale.y = Math.max(0.01, 1.0 - ease);
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

  // 2. Elevate camera and compact buildings into a representative folder box
  animateSubirNivel(onComplete) {
    // Elevate camera upwards to a high bird's eye view
    const currentCam = this.engine.camera.position;
    const highCam = new THREE.Vector3(currentCam.x * 0.35, currentCam.y + 65, currentCam.z * 0.35 + 20);
    this.engine.flyCameraTo(highCam, new THREE.Vector3(0, 0, 0), 550);

    // Animate all current buildings compacting towards center (0, 0, 0)
    const buildingsData = this.buildings.map(b => ({
      mesh: b,
      startPos: b.position.clone(),
      startScale: b.scale.clone()
    }));

    // Create a compact representative folder cube at center
    const compactBoxGeo = new THREE.BoxGeometry(4.5, 4.0, 4.5);
    const compactBoxMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: this.colors.folder,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.7
    });
    const compactMesh = new THREE.Mesh(compactBoxGeo, compactBoxMat);
    compactMesh.position.set(0, 2.0, 0);
    compactMesh.scale.set(0.01, 0.01, 0.01);
    this.cityGroup.add(compactMesh);

    const startTime = performance.now();
    const duration = 500;

    const animateCompaction = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      for (let i = 0; i < buildingsData.length; i++) {
        const item = buildingsData[i];
        item.mesh.position.lerpVectors(item.startPos, new THREE.Vector3(0, 0.5, 0), ease);
        item.mesh.scale.set(
          item.startScale.x * (1 - ease * 0.95),
          Math.max(0.01, item.startScale.y * (1 - ease * 0.95)),
          item.startScale.z * (1 - ease * 0.95)
        );
      }

      const boxScale = ease;
      compactMesh.scale.set(boxScale, boxScale, boxScale);

      if (progress < 1.0) {
        requestAnimationFrame(animateCompaction);
      } else {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 60);
      }
    };

    requestAnimationFrame(animateCompaction);
  }

  calculateBuildingHeight(data) {
    if (data.isDirectory) {
      // Folders have robust standard height or proportional to childCount
      if (data.childCount > 0) {
        return Math.min(22.0, 5.0 + Math.min(16.0, data.childCount * 0.65));
      }
      return 6.5;
    }

    // Files: logarithmic scaling based on sizeBytes
    const bytes = data.sizeBytes || 0;
    if (bytes <= 0) return 2.2;

    // Scale: log10(bytes / 1024 + 1) -> 0 to 7 approx for 10GB
    const kb = bytes / 1024;
    const logVal = Math.log10(kb + 1);
    const height = 2.4 + logVal * 4.2;

    return Math.max(2.2, Math.min(28.0, height));
  }

  createBuildingMesh(data, x, z, w, h, d, index) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData = {
      nodeData: data,
      targetHeight: h,
      baseY: 0,
      width: w,
      depth: d
    };

    const colorHex = this.colors[data.itemType] || this.colors.unknown;

    let mainMesh;
    let roof = null;
    if (data.isDirectory) {
      // 1. FOLDER BUILDING (Distinctive golden cube with beacon roof)
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: colorHex,
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.65
      });
      mainMesh = new THREE.Mesh(geo, mat);
      mainMesh.position.y = h / 2;
      group.add(mainMesh);

      // Distinctive pyramidal / cornice roof for folders
      const roofGeo = new THREE.ConeGeometry(w * 0.62, 1.8, 4);
      const roofMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.55,
        roughness: 0.2
      });
      roof = new THREE.Mesh(roofGeo, roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = h + 0.9;
      roof.userData = group.userData;
      group.add(roof);

      // Glowing edges
      const edges = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
      mainMesh.add(new THREE.LineSegments(edges, edgeMat));
    } else {
      // 2. FILE BUILDING (Tower with illuminated top and neon color code)
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: colorHex,
        emissiveIntensity: 0.22,
        roughness: 0.3,
        metalness: 0.7
      });
      mainMesh = new THREE.Mesh(geo, mat);
      mainMesh.position.y = h / 2;
      group.add(mainMesh);

      // Glowing roof border
      const edges = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75 });
      mainMesh.add(new THREE.LineSegments(edges, edgeMat));

      // Rooftop helipad/beacon plate
      const plateGeo = new THREE.BoxGeometry(w * 0.85, 0.15, d * 0.85);
      const plateMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = h / 2 + 0.08;
      plate.userData = group.userData;
      mainMesh.add(plate);
    }

    mainMesh.userData = group.userData;

    // Hover Animation Handlers
    group.onHoverEnter = () => {
      group.position.y = 0.8; // Elevate slightly
      mainMesh.material.emissiveIntensity = 0.75;
      document.body.style.cursor = "pointer";
    };

    group.onHoverExit = () => {
      group.position.y = 0;
      mainMesh.material.emissiveIntensity = data.isDirectory ? 0.35 : 0.22;
      document.body.style.cursor = "default";
    };

    group.onDoubleClick = () => {
      if (data.isDirectory) {
        // Dive into folder with camera transition
        const targetPos = group.position.clone();
        this.engine.flyCameraTo(
          new THREE.Vector3(targetPos.x, targetPos.y + 12, targetPos.z + 16),
          targetPos,
          450
        );
        setTimeout(() => {
          this.bridge.sendMessage("navigate", data.fullPath);
        }, 220);
      } else {
        // Execute / Open file in Windows
        this.bridge.sendMessage("open", data.fullPath);
      }
    };

    // Staggered architectural construction entrance animation
    group.scale.y = 0.01;
    this.animatingBuildings.push({
      mesh: group,
      delay: Math.min(600, index * 8),
      startTime: performance.now(),
      duration: 500
    });

    this.engine.interactiveObjects.push(mainMesh);
    if (roof) {
      this.engine.interactiveObjects.push(roof);
    }
    return group;
  }

  createAvenueLines(bCols, bRows, strideX, strideZ, totalW, totalD) {
    const avenueMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28
    });

    const pts = [];
    const halfW = totalW / 2 + 10;
    const halfD = totalD / 2 + 10;

    // Horizontal avenues
    for (let r = 0; r <= bRows; r++) {
      const z = -totalD / 2 + r * strideZ;
      pts.push(new THREE.Vector3(-halfW, 0.02, z));
      pts.push(new THREE.Vector3(halfW, 0.02, z));
    }

    // Vertical avenues
    for (let c = 0; c <= bCols; c++) {
      const x = -totalW / 2 + c * strideX;
      pts.push(new THREE.Vector3(x, 0.02, -halfD));
      pts.push(new THREE.Vector3(x, 0.02, halfD));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineSegments = new THREE.LineSegments(geo, avenueMat);
    this.cityGroup.add(lineSegments);
  }

  renderEmptyDirectoryNotice(node) {
    const labelSprite = this.createTextBadge(node.name || "Carpeta Vacía", "No se encontraron elementos legibles", 0x64748b);
    labelSprite.position.set(0, 8, 0);
    this.cityGroup.add(labelSprite);

    this.engine.flyCameraTo(
      new THREE.Vector3(0, 20, 35),
      new THREE.Vector3(0, 6, 0),
      800
    );
  }

  createTextBadge(title, subtitle, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pill background with glow stroke
    ctx.fillStyle = 'rgba(3, 7, 18, 0.82)';
    ctx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 3;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(16, 16, 480, 108, 20);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(16, 16, 480, 108);
      ctx.strokeRect(16, 16, 480, 108);
    }

    // Title
    ctx.font = 'bold 34px Segoe UI, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title || 'Item', 256, 52);

    // Subtitle
    if (subtitle) {
      ctx.font = '22px Segoe UI, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(subtitle, 256, 92);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(10.5, 2.8, 1);
    sprite.visible = this.showLabels;
    this.labelSprites.push(sprite);

    return sprite;
  }

  onRenderFrame(time) {
    // 1. Rotate inner core of welcome box if active
    if (this.currentViewMode === "welcome" && this.welcomeBoxObj) {
      if (this.welcomeBoxObj.innerCore) {
        this.welcomeBoxObj.innerCore.rotation.y += 0.012;
        this.welcomeBoxObj.innerCore.rotation.x += 0.008;
      }
      if (this.welcomeBoxObj.halo) {
        this.welcomeBoxObj.halo.rotation.z += 0.005;
      }
    }

    // 2. Animate building entrance elevation growth
    if (this.animatingBuildings.length > 0) {
      const now = performance.now();
      for (let i = this.animatingBuildings.length - 1; i >= 0; i--) {
        const anim = this.animatingBuildings[i];
        const elapsed = now - anim.startTime - anim.delay;
        if (elapsed > 0) {
          const t = Math.min(1.0, elapsed / anim.duration);
          // Ease-out back
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const ease = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

          anim.mesh.scale.y = Math.max(0.01, Math.min(1.0, ease));

          if (t >= 1.0) {
            anim.mesh.scale.y = 1.0;
            this.animatingBuildings.splice(i, 1);
          }
        }
      }
    }

    // 3. Animate street grid traffic light vehicles (random glowing photon packets)
    this.updateTraffic(time);
  }

  /* =========================================================================
   * STREET GRID TRAFFIC SIMULATION (Paquetes lumínicos aleatorios)
   * ========================================================================= */
  setupTraffic(gridSize, divisions) {
    this.disposeTraffic();

    this.trafficGridSize = gridSize;
    this.trafficDivisions = divisions;
    const step = gridSize / divisions;
    const halfSize = gridSize / 2;

    const vehicleCount = 90;
    // Glowing spherical energy packets identical in aesthetic to Constellation mode
    const geo = new THREE.SphereGeometry(0.18, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.InstancedMesh(geo, mat, vehicleCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Multi-hued cyber photon energy palette
    const photonPalette = [
      new THREE.Color(0x00f0ff), // Electric Cyan
      new THREE.Color(0x38bdf8), // Sky Blue
      new THREE.Color(0x80ffff), // Brilliant Aqua
      new THREE.Color(0xffffff), // White Photon
      new THREE.Color(0x00ff9d), // Cyber Emerald
      new THREE.Color(0xfacc15)  // Solar Flare Amber
    ];

    this.vehicles = [];

    for (let i = 0; i < vehicleCount; i++) {
      const axis = Math.random() < 0.5 ? 'x' : 'z';
      const dir = Math.random() < 0.5 ? 1 : -1;

      // Pick a random grid line index across the base grid
      const lineIdx = Math.floor(Math.random() * (divisions - 2)) + 1;
      const fixedCoord = -halfSize + lineIdx * step;
      // Stagger random initial position along the straight line
      const movingCoord = -halfSize + Math.random() * gridSize;

      // Assign vivid photon color from palette
      const color = photonPalette[i % photonPalette.length];
      mesh.setColorAt(i, color);

      const v = {
        x: axis === 'x' ? movingCoord : fixedCoord,
        z: axis === 'z' ? movingCoord : fixedCoord,
        axis: axis,
        dir: dir,
        speed: (0.16 + Math.random() * 0.24) * 0.75,
        phase: Math.random() * Math.PI * 2,
        fixedCoord: fixedCoord,
        step: step,
        halfSize: halfSize
      };

      this.vehicles.push(v);

      this.dummyTransform.position.set(v.x, 0.16, v.z);
      this.dummyTransform.rotation.set(0, 0, 0);
      this.dummyTransform.scale.set(1, 1, 1);
      this.dummyTransform.updateMatrix();
      mesh.setMatrixAt(i, this.dummyTransform.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.visible = this.trafficEnabled;

    this.trafficMesh = mesh;
    this.cityGroup.add(mesh);
  }

  updateTraffic(time = 0) {
    if (!this.trafficEnabled || !this.trafficMesh || this.vehicles.length === 0) return;

    const count = this.vehicles.length;
    const halfSize = this.trafficGridSize / 2;
    const step = this.trafficGridSize / this.trafficDivisions;

    for (let i = 0; i < count; i++) {
      const v = this.vehicles[i];
      const move = v.dir * v.speed * this.trafficSpeedMultiplier;

      // Always travel in a straight line on the assigned grid line (never turn at intersections)
      if (v.axis === 'x') {
        v.x += move;
        if (v.dir > 0 && v.x > halfSize) {
          v.x = -halfSize;
          const lineIdx = Math.floor(Math.random() * (this.trafficDivisions - 2)) + 1;
          v.z = -halfSize + lineIdx * step;
        } else if (v.dir < 0 && v.x < -halfSize) {
          v.x = halfSize;
          const lineIdx = Math.floor(Math.random() * (this.trafficDivisions - 2)) + 1;
          v.z = -halfSize + lineIdx * step;
        }
      } else {
        v.z += move;
        if (v.dir > 0 && v.z > halfSize) {
          v.z = -halfSize;
          const lineIdx = Math.floor(Math.random() * (this.trafficDivisions - 2)) + 1;
          v.x = -halfSize + lineIdx * step;
        } else if (v.dir < 0 && v.z < -halfSize) {
          v.z = halfSize;
          const lineIdx = Math.floor(Math.random() * (this.trafficDivisions - 2)) + 1;
          v.x = -halfSize + lineIdx * step;
        }
      }

      // Smooth edge fade-in / fade-out as packets approach grid boundaries
      const movingVal = Math.abs(v.axis === 'x' ? v.x : v.z);
      const fadeThreshold = halfSize * 0.80;
      let edgeFade = 1.0;
      if (movingVal > fadeThreshold) {
        edgeFade = Math.max(0.01, (halfSize - movingVal) / (halfSize - fadeThreshold));
      }

      // Harmonic breathing pulsation scale matching Constellation data pulses
      const pulse = 0.85 + Math.sin(time * 0.005 + v.phase + i * 0.25) * 0.28;
      const s = Math.max(0.01, pulse * edgeFade);

      this.dummyTransform.position.set(v.x, 0.16, v.z);
      this.dummyTransform.rotation.set(0, 0, 0);
      this.dummyTransform.scale.set(s, s, s);
      this.dummyTransform.updateMatrix();
      this.trafficMesh.setMatrixAt(i, this.dummyTransform.matrix);
    }

    this.trafficMesh.instanceMatrix.needsUpdate = true;
  }

  disposeTraffic() {
    if (this.trafficMesh) {
      this.cityGroup.remove(this.trafficMesh);
      if (this.trafficMesh.geometry) this.trafficMesh.geometry.dispose();
      if (this.trafficMesh.material) this.trafficMesh.material.dispose();
      this.trafficMesh = null;
    }
    this.vehicles = [];
  }

  setTrafficVisible(visible) {
    this.trafficEnabled = visible;
    if (this.trafficMesh) {
      this.trafficMesh.visible = visible;
    }
  }

  setTrafficSpeed(multiplier) {
    this.trafficSpeedMultiplier = multiplier;
  }
}


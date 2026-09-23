// engine3d.js - Core Three.js 3D Viewport, Camera Controls, Shaders, Bloom & Starfield

class Engine3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.composer = null;
    this.bloomPass = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.starfield = null;

    // Interaction state
    this.hoveredObject = null;
    this.selectedObject = null;
    this.interactiveObjects = [];
    this.targetCameraPos = null;
    this.targetControlsTarget = null;
    this.isTransitioning = false;

    // Callbacks
    this.onNodeHover = null;
    this.onNodeClick = null;
    this.onNodeDoubleClick = null;
    this.onBackgroundClick = null;
    this.activeSelectionHalos = [];

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x02040a, 0.0035);

    // 2. Camera (Free 3D Perspective)
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.5, 2000);
    this.camera.position.set(0, 35, 75);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x02040a, 1);
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls (Free 3D Camera navigation)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 450;
    this.controls.maxPolarAngle = Math.PI - 0.05;
    this.controls.target.set(0, 0, 0);

    // Free right-click button for context menu
    if (THREE.MOUSE) {
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: null
      };
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x223344, 1.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dirLight1.position.set(50, 100, 50);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xb026ff, 1.2);
    dirLight2.position.set(-50, -50, -50);
    this.scene.add(dirLight2);

    // 6. Postprocessing (Sci-Fi Neon Bloom)
    this.setupPostProcessing(width, height);

    // 7. Ambient Cyber Cosmic Dust / Starfield
    this.createStarfield();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    this.renderer.domElement.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    this.renderer.domElement.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    this.renderer.domElement.addEventListener('pointerup', (e) => {
      if (e.button === 2) {
        this.onContextMenu(e);
      }
    });

    // Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupPostProcessing(width, height) {
    try {
      if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        this.bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(width, height),
          0.55, // subtle glow
          0.40,
          0.32
        );
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
      }
    } catch (err) {
      console.warn("PostProcessing fallback to standard renderer:", err);
      this.composer = null;
    }
  }

  setBloomIntensity(percent) {
    if (this.bloomPass) {
      this.bloomPass.strength = (percent / 100) * 1.1;
    }
  }

  setStarfieldVisible(visible) {
    if (this.starfield) {
      this.starfield.visible = visible;
    }
  }

  createStarfield() {
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorA = new THREE.Color(0x00f0ff);
    const colorB = new THREE.Color(0xb026ff);
    const colorC = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 800;
      positions[idx + 1] = (Math.random() - 0.5) * 600;
      positions[idx + 2] = (Math.random() - 0.5) * 800;

      const mixed = Math.random() < 0.4 ? colorA : (Math.random() < 0.7 ? colorB : colorC);
      colors[idx] = mixed.r;
      colors[idx + 1] = mixed.g;
      colors[idx + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.0, // Reduced from 2.2 to 1.0 for delicate celestial dust
      vertexColors: true,
      transparent: true,
      opacity: 0.35, // Softer opacity
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);

    // Prevent page zoom from interfering with HUD
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    });
  }

  onWindowResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  updateMouse(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerMove(event) {
    this.updateMouse(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let topHit = intersects[0].object;
      while (topHit.parent && !topHit.userData.nodeData && topHit.parent !== this.scene) {
        topHit = topHit.parent;
      }

      if (this.hoveredObject !== topHit) {
        if (this.hoveredObject && this.hoveredObject.onHoverExit) {
          this.hoveredObject.onHoverExit();
        }
        this.hoveredObject = topHit;
        if (this.hoveredObject && this.hoveredObject.onHoverEnter) {
          this.hoveredObject.onHoverEnter();
        }
        this.renderer.domElement.style.cursor = 'pointer';
        if (this.onNodeHover) {
          this.onNodeHover(this.hoveredObject.userData.nodeData, event);
        }
      }
    } else {
      if (this.hoveredObject) {
        if (this.hoveredObject.onHoverExit) {
          this.hoveredObject.onHoverExit();
        }
        this.hoveredObject = null;
        this.renderer.domElement.style.cursor = 'default';
        if (this.onNodeHover) {
          this.onNodeHover(null, event);
        }
      }
    }
  }

  onClick(event) {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let target = intersects[0].object;
      while (target.parent && !target.userData.nodeData && target.parent !== this.scene) {
        target = target.parent;
      }
      this.selectedObject = target;
      if (this.onNodeClick) {
        this.onNodeClick(target.userData.nodeData, event, target);
      }
    } else {
      if (this.onBackgroundClick) {
        this.onBackgroundClick(event);
      }
    }
  }

  onDoubleClick(event) {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let target = intersects[0].object;
      while (target.parent && !target.userData.nodeData && target.parent !== this.scene) {
        target = target.parent;
      }
      if (this.onNodeDoubleClick) {
        this.onNodeDoubleClick(target.userData.nodeData, target);
      }
    }
  }

  onContextMenu(event) {
    if (event.preventDefault) event.preventDefault();
    const now = performance.now();
    if (this._lastContextMenuTime && (now - this._lastContextMenuTime) < 220) {
      return;
    }
    this._lastContextMenuTime = now;

    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    let targetData = null;
    let targetMesh = null;
    if (intersects.length > 0) {
      let target = intersects[0].object;
      while (target.parent && !target.userData.nodeData && target.parent !== this.scene) {
        target = target.parent;
      }
      if (target.userData.nodeData) {
        targetData = target.userData.nodeData;
        targetMesh = target;
        this.selectedObject = target;
      }
    }

    if (this.onNodeContextMenu) {
      this.onNodeContextMenu(targetData, event, targetMesh);
    }
  }

  setNodeSelected(nodeMesh, isSelected) {
    if (!nodeMesh) return;
    const existingHalo = nodeMesh.getObjectByName('__selectionHalo__');
    if (isSelected) {
      if (!existingHalo) {
        const box = new THREE.Box3().setFromObject(nodeMesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.z, 2.2);
        const radius = maxDim * 0.72;

        const haloGroup = new THREE.Group();
        haloGroup.name = '__selectionHalo__';

        // Outer neon cyan ring
        const ringGeo = new THREE.RingGeometry(radius * 0.95, radius * 1.15, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.05;
        haloGroup.add(ringMesh);

        // Inner glowing disc aura
        const innerGeo = new THREE.RingGeometry(0.1, radius * 0.92, 48);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.18
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.x = Math.PI / 2;
        innerMesh.position.y = 0.04;
        haloGroup.add(innerMesh);

        nodeMesh.add(haloGroup);
        this.activeSelectionHalos.push(haloGroup);
      }
    } else {
      if (existingHalo) {
        nodeMesh.remove(existingHalo);
        this.activeSelectionHalos = this.activeSelectionHalos.filter(h => h !== existingHalo);
      }
    }
  }

  clearAllSelectionHalos() {
    for (const halo of this.activeSelectionHalos) {
      if (halo.parent) {
        halo.parent.remove(halo);
      }
    }
    this.activeSelectionHalos = [];
  }

  flyCameraTo(targetPos, targetLookAt, duration = 1000) {
    this.targetCameraPos = targetPos.clone();
    this.targetControlsTarget = targetLookAt.clone();
    this.isTransitioning = true;
  }

  resetCamera() {
    this.flyCameraTo(new THREE.Vector3(0, 35, 75), new THREE.Vector3(0, 0, 0));
  }

  setTopView() {
    this.flyCameraTo(new THREE.Vector3(0, 95, 0.1), new THREE.Vector3(0, 0, 0));
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    // Rotate background celestial particles slowly
    if (this.starfield) {
      this.starfield.rotation.y = time * 0.00004;
      this.starfield.rotation.x = time * 0.00002;
    }

    // Smooth camera fly-through interpolation (lerp)
    if (this.isTransitioning && this.targetCameraPos && this.targetControlsTarget) {
      this.camera.position.lerp(this.targetCameraPos, 0.07);
      this.controls.target.lerp(this.targetControlsTarget, 0.07);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.5 &&
          this.controls.target.distanceTo(this.targetControlsTarget) < 0.5) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetControlsTarget);
        this.isTransitioning = false;
      }
    }

    this.controls.update();

    // Subtle holographic rotation of active 3D selection halos
    if (this.activeSelectionHalos && this.activeSelectionHalos.length > 0) {
      for (let i = 0; i < this.activeSelectionHalos.length; i++) {
        this.activeSelectionHalos[i].rotation.y += 0.015;
      }
    }

    // Call any per-frame scene updates
    if (window.plexGraph && window.plexGraph.onRenderFrame) {
      window.plexGraph.onRenderFrame(time);
    }
    if (window.cityGrid && window.cityGrid.onRenderFrame) {
      window.cityGrid.onRenderFrame(time);
    }
    if (window.neuralNetwork && window.neuralNetwork.onRenderFrame) {
      window.neuralNetwork.onRenderFrame(time);
    }
    if (window.galleryMuseum && window.galleryMuseum.onRenderFrame) {
      window.galleryMuseum.onRenderFrame(time);
    }

    if (this.composer) {
      try {
        this.composer.render();
      } catch (err) {
        this.renderer.render(this.scene, this.camera);
      }
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

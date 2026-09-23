// galleryMuseum.js - Axplorer SNX 3D Virtual Museum & Gallery Experience
// Independent module: Procedural low-poly architectural gallery with 1st-person FPS navigation

class GalleryMuseum {
  constructor(engine, bridge) {
    this.engine = engine;
    this.bridge = bridge;

    // Root group for the entire museum
    this.galleryGroup = new THREE.Group();
    this.galleryGroup.name = "GalleryMuseumGroup";
    this.galleryGroup.visible = false;
    this.engine.scene.add(this.galleryGroup);

    // Active state
    this.isActive = false;
    this.currentData = null;
    this.allowWASD = false; // By default disabled as requested

    // Player / FPS Camera State
    this.playerHeight = 1.75;
    this.playerPosition = new THREE.Vector3(0, this.playerHeight, 0);
    this.cameraYaw = 0; // Horizontal rotation (radians)
    this.cameraPitch = 0; // Vertical look (radians)
    this.moveSpeed = 12.0; // Units per second
    this.turnSpeed = 2.2; // Radians per second for ArrowLeft / ArrowRight
    this.mouseSensitivity = 0.0022;

    // Movement flags
    this.keys = {
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false,
      keyW: false,
      keyS: false,
      keyA: false,
      keyD: false
    };
    this.isRightMouseDown = false;
    this.isDraggingMouse = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Interactive gallery items (paintings, books, crates, video cases, screen)
    this.interactiveGalleryItems = [];
    this.wallOccluders = [];
    this.corridorWidth = 14;
    this.halfCorridorLen = 26;
    this.hoveredItem = null;
    this.focusedItem = null;
    this.lastPointerEvent = null;

    // Video Player & Cinema Screening Room state
    this.videoElem = null;
    this.videoTexture = null;
    this.screenCanvasMesh = null;
    this.screenMat = null;
    this.currentVideoNode = null;
    this.firstVideoNode = null;
    this.isSeekingVideo = false;
    this.currentVolume = 0.8;
    this.hasMovedSinceEnter = false;

    // Textures cache & loader
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.setCrossOrigin('anonymous');
    this.plaqueCanvases = new Map();

    // Reusable vector / raycaster
    this.raycaster = new THREE.Raycaster();
    this.centerScreenVec = new THREE.Vector2(0, 0);

    // Room boundaries (AABBs) for basic collision
    this.roomBounds = [];

    // UI elements references
    this.reticleEl = null;
    this.exitBtnEl = null;
    this.controlsBadgeEl = null;
    this.headerBadgeEl = null;
    this.introCardEl = null;
    this.cinemaControlsEl = null;

    this.initUI();
    this.initInputListeners();
  }

  /* -------------------------------------------------------------
     UI & DOM Controls Setup
  ------------------------------------------------------------- */
  initUI() {
    // 1. Central Reticle
    this.reticleEl = document.createElement('div');
    this.reticleEl.id = 'gallery-reticle';
    this.reticleEl.className = 'gallery-reticle';
    this.reticleEl.style.display = 'none';
    document.body.appendChild(this.reticleEl);

    // 2. Floating Exit Gallery Button
    this.exitBtnEl = document.createElement('button');
    this.exitBtnEl.id = 'btn-exit-gallery';
    this.exitBtnEl.className = 'gallery-exit-btn';
    this.exitBtnEl.style.display = 'none';
    this.exitBtnEl.innerHTML = '<span class="exit-icon">🚪</span> <span>Salir de Galería 3D</span> <kbd>Esc</kbd>';
    this.exitBtnEl.addEventListener('click', () => this.exitGallery());
    document.body.appendChild(this.exitBtnEl);

    // 3. Floating Controls Helper Banner
    this.controlsBadgeEl = document.createElement('div');
    this.controlsBadgeEl.id = 'gallery-controls-badge';
    this.controlsBadgeEl.className = 'gallery-controls-badge';
    this.controlsBadgeEl.style.display = 'none';
    this.updateControlsBadgeText();
    document.body.appendChild(this.controlsBadgeEl);

    // 4. Header Badge (Showing current gallery folder)
    this.headerBadgeEl = document.createElement('div');
    this.headerBadgeEl.id = 'gallery-header-badge';
    this.headerBadgeEl.className = 'gallery-header-badge';
    this.headerBadgeEl.style.display = 'none';
    this.headerBadgeEl.innerHTML = '<span>🏛️ Galería 3D:</span> <span class="gallery-folder-name" id="gallery-folder-title">Carpeta</span>';
    document.body.appendChild(this.headerBadgeEl);

    // 5. Intro / Tutorial Overlay Card (Fades out when player moves)
    this.introCardEl = document.createElement('div');
    this.introCardEl.id = 'gallery-intro-card';
    this.introCardEl.className = 'gallery-intro-card';
    this.introCardEl.style.display = 'none';
    this.introCardEl.innerHTML = `
      <div class="gallery-intro-header">
        <span class="gallery-intro-icon">🏛️</span>
        <div>
          <h3 class="gallery-intro-title">Modo Galería 3D</h3>
          <span class="gallery-intro-subtitle">Explora tus archivos en un entorno espacial interactivo</span>
        </div>
      </div>
      <div class="gallery-intro-grid">
        <div class="gallery-intro-item">
          <span class="intro-key-badge">▲ ▼</span>
          <div class="intro-text">
            <strong>Avanzar / Retroceder</strong>
            <span>Caminar por el museo</span>
          </div>
        </div>
        <div class="gallery-intro-item">
          <span class="intro-key-badge">◄ ►</span>
          <div class="intro-text">
            <strong>Desplazamiento Lateral</strong>
            <span>Desplazamiento lateral (Strafe)</span>
          </div>
        </div>
        <div class="gallery-intro-item">
          <span class="intro-key-badge">Mouse</span>
          <div class="intro-text">
            <strong>Arrastrar (Clic Izq / Der)</strong>
            <span>Girar la vista (Mouse Look)</span>
          </div>
        </div>
        <div class="gallery-intro-item">
          <span class="intro-key-badge">Clic / 2 Clic</span>
          <div class="intro-text">
            <strong>Inspeccionar / Abrir</strong>
            <span>Ver detalles, reproducir cine o abrir</span>
          </div>
        </div>
      </div>
      <div class="gallery-intro-footer">
        <span>💡 Comienza a moverte para cerrar esta guía automáticamente</span>
      </div>
    `;
    document.body.appendChild(this.introCardEl);

    // 6. Cinema Screening Room Floating Controls Bar
    this.cinemaControlsEl = document.createElement('div');
    this.cinemaControlsEl.id = 'gallery-cinema-controls';
    this.cinemaControlsEl.className = 'gallery-cinema-controls';
    this.cinemaControlsEl.style.display = 'none';
    this.cinemaControlsEl.innerHTML = `
      <div class="cinema-info-row">
        <span class="cinema-badge">CINE 3D</span>
        <span id="cinema-title" class="cinema-video-title">Sin video cargado</span>
        <span id="cinema-time" class="cinema-time-display">00:00 / 00:00</span>
      </div>
      <div class="cinema-bar-row">
        <button id="btn-cinema-play" class="cinema-ctrl-btn" title="Reproducir / Pausar">▶</button>
        <input id="cinema-seek" type="range" class="cinema-scrub-bar" min="0" max="100" step="0.1" value="0">
        <div class="cinema-vol-group">
          <button id="btn-cinema-vol" class="cinema-vol-btn" title="Silenciar / Activar audio">🔊</button>
          <input id="cinema-vol" type="range" class="cinema-vol-slider" min="0" max="1" step="0.05" value="0.8">
        </div>
        <button id="btn-cinema-fs" class="cinema-ctrl-btn" title="Pantalla Completa">⛶</button>
      </div>
    `;
    document.body.appendChild(this.cinemaControlsEl);

    // Bind Cinema UI Events
    const playBtn = this.cinemaControlsEl.querySelector('#btn-cinema-play');
    if (playBtn) playBtn.addEventListener('click', () => this.togglePlayPause());

    const seekInput = this.cinemaControlsEl.querySelector('#cinema-seek');
    if (seekInput) {
      seekInput.addEventListener('input', (e) => {
        this.isSeekingVideo = true;
        if (this.videoElem && this.videoElem.duration) {
          const targetTime = (parseFloat(e.target.value) / 100) * this.videoElem.duration;
          this.updateTimeLabel(targetTime, this.videoElem.duration);
        }
      });
      seekInput.addEventListener('change', (e) => {
        if (this.videoElem && this.videoElem.duration) {
          this.videoElem.currentTime = (parseFloat(e.target.value) / 100) * this.videoElem.duration;
        }
        this.isSeekingVideo = false;
      });
    }

    const volBtn = this.cinemaControlsEl.querySelector('#btn-cinema-vol');
    const volInput = this.cinemaControlsEl.querySelector('#cinema-vol');
    if (volBtn && volInput) {
      volBtn.addEventListener('click', () => {
        if (!this.videoElem) return;
        this.videoElem.muted = !this.videoElem.muted;
        volBtn.textContent = this.videoElem.muted ? '🔇' : '🔊';
      });
      volInput.addEventListener('input', (e) => {
        if (!this.videoElem) return;
        this.currentVolume = parseFloat(e.target.value);
        this.videoElem.volume = this.currentVolume;
        this.videoElem.muted = (this.currentVolume === 0);
        volBtn.textContent = this.videoElem.muted ? '🔇' : '🔊';
      });
    }

    const fsBtn = this.cinemaControlsEl.querySelector('#btn-cinema-fs');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!this.videoElem) return;
        if (this.videoElem.requestFullscreen) {
          this.videoElem.requestFullscreen();
        } else if (this.videoElem.webkitRequestFullscreen) {
          this.videoElem.webkitRequestFullscreen();
        }
      });
    }

    this.initVideoPlayer();
  }

  dismissIntroCard() {
    if (this.hasMovedSinceEnter) return;
    this.hasMovedSinceEnter = true;
    if (this.introCardEl) {
      this.introCardEl.classList.add('fade-out');
      setTimeout(() => {
        if (this.introCardEl && this.hasMovedSinceEnter) {
          this.introCardEl.style.display = 'none';
        }
      }, 480);
    }
  }

  updateControlsBadgeText() {
    if (!this.controlsBadgeEl) return;
    const wasdText = this.allowWASD ? '<span class="gallery-control-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Mover</span> <div class="gallery-control-sep"></div>' : '';
    this.controlsBadgeEl.innerHTML = `
      <span class="gallery-control-item"><kbd>▲</kbd><kbd>▼</kbd> Avanzar / Retroceder</span>
      <div class="gallery-control-sep"></div>
      <span class="gallery-control-item"><kbd>◄</kbd><kbd>►</kbd> Desplazamiento Lateral</span>
      <div class="gallery-control-sep"></div>
      <span class="gallery-control-item"><kbd>Arrastrar Mouse</kbd> Girar Vista</span>
      <div class="gallery-control-sep"></div>
      <span class="gallery-control-item"><kbd>Clic Secundario (Sostener)</kbd> Avanzar</span>
      <div class="gallery-control-sep"></div>
      ${wasdText}
      <span class="gallery-control-item"><kbd>Clic Izq</kbd> Examinar / Reproducir</span>
    `;
  }

  setAllowWASD(allow) {
    this.allowWASD = !!allow;
    this.updateControlsBadgeText();
  }

  /* -------------------------------------------------------------
     Video Player Engine (HTML5 Video + THREE.VideoTexture)
  ------------------------------------------------------------- */
  initVideoPlayer() {
    this.videoElem = document.createElement('video');
    this.videoElem.crossOrigin = 'anonymous';
    this.videoElem.playsInline = true;
    this.videoElem.preload = 'metadata';
    this.videoElem.style.display = 'none';
    document.body.appendChild(this.videoElem);

    this.videoTexture = new THREE.VideoTexture(this.videoElem);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBAFormat;

    // Time update for scrub bar and time label
    this.videoElem.addEventListener('timeupdate', () => {
      if (!this.isSeekingVideo && this.videoElem.duration) {
        const pct = (this.videoElem.currentTime / this.videoElem.duration) * 100;
        const seekEl = document.getElementById('cinema-seek');
        if (seekEl) seekEl.value = pct;
        this.updateTimeLabel(this.videoElem.currentTime, this.videoElem.duration);
      }
    });

    this.videoElem.addEventListener('ended', () => {
      this.updatePlayPauseBtn(false);
    });

    this.videoElem.addEventListener('pause', () => {
      this.updatePlayPauseBtn(false);
    });

    this.videoElem.addEventListener('play', () => {
      this.updatePlayPauseBtn(true);
    });
  }

  loadAndPlayVideo(videoNode) {
    if (!videoNode || !videoNode.fullPath) return;
    this.currentVideoNode = videoNode;

    const titleEl = document.getElementById('cinema-title');
    if (titleEl) titleEl.textContent = videoNode.name || 'Video';

    const videoUrl = `https://axplorer-media.local/video?path=${encodeURIComponent(videoNode.fullPath)}`;
    this.videoElem.src = videoUrl;
    this.videoElem.volume = this.currentVolume;

    this.videoElem.play().then(() => {
      this.updatePlayPauseBtn(true);
      if (this.screenCanvasMesh) {
        this.screenCanvasMesh.material.map = this.videoTexture;
        this.screenCanvasMesh.material.needsUpdate = true;
      }
    }).catch(err => {
      console.warn("Video playback deferred/blocked:", err);
    });

    if (window.hudOverlay) {
      window.hudOverlay.updateInspector(videoNode);
      window.hudOverlay.showToast(`Cargando en Pantalla de Cine: ${videoNode.name}`);
    }
  }

  togglePlayPause() {
    if (!this.videoElem || !this.videoElem.src) {
      if (this.firstVideoNode) {
        this.loadAndPlayVideo(this.firstVideoNode);
      }
      return;
    }
    if (this.videoElem.paused) {
      this.videoElem.play();
    } else {
      this.videoElem.pause();
    }
  }

  updatePlayPauseBtn(isPlaying) {
    const btn = document.getElementById('btn-cinema-play');
    if (btn) {
      btn.textContent = isPlaying ? '❚❚' : '▶';
    }
  }

  updateTimeLabel(curr, dur) {
    const timeEl = document.getElementById('cinema-time');
    if (timeEl) {
      timeEl.textContent = `${this.formatVideoTime(curr)} / ${this.formatVideoTime(dur)}`;
    }
  }

  formatVideoTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const mm = m < 10 ? '0' + m : '' + m;
    const ss = s < 10 ? '0' + s : '' + s;
    return `${mm}:${ss}`;
  }

  /* -------------------------------------------------------------
     Input & Movement Handlers (Arrow Keys, Mouse Secondary Walk)
  ------------------------------------------------------------- */
  initInputListeners() {
    // Keyboard listener
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      if (e.key === 'Escape') {
        this.exitGallery();
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowUp') { this.keys.arrowUp = true; e.preventDefault(); }
      if (e.key === 'ArrowDown') { this.keys.arrowDown = true; e.preventDefault(); }
      if (e.key === 'ArrowLeft') { this.keys.arrowLeft = true; e.preventDefault(); }
      if (e.key === 'ArrowRight') { this.keys.arrowRight = true; e.preventDefault(); }

      if (this.allowWASD) {
        if (e.code === 'KeyW') this.keys.keyW = true;
        if (e.code === 'KeyS') this.keys.keyS = true;
        if (e.code === 'KeyA') this.keys.keyA = true;
        if (e.code === 'KeyD') this.keys.keyD = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isActive) return;

      if (e.key === 'ArrowUp') this.keys.arrowUp = false;
      if (e.key === 'ArrowDown') this.keys.arrowDown = false;
      if (e.key === 'ArrowLeft') this.keys.arrowLeft = false;
      if (e.key === 'ArrowRight') this.keys.arrowRight = false;

      if (e.code === 'KeyW') this.keys.keyW = false;
      if (e.code === 'KeyS') this.keys.keyS = false;
      if (e.code === 'KeyA') this.keys.keyA = false;
      if (e.code === 'KeyD') this.keys.keyD = false;
    });

    // Mouse button listeners
    const canvasDom = this.engine.renderer.domElement;

    canvasDom.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;

      if (e.button === 2) {
        // Right button (secondary): Advance forward
        this.isRightMouseDown = true;
        e.preventDefault();
      } else if (e.button === 0) {
        // Left button: drag to look or click item
        this.isDraggingMouse = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.isActive) return;

      if (e.button === 2) {
        this.isRightMouseDown = false;
      } else if (e.button === 0) {
        this.isDraggingMouse = false;
      }
    });

    // Mouse movement / look around
    window.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      this.lastPointerEvent = e;

      if (this.isDraggingMouse || this.isRightMouseDown) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;

        this.cameraYaw -= deltaX * this.mouseSensitivity;
        this.cameraPitch -= deltaY * this.mouseSensitivity;

        // Clamp pitch to avoid neck-snapping
        const maxPitch = Math.PI / 2.5;
        this.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, this.cameraPitch));
      }

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    // Clicking / interacting with items in gallery
    canvasDom.addEventListener('click', (e) => {
      if (!this.isActive) return;
      if (e.button !== 0) return; // Only left click

      // Dismiss intro card if still visible
      this.dismissIntroCard();

      // Perform center-raycast or pointer raycast
      const item = this.raycastInteractiveItem(e);
      if (item && item.userData) {
        if (item.userData.type === 'videoCase' && item.userData.nodeData) {
          this.loadAndPlayVideo(item.userData.nodeData);
        } else if (item.userData.type === 'screen') {
          this.togglePlayPause();
        }
        if (item.userData.nodeData && window.hudOverlay) {
          window.hudOverlay.updateInspector(item.userData.nodeData);
        }
      }
    });

    // Double click to open item in Windows
    canvasDom.addEventListener('dblclick', (e) => {
      if (!this.isActive) return;
      const item = this.raycastInteractiveItem(e);
      if (item && item.userData && item.userData.nodeData) {
        const node = item.userData.nodeData;
        if (node.fullPath && this.bridge) {
          this.bridge.sendMessage('open', node.fullPath);
        }
      }
    });
  }

  /* -------------------------------------------------------------
     Gallery Mode Activation & Teardown
  ------------------------------------------------------------- */
  enterGallery(folderData) {
    if (!folderData) return;
    this.isActive = true;
    this.currentData = folderData;
    this.hasMovedSinceEnter = false;

    // 1. Hide standard views
    if (window.cityGrid && window.cityGrid.cityGroup) window.cityGrid.cityGroup.visible = false;
    if (window.plexGraph && window.plexGraph.graphGroup) window.plexGraph.graphGroup.visible = false;
    if (window.neuralNetwork && window.neuralNetwork.neuralGroup) window.neuralNetwork.neuralGroup.visible = false;

    // Clear old interactive objects so engine3d doesn't raycast against hidden city/neural meshes
    if (this.engine) {
      this.engine.interactiveObjects = [];
    }

    // 2. Disable OrbitControls
    if (this.engine.controls) {
      this.engine.controls.enabled = false;
    }

    // 3. Hide sidebars and camera widget during Gallery mode
    const sidebarLeft = document.getElementById('sidebar-left');
    const sidebarRight = document.getElementById('sidebar-right');
    const cameraWidget = document.getElementById('camera-widget');
    const bottomBar = document.getElementById('bottom-bar');
    if (sidebarLeft) sidebarLeft.style.display = 'none';
    if (sidebarRight) sidebarRight.style.display = 'none';
    if (cameraWidget) cameraWidget.style.display = 'none';
    if (bottomBar) bottomBar.style.display = 'none';

    // 4. Show Gallery Group & UI
    this.galleryGroup.visible = true;
    if (this.reticleEl) this.reticleEl.style.display = 'block';
    if (this.exitBtnEl) this.exitBtnEl.style.display = 'flex';
    if (this.controlsBadgeEl) this.controlsBadgeEl.style.display = 'flex';
    if (this.introCardEl) {
      this.introCardEl.style.display = 'flex';
      this.introCardEl.classList.remove('fade-out');
    }
    if (this.headerBadgeEl) {
      this.headerBadgeEl.style.display = 'flex';
      const titleSpan = document.getElementById('gallery-folder-title');
      if (titleSpan) titleSpan.textContent = folderData.currentNode ? folderData.currentNode.name : 'Carpeta';
    }

    // 5. Adapt HUD layout
    if (window.hudOverlay) {
      if (window.hudOverlay.btnNavUp) window.hudOverlay.btnNavUp.style.display = 'none';
      if (window.hudOverlay.colorLegendEl) window.hudOverlay.colorLegendEl.style.display = 'none';
    }

    // 6. Build procedural 3D museum architecture
    this.buildMuseumArchitecture(folderData);
  }

  exitGallery() {
    if (!this.isActive) return;
    this.isActive = false;

    // 1. Hide Gallery 3D group and UI
    this.galleryGroup.visible = false;
    if (this.reticleEl) this.reticleEl.style.display = 'none';
    if (this.exitBtnEl) this.exitBtnEl.style.display = 'none';
    if (this.controlsBadgeEl) this.controlsBadgeEl.style.display = 'none';
    if (this.headerBadgeEl) this.headerBadgeEl.style.display = 'none';
    if (this.introCardEl) this.introCardEl.style.display = 'none';
    if (this.cinemaControlsEl) this.cinemaControlsEl.style.display = 'none';

    // Stop video playback and release source
    if (this.videoElem) {
      this.videoElem.pause();
      this.videoElem.removeAttribute('src');
      this.videoElem.load();
    }
    this.currentVideoNode = null;
    this.updatePlayPauseBtn(false);

    // Restore sidebars and HUD widgets
    const sidebarLeft = document.getElementById('sidebar-left');
    const sidebarRight = document.getElementById('sidebar-right');
    const cameraWidget = document.getElementById('camera-widget');
    const bottomBar = document.getElementById('bottom-bar');
    if (sidebarLeft) sidebarLeft.style.display = '';
    if (sidebarRight) sidebarRight.style.display = '';
    if (cameraWidget) cameraWidget.style.display = '';
    if (bottomBar) bottomBar.style.display = '';

    // Clear hover and tooltip
    this.hoveredItem = null;
    this.lastPointerEvent = null;
    if (window.hudOverlay) {
      window.hudOverlay.showTooltip(null, null);
      if (window.hudOverlay.btnNavUp) window.hudOverlay.btnNavUp.style.display = '';
      if (window.hudOverlay.colorLegendEl) window.hudOverlay.colorLegendEl.style.display = '';
    }

    // 2. Reset camera & controls to normal 3D orbit
    this.engine.isTransitioning = false;
    this.engine.targetCameraPos = null;
    this.engine.targetControlsTarget = null;
    this.engine.camera.rotation.order = 'XYZ';

    this.engine.camera.position.set(0, 35, 75);
    this.engine.camera.lookAt(0, 0, 0);

    if (this.engine.controls) {
      this.engine.controls.enabled = true;
      this.engine.controls.target.set(0, 0, 0);
      this.engine.controls.update();
    }

    // 3. Restore previous visual mode and rebuild scene
    if (window.hudOverlay) {
      const mode = window.hudOverlay.currentViewMode || 'city';
      const payload = this.currentData || window.hudOverlay.lastPayload;
      if (payload) {
        window.hudOverlay.lastPayload = payload;
      }
      window.hudOverlay.setInterfaceMode(mode);
    }
  }

  /* -------------------------------------------------------------
     Procedural Architecture Generator (Pasillos, Biblioteca, Almacén)
  ------------------------------------------------------------- */
  buildMuseumArchitecture(folderData) {
    // Clear previous geometry
    while (this.galleryGroup.children.length > 0) {
      const obj = this.galleryGroup.children[0];
      this.galleryGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    this.interactiveGalleryItems = [];
    this.wallOccluders = [];
    this.roomBounds = [];

    const children = folderData.children || [];

    // Filter items by category
    const isVideo = (c) => !c.isDirectory && (c.itemType === 'video' || /\.(mp4|mkv|webm|avi|mov|wmv|m4v|ogg|ogv)$/i.test(c.extension || ''));
    const videoFiles = children.filter(isVideo);
    const imageFiles = children.filter(c => !c.isDirectory && c.itemType === 'image');
    const docFiles = children.filter(c => !c.isDirectory && !isVideo(c) && (c.itemType === 'document' || c.itemType === 'code'));
    const archiveAndOtherFiles = children.filter(c => !c.isDirectory && !isVideo(c) && c.itemType !== 'image' && c.itemType !== 'document' && c.itemType !== 'code');

    // Corridor Dimensions
    const corridorWidth = 14;
    this.corridorWidth = corridorWidth;
    const corridorHeight = 6.5;

    // 1. Calculate Frame Sizes Relative to Resolution (no overblown pixels on small images!)
    imageFiles.forEach(img => {
      let w = img.imageWidth || 0;
      let h = img.imageHeight || 0;
      let aspect = (w > 0 && h > 0) ? (w / h) : 1.33;
      aspect = Math.max(0.55, Math.min(2.4, aspect));

      const maxDim = Math.max(w, h);
      let baseH = 1.6;
      if (maxDim > 0) {
        if (maxDim <= 256) baseH = 0.95;
        else if (maxDim <= 600) baseH = 1.35;
        else if (maxDim <= 1280) baseH = 1.85;
        else if (maxDim <= 2160) baseH = 2.35;
        else baseH = 2.75;
      }

      const frameH = baseH;
      let frameW = frameH * aspect;
      frameW = Math.max(0.9, Math.min(4.0, frameW));

      img._frameW = frameW;
      img._frameH = frameH;
    });

    // 2. Distribute Images Alternating Between Left and Right Walls
    const leftImages = [];
    const rightImages = [];
    imageFiles.forEach((img, i) => {
      if (i % 2 === 0) leftImages.push(img);
      else rightImages.push(img);
    });

    // Layout along one wall avoiding the central archway [-4.5, 4.5]
    function computeWallPositions(items) {
      const placed = [];
      const half = Math.ceil(items.length / 2);
      const frontItems = items.slice(0, half);
      const backItems = items.slice(half);

      // Section Front: Z > 5.5 (towards spawn)
      let zFront = 5.5;
      frontItems.forEach(img => {
        const centerZ = zFront + img._frameW / 2 + 0.8;
        placed.push({ img, z: centerZ });
        zFront = centerZ + img._frameW / 2 + 1.8;
      });

      // Section Back: Z < -5.5 (towards corridor end)
      let zBack = -5.5;
      backItems.forEach(img => {
        const centerZ = zBack - (img._frameW / 2 + 0.8);
        placed.push({ img, z: centerZ });
        zBack = centerZ - (img._frameW / 2 + 1.8);
      });

      return {
        placed,
        maxFrontZ: Math.max(18, zFront + 4.0),
        minBackZ: Math.min(-18, zBack - 4.0)
      };
    }

    const leftLayout = computeWallPositions(leftImages);
    const rightLayout = computeWallPositions(rightImages);

    // Compute required corridor length dynamically so paintings NEVER stick out of walls
    const maxFrontZ = Math.max(leftLayout.maxFrontZ, rightLayout.maxFrontZ, 20);
    const minBackZ = Math.min(leftLayout.minBackZ, rightLayout.minBackZ, -20);
    const halfCorridorLen = Math.max(maxFrontZ, Math.abs(minBackZ)) + 6.0;
    const corridorLength = halfCorridorLen * 2;
    this.halfCorridorLen = halfCorridorLen;

    // 3. Materials
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.15
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.9,
      metalness: 0.0
    });

    const frameWoodMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.3
    });

    // 4. Build Main Corridor Floor, Ceiling & End Walls
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 0, 0);
    this.galleryGroup.add(floorMesh);

    // Subtle grid pattern on floor
    const gridHelper = new THREE.GridHelper(corridorLength, Math.round(corridorLength / 2), 0x00f0ff, 0x1e293b);
    gridHelper.position.y = 0.02;
    this.galleryGroup.add(gridHelper);

    const ceilingGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    ceilingGeo.rotateX(Math.PI / 2);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.set(0, corridorHeight, 0);
    this.galleryGroup.add(ceilingMesh);

    // North Archway Opening leading into Sala de Proyección y Cine
    const cinemaArchWidth = 8;
    const cinemaWallPartLen = (corridorWidth - cinemaArchWidth) / 2;
    // Left section of North wall: x from -corridorWidth/2 to -4
    this.buildWallSection(-corridorWidth / 2 + cinemaWallPartLen / 2, corridorHeight, cinemaWallPartLen, -halfCorridorLen, 0, wallMat);
    // Right section of North wall: x from 4 to corridorWidth/2
    this.buildWallSection(corridorWidth / 2 - cinemaWallPartLen / 2, corridorHeight, cinemaWallPartLen, -halfCorridorLen, 0, wallMat);
    // Header over North Archway with Title Sign
    this.buildArchHeader(0, corridorHeight, cinemaArchWidth, -halfCorridorLen, 0, wallMat, "🎬 SALA DE PROYECCIÓN Y CINE");

    // Front wall (Entrance behind player spawn)
    const frontWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    frontWallGeo.rotateY(Math.PI);
    const frontWallMesh = new THREE.Mesh(frontWallGeo, wallMat);
    frontWallMesh.position.set(0, corridorHeight / 2, corridorLength / 2);
    frontWallMesh.userData = { isWall: true };
    this.wallOccluders.push(frontWallMesh);
    this.galleryGroup.add(frontWallMesh);

    // 5. Side Walls with Portals/Archways for Rooms
    const halfLen = corridorLength / 2;
    const archWidth = 8;
    const wallPartLen = (corridorLength - archWidth) / 2;

    // Left wall sections
    this.buildWallSection(-corridorWidth / 2, corridorHeight, wallPartLen, -halfLen + wallPartLen / 2, Math.PI / 2, wallMat);
    this.buildWallSection(-corridorWidth / 2, corridorHeight, wallPartLen, halfLen - wallPartLen / 2, Math.PI / 2, wallMat);
    // Header over left archway
    this.buildArchHeader(-corridorWidth / 2, corridorHeight, archWidth, 0, Math.PI / 2, wallMat, "📚 SALA DE LECTURA Y DOCUMENTOS");

    // Right wall sections
    this.buildWallSection(corridorWidth / 2, corridorHeight, wallPartLen, -halfLen + wallPartLen / 2, -Math.PI / 2, wallMat);
    this.buildWallSection(corridorWidth / 2, corridorHeight, wallPartLen, halfLen - wallPartLen / 2, -Math.PI / 2, wallMat);
    // Header over right archway
    this.buildArchHeader(corridorWidth / 2, corridorHeight, archWidth, 0, -Math.PI / 2, wallMat, "📦 DEPÓSITO Y ARCHIVOS");

    // Corridor lights (Ceiling spotlights along path)
    const lightStep = 10;
    for (let z = -halfLen + 6; z < halfLen; z += lightStep) {
      const spot = new THREE.PointLight(0x00f0ff, 0.9, 18);
      spot.position.set(0, corridorHeight - 0.4, z);
      this.galleryGroup.add(spot);

      const fixGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8);
      const fixMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const fixMesh = new THREE.Mesh(fixGeo, fixMat);
      fixMesh.position.copy(spot.position);
      this.galleryGroup.add(fixMesh);
    }

    // 6. Hang Image Paintings along Left and Right Corridor Walls
    leftLayout.placed.forEach(p => {
      const xPos = -corridorWidth / 2 + 0.15;
      const rotY = Math.PI / 2;
      const frameY = Math.max(2.1, 1.3 + p.img._frameH / 2);
      this.createPaintingArtwork(p.img, xPos, frameY, p.z, rotY, frameWoodMat);
    });

    rightLayout.placed.forEach(p => {
      const xPos = corridorWidth / 2 - 0.15;
      const rotY = -Math.PI / 2;
      const frameY = Math.max(2.1, 1.3 + p.img._frameH / 2);
      this.createPaintingArtwork(p.img, xPos, frameY, p.z, rotY, frameWoodMat);
    });

    // If no images exist in this folder, put an elegant museum banner
    if (imageFiles.length === 0) {
      this.createMuseumNotice(0, 2.8, -halfLen + 0.2, 0, "Galería Fotográfica", "No se detectaron imágenes en esta carpeta.\nVisite las salas laterales de Documentos, Archivos y Cine.");
    }

    // 7. Build Wing A: Library Room (Documentos y Textos)
    this.buildLibraryRoom(corridorWidth, corridorHeight, docFiles);

    // 8. Build Wing B: Warehouse Room (Archivos Comprimidos y Otros)
    this.buildWarehouseRoom(corridorWidth, corridorHeight, archiveAndOtherFiles);

    // 9. Build Wing C: Cinema Screening Room (Sala de Proyección y Cine)
    const cineRoomW = 22;
    const cineRoomD = 20;
    this.buildCinemaRoom(corridorWidth, corridorHeight, videoFiles, halfCorridorLen, cineRoomW, cineRoomD);

    // 10. Setup Room Collision Boundaries
    this.roomBounds = [
      // Main Corridor AABB
      { minX: -corridorWidth / 2 + 0.6, maxX: corridorWidth / 2 - 0.6, minZ: -corridorLength / 2 + 0.8, maxZ: corridorLength / 2 - 0.8 },
      // Archway left connector (Library)
      { minX: -corridorWidth / 2 - 4.5, maxX: -corridorWidth / 2 + 0.8, minZ: -3.8, maxZ: 3.8 },
      // Library Room AABB
      { minX: -corridorWidth / 2 - 20, maxX: -corridorWidth / 2 - 2, minZ: -10, maxZ: 10 },
      // Archway right connector (Warehouse)
      { minX: corridorWidth / 2 - 0.8, maxX: corridorWidth / 2 + 4.5, minZ: -3.8, maxZ: 3.8 },
      // Warehouse Room AABB
      { minX: corridorWidth / 2 + 2, maxX: corridorWidth / 2 + 22, minZ: -11, maxZ: 11 },
      // North Archway connector (Cinema)
      { minX: -cinemaArchWidth / 2 + 0.5, maxX: cinemaArchWidth / 2 - 0.5, minZ: -halfCorridorLen - 2.0, maxZ: -halfCorridorLen + 1.0 },
      // Cinema Room AABB
      { minX: -cineRoomW / 2 + 0.8, maxX: cineRoomW / 2 - 0.8, minZ: -halfCorridorLen - cineRoomD + 0.8, maxZ: -halfCorridorLen - 0.5 }
    ];

    // 11. Position Player at Entrance of Corridor
    this.playerPosition.set(0, this.playerHeight, halfCorridorLen - 5.0);
    this.cameraYaw = 0; // Facing along -Z into corridor
    this.cameraPitch = 0;
    this.engine.camera.position.copy(this.playerPosition);
    this.engine.camera.rotation.set(0, 0, 0);
  }

  /* -------------------------------------------------------------
     Corridor Wall Helper Methods
  ------------------------------------------------------------- */
  buildWallSection(x, height, length, zCenter, rotY, material) {
    const wallGeo = new THREE.PlaneGeometry(length, height);
    wallGeo.rotateY(rotY);
    const wall = new THREE.Mesh(wallGeo, material);
    wall.position.set(x, height / 2, zCenter);
    wall.userData = { isWall: true };
    this.wallOccluders.push(wall);
    this.galleryGroup.add(wall);
  }

  buildArchHeader(x, height, archWidth, zCenter, rotY, material, titleText) {
    const headerH = height - 3.8;
    const isNS = Math.abs(rotY) < 0.1 || Math.abs(rotY - Math.PI) < 0.1;
    const boxX = isNS ? archWidth : 0.3;
    const boxZ = isNS ? 0.3 : archWidth;
    const headerGeo = new THREE.BoxGeometry(boxX, headerH, boxZ);
    const headerMesh = new THREE.Mesh(headerGeo, material);
    headerMesh.position.set(x, height - headerH / 2, zCenter);
    headerMesh.userData = { isWall: true };
    this.wallOccluders.push(headerMesh);
    this.galleryGroup.add(headerMesh);

    // Title Signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 160;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 160);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 1008, 144);
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, 512, 80);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signGeo = new THREE.PlaneGeometry(archWidth * 0.9, 1.1);
    signGeo.rotateY(rotY);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    const signOffsetZ = isNS ? 0.2 : 0;
    const signOffsetX = isNS ? 0 : (rotY > 0 ? 0.2 : -0.2);
    signMesh.position.set(x + signOffsetX, height - headerH / 2, zCenter + signOffsetZ);
    this.galleryGroup.add(signMesh);
  }

  /* -------------------------------------------------------------
     Framed Artwork Painting & Informative Plaque Creator
  ------------------------------------------------------------- */
  createPaintingArtwork(nodeData, x, y, z, rotY, frameMat) {
    const artworkGroup = new THREE.Group();
    artworkGroup.position.set(x, y, z);
    artworkGroup.rotation.y = rotY;

    // Aspect ratio & dimensions
    let aspect = 1.33;
    if (nodeData.imageWidth && nodeData.imageHeight && nodeData.imageHeight > 0) {
      aspect = nodeData.imageWidth / nodeData.imageHeight;
      aspect = Math.max(0.65, Math.min(2.2, aspect)); // Keep frame proportions pleasing
    }

    const frameHeight = nodeData._frameH || 2.0;
    const frameWidth = nodeData._frameW || (frameHeight * aspect);

    // 1. 3D Outer Frame (Low-poly beveled edge)
    const frameDepth = 0.12;
    const frameBorder = 0.14;
    const frameBoxGeo = new THREE.BoxGeometry(frameWidth + frameBorder * 2, frameHeight + frameBorder * 2, frameDepth);
    const frameMesh = new THREE.Mesh(frameBoxGeo, frameMat);
    artworkGroup.add(frameMesh);

    // 2. Picture Canvas with streamed texture
    const canvasGeo = new THREE.PlaneGeometry(frameWidth, frameHeight);
    
    // Default placeholder texture while loading
    const placeholderTex = this.createArtworkPlaceholder(nodeData);
    const canvasMat = new THREE.MeshStandardMaterial({
      map: placeholderTex,
      roughness: 0.35,
      metalness: 0.1
    });

    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.position.z = frameDepth / 2 + 0.01;
    artworkGroup.add(canvasMesh);

    // 3. Museum Informative Plaque (Cartela Informativa al pie del cuadro)
    const plaqueWidth = Math.min(frameWidth, 2.4);
    const plaqueHeight = Math.min(0.7, Math.max(0.42, frameHeight * 0.35));
    const plaqueGeo = new THREE.BoxGeometry(plaqueWidth, plaqueHeight, 0.05);
    const plaqueCanvas = this.renderPlaqueCanvas(nodeData);
    const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
    const plaqueFaceMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
    const plaqueBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });

    const plaqueMesh = new THREE.Mesh(plaqueGeo, [
      plaqueBaseMat, plaqueBaseMat, plaqueBaseMat, plaqueBaseMat,
      plaqueFaceMat, plaqueBaseMat
    ]);
    plaqueMesh.position.set(0, -frameHeight / 2 - plaqueHeight / 2 - 0.15, frameDepth / 2);
    artworkGroup.add(plaqueMesh);

    // 4. Local Image Texture Streaming via axplorer-media.local
    if (nodeData.fullPath) {
      const mediaUrl = `https://axplorer-media.local/image?path=${encodeURIComponent(nodeData.fullPath)}`;
      this.textureLoader.load(
        mediaUrl,
        (loadedTex) => {
          loadedTex.minFilter = THREE.LinearFilter;
          loadedTex.generateMipmaps = false;
          canvasMat.map = loadedTex;
          canvasMat.needsUpdate = true;

          // If image dimensions were not present, update dynamically from image
          if (!nodeData.resolution && loadedTex.image && loadedTex.image.naturalWidth) {
            nodeData.imageWidth = loadedTex.image.naturalWidth;
            nodeData.imageHeight = loadedTex.image.naturalHeight;
            nodeData.resolution = `${nodeData.imageWidth} × ${nodeData.imageHeight}`;
            const updatedPlaqueCanvas = this.renderPlaqueCanvas(nodeData);
            plaqueFaceMat.map = new THREE.CanvasTexture(updatedPlaqueCanvas);
            plaqueFaceMat.needsUpdate = true;
          }
        },
        undefined,
        (err) => {
          // Gracefully keep placeholder
        }
      );
    }

    // Attach interaction metadata
    canvasMesh.userData = { nodeData: nodeData, type: 'painting', group: artworkGroup };
    frameMesh.userData = { nodeData: nodeData, type: 'painting', group: artworkGroup };
    plaqueMesh.userData = { nodeData: nodeData, type: 'painting', group: artworkGroup };

    this.interactiveGalleryItems.push(canvasMesh, frameMesh, plaqueMesh);
    this.galleryGroup.add(artworkGroup);
  }

  /* -------------------------------------------------------------
     Plaque 2D Canvas Renderer (Size, Resolution, Format)
  ------------------------------------------------------------- */
  renderPlaqueCanvas(nodeData) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 200);
    grad.addColorStop(0, '#0a0f1d');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 200);

    // Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 588, 188);

    // Left decorative bar
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(16, 16, 8, 168);

    // Title / File Name
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    let name = nodeData.name || 'Imagen';
    if (name.length > 26) name = name.substring(0, 24) + '...';
    ctx.fillText(name, 38, 52);

    // Info lines
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';

    // Format badge
    const ext = (nodeData.extension || '').replace('.', '').toUpperCase() || 'IMG';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`Formato: ${ext}`, 38, 98);

    // Resolution
    const res = nodeData.resolution || (nodeData.imageWidth ? `${nodeData.imageWidth} × ${nodeData.imageHeight} px` : 'Resolución: Auto');
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Resolución: ${res}`, 38, 138);

    // Size
    const size = nodeData.formattedSize || 'N/A';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Tamaño: ${size}`, 38, 175);

    return canvas;
  }

  createArtworkPlaceholder(nodeData) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b132b';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 364);

    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('🖼️', 256, 160);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(nodeData.name || 'Cargando imagen...', 256, 260);

    return new THREE.CanvasTexture(canvas);
  }

  createMuseumNotice(x, y, z, rotY, title, body) {
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 800;
    bannerCanvas.height = 400;
    const ctx = bannerCanvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 400);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 776, 376);

    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.fillText(title, 400, 100);

    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const lines = body.split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, 400, 200 + idx * 45);
    });

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeo = new THREE.PlaneGeometry(5, 2.5);
    bannerGeo.rotateY(rotY);
    const bannerMesh = new THREE.Mesh(bannerGeo, new THREE.MeshBasicMaterial({ map: bannerTex }));
    bannerMesh.position.set(x, y, z);
    this.galleryGroup.add(bannerMesh);
  }

  /* -------------------------------------------------------------
     Wing A: Library Room (Estantes de Libros con Documentos)
  ------------------------------------------------------------- */
  buildLibraryRoom(corridorWidth, corridorHeight, docFiles) {
    const roomW = 18;
    const roomD = 18;
    const centerX = -corridorWidth / 2 - roomW / 2;
    const centerZ = 0;

    // Room Floor
    const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.35, metalness: 0.1 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(centerX, 0, centerZ);
    this.galleryGroup.add(floorMesh);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(roomW, roomD);
    ceilGeo.rotateX(Math.PI / 2);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.position.set(centerX, corridorHeight, centerZ);
    this.galleryGroup.add(ceilMesh);

    // Outer Walls (North, South, West)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, side: THREE.DoubleSide });

    // North wall
    const nWallGeo = new THREE.PlaneGeometry(roomW, corridorHeight);
    const nWall = new THREE.Mesh(nWallGeo, wallMat);
    nWall.position.set(centerX, corridorHeight / 2, centerZ - roomD / 2);
    nWall.userData = { isWall: true };
    this.wallOccluders.push(nWall);
    this.galleryGroup.add(nWall);

    // South wall
    const sWallGeo = new THREE.PlaneGeometry(roomW, corridorHeight);
    sWallGeo.rotateY(Math.PI);
    const sWall = new THREE.Mesh(sWallGeo, wallMat);
    sWall.position.set(centerX, corridorHeight / 2, centerZ + roomD / 2);
    sWall.userData = { isWall: true };
    this.wallOccluders.push(sWall);
    this.galleryGroup.add(sWall);

    // West wall (Far back)
    const wWallGeo = new THREE.PlaneGeometry(roomD, corridorHeight);
    wWallGeo.rotateY(Math.PI / 2);
    const wWall = new THREE.Mesh(wWallGeo, wallMat);
    wWall.position.set(centerX - roomW / 2, corridorHeight / 2, centerZ);
    wWall.userData = { isWall: true };
    this.wallOccluders.push(wWall);
    this.galleryGroup.add(wWall);

    // Chandelier / Ambient Room Light
    const libLight = new THREE.PointLight(0xa855f7, 1.4, 25);
    libLight.position.set(centerX, corridorHeight - 0.8, centerZ);
    this.galleryGroup.add(libLight);

    // Modular Bookshelves ("Estantes de libros")
    const numShelves = 3;
    const shelfWidth = 5.0;
    const shelfHeight = 4.2;
    const shelfDepth = 0.9;
    const shelfSpacing = 5.6;

    let docIndex = 0;
    for (let s = 0; s < numShelves; s++) {
      const shelfZ = centerZ - (numShelves - 1) * shelfSpacing / 2 + s * shelfSpacing;
      const shelfX = centerX - roomW / 2 + 1.2;

      this.createBookshelf(shelfX, 0, shelfZ, shelfWidth, shelfHeight, shelfDepth, Math.PI / 2);

      // Populate Books on Shelves
      const booksPerTier = 7;
      const tiers = 3;
      for (let tier = 0; tier < tiers; tier++) {
        const tierY = 0.5 + tier * 1.25;
        for (let b = 0; b < booksPerTier; b++) {
          if (docIndex >= docFiles.length) break;
          const docNode = docFiles[docIndex++];
          const bookZ = shelfZ - shelfWidth / 2 + 0.5 + b * (shelfWidth / (booksPerTier + 0.5));
          this.create3DBook(shelfX + 0.1, tierY, bookZ, docNode, Math.PI / 2);
        }
      }
    }

    // If no document files, show a notice
    if (docFiles.length === 0) {
      this.createMuseumNotice(centerX, 2.5, centerZ, Math.PI / 2, "Biblioteca Digital", "No se encontraron documentos ni textos en esta carpeta.");
    }
  }

  createBookshelf(x, y, z, width, height, depth, rotY) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(x, y, z);
    shelfGroup.rotation.y = rotY;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.6, metalness: 0.1 });

    // Uprights (sides)
    const uprightGeo = new THREE.BoxGeometry(0.12, height, depth);
    const leftSide = new THREE.Mesh(uprightGeo, woodMat);
    leftSide.position.set(-width / 2, height / 2, 0);
    const rightSide = new THREE.Mesh(uprightGeo, woodMat);
    rightSide.position.set(width / 2, height / 2, 0);
    shelfGroup.add(leftSide, rightSide);

    // Horizontal Shelves
    const numPlanks = 4;
    const plankGeo = new THREE.BoxGeometry(width, 0.08, depth);
    for (let i = 0; i < numPlanks; i++) {
      const plank = new THREE.Mesh(plankGeo, woodMat);
      plank.position.set(0, 0.4 + i * 1.25, 0);
      shelfGroup.add(plank);
    }

    // Backing panel
    const backGeo = new THREE.BoxGeometry(width, height, 0.04);
    const backMesh = new THREE.Mesh(backGeo, woodMat);
    backMesh.position.set(0, height / 2, -depth / 2);
    backMesh.userData = { isWall: true };
    this.wallOccluders.push(backMesh);
    shelfGroup.add(backMesh);

    this.galleryGroup.add(shelfGroup);
  }

  create3DBook(x, y, z, docNode, rotY) {
    const ext = (docNode.extension || '').toLowerCase();
    
    // Choose book spine color based on document type
    let bookColor = 0x1d4ed8; // rich blue for doc
    let bookColorHex = '#1d4ed8';
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      bookColor = 0x047857; // emerald green
      bookColorHex = '#047857';
    } else if (ext === '.pdf') {
      bookColor = 0xb91c1c; // deep red
      bookColorHex = '#b91c1c';
    } else if (ext === '.pptx' || ext === '.ppt') {
      bookColor = 0xb45309; // warm amber
      bookColorHex = '#b45309';
    } else if (ext === '.txt' || ext === '.md' || ext === '.rtf') {
      bookColor = 0x6d28d9; // rich purple
      bookColorHex = '#6d28d9';
    } else if (ext === '.ini' || ext === '.cfg' || ext === '.conf' || ext === '.log' || ext === '.env' || ext === '.yaml' || ext === '.yml' || ext === '.toml' || ext === '.reg') {
      bookColor = 0x475569; // slate grey / config & settings
      bookColorHex = '#475569';
    } else if (ext === '.bat' || ext === '.cmd' || ext === '.ps1' || ext === '.sh' || ext === '.vbs') {
      bookColor = 0x0284c7; // sky / terminal console blue for scripts
      bookColorHex = '#0284c7';
    } else if (ext === '.cs' || ext === '.js' || ext === '.html' || ext === '.py' || ext === '.ts' || ext === '.cpp' || ext === '.h' || ext === '.json' || ext === '.xml' || ext === '.sql' || ext === '.css') {
      bookColor = 0x0e7490; // cyan / teal code
      bookColorHex = '#0e7490';
    }

    const bookH = 0.85 + Math.random() * 0.2;
    const bookW = 0.14 + Math.random() * 0.08;
    const bookD = 0.55;

    const bookGeo = new THREE.BoxGeometry(bookW, bookH, bookD);

    // Book cover and pages materials
    const coverMat = new THREE.MeshStandardMaterial({
      color: bookColor,
      roughness: 0.45,
      metalness: 0.1
    });

    const pagesMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7, // ivory/cream paper pages
      roughness: 0.85,
      metalness: 0.0
    });

    // Clean extension text (e.g. XLSX, DOCX, PPTX, PDF, TXT, MD)
    let extClean = (docNode.extension || '').replace('.', '').toUpperCase();
    if (!extClean) extClean = 'DOC';

    // Generate book spine canvas texture with vertically oriented title
    const spineCanvas = this.renderBookSpineCanvas(extClean, bookColorHex);
    const spineTex = new THREE.CanvasTexture(spineCanvas);
    const spineMat = new THREE.MeshBasicMaterial({ map: spineTex });

    // 0: +X (Right Cover), 1: -X (Left Cover), 2: +Y (Top Pages), 3: -Y (Bottom Pages), 4: +Z (Spine facing room), 5: -Z (Fore-edge / back)
    const materials = [coverMat, coverMat, pagesMat, pagesMat, spineMat, pagesMat];

    const bookMesh = new THREE.Mesh(bookGeo, materials);
    bookMesh.position.set(x, y + bookH / 2, z);
    bookMesh.rotation.y = rotY;

    // Attach interaction metadata
    bookMesh.userData = { nodeData: docNode, type: 'book' };
    this.interactiveGalleryItems.push(bookMesh);
    this.galleryGroup.add(bookMesh);
  }

  renderBookSpineCanvas(extText, bookColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Leather / Bookcloth Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, '#0a0f1d');
    grad.addColorStop(0.18, bookColorHex);
    grad.addColorStop(0.82, bookColorHex);
    grad.addColorStop(1, '#05070d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 512);

    // 2. Gold Embossed Top & Bottom Decorative Bands
    ctx.strokeStyle = '#f59e0b'; // Amber Gold
    ctx.lineWidth = 4;
    // Top bands
    ctx.strokeRect(10, 20, 108, 14);
    ctx.strokeRect(10, 42, 108, 6);
    // Bottom bands
    ctx.strokeRect(10, 464, 108, 6);
    ctx.strokeRect(10, 478, 108, 14);

    // Decorative stars / diamonds
    ctx.fillStyle = '#fbbf24';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆', 64, 82);
    ctx.fillText('◆', 64, 430);

    // 3. Vertical Spine Title (Extension: XLSX, DOCX, PPTX, PDF, etc.)
    // Stacking letters vertically with embossed gold/white shadow
    const letters = extText.split('');
    const numLetters = letters.length;
    const fontSize = numLetters <= 3 ? 54 : (numLetters <= 4 ? 46 : 38);
    const letterSpacing = numLetters <= 3 ? 66 : (numLetters <= 4 ? 54 : 44);
    const totalH = numLetters * letterSpacing;
    const startY = 256 - totalH / 2 + letterSpacing / 2;

    ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    letters.forEach((char, i) => {
      const y = startY + i * letterSpacing;
      // Shadow for embossed relief
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillText(char, 66, y + 2);
      // Gold-tinted white text
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(char, 64, y);
    });

    return canvas;
  }

  /* -------------------------------------------------------------
     Wing B: Warehouse Room (Cajas 3D y Archivos Comprimidos)
  ------------------------------------------------------------- */
  buildWarehouseRoom(corridorWidth, corridorHeight, archiveFiles) {
    const roomW = 18;
    const roomD = 18;
    const centerX = corridorWidth / 2 + roomW / 2;
    const centerZ = 0;

    // Room Floor (Industrial concrete look)
    const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7, metalness: 0.3 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(centerX, 0, centerZ);
    this.galleryGroup.add(floorMesh);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(roomW, roomD);
    ceilGeo.rotateX(Math.PI / 2);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.position.set(centerX, corridorHeight, centerZ);
    this.galleryGroup.add(ceilMesh);

    // Outer Walls (North, South, East)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8, side: THREE.DoubleSide });

    // North wall
    const nWallGeo = new THREE.PlaneGeometry(roomW, corridorHeight);
    const nWall = new THREE.Mesh(nWallGeo, wallMat);
    nWall.position.set(centerX, corridorHeight / 2, centerZ - roomD / 2);
    nWall.userData = { isWall: true };
    this.wallOccluders.push(nWall);
    this.galleryGroup.add(nWall);

    // South wall
    const sWallGeo = new THREE.PlaneGeometry(roomW, corridorHeight);
    sWallGeo.rotateY(Math.PI);
    const sWall = new THREE.Mesh(sWallGeo, wallMat);
    sWall.position.set(centerX, corridorHeight / 2, centerZ + roomD / 2);
    sWall.userData = { isWall: true };
    this.wallOccluders.push(sWall);
    this.galleryGroup.add(sWall);

    // East wall (Far back)
    const eWallGeo = new THREE.PlaneGeometry(roomD, corridorHeight);
    eWallGeo.rotateY(-Math.PI / 2);
    const eWall = new THREE.Mesh(eWallGeo, wallMat);
    eWall.position.set(centerX + roomW / 2, corridorHeight / 2, centerZ);
    eWall.userData = { isWall: true };
    this.wallOccluders.push(eWall);
    this.galleryGroup.add(eWall);

    // Industrial Amber Ceiling Light
    const warehouseLight = new THREE.PointLight(0xf59e0b, 1.3, 25);
    warehouseLight.position.set(centerX, corridorHeight - 0.8, centerZ);
    this.galleryGroup.add(warehouseLight);

    // Deterministic Slots for Non-Overlapping Crates
    const slots = [];

    // 1. Perimeter Industrial Racks (North & South walls)
    const racks = [
      { x: centerX - 3.8, z: centerZ - 6.8 },
      { x: centerX + 3.8, z: centerZ - 6.8 },
      { x: centerX - 3.8, z: centerZ + 6.8 },
      { x: centerX + 3.8, z: centerZ + 6.8 }
    ];

    racks.forEach(r => {
      this.createIndustrialRack(r.x, 0, r.z, 5.8, 3.8, 1.4);
      // 3 positions per tier, 2 tiers per rack
      [-1.8, 0, 1.8].forEach(dx => {
        slots.push({ x: r.x + dx, y: 0.38, z: r.z, scale: 1.0 });
        slots.push({ x: r.x + dx, y: 2.08, z: r.z, scale: 1.0 });
      });
    });

    // 2. Central Floor Pallet Staging Area (12 discrete positions)
    const palletCols = [centerX - 2.8, centerX - 0.3, centerX + 2.2, centerX + 4.7];
    const palletRows = [-2.5, 0, 2.5];

    palletCols.forEach(px => {
      palletRows.forEach(pz => {
        this.createWoodenPallet(px, 0, pz, 1.6, 1.6);
        slots.push({ x: px, y: 0.16, z: pz, scale: 1.15 });
      });
    });

    // 3. Far East Wall Pallets (5 positions along back wall)
    const eastX = centerX + 7.2;
    [-4.6, -2.3, 0, 2.3, 4.6].forEach(ez => {
      this.createWoodenPallet(eastX, 0, ez, 1.5, 1.5);
      slots.push({ x: eastX, y: 0.16, z: ez, scale: 1.1 });
    });

    // Place Crates deterministically without random collision
    archiveFiles.forEach((archNode, idx) => {
      const sizeBytes = archNode.sizeBytes || 10000;
      let sizeFactor = 1.0;
      if (sizeBytes > 100 * 1024 * 1024) sizeFactor = 1.18;
      else if (sizeBytes > 10 * 1024 * 1024) sizeFactor = 1.05;
      else sizeFactor = 0.92;

      let slot;
      let tierOffset = 0;
      if (idx < slots.length) {
        slot = slots[idx];
      } else {
        // Deterministic stacking on pallet slots for folders with > 41 archive files
        const palletSlotIdx = 24 + (idx % 17);
        slot = slots[palletSlotIdx];
        const stackLevel = Math.floor((idx - slots.length) / 17) + 1;
        tierOffset = stackLevel * 1.05;
      }

      const finalScale = (slot.scale || 1.0) * sizeFactor;
      this.create3DCrate(slot.x, slot.y + tierOffset, slot.z, archNode, finalScale);
    });

    // If no archives exist, display informational notice
    if (archiveFiles.length === 0) {
      this.createMuseumNotice(centerX, 2.5, centerZ, -Math.PI / 2, "Almacén de Archivos", "No se detectaron archivos comprimidos ni binarios en esta carpeta.");
    }
  }

  createWoodenPallet(x, y, z, width, depth) {
    const palletGroup = new THREE.Group();
    palletGroup.position.set(x, y, z);

    const palletWoodMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.85,
      metalness: 0.05
    });

    // 3 bottom runners
    const runnerGeo = new THREE.BoxGeometry(width, 0.06, 0.12);
    [-depth / 2 + 0.08, 0, depth / 2 - 0.08].forEach(rz => {
      const runner = new THREE.Mesh(runnerGeo, palletWoodMat);
      runner.position.set(0, 0.03, rz);
      palletGroup.add(runner);
    });

    // Top deck boards (slats)
    const numSlats = 5;
    const slatW = width;
    const slatD = (depth - 0.1) / numSlats - 0.03;
    const slatGeo = new THREE.BoxGeometry(slatW, 0.035, slatD);
    for (let i = 0; i < numSlats; i++) {
      const sz = -depth / 2 + 0.08 + i * ((depth - 0.16) / (numSlats - 1));
      const slat = new THREE.Mesh(slatGeo, palletWoodMat);
      slat.position.set(0, 0.085, sz);
      palletGroup.add(slat);
    }

    this.galleryGroup.add(palletGroup);
  }

  createIndustrialRack(x, y, z, width, height, depth) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, y, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.4, metalness: 0.8 });
    const beamGeo = new THREE.BoxGeometry(0.12, height, 0.12);

    // 4 Corner Posts
    const p1 = new THREE.Mesh(beamGeo, metalMat); p1.position.set(-width / 2, height / 2, -depth / 2);
    const p2 = new THREE.Mesh(beamGeo, metalMat); p2.position.set(width / 2, height / 2, -depth / 2);
    const p3 = new THREE.Mesh(beamGeo, metalMat); p3.position.set(-width / 2, height / 2, depth / 2);
    const p4 = new THREE.Mesh(beamGeo, metalMat); p4.position.set(width / 2, height / 2, depth / 2);
    rackGroup.add(p1, p2, p3, p4);

    // 2 Shelves
    const shelfGeo = new THREE.BoxGeometry(width, 0.08, depth);
    const s1 = new THREE.Mesh(shelfGeo, metalMat); s1.position.set(0, 0.35, 0);
    const s2 = new THREE.Mesh(shelfGeo, metalMat); s2.position.set(0, 2.05, 0);
    rackGroup.add(s1, s2);

    this.galleryGroup.add(rackGroup);
  }

  create3DCrate(x, y, z, archNode, scale = 1.0) {
    const crateW = 1.05 * scale;
    const crateH = 0.95 * scale;
    const crateD = 1.05 * scale;

    const crateGeo = new THREE.BoxGeometry(crateW, crateH, crateD);
    
    // Choose texture / color
    const isZip = archNode.itemType === 'archive';
    const crateMat = new THREE.MeshStandardMaterial({
      color: isZip ? 0xd97706 : 0x475569, // Warm wood orange for archives, slate metal for others
      roughness: 0.7,
      metalness: isZip ? 0.1 : 0.6
    });

    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(x, y + crateH / 2, z);

    // Crate stencil label texture
    const stencilCanvas = document.createElement('canvas');
    stencilCanvas.width = 256;
    stencilCanvas.height = 256;
    const ctx = stencilCanvas.getContext('2d');
    ctx.fillStyle = isZip ? '#b45309' : '#334155';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const ext = (archNode.extension || '').replace('.', '').toUpperCase() || 'BOX';
    ctx.fillText(`[ ${ext} ]`, 128, 90);

    ctx.font = '22px monospace';
    let name = archNode.name || '';
    if (name.length > 12) name = name.substring(0, 10) + '..';
    ctx.fillText(name, 128, 145);

    ctx.font = '20px monospace';
    ctx.fillText(archNode.formattedSize || '', 128, 195);

    const stencilTex = new THREE.CanvasTexture(stencilCanvas);
    const stencilMat = new THREE.MeshBasicMaterial({ map: stencilTex });

    // Description on 2 opposite faces (+Z Front and -Z Back) so user doesn't need to walk all around
    crateMesh.material = [crateMat, crateMat, crateMat, crateMat, stencilMat, stencilMat];

    // Interaction metadata
    crateMesh.userData = { nodeData: archNode, type: 'crate' };
    this.interactiveGalleryItems.push(crateMesh);
    this.galleryGroup.add(crateMesh);
  }

  /* -------------------------------------------------------------
     Wing C: Cinema Screening Room (Sala de Proyección y Cine)
  ------------------------------------------------------------- */
  buildCinemaRoom(corridorWidth, corridorHeight, videoFiles, halfCorridorLen, roomW = 22, roomD = 20) {
    const centerX = 0;
    const centerZ = -halfCorridorLen - roomD / 2;

    // 1. Room Floor (Dark acoustic carpet)
    const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0c0d16, roughness: 0.85, metalness: 0.1 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(centerX, 0, centerZ);
    this.galleryGroup.add(floorMesh);

    // Subtle floor accent grid
    const floorGrid = new THREE.GridHelper(Math.min(roomW, roomD), 10, 0x6366f1, 0x1e1b4b);
    floorGrid.position.set(centerX, 0.02, centerZ);
    this.galleryGroup.add(floorGrid);

    // 2. Ceiling
    const ceilGeo = new THREE.PlaneGeometry(roomW, roomD);
    ceilGeo.rotateX(Math.PI / 2);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x06080e, roughness: 0.95 });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.position.set(centerX, corridorHeight, centerZ);
    this.galleryGroup.add(ceilMesh);

    // 3. Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, side: THREE.DoubleSide });

    // North wall (behind screen)
    const nWallGeo = new THREE.PlaneGeometry(roomW, corridorHeight);
    const nWall = new THREE.Mesh(nWallGeo, wallMat);
    nWall.position.set(centerX, corridorHeight / 2, -halfCorridorLen - roomD);
    nWall.userData = { isWall: true };
    this.wallOccluders.push(nWall);
    this.galleryGroup.add(nWall);

    // South wall (Outer parts flanking the 8m entrance arch)
    const archWidth = 8;
    const southPartLen = (roomW - archWidth) / 2;
    // Left south section
    const sWallL = new THREE.Mesh(new THREE.PlaneGeometry(southPartLen, corridorHeight), wallMat);
    sWallL.position.set(-archWidth / 2 - southPartLen / 2, corridorHeight / 2, -halfCorridorLen);
    sWallL.userData = { isWall: true };
    this.wallOccluders.push(sWallL);
    this.galleryGroup.add(sWallL);

    // Right south section
    const sWallR = new THREE.Mesh(new THREE.PlaneGeometry(southPartLen, corridorHeight), wallMat);
    sWallR.position.set(archWidth / 2 + southPartLen / 2, corridorHeight / 2, -halfCorridorLen);
    sWallR.userData = { isWall: true };
    this.wallOccluders.push(sWallR);
    this.galleryGroup.add(sWallR);

    // West wall
    const wWallGeo = new THREE.PlaneGeometry(roomD, corridorHeight);
    wWallGeo.rotateY(Math.PI / 2);
    const wWall = new THREE.Mesh(wWallGeo, wallMat);
    wWall.position.set(-roomW / 2, corridorHeight / 2, centerZ);
    wWall.userData = { isWall: true };
    this.wallOccluders.push(wWall);
    this.galleryGroup.add(wWall);

    // East wall
    const eWallGeo = new THREE.PlaneGeometry(roomD, corridorHeight);
    eWallGeo.rotateY(-Math.PI / 2);
    const eWall = new THREE.Mesh(eWallGeo, wallMat);
    eWall.position.set(roomW / 2, corridorHeight / 2, centerZ);
    eWall.userData = { isWall: true };
    this.wallOccluders.push(eWall);
    this.galleryGroup.add(eWall);

    // 4. Theatrical Ambient Lighting
    const cineLight = new THREE.PointLight(0x6366f1, 1.3, 26);
    cineLight.position.set(centerX, corridorHeight - 0.7, centerZ);
    this.galleryGroup.add(cineLight);

    const screenAccentLight = new THREE.PointLight(0x00f0ff, 0.7, 18);
    screenAccentLight.position.set(centerX, corridorHeight - 0.5, -halfCorridorLen - roomD + 4);
    this.galleryGroup.add(screenAccentLight);

    // 5. Giant 3D Cinema Screen (16:9 widescreen)
    const screenFrameW = 12.6;
    const screenFrameH = 7.1;
    const screenFrameGeo = new THREE.BoxGeometry(screenFrameW, screenFrameH, 0.2);
    const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const screenFrameMesh = new THREE.Mesh(screenFrameGeo, screenFrameMat);
    screenFrameMesh.position.set(centerX, 3.8, -halfCorridorLen - roomD + 0.16);
    this.galleryGroup.add(screenFrameMesh);

    // Screen display surface
    const screenGeo = new THREE.PlaneGeometry(12.0, 6.75);
    const standbyCanvas = this.renderScreenStandbyCanvas();
    const standbyTex = new THREE.CanvasTexture(standbyCanvas);
    this.screenMat = new THREE.MeshBasicMaterial({ map: standbyTex });
    this.screenCanvasMesh = new THREE.Mesh(screenGeo, this.screenMat);
    this.screenCanvasMesh.position.set(centerX, 3.8, -halfCorridorLen - roomD + 0.28);
    this.screenCanvasMesh.userData = { type: 'screen', isScreen: true };
    this.interactiveGalleryItems.push(this.screenCanvasMesh);
    this.galleryGroup.add(this.screenCanvasMesh);

    // 6. Video Media Shelf ("Estante de Videos") beside the screen along East wall
    const shelfX = roomW / 2 - 1.2;
    const shelfZ = centerZ;
    const shelfW = 5.2;
    const shelfH = 4.2;
    const shelfD = 0.8;

    this.createBookshelf(shelfX, 0, shelfZ, shelfW, shelfH, shelfD, -Math.PI / 2);

    // Video cases distribution on shelves
    const casesPerTier = 5;
    const tiers = 3;
    let vidIndex = 0;
    this.firstVideoNode = videoFiles.length > 0 ? videoFiles[0] : null;

    for (let tier = 0; tier < tiers; tier++) {
      const tierY = 0.45 + tier * 1.25;
      for (let c = 0; c < casesPerTier; c++) {
        if (vidIndex >= videoFiles.length) break;
        const vNode = videoFiles[vidIndex++];
        const caseZ = shelfZ - shelfW / 2 + 0.6 + c * (shelfW / (casesPerTier + 0.2));
        this.create3DVideoCase(shelfX - 0.05, tierY, caseZ, vNode, -Math.PI / 2);
      }
    }

    // If no video files exist, display informational notice
    if (videoFiles.length === 0) {
      this.createMuseumNotice(0, 3.5, -halfCorridorLen - roomD + 0.35, 0, "Sala de Proyección", "No se detectaron archivos de video en esta carpeta.\nColoca archivos MP4, MKV o WEBM para verlos aquí.");
    }
  }

  renderScreenStandbyCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#050714');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#02040a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Glowing Neon Frames
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 1240, 680);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 1212, 652);

    // Cinema Icon
    ctx.font = '110px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎬', 640, 230);

    // Main Title
    ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('SALA DE PROYECCIÓN Y CINE 3D', 640, 350);

    // Subtitle
    ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Haz clic en cualquier caja de video del estante lateral para proyectar aquí', 640, 420);

    // Formats supported
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Formatos soportados: MP4 • MKV • WEBM • AVI • MOV • WMV', 640, 490);

    return canvas;
  }

  create3DVideoCase(x, y, z, videoNode, rotY) {
    const caseW = 0.75;
    const caseH = 1.08;
    const caseD = 0.12;

    const caseGeo = new THREE.BoxGeometry(caseW, caseH, caseD);
    const plasticMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.2
    });

    const ext = (videoNode.extension || '').replace('.', '').toUpperCase() || 'VID';
    const posterCanvas = this.renderVideoPosterCanvas(videoNode);
    const posterTex = new THREE.CanvasTexture(posterCanvas);
    const posterMat = new THREE.MeshBasicMaterial({ map: posterTex });

    const spineCanvas = this.renderVideoSpineCanvas(ext, videoNode.name);
    const spineTex = new THREE.CanvasTexture(spineCanvas);
    const spineMat = new THREE.MeshBasicMaterial({ map: spineTex });

    // 0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z (Front), 5: -Z (Back)
    const materials = [spineMat, plasticMat, plasticMat, plasticMat, posterMat, posterMat];

    const caseMesh = new THREE.Mesh(caseGeo, materials);
    caseMesh.position.set(x, y + caseH / 2, z);
    caseMesh.rotation.y = rotY;

    caseMesh.userData = { nodeData: videoNode, type: 'videoCase' };
    this.interactiveGalleryItems.push(caseMesh);
    this.galleryGroup.add(caseMesh);
  }

  renderVideoPosterCanvas(videoNode) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 720);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.35, '#0f172a');
    grad.addColorStop(0.75, '#1e1b4b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 720);

    // Cyan border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 700);

    // Format badge
    const ext = (videoNode.extension || '').replace('.', '').toUpperCase() || 'VIDEO';
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(20, 20, 140, 40);
    ctx.font = 'bold 22px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ext, 90, 40);

    // Central Movie Icon
    ctx.font = '105px sans-serif';
    ctx.fillText('🎬', 256, 230);

    // Video Title
    ctx.font = 'bold 30px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    let name = videoNode.name || 'Video';
    if (name.length > 20) name = name.substring(0, 18) + '...';
    ctx.fillText(name, 256, 370);

    // File info
    ctx.font = '22px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const size = videoNode.formattedSize || '';
    if (size) ctx.fillText(`Tamaño: ${size}`, 256, 420);

    // Prompt Box
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(40, 520, 432, 65, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('▶ Clic para reproducir', 256, 552);

    // Watermark
    ctx.font = '16px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('AXPLORER CINEMA 3D', 256, 650);

    return canvas;
  }

  renderVideoSpineCanvas(ext, name) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, '#05070d');
    grad.addColorStop(0.3, '#1e1b4b');
    grad.addColorStop(0.7, '#1e1b4b');
    grad.addColorStop(1, '#05070d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 720);

    // Badge
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(14, 20, 100, 36);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ext, 64, 38);

    // Vertical letters
    const letters = (ext || 'VID').split('');
    const numLetters = letters.length;
    const fontSize = 42;
    const letterSpacing = 50;
    const startY = 360 - (numLetters * letterSpacing) / 2;

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#38bdf8';
    letters.forEach((char, i) => {
      ctx.fillText(char, 64, startY + i * letterSpacing);
    });

    return canvas;
  }

  /* -------------------------------------------------------------
     Raycast & Hover Interactivity
  ------------------------------------------------------------- */
  getCurrentZone() {
    const px = this.playerPosition.x;
    const pz = this.playerPosition.z;
    const halfCorridor = (this.corridorWidth || 14) / 2;
    const halfCorridorLen = this.halfCorridorLen || 26;

    if (pz < -halfCorridorLen - 0.5) {
      return 'cinema';
    } else if (px < -halfCorridor - 0.5) {
      return 'library';
    } else if (px > halfCorridor + 0.5) {
      return 'warehouse';
    }
    return 'corridor';
  }

  raycastInteractiveItem(event) {
    if (!this.isActive) return null;

    let mouseCoords = new THREE.Vector2();
    if (event) {
      const rect = this.engine.renderer.domElement.getBoundingClientRect();
      mouseCoords.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoords.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    } else {
      mouseCoords.set(0, 0); // Center screen reticle
    }

    this.raycaster.setFromCamera(mouseCoords, this.engine.camera);

    // Test BOTH interactive items AND wall occluders in a single unified raycast
    const candidates = [...this.interactiveGalleryItems, ...this.wallOccluders];
    const intersects = this.raycaster.intersectObjects(candidates, false);

    if (intersects.length === 0) return null;

    // Closest hit along ray
    const firstHit = intersects[0];

    // 1. Line-of-sight Occlusion: Wall hit blocks visibility of everything behind it
    if (firstHit.object.userData && firstHit.object.userData.isWall) {
      return null;
    }

    // 2. Maximum interactive distance (14 meters)
    if (firstHit.distance > 14.0) {
      return null;
    }

    // 3. Zone isolation: Only allow hovering items that belong to the player's current physical room
    const currentZone = this.getCurrentZone();
    const itemType = (firstHit.object.userData && firstHit.object.userData.type) || '';

    if (itemType === 'painting' && currentZone !== 'corridor') {
      return null;
    }
    if (itemType === 'book' && currentZone !== 'library') {
      return null;
    }
    if (itemType === 'crate' && currentZone !== 'warehouse') {
      return null;
    }
    if ((itemType === 'videoCase' || itemType === 'screen') && currentZone !== 'cinema') {
      return null;
    }

    return firstHit.object;
  }

  /* -------------------------------------------------------------
     Per-Frame Update Loop (Movement, Collision, Raycasting)
  ------------------------------------------------------------- */
  onRenderFrame(time) {
    if (!this.isActive) return;

    // Delta time calculation
    const now = performance.now();
    if (!this._lastFrameTime) this._lastFrameTime = now;
    const dt = Math.min((now - this._lastFrameTime) / 1000, 0.1);
    this._lastFrameTime = now;

    // 1. Process Forward / Backward and Lateral Strafe Vectors (Turning is strictly mouse-driven)
    let moveForward = 0;
    let moveStrafe = 0;

    // Arrow keys: Up/Down for Forward/Backward, Left/Right for Lateral Strafe
    if (this.keys.arrowUp) moveForward += 1;
    if (this.keys.arrowDown) moveForward -= 1;
    if (this.keys.arrowLeft) moveStrafe -= 1;
    if (this.keys.arrowRight) moveStrafe += 1;

    // Secondary mouse button (right-click hold to advance)
    if (this.isRightMouseDown) {
      moveForward += 1;
    }

    // WASD (only if user enabled it in settings)
    if (this.allowWASD) {
      if (this.keys.keyW) moveForward += 1;
      if (this.keys.keyS) moveForward -= 1;
      if (this.keys.keyA) moveStrafe -= 1;
      if (this.keys.keyD) moveStrafe += 1;
    }

    // Dismiss intro card automatically as soon as player moves
    if (!this.hasMovedSinceEnter && (moveForward !== 0 || moveStrafe !== 0 || this.isDraggingMouse || this.isRightMouseDown)) {
      this.dismissIntroCard();
    }

    // Compute forward and right world directions
    const forwardVec = new THREE.Vector3(
      -Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw)
    );

    const rightVec = new THREE.Vector3(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw)
    );

    const moveDirection = new THREE.Vector3();
    if (moveForward !== 0) moveDirection.addScaledVector(forwardVec, moveForward);
    if (moveStrafe !== 0) moveDirection.addScaledVector(rightVec, moveStrafe);

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      const step = moveDirection.multiplyScalar(this.moveSpeed * dt);
      const nextPos = this.playerPosition.clone().add(step);

      // Verify collision bounds (stay inside museum)
      if (this.isPositionInsideMuseum(nextPos)) {
        this.playerPosition.copy(nextPos);
      } else {
        // Try sliding along X or Z
        const nextPosX = this.playerPosition.clone().add(new THREE.Vector3(step.x, 0, 0));
        if (this.isPositionInsideMuseum(nextPosX)) {
          this.playerPosition.copy(nextPosX);
        } else {
          const nextPosZ = this.playerPosition.clone().add(new THREE.Vector3(0, 0, step.z));
          if (this.isPositionInsideMuseum(nextPosZ)) {
            this.playerPosition.copy(nextPosZ);
          }
        }
      }
    }

    // 2. Update Camera Position & Rotation from Yaw / Pitch
    this.engine.camera.position.set(this.playerPosition.x, this.playerHeight, this.playerPosition.z);

    // Apply rotation order YXZ (Yaw then Pitch)
    this.engine.camera.rotation.order = 'YXZ';
    this.engine.camera.rotation.y = this.cameraYaw;
    this.engine.camera.rotation.x = this.cameraPitch;
    this.engine.camera.rotation.z = 0;

    // 3. Cinema Controls & Movement Badge Visibility
    // In the Cinema room, hide the movement controls badge so it doesn't overlap with the playback bar
    const currentZone = this.getCurrentZone();
    const inCinema = (currentZone === 'cinema');
    const isVideoPlaying = (this.videoElem && !this.videoElem.paused);
    const showCinemaControls = inCinema || isVideoPlaying;

    if (this.cinemaControlsEl) {
      this.cinemaControlsEl.style.display = showCinemaControls ? 'flex' : 'none';
    }

    if (this.controlsBadgeEl) {
      this.controlsBadgeEl.style.display = showCinemaControls ? 'none' : 'flex';
    }

    // 4. Raycasting for Highlighting (Center-Screen Reticle or Free Pointer Hover)
    let hitObject = null;
    let tooltipPos = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 + 30 };

    if (!this.isDraggingMouse && !this.isRightMouseDown && this.lastPointerEvent) {
      hitObject = this.raycastInteractiveItem(this.lastPointerEvent);
      if (hitObject) {
        tooltipPos = { clientX: this.lastPointerEvent.clientX, clientY: this.lastPointerEvent.clientY + 20 };
      }
    }

    if (!hitObject) {
      hitObject = this.raycastInteractiveItem(null);
      tooltipPos = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 + 30 };
    }

    if (hitObject) {
      if (this.hoveredItem !== hitObject) {
        this.hoveredItem = hitObject;
        if (this.reticleEl) this.reticleEl.classList.add('active');
        if (hitObject.userData && hitObject.userData.nodeData && window.hudOverlay) {
          window.hudOverlay.showTooltip(hitObject.userData.nodeData, tooltipPos);
        }
      }
    } else {
      if (this.hoveredItem) {
        this.hoveredItem = null;
        if (this.reticleEl) this.reticleEl.classList.remove('active');
        if (window.hudOverlay) {
          window.hudOverlay.showTooltip(null, null);
        }
      }
    }
  }

  isPositionInsideMuseum(pos) {
    if (this.roomBounds.length === 0) return true;
    for (const b of this.roomBounds) {
      if (pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ) {
        return true;
      }
    }
    return false;
  }
}

// Attach to window
window.GalleryMuseum = GalleryMuseum;

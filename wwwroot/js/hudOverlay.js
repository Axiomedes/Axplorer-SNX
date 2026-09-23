// hudOverlay.js - DOM HUD management, sidebars, breadcrumbs, search, inspector

class HudOverlay {
  constructor(bridge) {
    this.bridge = bridge;
    this.selectedNodeData = null;

    // Elements
    this.breadcrumbsEl = document.getElementById('breadcrumbs-list');
    this.drivesListEl = document.getElementById('drives-list');
    this.quickListEl = document.getElementById('quick-list');
    this.windowsListEl = document.getElementById('windows-list');
    this.searchInput = document.getElementById('search-input');
    this.tooltipEl = document.getElementById('node-tooltip');

    // Inspector elements
    this.inspectorEl = document.getElementById('bottom-bar');
    this.inspectorType = document.getElementById('inspector-type');
    this.inspectorTitle = document.getElementById('inspector-title');
    this.inspectorMeta = document.getElementById('inspector-meta');
    this.actionPrimary = document.getElementById('btn-action-primary');
    this.actionSecondary = document.getElementById('btn-action-secondary');

    // Settings Modal Elements
    this.settingsModalEl = document.getElementById('settings-modal');
    this.settingShowRings = document.getElementById('setting-show-rings');
    this.settingShowOrbitTracks = document.getElementById('setting-show-orbit-tracks');
    this.settingShowLabels = document.getElementById('setting-show-labels');
    this.settingGlowRange = document.getElementById('setting-glow-range');
    this.settingGlowVal = document.getElementById('setting-glow-val');
    this.settingShowParticles = document.getElementById('setting-show-particles');
    this.settingShowDataPulses = document.getElementById('setting-show-data-pulses');
    this.settingShowSyncPulses = document.getElementById('setting-show-sync-pulses');
    this.settingSpeedRange = document.getElementById('setting-speed-range');
    this.settingSpeedVal = document.getElementById('setting-speed-val');

    // City and Navigation Controls
    this.btnNavUp = document.getElementById('btn-nav-up');
    this.btnSettingStyleCity = document.getElementById('btn-setting-style-city');
    this.btnSettingStylePlex = document.getElementById('btn-setting-style-plex');
    this.btnSettingStyleNeural = document.getElementById('btn-setting-style-neural');
    this.colorLegendEl = document.getElementById('color-legend');
    this.btnToggleLegend = document.getElementById('btn-toggle-legend');
    this.legendHeader = document.getElementById('legend-header');

    // Collapsible Panels Elements
    this.sidebarLeft = document.getElementById('sidebar-left');
    this.sidebarRight = document.getElementById('sidebar-right');
    this.cameraWidget = document.getElementById('camera-widget');
    this.btnToggleSidebarLeft = document.getElementById('btn-toggle-sidebar-left');
    this.btnToggleSidebarRight = document.getElementById('btn-toggle-sidebar-right');
    this.btnToggleCameraWidget = document.getElementById('btn-toggle-camera-widget');

    // About Modal Elements
    this.aboutModalEl = document.getElementById('about-modal');
    this.btnAbout = document.getElementById('btn-about');
    this.btnCloseAbout = document.getElementById('btn-close-about');
    this.btnAboutOk = document.getElementById('btn-about-ok');
    this.aboutHeroLogo = document.getElementById('about-hero-logo');
    this.aboutHeroSub = document.getElementById('about-hero-sub');
    this.aboutVersionPill = document.getElementById('about-version-pill');
    this.aboutDescTitle = document.getElementById('about-desc-title');
    this.aboutDescText = document.getElementById('about-desc-text');
    this.aboutFeaturesGrid = document.getElementById('about-features-grid');
    this.aboutDevTitle = document.getElementById('about-dev-title');
    this.aboutDevName = document.getElementById('about-dev-name');
    this.aboutDevArch = document.getElementById('about-dev-arch');
    this.aboutDevTech = document.getElementById('about-dev-tech');
    this.aboutDevLicense = document.getElementById('about-dev-license');

    // Windows 11 Context Menu Elements
    this.contextMenuEl = document.getElementById('win-context-menu');
    this.ctxItemIcon = document.getElementById('ctx-item-icon');
    this.ctxItemTitle = document.getElementById('ctx-item-title');
    this.ctxOpenLabel = document.getElementById('ctx-open-label');
    this.ctxActionOpen = document.getElementById('ctx-action-open');
    this.ctxActionReveal = document.getElementById('ctx-action-reveal');
    this.ctxActionTerminal = document.getElementById('ctx-action-terminal');
    this.ctxActionCopyFile = document.getElementById('ctx-action-copy-file');
    this.ctxActionPasteFile = document.getElementById('ctx-action-paste-file');
    this.ctxActionCopyPath = document.getElementById('ctx-action-copy-path');
    this.ctxActionCopyName = document.getElementById('ctx-action-copy-name');
    this.ctxActionRefresh = document.getElementById('ctx-action-refresh');
    this.ctxActionNavUp = document.getElementById('ctx-action-nav-up');
    this.ctxActionProperties = document.getElementById('ctx-action-properties');
    this.ctxDivTools = document.getElementById('ctx-div-tools');
    this.ctxExternalToolsList = document.getElementById('ctx-external-tools-list');
    this.ctxDivClipboard = document.getElementById('ctx-div-clipboard');
    this.toastEl = document.getElementById('hud-toast');
    this.ctxActionGallery = document.getElementById('ctx-action-gallery');
    this.settingGalleryWASD = document.getElementById('setting-gallery-wasd');
    this.activeContextNode = null;
    this.clipboardHasFiles = false;
    this.pendingGalleryFolder = null;

    // Multi-Selection State & Elements
    this.selectedNodes = []; // Array of { data: nodeData, mesh: targetMesh }
    this.contextMode = 'single'; // 'single', 'multi', 'empty_folder', 'empty_root'
    this.multiSelectionCard = document.getElementById('multi-selection-card');
    this.multiSelectionHeading = document.getElementById('multi-selection-heading');
    this.multiSelectionBadge = document.getElementById('multi-selection-badge');
    this.multiSelectionList = document.getElementById('multi-selection-list');
    this.btnClearSelection = document.getElementById('btn-clear-selection');
    this.btnMultiselCopy = document.getElementById('btn-multisel-copy');
    this.btnMultiselCut = document.getElementById('btn-multisel-cut');
    this.btnMultiselZip = document.getElementById('btn-multisel-zip');
    this.btnMultiselMore = document.getElementById('btn-multisel-more');

    // Context Menu Dynamic Labels & Options
    this.ctxActionCutFile = document.getElementById('ctx-action-cut-file');
    this.ctxCopyLabel = document.getElementById('ctx-copy-label');
    this.ctxCopyShortcut = document.getElementById('ctx-copy-shortcut');
    this.ctxCutLabel = document.getElementById('ctx-cut-label');
    this.ctxCutShortcut = document.getElementById('ctx-cut-shortcut');
    this.ctxActionCompressSelected = document.getElementById('ctx-action-compress-selected');
    this.ctxActionPrintSelected = document.getElementById('ctx-action-print-selected');
    this.ctxPasteLabel = document.getElementById('ctx-paste-label');

    // Traffic Setting Element
    this.settingShowTraffic = document.getElementById('setting-show-traffic');

    // Paste / Copy Progress Elements
    this.pasteProgressCard = document.getElementById('paste-progress-card');
    this.pasteTitleText = document.getElementById('paste-title-text');
    this.btnCancelPaste = document.getElementById('btn-cancel-paste');
    this.pasteCurrentFile = document.getElementById('paste-current-file');
    this.pasteMeterFill = document.getElementById('paste-meter-fill');
    this.pasteItemsCount = document.getElementById('paste-items-count');
    this.pasteSizeStats = document.getElementById('paste-size-stats');
    this.pasteSpeedStat = document.getElementById('paste-speed-stat');
    this.pastePercentStat = document.getElementById('paste-percent-stat');

    this.currentViewMode = 'city'; // 'city', 'plex'
    this.currentLevel = 'welcome';
    this.lastPayload = null;

    this.initEvents();
  }

  initEvents() {
    // Window controls
    document.getElementById('btn-min').addEventListener('click', () => {
      this.bridge.sendMessage('minimize');
    });

    document.getElementById('btn-max').addEventListener('click', () => {
      this.bridge.sendMessage('toggle_fullscreen');
    });

    document.getElementById('btn-close').addEventListener('click', () => {
      this.bridge.sendMessage('close');
    });

    // Cancel paste button
    if (this.btnCancelPaste) {
      this.btnCancelPaste.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.bridge) {
          this.bridge.sendMessage('cancel_paste');
        }
        if (this.pasteTitleText) {
          this.pasteTitleText.textContent = "Cancelando...";
        }
      });
    }

    // Settings Modal Open/Close
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        this.settingsModalEl.classList.add('open');
      });
    }

    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        this.settingsModalEl.classList.remove('open');
      });
    }

    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        this.settingsModalEl.classList.remove('open');
      });
    }

    this.settingsModalEl.addEventListener('click', (e) => {
      if (e.target === this.settingsModalEl) {
        this.settingsModalEl.classList.remove('open');
      }
    });

    // About Modal Open/Close (Native WPF Window with HTML fallback)
    const openAbout = () => {
      this.bridge.sendMessage('open_about_window');
      // Fallback for standalone browser testing outside WPF WebView2
      if (!window.chrome || !window.chrome.webview) {
        if (this.aboutModalEl) {
          this.aboutModalEl.classList.add('open');
        }
        this.bridge.sendMessage('get_about_info');
      }
    };
    const closeAbout = () => {
      if (this.aboutModalEl) {
        this.aboutModalEl.classList.remove('open');
      }
    };

    if (this.btnAbout) {
      this.btnAbout.addEventListener('click', openAbout);
    }
    if (this.btnCloseAbout) {
      this.btnCloseAbout.addEventListener('click', closeAbout);
    }
    if (this.btnAboutOk) {
      this.btnAboutOk.addEventListener('click', closeAbout);
    }
    if (this.aboutModalEl) {
      this.aboutModalEl.addEventListener('click', (e) => {
        if (e.target === this.aboutModalEl) {
          closeAbout();
        }
      });
    }

    // Setting: Show Rings
    this.settingShowRings.addEventListener('change', (e) => {
      if (window.plexGraph) {
        window.plexGraph.setRingsVisible(e.target.checked);
      }
      this.saveSettings();
    });

    // Setting: Show Orbit Tracks
    if (this.settingShowOrbitTracks) {
      this.settingShowOrbitTracks.addEventListener('change', (e) => {
        if (window.plexGraph) {
          window.plexGraph.setOrbitTracksVisible(e.target.checked);
        }
        this.saveSettings();
      });
    }

    // Setting: Show Labels
    this.settingShowLabels.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (window.plexGraph) {
        window.plexGraph.setLabelsVisible(isChecked);
      }
      if (window.cityGrid) {
        window.cityGrid.setLabelsVisible(isChecked);
      }
      if (window.neuralNetwork) {
        window.neuralNetwork.setLabelsVisible(isChecked);
      }
      this.saveSettings();
    });

    // Setting: Exploration Visual Style (City-Grid vs Plex)
    if (this.btnSettingStyleCity) {
      this.btnSettingStyleCity.addEventListener('click', () => {
        this.setInterfaceMode('city');
        this.saveSettings();
      });
    }

    if (this.btnSettingStylePlex) {
      this.btnSettingStylePlex.addEventListener('click', () => {
        this.setInterfaceMode('plex');
        this.saveSettings();
      });
    }

    if (this.btnSettingStyleNeural) {
      this.btnSettingStyleNeural.addEventListener('click', () => {
        this.setInterfaceMode('neural');
        this.saveSettings();
      });
    }

    // Setting: Glow intensity slider
    this.settingGlowRange.addEventListener('input', (e) => {
      const val = e.target.value;
      this.settingGlowVal.textContent = `${val}%`;
      if (window.engine3d) {
        window.engine3d.setBloomIntensity(val);
      }
      this.saveSettings();
    });

    // Setting: Show Particles
    this.settingShowParticles.addEventListener('change', (e) => {
      if (window.engine3d) {
        window.engine3d.setStarfieldVisible(e.target.checked);
      }
      this.saveSettings();
    });

    // Setting: Show Async Data Pulses (Mutually exclusive with Sync Pulses)
    if (this.settingShowDataPulses) {
      this.settingShowDataPulses.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (this.settingShowSyncPulses) {
            this.settingShowSyncPulses.checked = false;
            if (window.plexGraph) window.plexGraph.setSyncPulsesVisible(false);
          }
        }
        if (window.plexGraph) {
          window.plexGraph.setDataPulsesVisible(e.target.checked);
        }
        this.saveSettings();
      });
    }

    // Setting: Show Synchronized Concentric Pulses (Mutually exclusive with Data Pulses)
    if (this.settingShowSyncPulses) {
      this.settingShowSyncPulses.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (this.settingShowDataPulses) {
            this.settingShowDataPulses.checked = false;
            if (window.plexGraph) window.plexGraph.setDataPulsesVisible(false);
          }
        }
        if (window.plexGraph) {
          window.plexGraph.setSyncPulsesVisible(e.target.checked);
        }
        this.saveSettings();
      });
    }

    // Setting: Pulse and flow speed slider
    if (this.settingSpeedRange) {
      this.settingSpeedRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const factor = val / 100;
        if (this.settingSpeedVal) {
          this.settingSpeedVal.textContent = `${factor.toFixed(1)}x`;
        }
        if (window.plexGraph) {
          window.plexGraph.setPulseSpeed(factor);
        }
        if (window.cityGrid) {
          window.cityGrid.setTrafficSpeed(factor);
        }
        if (window.neuralNetwork) {
          window.neuralNetwork.pulseSpeedFactor = factor;
        }
        this.saveSettings();
      });
    }

    // Setting: Show 3D Street Traffic (City-Grid)
    if (this.settingShowTraffic) {
      this.settingShowTraffic.addEventListener('change', (e) => {
        if (window.cityGrid) {
          window.cityGrid.setTrafficVisible(e.target.checked);
        }
        this.saveSettings();
      });
    }

    // Setting: WASD Controls in Gallery Museum
    if (this.settingGalleryWASD) {
      this.settingGalleryWASD.addEventListener('change', (e) => {
        if (window.galleryMuseum) {
          window.galleryMuseum.setAllowWASD(e.target.checked);
        }
        this.saveSettings();
      });
    }

    // Windows 11 Context Menu Handlers
    if (this.contextMenuEl) {
      this.contextMenuEl.addEventListener('click', (e) => {
        const item = e.target.closest('.ctx-item');
        if (!item) return;
        const action = item.dataset.action;
        this.handleContextMenuAction(action, item, e);
        this.hideContextMenu();
      });

      document.addEventListener('pointerdown', (e) => {
        if (e.button === 0 && !e.target.closest('#win-context-menu')) {
          this.hideContextMenu();
        }
      });
    }

    // Floating Multi-Selection Card Event Listeners
    if (this.btnClearSelection) {
      this.btnClearSelection.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearSelection();
      });
    }

    if (this.btnMultiselCopy) {
      this.btnMultiselCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        this.executeBatchAction('copy');
      });
    }

    if (this.btnMultiselCut) {
      this.btnMultiselCut.addEventListener('click', (e) => {
        e.stopPropagation();
        this.executeBatchAction('cut');
      });
    }

    if (this.btnMultiselZip) {
      this.btnMultiselZip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.executeBatchAction('zip');
      });
    }

    if (this.btnMultiselMore) {
      this.btnMultiselMore.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = this.btnMultiselMore.getBoundingClientRect();
        this.showContextMenu(null, rect.left, rect.bottom + 6, null, true);
      });
    }

    if (this.multiSelectionCard) {
      this.multiSelectionCard.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextMenu(null, e.clientX, e.clientY, null, true);
      });
    }

    // Window drag support & maximize toggle on top-bar
    const topBar = document.getElementById('top-bar');
    if (topBar) {
      topBar.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.crumb-item')) return;
        this.bridge.sendMessage('drag_move');
      });

      topBar.addEventListener('dblclick', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.crumb-item')) return;
        this.bridge.sendMessage('toggle_fullscreen');
      });
    }

    // Prevent zoom propagation on all periphery HUD panels (sidebar, top-bar, bottom-bar, etc.)
    const peripheryElements = document.querySelectorAll('.sidebar, #top-bar, #bottom-bar, #camera-widget, .settings-dialog');
    peripheryElements.forEach(el => {
      el.addEventListener('wheel', (e) => {
        e.stopPropagation();
      }, { passive: false });
    });

    // Auto-refresh active windows list periodically
    setInterval(() => {
      this.bridge.sendMessage('refresh_windows');
    }, 5000);

    // Camera buttons
    document.getElementById('btn-cam-reset').addEventListener('click', () => {
      window.engine3d.resetCamera();
    });

    document.getElementById('btn-cam-top').addEventListener('click', () => {
      window.engine3d.setTopView();
    });

    // Search filter
    this.searchInput.addEventListener('input', (e) => {
      if (window.plexGraph) {
        window.plexGraph.filterNodes(e.target.value);
      }
      if (window.neuralNetwork) {
        window.neuralNetwork.filterNodes(e.target.value);
      }
    });

    // Inspector primary action
    this.actionPrimary.addEventListener('click', () => {
      if (!this.selectedNodeData) return;
      this.executeNodeAction(this.selectedNodeData);
    });

    // Inspector secondary action (Copy Path)
    this.actionSecondary.addEventListener('click', () => {
      const pathToCopy = (this.selectedNodeData && this.selectedNodeData.fullPath)
        || (this.lastPayload && this.lastPayload.currentNode && this.lastPayload.currentNode.fullPath);
      if (pathToCopy) {
        navigator.clipboard.writeText(pathToCopy);
        this.actionSecondary.innerText = "¡Copiado!";
        setTimeout(() => this.actionSecondary.innerText = "Copiar Ruta", 1500);
      }
    });

    // Navigation Up Button (In-Canvas)
    if (this.btnNavUp) {
      this.btnNavUp.addEventListener('click', () => {
        this.navigateUp();
      });
    }

    // Collapsible Panels Handlers
    const bindToggle = (btn, header, panelEl) => {
      if (btn && panelEl) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          panelEl.classList.toggle('collapsed');
        });
      }
      if (header && panelEl) {
        header.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          panelEl.classList.toggle('collapsed');
        });
      }
    };

    bindToggle(this.btnToggleSidebarLeft, document.getElementById('header-sidebar-left'), this.sidebarLeft);
    bindToggle(this.btnToggleSidebarRight, document.getElementById('header-sidebar-right'), this.sidebarRight);
    bindToggle(this.btnToggleCameraWidget, document.getElementById('header-camera-widget'), this.cameraWidget);

    // Toggle Color Legend
    if (this.legendHeader) {
      this.legendHeader.addEventListener('click', (e) => {
        if (this.colorLegendEl) {
          this.colorLegendEl.classList.toggle('collapsed');
        }
      });
    }
    if (this.btnToggleLegend && this.colorLegendEl) {
      this.btnToggleLegend.addEventListener('click', (e) => {
        e.stopPropagation();
        this.colorLegendEl.classList.toggle('collapsed');
      });
    }

    // Keyboard Shortcuts: Alt+Up or Backspace to navigate up with spatial continuity, Escape to close modals / clear selection
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.contextMenuEl && this.contextMenuEl.style.display !== 'none') {
          this.hideContextMenu();
          return;
        }
        if (this.selectedNodes && this.selectedNodes.length > 0) {
          this.clearSelection();
          return;
        }
        if (this.aboutModalEl && this.aboutModalEl.classList.contains('open')) {
          this.aboutModalEl.classList.remove('open');
          return;
        }
        if (this.settingsModalEl && this.settingsModalEl.classList.contains('open')) {
          this.settingsModalEl.classList.remove('open');
          return;
        }
      }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      // Copy & Paste Shortcuts (Windows File Explorer Style)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        if (this.selectedNodes && this.selectedNodes.length > 1) {
          e.preventDefault();
          this.executeBatchAction('copy');
          return;
        }
        const target = this.selectedNodeData || this.activeContextNode;
        if (target && target.fullPath && target.fullPath !== 'welcome' && target.fullPath !== 'root') {
          e.preventDefault();
          this.bridge.sendMessage('copy_file_clipboard', target.fullPath);
          this.showToast("Copiado al portapapeles");
          this.clearSelection();
        }
      }

      if (e.ctrlKey && !e.shiftKey && (e.key === 'x' || e.key === 'X')) {
        if (this.selectedNodes && this.selectedNodes.length > 1) {
          e.preventDefault();
          this.executeBatchAction('cut');
          return;
        }
        const target = this.selectedNodeData || this.activeContextNode;
        if (target && target.fullPath && target.fullPath !== 'welcome' && target.fullPath !== 'root') {
          e.preventDefault();
          this.bridge.sendMessage('cut_file_clipboard', target.fullPath);
          this.showToast("Cortado al portapapeles");
          this.clearSelection();
        }
      }

      if (e.ctrlKey && !e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        if (!this.clipboardHasFiles) {
          this.showToast("El portapapeles no contiene archivos ni carpetas para pegar.");
          return;
        }
        const current = (this.lastPayload && this.lastPayload.currentNode) || null;
        let pasteDest = (this.selectedNodeData && (this.selectedNodeData.isDirectory || this.selectedNodeData.isDrive))
          ? this.selectedNodeData.fullPath
          : (current ? current.fullPath : null);

        if (pasteDest && pasteDest !== 'welcome' && pasteDest !== 'root') {
          e.preventDefault();
          this.bridge.sendMessage('paste_file_clipboard', pasteDest);
        }
      }

      // Shift+F10: Open Windows native shell context menu on selected node
      if (e.shiftKey && e.key === 'F10') {
        const target = this.selectedNodeData || this.activeContextNode || (this.lastPayload && this.lastPayload.currentNode);
        if (target && target.fullPath && target.fullPath !== 'welcome' && target.fullPath !== 'root') {
          e.preventDefault();
          this.bridge.sendMessage('show_native_context_menu', target.fullPath);
        }
      }

      if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        this.navigateUp();
      }
    });
  }

  navigateUp() {
    if (this.currentViewMode === 'city') {
      if (window.cityGrid && this.currentLevel !== 'welcome') {
        window.cityGrid.animateSubirNivel(() => {
          this.bridge.sendMessage('navigate_parent');
        });
      } else {
        this.bridge.sendMessage('navigate_parent');
      }
    } else if (this.currentViewMode === 'plex') {
      if (window.plexGraph && this.currentLevel !== 'welcome') {
        window.plexGraph.animateAscend(() => {
          this.bridge.sendMessage('navigate_parent');
        });
      } else {
        this.bridge.sendMessage('navigate_parent');
      }
    } else if (this.currentViewMode === 'neural') {
      if (window.neuralNetwork && this.currentLevel !== 'welcome') {
        window.neuralNetwork.animateAscend(() => {
          this.bridge.sendMessage('navigate_parent');
        });
      } else {
        this.bridge.sendMessage('navigate_parent');
      }
    } else {
      this.bridge.sendMessage('navigate_parent');
    }
  }

  /* =========================================================================
   * WINDOWS FILE EXPLORER CONTEXT MENU
   * ========================================================================= */
  showContextMenu(nodeData, clientX, clientY, targetMesh = null, fromMultiCard = false) {
    if (!this.contextMenuEl) return;

    // Request fresh clipboard status immediately
    this.bridge.sendMessage('get_clipboard_status');

    // Reset external tools container
    if (this.ctxExternalToolsList) {
      this.ctxExternalToolsList.innerHTML = '';
    }
    if (this.ctxDivTools) {
      this.ctxDivTools.style.display = 'none';
    }

    const current = (this.lastPayload && this.lastPayload.currentNode) || null;
    const isRealFolder = current && current.fullPath && current.fullPath !== 'welcome' && current.fullPath !== 'root';

    // Check if target is part of an active multi-selection
    const isTargetInMulti = nodeData && this.selectedNodes.length > 1 &&
      this.selectedNodes.some(s => s.data && s.data.fullPath === nodeData.fullPath);

    if (fromMultiCard || isTargetInMulti) {
      // -------------------------------------------------------------
      // CONTEXT: MULTI-SELECTION BATCH
      // -------------------------------------------------------------
      this.contextMode = 'multi';
      this.activeContextNode = null;
      const count = this.selectedNodes.length;

      this.ctxItemIcon.textContent = '📑';
      this.ctxItemTitle.textContent = `${count} elementos seleccionados`;

      this.ctxActionOpen.style.display = 'none';
      if (this.ctxActionGallery) this.ctxActionGallery.style.display = 'none';
      this.ctxActionReveal.style.display = 'none';
      this.ctxActionTerminal.style.display = 'none';

      // Batch copy / cut
      this.ctxActionCopyFile.style.display = 'flex';
      if (this.ctxCopyLabel) this.ctxCopyLabel.textContent = `Copiar (${count})`;
      if (this.ctxCopyShortcut) this.ctxCopyShortcut.textContent = 'Ctrl+C';

      this.ctxActionCutFile.style.display = 'flex';
      if (this.ctxCutLabel) this.ctxCutLabel.textContent = `Cortar (${count})`;
      if (this.ctxCutShortcut) this.ctxCutShortcut.textContent = 'Ctrl+X';

      // Paste not available directly on multi-item selection
      if (this.ctxActionPasteFile) this.ctxActionPasteFile.style.display = 'none';

      // Batch compress and print
      if (this.ctxActionCompressSelected) this.ctxActionCompressSelected.style.display = 'flex';
      if (this.ctxActionPrintSelected) this.ctxActionPrintSelected.style.display = 'flex';

      this.ctxActionCopyPath.style.display = 'flex';
      const pathLabel = document.getElementById('ctx-copy-path-label');
      if (pathLabel) pathLabel.textContent = 'Copiar rutas de acceso';

      this.ctxActionCopyName.style.display = 'none';
      if (this.ctxDivClipboard) this.ctxDivClipboard.style.display = 'block';
      this.ctxActionRefresh.style.display = 'none';
      this.ctxActionNavUp.style.display = 'none';
      this.ctxActionProperties.style.display = 'none';

    } else if (nodeData) {
      // -------------------------------------------------------------
      // CONTEXT: SINGLE ELEMENT
      // -------------------------------------------------------------
      this.contextMode = 'single';
      this.activeContextNode = nodeData;

      // If we previously had multi-selection and right-clicked on an unselected item, select only this one
      if (this.selectedNodes.length > 1) {
        this.clearSelection(true);
        this.selectedNodes = [{ data: nodeData, mesh: targetMesh }];
        if (targetMesh && window.engine3d) {
          window.engine3d.setNodeSelected(targetMesh, true);
        }
        this.updateInspector(nodeData);
        this.updateMultiSelectionUI();
      }

      const isDir = nodeData.isDirectory || nodeData.isDrive || nodeData.isLibrary || nodeData.itemType === 'system';
      const iconMap = {
        folder: '📁', document: '📄', image: '🖼️', audio: '🎵', video: '🎬',
        code: '💻', archive: '📦', executable: '⚙️', drive: '💽', network: '🌐'
      };
      this.ctxItemIcon.textContent = iconMap[nodeData.itemType] || (isDir ? '📁' : '📄');
      this.ctxItemTitle.textContent = nodeData.name || 'Elemento';
      this.ctxOpenLabel.textContent = isDir ? 'Explorar' : 'Abrir';

      this.ctxActionOpen.style.display = 'flex';
      if (this.ctxActionGallery) {
        const isFolderItem = isDir && nodeData.fullPath && nodeData.fullPath !== 'welcome' && nodeData.fullPath !== 'root';
        this.ctxActionGallery.style.display = isFolderItem ? 'flex' : 'none';
      }
      this.ctxActionReveal.style.display = 'flex';
      this.ctxActionTerminal.style.display = isDir ? 'flex' : 'none';

      // Single item: "Copiar" and "Cortar"
      this.ctxActionCopyFile.style.display = 'flex';
      if (this.ctxCopyLabel) this.ctxCopyLabel.textContent = 'Copiar';
      if (this.ctxCopyShortcut) this.ctxCopyShortcut.textContent = 'Ctrl+C';

      this.ctxActionCutFile.style.display = 'flex';
      if (this.ctxCutLabel) this.ctxCutLabel.textContent = 'Cortar';
      if (this.ctxCutShortcut) this.ctxCutShortcut.textContent = 'Ctrl+X';

      if (this.ctxActionPasteFile) {
        this.ctxActionPasteFile.style.display = (this.clipboardHasFiles && isDir) ? 'flex' : 'none';
        if (this.ctxPasteLabel) this.ctxPasteLabel.textContent = 'Pegar';
      }

      if (this.ctxActionCompressSelected) this.ctxActionCompressSelected.style.display = 'none';
      if (this.ctxActionPrintSelected) this.ctxActionPrintSelected.style.display = 'none';

      this.ctxActionCopyPath.style.display = 'flex';
      const pathLabel = document.getElementById('ctx-copy-path-label');
      if (pathLabel) pathLabel.textContent = 'Copiar como ruta de acceso';

      this.ctxActionCopyName.style.display = 'flex';
      if (this.ctxDivClipboard) this.ctxDivClipboard.style.display = 'block';
      this.ctxActionRefresh.style.display = 'none';
      this.ctxActionNavUp.style.display = 'none';
      this.ctxActionProperties.style.display = 'flex';

      if (nodeData.fullPath && nodeData.fullPath !== 'welcome' && nodeData.fullPath !== 'root') {
        this.bridge.sendMessage('get_external_tools', nodeData.fullPath);
      }

    } else {
      // -------------------------------------------------------------
      // CONTEXT: EMPTY AREA
      // -------------------------------------------------------------
      this.activeContextNode = null;
      if (this.selectedNodes.length > 0) {
        this.clearSelection(true);
      }

      if (isRealFolder) {
        // Empty area inside a real folder or drive:
        // "Copiar Todo", "Cortar Todo", and "Pegar" (if clipboard contains items)
        this.contextMode = 'empty_folder';
        this.ctxItemIcon.textContent = '🏙️';
        this.ctxItemTitle.textContent = current ? (current.name || 'Carpeta actual') : 'Carpeta actual';

        this.ctxActionOpen.style.display = 'none';
        if (this.ctxActionGallery) {
          this.ctxActionGallery.style.display = 'flex';
        }
        this.ctxActionReveal.style.display = 'flex';
        this.ctxActionTerminal.style.display = 'flex';

        this.ctxActionCopyFile.style.display = 'flex';
        if (this.ctxCopyLabel) this.ctxCopyLabel.textContent = 'Copiar Todo';
        if (this.ctxCopyShortcut) this.ctxCopyShortcut.textContent = 'Ctrl+A, C';

        this.ctxActionCutFile.style.display = 'flex';
        if (this.ctxCutLabel) this.ctxCutLabel.textContent = 'Cortar Todo';
        if (this.ctxCutShortcut) this.ctxCutShortcut.textContent = 'Ctrl+A, X';

        if (this.ctxActionPasteFile) {
          this.ctxActionPasteFile.style.display = this.clipboardHasFiles ? 'flex' : 'none';
          if (this.ctxPasteLabel) this.ctxPasteLabel.textContent = 'Pegar';
        }

        if (this.ctxActionCompressSelected) this.ctxActionCompressSelected.style.display = 'none';
        if (this.ctxActionPrintSelected) this.ctxActionPrintSelected.style.display = 'none';

        this.ctxActionCopyPath.style.display = 'flex';
        const pathLabel = document.getElementById('ctx-copy-path-label');
        if (pathLabel) pathLabel.textContent = 'Copiar como ruta de acceso';

        this.ctxActionCopyName.style.display = 'none';
        if (this.ctxDivClipboard) this.ctxDivClipboard.style.display = 'block';
        this.ctxActionRefresh.style.display = 'flex';
        this.ctxActionNavUp.style.display = this.currentLevel !== 'welcome' ? 'flex' : 'none';
        this.ctxActionProperties.style.display = 'flex';

        if (current.fullPath) {
          this.bridge.sendMessage('get_external_tools', current.fullPath);
        }

      } else {
        // Empty space in Root (Mi PC) or Welcome hub
        this.contextMode = 'empty_root';
        this.ctxItemIcon.textContent = '🌌';
        this.ctxItemTitle.textContent = 'Espacio 3D';

        this.ctxActionOpen.style.display = 'none';
        if (this.ctxActionGallery) this.ctxActionGallery.style.display = 'none';
        this.ctxActionReveal.style.display = 'none';
        this.ctxActionTerminal.style.display = 'none';
        this.ctxActionCopyFile.style.display = 'none';
        this.ctxActionCutFile.style.display = 'none';
        if (this.ctxActionPasteFile) this.ctxActionPasteFile.style.display = 'none';
        if (this.ctxActionCompressSelected) this.ctxActionCompressSelected.style.display = 'none';
        if (this.ctxActionPrintSelected) this.ctxActionPrintSelected.style.display = 'none';
        this.ctxActionCopyPath.style.display = 'none';
        this.ctxActionCopyName.style.display = 'none';
        if (this.ctxDivClipboard) this.ctxDivClipboard.style.display = 'none';
        this.ctxActionRefresh.style.display = 'flex';
        this.ctxActionNavUp.style.display = this.currentLevel !== 'welcome' ? 'flex' : 'none';
        this.ctxActionProperties.style.display = 'none';
      }
    }

    // Position context menu with boundary safety
    this.contextMenuEl.style.display = 'block';
    const menuW = this.contextMenuEl.offsetWidth || 250;
    const menuH = this.contextMenuEl.offsetHeight || 280;

    let posX = clientX;
    let posY = clientY;

    if (posX + menuW > window.innerWidth - 12) {
      posX = window.innerWidth - menuW - 12;
    }
    if (posY + menuH > window.innerHeight - 12) {
      posY = window.innerHeight - menuH - 12;
    }

    this.contextMenuEl.style.left = `${Math.max(10, posX)}px`;
    this.contextMenuEl.style.top = `${Math.max(10, posY)}px`;
  }

  hideContextMenu() {
    if (this.contextMenuEl) {
      this.contextMenuEl.style.display = 'none';
    }
    this.activeContextNode = null;
  }

  handleContextMenuAction(action, item = null, event = null) {
    const node = this.activeContextNode;
    const current = (this.lastPayload && this.lastPayload.currentNode) || null;
    const targetPath = (node && node.fullPath) || (current && current.fullPath) || null;

    switch (action) {
      case 'ext_tool':
        if (item && item.dataset.toolId) {
          const toolId = item.dataset.toolId;
          const path = item.dataset.targetPath || targetPath;
          if (toolId === 'native_shell_menu') {
            this.hideContextMenu();
          }
          const sx = (event && event.screenX) ? event.screenX : (window.screenX + 150);
          const sy = (event && event.screenY) ? event.screenY : (window.screenY + 150);
          this.bridge.sendMessage('execute_external_tool', path, null, {
            toolId: toolId,
            screenX: sx,
            screenY: sy
          });
        }
        break;

      case 'open':
        if (node) {
          this.executeNodeAction(node);
        }
        break;

      case 'open_gallery':
        {
          const folderPath = (node && (node.isDirectory || node.isDrive)) ? node.fullPath : (current ? current.fullPath : null);
          if (folderPath && folderPath !== 'welcome' && folderPath !== 'root') {
            this.openGalleryMode(folderPath);
          }
        }
        break;

      case 'show_in_folder':
        if (targetPath) {
          this.bridge.sendMessage('show_in_folder', targetPath);
        }
        break;

      case 'open_terminal':
        if (targetPath) {
          this.bridge.sendMessage('open_terminal', targetPath);
        }
        break;

      case 'copy_file':
        if (this.contextMode === 'multi') {
          this.executeBatchAction('copy');
        } else if (this.contextMode === 'empty_folder') {
          const children = (this.lastPayload && this.lastPayload.children) || [];
          const paths = children.map(c => c.fullPath).filter(p => p && p !== 'welcome' && p !== 'root');
          if (paths.length > 0) {
            this.bridge.sendMessage('copy_multiple_clipboard', paths);
            this.showToast(`${paths.length} elementos copiados al portapapeles`);
          }
          this.clearSelection();
        } else {
          if (targetPath) {
            this.bridge.sendMessage('copy_file_clipboard', targetPath);
            this.showToast("Copiado al portapapeles");
          }
          this.clearSelection();
        }
        break;

      case 'cut_file':
        if (this.contextMode === 'multi') {
          this.executeBatchAction('cut');
        } else if (this.contextMode === 'empty_folder') {
          const children = (this.lastPayload && this.lastPayload.children) || [];
          const paths = children.map(c => c.fullPath).filter(p => p && p !== 'welcome' && p !== 'root');
          if (paths.length > 0) {
            this.bridge.sendMessage('cut_multiple_clipboard', paths);
            this.showToast(`${paths.length} elementos cortados al portapapeles`);
          }
          this.clearSelection();
        } else {
          if (targetPath) {
            this.bridge.sendMessage('cut_file_clipboard', targetPath);
            this.showToast("Cortado al portapapeles");
          }
          this.clearSelection();
        }
        break;

      case 'paste_file':
        {
          const isDir = node && (node.isDirectory || node.isDrive || node.isLibrary || node.itemType === 'system');
          const dest = (node && isDir) ? node.fullPath : (current ? current.fullPath : null);
          if (dest && dest !== 'welcome' && dest !== 'root') {
            this.bridge.sendMessage('paste_file_clipboard', dest);
          }
        }
        break;

      case 'compress_selected':
        this.executeBatchAction('zip');
        break;

      case 'print_selected':
        this.executeBatchAction('print');
        break;

      case 'copy_path':
        if (this.contextMode === 'multi') {
          const text = this.selectedNodes.map(n => `"${n.data.fullPath}"`).join('\n');
          navigator.clipboard.writeText(text);
          this.showToast(`${this.selectedNodes.length} rutas copiadas`);
          this.clearSelection();
        } else if (targetPath) {
          navigator.clipboard.writeText(targetPath);
          this.showToast("Ruta copiada al portapapeles");
        }
        break;

      case 'copy_name':
        if (node && node.name) {
          navigator.clipboard.writeText(node.name);
          this.showToast("Nombre copiado");
        } else if (current && current.name) {
          navigator.clipboard.writeText(current.name);
          this.showToast("Nombre copiado");
        }
        break;

      case 'properties':
        if (targetPath) {
          this.bridge.sendMessage('show_properties', targetPath);
        }
        break;

      case 'refresh':
        if (current && current.fullPath) {
          this.bridge.sendMessage('navigate', current.fullPath);
        } else {
          this.bridge.sendMessage('navigate', 'root');
        }
        break;

      case 'navigate_up':
        this.navigateUp();
        break;
    }
  }

  updateAboutModal(data) {
    if (!data) return;
    if (this.aboutHeroLogo && data.appName) {
      this.aboutHeroLogo.innerHTML = `${data.appName} <span class="brand-tag">${data.brandTag || ''}</span>`;
    }
    if (this.aboutHeroSub && data.subtitle) {
      this.aboutHeroSub.textContent = data.subtitle;
    }
    if (this.aboutVersionPill && data.version) {
      this.aboutVersionPill.textContent = data.version;
    }
    if (this.aboutDescTitle && data.descriptionTitle) {
      this.aboutDescTitle.innerHTML = `<span>🌌</span> ${data.descriptionTitle}`;
    }
    if (this.aboutDescText && data.descriptionText) {
      this.aboutDescText.innerHTML = `<strong>${data.appName || 'Axplorer'} ${data.brandTag || ''}</strong> ${data.descriptionText}`;
    }
    if (this.aboutFeaturesGrid && Array.isArray(data.features)) {
      this.aboutFeaturesGrid.innerHTML = '';
      data.features.forEach(f => {
        const card = document.createElement('div');
        card.className = 'about-feature-card';
        card.innerHTML = `
          <div class="feature-head"><span>${f.icon || '⭐'}</span> ${f.title || ''}</div>
          <div class="feature-body">${f.description || ''}</div>
        `;
        this.aboutFeaturesGrid.appendChild(card);
      });
    }
    if (this.aboutDevTitle && data.developerTitle) {
      this.aboutDevTitle.innerHTML = `<span>👨‍💻</span> ${data.developerTitle}`;
    }
    if (this.aboutDevName && data.developerName) {
      this.aboutDevName.textContent = data.developerName;
    }
    if (this.aboutDevArch && data.architecture) {
      this.aboutDevArch.textContent = data.architecture;
    }
    if (this.aboutDevTech && data.technologies) {
      this.aboutDevTech.textContent = data.technologies;
    }
    if (this.aboutDevLicense && data.licenseYear) {
      this.aboutDevLicense.textContent = data.licenseYear;
    }
  }

  updateGraph(payload) {
    this.clearSelection();
    this.lastPayload = payload;
    this.renderBreadcrumbs(payload.breadcrumbs || []);
    this.renderDrives(payload.drives || []);
    this.renderQuickAccess(payload.quickAccess || []);
    this.renderWindows(payload.windows || []);
    this.updateInspector(payload.currentNode);
    this.searchInput.value = '';

    if (this.pendingGalleryFolder && payload.currentNode && payload.currentNode.fullPath === this.pendingGalleryFolder) {
      this.pendingGalleryFolder = null;
      if (window.galleryMuseum) {
        window.galleryMuseum.enterGallery(payload);
      }
    }
  }

  openGalleryMode(folderPath) {
    const current = (this.lastPayload && this.lastPayload.currentNode) || null;
    if (current && current.fullPath === folderPath) {
      if (window.galleryMuseum) {
        window.galleryMuseum.enterGallery(this.lastPayload);
      }
    } else {
      this.pendingGalleryFolder = folderPath;
      this.bridge.sendMessage('navigate', folderPath);
    }
  }

  updateBreadcrumbs(crumbs) {
    this.renderBreadcrumbs(crumbs);
  }

  renderBreadcrumbs(crumbs) {
    this.breadcrumbsEl.innerHTML = '';
    crumbs.forEach((c, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'crumb-separator';
        sep.textContent = '>';
        this.breadcrumbsEl.appendChild(sep);
      }

      const item = document.createElement('span');
      item.className = `crumb-item ${idx === crumbs.length - 1 ? 'active' : ''}`;
      item.textContent = c.name;
      item.addEventListener('click', () => {
        this.bridge.sendMessage('navigate', c.path);
      });
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextMenu({ name: c.name, fullPath: c.path, isDirectory: true, itemType: 'folder' }, e.clientX, e.clientY);
      });
      this.breadcrumbsEl.appendChild(item);
    });
  }

  renderDrives(drives) {
    this.drivesListEl.innerHTML = '';
    drives.forEach(d => {
      const el = document.createElement('div');
      el.className = 'sidebar-item';
      el.innerHTML = `
        <span class="item-icon">💽</span>
        <span class="item-name">${d.name}</span>
        <span class="item-badge">${d.freeSpace || ''}</span>
      `;
      el.addEventListener('click', () => {
        this.bridge.sendMessage('navigate', d.fullPath);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextMenu(d, e.clientX, e.clientY);
      });
      this.drivesListEl.appendChild(el);
    });
  }

  renderQuickAccess(shortcuts) {
    this.quickListEl.innerHTML = '';
    const icons = {
      Escritorio: '🖥️',
      Documentos: '📁',
      Usuario: '👤',
      Descargas: '⬇️',
      Imágenes: '🖼️',
      Música: '🎵',
      Vídeos: '🎬'
    };

    shortcuts.forEach(s => {
      const el = document.createElement('div');
      el.className = 'sidebar-item';
      el.innerHTML = `
        <span class="item-icon">${icons[s.name] || '📂'}</span>
        <span class="item-name">${s.name}</span>
      `;
      el.addEventListener('click', () => {
        this.bridge.sendMessage('navigate', s.fullPath);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextMenu(s, e.clientX, e.clientY);
      });
      this.quickListEl.appendChild(el);
    });
  }

  renderWindows(windows) {
    this.windowsListEl.innerHTML = '';
    if (!windows || windows.length === 0) {
      this.windowsListEl.innerHTML = '<div style="font-size: 11px; color: #64748b; padding: 6px;">Sin ventanas registradas</div>';
      return;
    }

    windows.forEach(w => {
      const el = document.createElement('div');
      el.className = 'sidebar-item';
      el.innerHTML = `
        <span class="item-icon">🪟</span>
        <span class="item-name" title="${w.title}">${w.title}</span>
        <span class="item-badge">${w.processName}</span>
        <button class="win-close-btn" title="Cerrar ventana (enviar orden de cierre)" data-hwnd="${w.hwnd}">✕</button>
      `;
      el.addEventListener('click', (e) => {
        if (e.target.closest('.win-close-btn')) return;
        this.bridge.sendMessage('focus_window', null, w.hwnd);
      });

      const closeBtn = el.querySelector('.win-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          el.style.opacity = '0.35';
          el.style.pointerEvents = 'none';
          this.bridge.sendMessage('close_window', null, w.hwnd);
        });
      }

      this.windowsListEl.appendChild(el);
    });
  }

  updateInspector(nodeData) {
    if (!nodeData) return;
    this.selectedNodeData = nodeData;

    if (this.inspectorType) {
      this.inspectorType.textContent = (nodeData.itemType || 'item').toUpperCase();
    }
    if (this.inspectorTitle) {
      this.inspectorTitle.textContent = nodeData.name || 'Sin nombre';
    }

    if (this.inspectorMeta) {
      let meta = nodeData.fullPath || '';
      if (nodeData.formattedSize) meta += ` • ${nodeData.formattedSize}`;
      if (nodeData.childCount) meta += ` • ${nodeData.childCount} elementos`;
      this.inspectorMeta.textContent = meta;
    }

    if (nodeData.isDirectory || nodeData.isDrive || nodeData.itemType === 'system') {
      this.actionPrimary.innerHTML = `<span>🚀</span> Explorar`;
      this.actionPrimary.style.display = 'flex';
    } else if (nodeData.itemType === 'window') {
      this.actionPrimary.innerHTML = `<span>🪟</span> Enfocar`;
      this.actionPrimary.style.display = 'flex';
    } else {
      this.actionPrimary.innerHTML = `<span>⚡</span> Abrir`;
      this.actionPrimary.style.display = 'flex';
    }
  }

  executeNodeAction(nodeData) {
    if (nodeData.isDirectory || nodeData.isDrive) {
      this.bridge.sendMessage('navigate', nodeData.fullPath);
    } else if (nodeData.itemType === 'window') {
      this.bridge.sendMessage('focus_window', null, nodeData.windowHandle);
    } else if (nodeData.itemType === 'system') {
      this.bridge.sendMessage('navigate', 'root');
    } else {
      this.bridge.sendMessage('open', nodeData.fullPath);
    }
  }

  showTooltip(nodeData, event) {
    if (!nodeData) {
      this.tooltipEl.style.display = 'none';
      return;
    }

    this.tooltipEl.style.display = 'block';
    this.tooltipEl.style.left = `${event.clientX + 14}px`;
    this.tooltipEl.style.top = `${event.clientY - 16}px`;

    const title = nodeData.name;
    const typeStr = (nodeData.itemType || 'archivo').toUpperCase();
    const sizeStr = nodeData.formattedSize || (nodeData.isDirectory ? (nodeData.childCount ? `${nodeData.childCount} elementos` : 'Carpeta') : '0 B');
    const extStr = nodeData.extension ? `.${nodeData.extension.replace(/^\./, '')}` : (nodeData.isDirectory ? 'Carpeta' : 'Sin extensión');
    const dateStr = nodeData.modifiedDate ? new Date(nodeData.modifiedDate).toLocaleString() : 'N/A';

    this.tooltipEl.innerHTML = `
      <div class="tt-title">${title}</div>
      <div class="tt-sub"><span style="color: var(--accent-cyan); font-weight: 600;">${typeStr}</span> • ${sizeStr}</div>
      <div style="font-size: 10px; color: #94a3b8; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
        Ext: <b style="color: #ffffff;">${extStr}</b> • Modificado: <b>${dateStr}</b>
      </div>
    `;
  }

  setViewMode(level) {
    this.currentLevel = level;
    if (level === 'welcome') {
      if (this.colorLegendEl) this.colorLegendEl.style.display = 'none';
      if (this.btnNavUp) this.btnNavUp.style.display = 'none';
    } else if (level === 'mypc') {
      if (this.colorLegendEl) this.colorLegendEl.style.display = 'none';
      if (this.btnNavUp) this.btnNavUp.style.display = this.currentViewMode === 'city' ? 'flex' : 'none';
    } else { // 'city'
      if (this.colorLegendEl) this.colorLegendEl.style.display = this.currentViewMode === 'city' ? 'block' : 'none';
      if (this.btnNavUp) this.btnNavUp.style.display = this.currentViewMode === 'city' ? 'flex' : 'none';
    }
  }

  setInterfaceMode(mode) {
    this.currentViewMode = mode;

    if (this.btnSettingStyleCity) this.btnSettingStyleCity.classList.toggle('active', mode === 'city');
    if (this.btnSettingStylePlex) this.btnSettingStylePlex.classList.toggle('active', mode === 'plex');
    if (this.btnSettingStyleNeural) this.btnSettingStyleNeural.classList.toggle('active', mode === 'neural');

    // Manage floating nav-up button visibility
    if (this.btnNavUp) {
      if (mode === 'city' && this.currentLevel !== 'welcome') {
        this.btnNavUp.style.display = 'flex';
      } else {
        this.btnNavUp.style.display = 'none';
      }
    }

    if (window.galleryMuseum && window.galleryMuseum.galleryGroup) {
      window.galleryMuseum.galleryGroup.visible = false;
    }

    if (mode === 'city') {
      if (this.colorLegendEl && this.currentLevel === 'city') {
        this.colorLegendEl.style.display = 'block';
      } else if (this.colorLegendEl) {
        this.colorLegendEl.style.display = 'none';
      }

      if (window.cityGrid && this.lastPayload) {
        window.cityGrid.cityGroup.visible = true;
        if (window.plexGraph) window.plexGraph.graphGroup.visible = false;
        if (window.neuralNetwork) window.neuralNetwork.neuralGroup.visible = false;
        if (this.lastPayload.viewMode === 'welcome') {
          window.cityGrid.buildWelcomeView(this.lastPayload);
        } else if (this.lastPayload.viewMode === 'mypc') {
          window.cityGrid.buildMyPcHub(this.lastPayload);
        } else {
          window.cityGrid.buildCityGrid(this.lastPayload);
        }
        const showLabels = this.settingShowLabels ? this.settingShowLabels.checked : true;
        window.cityGrid.setLabelsVisible(showLabels);
      }
    } else if (mode === 'plex') {
      if (this.colorLegendEl) this.colorLegendEl.style.display = 'none';
      if (window.plexGraph && this.lastPayload) {
        if (window.cityGrid) window.cityGrid.cityGroup.visible = false;
        if (window.neuralNetwork) window.neuralNetwork.neuralGroup.visible = false;
        window.plexGraph.graphGroup.visible = true;
        window.plexGraph.loadData(this.lastPayload);
        const showLabels = this.settingShowLabels ? this.settingShowLabels.checked : true;
        window.plexGraph.setLabelsVisible(showLabels);
      }
    } else if (mode === 'neural') {
      if (this.colorLegendEl) this.colorLegendEl.style.display = 'none';
      if (window.neuralNetwork && this.lastPayload) {
        if (window.cityGrid) window.cityGrid.cityGroup.visible = false;
        if (window.plexGraph) window.plexGraph.graphGroup.visible = false;
        window.neuralNetwork.neuralGroup.visible = true;
        window.neuralNetwork.loadData(this.lastPayload);
        const showLabels = this.settingShowLabels ? this.settingShowLabels.checked : true;
        window.neuralNetwork.setLabelsVisible(showLabels);
      }
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('axplorer_settings');
      if (saved) {
        const s = JSON.parse(saved);

        if (s.viewMode && (s.viewMode === 'city' || s.viewMode === 'plex' || s.viewMode === 'neural')) {
          this.setInterfaceMode(s.viewMode);
        }

        if (s.showRings !== undefined && this.settingShowRings) {
          this.settingShowRings.checked = s.showRings;
          if (window.plexGraph) window.plexGraph.setRingsVisible(s.showRings);
        }
        if (s.showOrbitTracks !== undefined && this.settingShowOrbitTracks) {
          this.settingShowOrbitTracks.checked = s.showOrbitTracks;
          if (window.plexGraph) window.plexGraph.setOrbitTracksVisible(s.showOrbitTracks);
        }
        if (s.showLabels !== undefined && this.settingShowLabels) {
          this.settingShowLabels.checked = s.showLabels;
          if (window.plexGraph) window.plexGraph.setLabelsVisible(s.showLabels);
          if (window.cityGrid) window.cityGrid.setLabelsVisible(s.showLabels);
          if (window.neuralNetwork) window.neuralNetwork.setLabelsVisible(s.showLabels);
        }
        if (s.glow !== undefined && this.settingGlowRange) {
          this.settingGlowRange.value = s.glow;
          if (this.settingGlowVal) this.settingGlowVal.textContent = `${s.glow}%`;
          if (window.engine3d) window.engine3d.setBloomIntensity(s.glow);
        }
        if (s.showParticles !== undefined && this.settingShowParticles) {
          this.settingShowParticles.checked = s.showParticles;
          if (window.engine3d) window.engine3d.setStarfieldVisible(s.showParticles);
        }

        // Mutual exclusion of pulses
        let dataPulses = s.showDataPulses !== undefined ? s.showDataPulses : true;
        let syncPulses = s.showSyncPulses !== undefined ? s.showSyncPulses : false;
        if (dataPulses && syncPulses) {
          syncPulses = false;
        }

        if (this.settingShowDataPulses) {
          this.settingShowDataPulses.checked = dataPulses;
          if (window.plexGraph) window.plexGraph.setDataPulsesVisible(dataPulses);
        }
        if (this.settingShowSyncPulses) {
          this.settingShowSyncPulses.checked = syncPulses;
          if (window.plexGraph) window.plexGraph.setSyncPulsesVisible(syncPulses);
        }
        if (s.pulseSpeed !== undefined && this.settingSpeedRange) {
          this.settingSpeedRange.value = s.pulseSpeed;
          const factor = s.pulseSpeed / 100;
          if (this.settingSpeedVal) this.settingSpeedVal.textContent = `${factor.toFixed(1)}x`;
          if (window.plexGraph) window.plexGraph.setPulseSpeed(factor);
          if (window.cityGrid) window.cityGrid.setTrafficSpeed(factor);
          if (window.neuralNetwork) window.neuralNetwork.pulseSpeedFactor = factor;
        }
        if (s.showTraffic !== undefined && this.settingShowTraffic) {
          this.settingShowTraffic.checked = s.showTraffic;
          if (window.cityGrid) window.cityGrid.setTrafficVisible(s.showTraffic);
        }
        if (s.galleryWASD !== undefined && this.settingGalleryWASD) {
          this.settingGalleryWASD.checked = s.galleryWASD;
          if (window.galleryMuseum) window.galleryMuseum.setAllowWASD(s.galleryWASD);
        }
      }
    } catch (e) {
      console.warn("No se pudieron cargar los ajustes:", e);
    }
  }

  saveSettings() {
    try {
      const s = {
        viewMode: this.currentViewMode,
        showRings: this.settingShowRings ? this.settingShowRings.checked : true,
        showOrbitTracks: this.settingShowOrbitTracks ? this.settingShowOrbitTracks.checked : true,
        showLabels: this.settingShowLabels ? this.settingShowLabels.checked : true,
        glow: this.settingGlowRange ? parseInt(this.settingGlowRange.value, 10) : 40,
        showParticles: this.settingShowParticles ? this.settingShowParticles.checked : true,
        showDataPulses: this.settingShowDataPulses ? this.settingShowDataPulses.checked : true,
        showSyncPulses: this.settingShowSyncPulses ? this.settingShowSyncPulses.checked : false,
        pulseSpeed: this.settingSpeedRange ? parseInt(this.settingSpeedRange.value, 10) : 100,
        showTraffic: this.settingShowTraffic ? this.settingShowTraffic.checked : true,
        galleryWASD: this.settingGalleryWASD ? this.settingGalleryWASD.checked : false
      };
      localStorage.setItem('axplorer_settings', JSON.stringify(s));
    } catch (e) {
      console.warn("No se pudieron guardar los ajustes:", e);
    }
  }

  showToast(message, duration = 2800) {
    if (!this.toastEl) {
      this.toastEl = document.getElementById('hud-toast');
    }
    if (!this.toastEl) return;

    this.toastEl.textContent = message;
    this.toastEl.style.display = 'block';
    void this.toastEl.offsetWidth;
    this.toastEl.style.opacity = '1';

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.style.opacity = '0';
      setTimeout(() => {
        this.toastEl.style.display = 'none';
      }, 260);
    }, duration);
  }

  setClipboardStatus(hasFiles) {
    this.clipboardHasFiles = !!hasFiles;
    if (this.contextMenuEl && this.contextMenuEl.style.display !== 'none' && this.ctxActionPasteFile) {
      if (this.contextMode === 'multi') {
        this.ctxActionPasteFile.style.display = 'none';
      } else if (this.contextMode === 'single') {
        const node = this.activeContextNode;
        const isDir = node && (node.isDirectory || node.isDrive || node.isLibrary || node.itemType === 'system');
        this.ctxActionPasteFile.style.display = (this.clipboardHasFiles && isDir) ? 'flex' : 'none';
      } else if (this.contextMode === 'empty_folder') {
        this.ctxActionPasteFile.style.display = this.clipboardHasFiles ? 'flex' : 'none';
      } else {
        this.ctxActionPasteFile.style.display = 'none';
      }
    }
  }

  renderExternalTools(path, tools) {
    if (!this.contextMenuEl || this.contextMenuEl.style.display === 'none') return;
    if (!this.ctxExternalToolsList) return;

    const activePath = (this.activeContextNode && this.activeContextNode.fullPath) ||
                      (this.lastPayload && this.lastPayload.currentNode && this.lastPayload.currentNode.fullPath);
    if (activePath !== path) return;

    this.ctxExternalToolsList.innerHTML = '';
    if (!tools || tools.length === 0) {
      if (this.ctxDivTools) this.ctxDivTools.style.display = 'none';
      return;
    }

    if (this.ctxDivTools) this.ctxDivTools.style.display = 'block';

    for (const tool of tools) {
      const el = document.createElement('div');
      el.className = 'ctx-item';
      el.dataset.action = 'ext_tool';
      el.dataset.toolId = tool.id;
      el.dataset.targetPath = path;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'ctx-item-icon';
      iconSpan.textContent = tool.icon || '⚡';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'ctx-item-label';
      labelSpan.textContent = tool.label;

      el.appendChild(iconSpan);
      el.appendChild(labelSpan);

      if (tool.id === 'native_shell_menu') {
        const sc = document.createElement('span');
        sc.className = 'ctx-item-shortcut';
        sc.textContent = 'Shift+F10';
        el.appendChild(sc);
      }

      this.ctxExternalToolsList.appendChild(el);
    }
  }

  updatePasteProgress(data) {
    if (!this.pasteProgressCard) {
      this.pasteProgressCard = document.getElementById('paste-progress-card');
    }
    if (!this.pasteProgressCard) return;

    if (this.pasteProgressCard.style.display === 'none') {
      this.pasteProgressCard.style.display = 'block';
      void this.pasteProgressCard.offsetWidth;
      this.pasteProgressCard.classList.add('visible');
    }

    if (data.status === 'calculating') {
      if (this.pasteTitleText) this.pasteTitleText.textContent = "Preparando copia...";
      if (this.pasteCurrentFile) this.pasteCurrentFile.textContent = data.message || "Analizando elementos...";
      if (this.pasteMeterFill) this.pasteMeterFill.style.width = "0%";
      if (this.pasteItemsCount) this.pasteItemsCount.textContent = "Calculando...";
      if (this.pasteSizeStats) this.pasteSizeStats.textContent = "--";
      if (this.pasteSpeedStat) this.pasteSpeedStat.textContent = "--";
      if (this.pastePercentStat) this.pastePercentStat.textContent = "0%";
      return;
    }

    if (data.status === 'cancelled') {
      if (this.pasteTitleText) this.pasteTitleText.textContent = "Cancelado";
      if (this.pasteCurrentFile) this.pasteCurrentFile.textContent = data.message || "Operación cancelada";
      if (this.pasteSpeedStat) this.pasteSpeedStat.textContent = "0 B/s";
      this.hidePasteProgress(1200);
      return;
    }

    if (data.status === 'completed') {
      if (this.pasteTitleText) this.pasteTitleText.textContent = "Completado";
      if (this.pasteCurrentFile) this.pasteCurrentFile.textContent = data.message || "Transferencia finalizada";
      if (this.pasteMeterFill) this.pasteMeterFill.style.width = "100%";
      if (this.pastePercentStat) this.pastePercentStat.textContent = "100%";
      if (this.pasteSpeedStat) this.pasteSpeedStat.textContent = "0 B/s";
      this.hidePasteProgress(1400);
      return;
    }

    if (data.status === 'error') {
      if (this.pasteTitleText) this.pasteTitleText.textContent = "Error";
      if (this.pasteCurrentFile) this.pasteCurrentFile.textContent = data.message || "Error al transferir";
      this.hidePasteProgress(2000);
      return;
    }

    if (this.pasteTitleText) this.pasteTitleText.textContent = "Copiando elementos...";
    if (this.pasteCurrentFile) {
      this.pasteCurrentFile.textContent = data.currentFileName || data.message || "...";
      this.pasteCurrentFile.title = data.currentFileName || "";
    }

    const percent = Math.min(100, Math.max(0, data.percent || 0));
    if (this.pasteMeterFill) {
      this.pasteMeterFill.style.width = `${percent}%`;
    }

    if (this.pasteItemsCount) {
      this.pasteItemsCount.textContent = `${data.filesCopied || 0} / ${data.totalFiles || 0} archivos`;
    }

    if (this.pasteSizeStats) {
      const copiedFormatted = this.formatBytes(data.bytesCopied || 0);
      const totalFormatted = this.formatBytes(data.totalBytes || 0);
      this.pasteSizeStats.textContent = `${copiedFormatted} / ${totalFormatted}`;
    }

    if (this.pasteSpeedStat) {
      this.pasteSpeedStat.textContent = data.formattedSpeed || "0 B/s";
    }

    if (this.pastePercentStat) {
      this.pastePercentStat.textContent = `${Math.round(percent)}%`;
    }
  }

  hidePasteProgress(delay = 600) {
    if (!this.pasteProgressCard) return;
    if (this._pasteHideTimer) clearTimeout(this._pasteHideTimer);
    this._pasteHideTimer = setTimeout(() => {
      this.pasteProgressCard.classList.remove('visible');
      setTimeout(() => {
        this.pasteProgressCard.style.display = 'none';
        if (this.pasteMeterFill) this.pasteMeterFill.style.width = '0%';
      }, 260);
    }, delay);
  }

  formatBytes(bytes) {
    if (bytes == null || isNaN(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${val} ${units[i] || 'TB'}`;
  }

  /* =========================================================================
   * MULTI-SELECTION AND BATCH OPERATIONS
   * ========================================================================= */
  handleNodeClick(nodeData, event, targetMesh) {
    if (!nodeData) return;

    const isMultiKey = event && (event.ctrlKey || event.shiftKey);

    if (isMultiKey) {
      if (event.preventDefault) event.preventDefault();
      const existingIdx = this.selectedNodes.findIndex(n => n.data && n.data.fullPath === nodeData.fullPath);
      if (existingIdx >= 0) {
        // Unselect this item
        const removed = this.selectedNodes.splice(existingIdx, 1)[0];
        if (removed.mesh && window.engine3d) {
          window.engine3d.setNodeSelected(removed.mesh, false);
        }
      } else {
        // Add to selection
        this.selectedNodes.push({ data: nodeData, mesh: targetMesh });
        if (targetMesh && window.engine3d) {
          window.engine3d.setNodeSelected(targetMesh, true);
        }
      }
      if (this.selectedNodes.length > 0) {
        const last = this.selectedNodes[this.selectedNodes.length - 1];
        this.updateInspector(last.data);
      }
    } else {
      // Single selection: clear previous selection halos
      this.clearSelection(false);
      if (window.engine3d) {
        window.engine3d.clearAllSelectionHalos();
      }
      this.selectedNodes = [{ data: nodeData, mesh: targetMesh }];
      if (targetMesh && window.engine3d) {
        window.engine3d.setNodeSelected(targetMesh, true);
      }
      this.updateInspector(nodeData);
    }

    this.updateMultiSelectionUI();
  }

  handleBackgroundClick(event) {
    const isMultiKey = event && (event.ctrlKey || event.shiftKey);
    if (!isMultiKey) {
      this.clearSelection();
    }
    this.hideContextMenu();
  }

  executeBatchAction(action) {
    if (!this.selectedNodes || this.selectedNodes.length === 0) return;
    const paths = this.selectedNodes
      .map(n => n.data && n.data.fullPath)
      .filter(p => p && p !== 'welcome' && p !== 'root');

    if (paths.length === 0) return;

    switch (action) {
      case 'copy':
        this.bridge.sendMessage('copy_multiple_clipboard', paths);
        this.showToast(`${paths.length} elementos copiados al portapapeles`);
        break;
      case 'cut':
        this.bridge.sendMessage('cut_multiple_clipboard', paths);
        this.showToast(`${paths.length} elementos cortados al portapapeles`);
        break;
      case 'zip':
      case 'compress':
        this.bridge.sendMessage('compress_items', paths);
        this.showToast(`Comprimiendo ${paths.length} elementos...`);
        break;
      case 'print':
        this.bridge.sendMessage('print_items', paths);
        this.showToast(`Enviando ${paths.length} documentos a la impresora...`);
        break;
    }

    // Once executed, clear selection and hide floating card as requested
    this.clearSelection();
  }

  clearSelection(clearHalos = true) {
    if (clearHalos && window.engine3d) {
      window.engine3d.clearAllSelectionHalos();
    }
    this.selectedNodes = [];
    this.updateMultiSelectionUI();
  }

  updateMultiSelectionUI() {
    if (!this.multiSelectionCard) return;

    const count = this.selectedNodes.length;
    if (count > 1) {
      if (this.multiSelectionBadge) {
        this.multiSelectionBadge.textContent = count;
      }
      if (this.multiSelectionList) {
        this.multiSelectionList.innerHTML = '';
        const iconMap = {
          folder: '📁', document: '📄', image: '🖼️', audio: '🎵', video: '🎬',
          code: '💻', archive: '📦', executable: '⚙️', drive: '💽', network: '🌐'
        };

        this.selectedNodes.forEach((item, index) => {
          const row = document.createElement('div');
          row.className = 'multi-item-row';
          const icon = iconMap[item.data.itemType] || (item.data.isDirectory ? '📁' : '📄');
          const name = item.data.name || 'Elemento';

          row.innerHTML = `
            <div class="multi-item-info" title="${item.data.fullPath || name}">
              <span class="multi-item-icon">${icon}</span>
              <span class="multi-item-name">${name}</span>
            </div>
            <button class="multi-remove-btn" title="Quitar de selección">✕</button>
          `;

          const removeBtn = row.querySelector('.multi-remove-btn');
          if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (item.mesh && window.engine3d) {
                window.engine3d.setNodeSelected(item.mesh, false);
              }
              this.selectedNodes.splice(index, 1);
              this.updateMultiSelectionUI();
            });
          }

          this.multiSelectionList.appendChild(row);
        });
      }

      this.multiSelectionCard.style.display = 'block';
      requestAnimationFrame(() => {
        this.multiSelectionCard.classList.add('visible');
      });
    } else {
      this.multiSelectionCard.classList.remove('visible');
      this.multiSelectionCard.style.display = 'none';
    }
  }
}

// main.js - Application Entrypoint & Bridge Orchestration

class AppBridge {
  constructor() {
    this.onMessageHandlers = [];
    this.setupListener();
  }

  setupListener() {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.addEventListener('message', (event) => {
        let msg = event.data;
        if (typeof msg === 'string') {
          try { msg = JSON.parse(msg); } catch (e) {}
        }
        this.dispatchMessage(msg);
      });
    } else {
      setTimeout(() => this.setupListener(), 100);
    }
  }

  sendMessage(action, payload = null, windowHandle = null, extra = null) {
    const msg = {
      action: action,
      payload: payload,
      windowHandle: windowHandle,
      ...(extra || {})
    };

    if (window.chrome && window.chrome.webview) {
      try {
        window.chrome.webview.postMessage(JSON.stringify(msg));
      } catch (err) {
        console.error("Error sending postMessage:", err);
      }
    } else {
      console.log("Mock IPC Send:", msg);
      if (action === 'init' || action === 'navigate') {
        this.mockSystemResponse(payload);
      }
    }
  }

  onMessage(callback) {
    this.onMessageHandlers.push(callback);
  }

  dispatchMessage(msg) {
    this.onMessageHandlers.forEach(handler => handler(msg));
  }

  mockSystemResponse(targetPath) {
    // Demo mock data for previewing outside WebView2
    setTimeout(() => {
      const isWelcome = !targetPath || targetPath === 'welcome';
      const isMyPc = targetPath === 'root' || targetPath === 'mypc';

      if (isWelcome) {
        this.dispatchMessage({
          type: 'plex_update',
          data: {
            viewMode: 'welcome',
            currentNode: { name: "Mi PC", itemType: "system", fullPath: "welcome" },
            breadcrumbs: [{ name: "Mi PC", path: "welcome" }],
            children: []
          }
        });
        return;
      }

      if (isMyPc) {
        this.dispatchMessage({
          type: 'plex_update',
          data: {
            viewMode: 'mypc',
            currentNode: { name: "Mi PC", itemType: "system", fullPath: "root" },
            breadcrumbs: [{ name: "Mi PC", path: "root" }],
            children: [
              { name: "Disco Local (C:)", itemType: "drive", isDrive: true, fullPath: "C:\\", freeSpace: "140 GB", totalSpace: "512 GB", percentUsed: 72 },
              { name: "Almacenamiento (D:)", itemType: "drive", isDrive: true, fullPath: "D:\\", freeSpace: "650 GB", totalSpace: "1 TB", percentUsed: 35 },
              { name: "Documentos", itemType: "document", isDirectory: true, fullPath: "C:\\Users\\Documents" },
              { name: "Descargas", itemType: "folder", isDirectory: true, fullPath: "C:\\Users\\Downloads" },
              { name: "Imágenes", itemType: "image", isDirectory: true, fullPath: "C:\\Users\\Pictures" },
              { name: "Música", itemType: "audio", isDirectory: true, fullPath: "C:\\Users\\Music" },
              { name: "Vídeos", itemType: "video", isDirectory: true, fullPath: "C:\\Users\\Videos" }
            ],
            drives: [
              { name: "Disco Local (C:)", fullPath: "C:\\", freeSpace: "140 GB" },
              { name: "Almacenamiento (D:)", fullPath: "D:\\", freeSpace: "650 GB" }
            ],
            quickAccess: [
              { name: "Documentos", fullPath: "C:\\Users\\Documents" },
              { name: "Descargas", fullPath: "C:\\Users\\Downloads" }
            ]
          }
        });
        return;
      }

      // City mode for directory
      this.dispatchMessage({
        type: 'plex_update',
        data: {
          viewMode: 'city',
          currentNode: { name: targetPath || "Disco Local (C:)", itemType: "drive", fullPath: targetPath || "C:\\", isDirectory: true },
          breadcrumbs: [
            { name: "Mi PC", path: "root" },
            { name: targetPath || "C:\\", path: targetPath || "C:\\" }
          ],
          children: [
            { name: "Windows", itemType: "folder", isDirectory: true, fullPath: "C:\\Windows", childCount: 140 },
            { name: "Archivos de Programa", itemType: "folder", isDirectory: true, fullPath: "C:\\Program Files", childCount: 85 },
            { name: "Usuarios", itemType: "folder", isDirectory: true, fullPath: "C:\\Users", childCount: 12 },
            { name: "Proyectos", itemType: "folder", isDirectory: true, fullPath: "C:\\Proyectos", childCount: 24 },
            { name: "kernel32.dll", itemType: "executable", isDirectory: false, sizeBytes: 1540000, formattedSize: "1.5 MB", extension: ".dll", modifiedDate: new Date() },
            { name: "main.cs", itemType: "code", isDirectory: false, sizeBytes: 14200, formattedSize: "14 KB", extension: ".cs", modifiedDate: new Date() },
            { name: "index.html", itemType: "code", isDirectory: false, sizeBytes: 8200, formattedSize: "8.2 KB", extension: ".html", modifiedDate: new Date() },
            { name: "wallpaper.png", itemType: "image", isDirectory: false, sizeBytes: 4200000, formattedSize: "4.2 MB", extension: ".png", modifiedDate: new Date() },
            { name: "reporte.docx", itemType: "document", isDirectory: false, sizeBytes: 520000, formattedSize: "520 KB", extension: ".docx", modifiedDate: new Date() },
            { name: "banda_sonora.mp3", itemType: "audio", isDirectory: false, sizeBytes: 8500000, formattedSize: "8.5 MB", extension: ".mp3", modifiedDate: new Date() },
            { name: "trailer.mp4", itemType: "video", isDirectory: false, sizeBytes: 48000000, formattedSize: "48 MB", extension: ".mp4", modifiedDate: new Date() },
            { name: "setup.exe", itemType: "executable", isDirectory: false, sizeBytes: 12000000, formattedSize: "12 MB", extension: ".exe", modifiedDate: new Date() },
            { name: "backup.zip", itemType: "archive", isDirectory: false, sizeBytes: 32000000, formattedSize: "32 MB", extension: ".zip", modifiedDate: new Date() },
            { name: "datos.bin", itemType: "unknown", isDirectory: false, sizeBytes: 2500, formattedSize: "2.5 KB", extension: ".bin", modifiedDate: new Date() }
          ]
        }
      });
    }, 150);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  const bridge = new AppBridge();
  const engine = new Engine3D('canvas-container');
  const graph = new PlexGraph(engine);
  const city = new CityGrid(engine, bridge);
  const neural = new NeuralNetwork(engine, bridge);

  window.appBridge = bridge;
  window.engine3d = engine;
  window.plexGraph = graph;
  window.cityGrid = city;
  window.neuralNetwork = neural;

  const hud = new HudOverlay(bridge);
  window.hudOverlay = hud;

  // Restore all persisted settings now that all visual modules exist
  hud.loadSettings();

  // Interactions between 3D and HUD
  engine.onNodeHover = (nodeData, event) => {
    hud.showTooltip(nodeData, event);
  };

  engine.onNodeClick = (nodeData) => {
    if (nodeData && nodeData.isAscendPortal) {
      if (hud.currentViewMode === 'neural' && window.neuralNetwork) {
        window.neuralNetwork.animateAscend(() => {
          bridge.sendMessage('navigate_parent');
        });
        return;
      }
    }
    hud.updateInspector(nodeData);
  };

  engine.onNodeContextMenu = (nodeData, event) => {
    hud.showContextMenu(nodeData, event.clientX, event.clientY);
  };

  // Intercept native browser right click globally to avoid browser context menu
  window.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();

    // If right clicked on empty HUD background or periphery (not canvas and not context menu itself)
    if (e.target.tagName !== 'CANVAS' && !e.target.closest('#win-context-menu')) {
      if (e.target.closest('.crumb-item') || e.target.closest('.sidebar-item')) {
        return; // Handled by item-specific contextmenu listener
      }
      hud.showContextMenu(null, e.clientX, e.clientY);
    }
  });

  engine.onNodeDoubleClick = (nodeData, nodeMesh) => {
    if (!nodeData) return;

    if (nodeData.isAscendPortal) {
      if (hud.currentViewMode === 'neural' && window.neuralNetwork) {
        window.neuralNetwork.animateAscend(() => {
          bridge.sendMessage('navigate_parent');
        });
        return;
      }
    }

    if (nodeData.isDirectory || nodeData.isDrive || nodeData.itemType === 'system') {
      if (nodeData.fullPath === "welcome") {
        if (hud.currentViewMode === 'city' && city.welcomeBoxObj && city.welcomeBoxObj.group) {
          city.executeWelcomeBoxOpen(city.welcomeBoxObj.group);
        } else {
          bridge.sendMessage('navigate', 'root');
        }
      } else if (nodeData.fullPath === "root") {
        bridge.sendMessage('navigate', 'root');
      } else {
        // Spatial continuity transitions
        if (hud.currentViewMode === 'city') {
          city.animateDescendIntoFolder(nodeData, nodeMesh, () => {
            bridge.sendMessage('navigate', nodeData.fullPath);
          });
        } else if (hud.currentViewMode === 'plex') {
          graph.animateDiveIn(nodeMesh, () => {
            bridge.sendMessage('navigate', nodeData.fullPath);
          });
        } else if (hud.currentViewMode === 'neural') {
          neural.animateWarpDive(nodeMesh, nodeData, () => {
            bridge.sendMessage('navigate', nodeData.fullPath);
          });
        } else {
          bridge.sendMessage('navigate', nodeData.fullPath);
        }
      }
    } else if (nodeData.itemType === 'window') {
      bridge.sendMessage('focus_window', null, nodeData.windowHandle);
    } else {
      // Execute / open file safely (read-only execution)
      bridge.sendMessage('open', nodeData.fullPath);
    }
  };

  let initialDataLoaded = false;

  // Process incoming messages from C# backend
  bridge.onMessage((msg) => {
    if (msg.type === 'plex_update') {
      initialDataLoaded = true;
      const data = msg.data;
      hud.updateGraph(data);

      if (hud.currentViewMode === 'plex') {
        city.cityGroup.visible = false;
        if (neural) neural.neuralGroup.visible = false;
        graph.graphGroup.visible = true;
        graph.loadData(data);
      } else if (hud.currentViewMode === 'neural') {
        city.cityGroup.visible = false;
        graph.graphGroup.visible = false;
        neural.neuralGroup.visible = true;
        neural.loadData(data);
      } else {
        graph.graphGroup.visible = false;
        if (neural) neural.neuralGroup.visible = false;
        city.cityGroup.visible = true;

        if (data.viewMode === 'welcome') {
          city.buildWelcomeView(data);
        } else if (data.viewMode === 'mypc') {
          city.buildMyPcHub(data);
        } else {
          city.buildCityGrid(data);
        }
      }
    } else if (msg.type === 'about_info') {
      hud.updateAboutModal(msg.data);
    } else if (msg.type === 'windows_update') {
      hud.renderWindows(msg.data);
    } else if (msg.type === 'clipboard_status') {
      if (hud && hud.setClipboardStatus) {
        hud.setClipboardStatus(msg.hasFiles);
      }
    } else if (msg.type === 'external_tools') {
      if (hud && hud.renderExternalTools) {
        hud.renderExternalTools(msg.path, msg.tools);
      }
    } else if (msg.type === 'notification') {
      console.log("[aXplorer System]", msg.message);
      if (hud && hud.showToast) {
        hud.showToast(msg.message);
      }
    }
  });

  // Request initial state from C#
  bridge.sendMessage('init');

  // Fallback retry
  setTimeout(() => {
    if (!initialDataLoaded) {
      bridge.sendMessage('init');
    }
  }, 1000);
});

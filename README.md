# 🌌 Axplorer SNX — Spatial Neural Plex

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078d4.svg?logo=windows)](https://microsoft.com/windows)
[![.NET](https://img.shields.io/badge/.NET-10.0%20WPF-512bd4.svg?logo=dotnet)](https://dotnet.microsoft.com/)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20(WebGL)-000000.svg?logo=three.js)](https://threejs.org/)
[![WebView2](https://img.shields.io/badge/Bridge-Microsoft%20WebView2-008272.svg?logo=microsoftedge)](https://developer.microsoft.com/microsoft-edge/webview2/)
[![Version](https://img.shields.io/badge/Version-v0.2.5%20SNX-00f0ff.svg)](https://github.com/)

**Axplorer SNX** es un explorador y gestor de archivos espacial en 3D para Windows. Transforma la interacción tradicional de árboles de carpetas y listas planas en un ecosistema espacial vivo, continuo e interactivo impulsado por **.NET 10 WPF**, **WebView2** y **Three.js WebGL**.

---

## 🔮 Modos de Exploración Espacial 3D

Axplorer SNX permite conmutar en tiempo real entre tres modos visuales complementarios desde el menú de Configuración (`⚙️`):

### 1. 🏙️ Modo Ciudad 3D (*City-Grid*)
- **Arquitectura Urbana Procedimental:** Cada carpeta es un distrito o manzana urbana y cada archivo un edificio tridimensional con altura proporcional a su tamaño en disco.
- **Tráfico Vehicular de Luz:** Paquetes luminosos aleatorios viajan en línea recta a lo largo de las calles de la cuadrícula simulando el flujo de tráfico de una metrópolis cibernética.
- **Caja de Bienvenida e Hub de Almacenamiento:** Despliegue tridimensional de unidades de almacenamiento (`C:\`, `D:\`) con medidores volumétricos de espacio libre y accesos directos rápidos.

### 2. 🌐 Modo Constelación (*Spatial Plex*)
- **Ecosistema Orbital Planetario:** El elemento central actúa como sol/núcleo y los contenidos orbitan en anillos concéntricos según su jerarquía (carpetas en órbitas internas, archivos en anillos exteriores).
- **Física de Partículas y Ondas Sincronizadas:** Ondas concéntricas expansivas y paquetes de datos en tránsito continuo entre los nodos del grafo.

### 3. 🧠 Modo Red Neuronal (*Neural Network*)
- **Regiones Neuronales y Nebulosas:** El directorio raíz y las subcarpetas se representan como núcleos somáticos rodeados por enjambres volumétricos de partículas bioluminiscentes ("nebulosas").
- **Archivos como Neuronas:** Nodos celulares con anillos dendríticos receptores clasificados por código cromático.
- **Sinapsis Orgánicas Curvas:** Conexiones sinápticas en 3D (`CatmullRomCurve3`) con flujo constante de neurotransmisores flotantes.
- **Disparos Eléctricos en Nodos Recientes:** Detección de archivos recientemente modificados que emiten periódicamente potenciales de acción eléctricos (picos de resplandor y ondas de choque).
- **Pulsos Concéntricos Sutiles:** Ondas cerebrales rítmicas difuminadas que recorren la red con una transparencia del 8% para no interferir con la visibilidad.
- **Transición con Efecto "Warp":** Al hacer doble clic en una nebulosa, la cámara acelera cinemáticamente con distorsión de campo visual (de 55° a 84°) y estelas de velocidad luz.
- **Tubo Conector de Retorno (Wormhole Conduit):** Tubo de 10 trazos semitransparentes en espiral que nace en el núcleo y se difumina hacia el exterior, con un portal interactivo para ascender a la carpeta superior al hacer clic.

---

## 🎨 Código Cromático de Elementos

| Tipo | Color | Representación |
| :--- | :--- | :--- |
| **Carpetas / Regiones** | `#bd00ff` / `#ffb700` | Violeta neón / Ámbar dorado |
| **Unidades de Disco** | `#38bdf8` | Azul cielo cibernético |
| **Código y Scripts** | `#00ffaa` / `#00ff9d` | Verde menta / Esmeralda |
| **Documentos** | `#60a5fa` | Azul eléctrico |
| **Imágenes y Arte** | `#d946ef` | Fucsia / Violeta neón |
| **Vídeos** | `#a855f7` | Púrpura cósmico |
| **Audio** | `#f43f5e` | Rosa coral |
| **Comprimidos (Zip/Rar)** | `#f59e0b` | Ámbar / Naranja |
| **Ejecutables (.exe/.dll)**| `#ff0055` | Carmesí intenso |
| **Otros / Binarios** | `#94a3b8` | Gris pizarra |

---

## ⚡ Características Principales

- **Menú Contextual Nativo Windows 11:** Clic secundario en cualquier elemento 3D o en el espacio para desplegar opciones completas: *Abrir, Mostrar en el Explorador, Abrir en Terminal / PowerShell, Copiar elemento, Copiar ruta, Copiar nombre, Propiedades*.
- **HUD Translúcido con Cristal Acrílico:**
  - Barra de migas de pan holográficas seleccionables.
  - Paneles colapsables de unidades de disco, accesos rápidos y ventanas activas del sistema.
  - Widget de control de cámara 3D (restablecer vista y vista 2.5D cenital).
  - Buscador / filtro en tiempo real para localizar nodos al instante.
- **Ventana Nativa WPF "Acerca De":** Diálogo desacoplado en XAML con identidad corporativa, logotipo personalizado, tipografía estilizada y ficha técnica editable externamente desde `AboutInfo.cs`.
- **Continuidad Cinemática Espacial:** Movimientos fluidos de cámara entre jerarquías sin recargas bruscas.

---

## 🛠️ Tecnologías y Arquitectura

- **Plataforma:** C# 14 • .NET 10 WPF (`net10.0-windows`).
- **Contenedor Web:** Microsoft.Web.WebView2 (`Chromium`).
- **Renderizado 3D:** Three.js (WebGL), `OrbitControls`, `EffectComposer`, `UnrealBloomPass` (post-procesado neón).
- **Integración con el SO:** Win32 API para gestión de ventanas y escaneo asíncrono del sistema de archivos.

---

## 🚀 Requisitos e Instalación

### Requisitos Previos
1. Windows 10 (versión 1809+) o Windows 11.
2. [.NET 10.0 SDK](https://dotnet.microsoft.com/download) instalado.
3. [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (incluido de serie en Windows 11).

### Compilación y Ejecución

1. Clona este repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/Axplorer-SNX.git
   cd Axplorer-SNX
   ```

2. Compila el proyecto con el SDK de .NET:
   ```bash
   dotnet build
   ```

3. Ejecuta la aplicación:
   ```bash
   dotnet run
   ```
   *(o ejecuta directamente el binario generado en `bin/Debug/net10.0-windows/aXplorer.exe`)*.

---

## ⌨️ Atajos de Teclado y Controles

- **Clic Izquierdo:** Seleccionar elemento e inspeccionar detalles.
- **Doble Clic:** Abrir archivo o sumergirse en la carpeta/nebulosa.
- **Clic Secundario (o botón derecho):** Abrir Menú Contextual de Windows.
- **Arrastrar Clic Izquierdo:** Rotar libremente el visor 3D.
- **Rueda del Ratón:** Zoom hacia adelante / atrás.
- **Botón `⬆️ Subir Nivel` / `Backspace` / `Alt + Flecha Arriba`:** Ascender a la carpeta superior.
- **`Esc`:** Cerrar menús contextuales o ventanas modales.

---

## 👨‍💻 Autor y Créditos

- **Desarrollador:** David Rojas `[Axio.UK]`
- **Arquitectura:** *Spatial Neural Plex (SNX Architecture)*
- **Año:** 2026 • Todos los derechos reservados.

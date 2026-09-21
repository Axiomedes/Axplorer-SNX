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
<img width="480" height="282" alt="image" src="https://github.com/user-attachments/assets/90aeeb15-d05a-40b0-9a94-087eda40322d" />

---
### 2. 🌐 Modo Constelación (*Spatial Plex*)
- **Ecosistema Orbital Planetario:** El elemento central actúa como sol/núcleo y los contenidos orbitan en anillos concéntricos según su jerarquía (carpetas en órbitas internas, archivos en anillos exteriores).
- **Física de Partículas y Ondas Sincronizadas:** Ondas concéntricas expansivas y paquetes de datos en tránsito continuo entre los nodos del grafo.
<img width="480" height="280" alt="image" src="https://github.com/user-attachments/assets/307e7e69-cec9-4b3e-8bac-e47c2b50eaca" />

---
### 3. 🧠 Modo Red Neuronal (*Neural Network*)
- **Regiones Neuronales y Nebulosas:** El directorio raíz y las subcarpetas se representan como núcleos somáticos rodeados por enjambres volumétricos de partículas bioluminiscentes ("nebulosas").
- **Archivos como Neuronas:** Nodos celulares con anillos dendríticos receptores clasificados por código cromático.
- **Sinapsis Orgánicas Curvas:** Conexiones sinápticas en 3D (`CatmullRomCurve3`) con flujo constante de neurotransmisores flotantes.
- **Disparos Eléctricos en Nodos Recientes:** Detección de archivos recientemente modificados que emiten periódicamente potenciales de acción eléctricos (picos de resplandor y ondas de choque).
- **Pulsos Concéntricos Sutiles:** Ondas cerebrales rítmicas difuminadas que recorren la red con una transparencia del 8% para no interferir con la visibilidad.
- **Transición con Efecto "Warp":** Al hacer doble clic en una nebulosa, la cámara acelera cinemáticamente con distorsión de campo visual (de 55° a 84°) y estelas de velocidad luz.
- **Tubo Conector de Retorno (Wormhole Conduit):** Tubo de 10 trazos semitransparentes en espiral que nace en el núcleo y se difumina hacia el exterior, con un portal interactivo para ascender a la carpeta superior al hacer clic.
<img width="480" height="280" alt="image" src="https://github.com/user-attachments/assets/1fc7de78-1fb5-424a-ba0d-735f9c2695ef" />

---

## 📁 Gestión de Archivos e Integración Profunda con Windows

Axplorer SNX no es solo un visor 3D: es un gestor de archivos completo diseñado para operar en armonía con Windows File Explorer y las aplicaciones del sistema:

### 📋 Portapapeles Nativo de Windows (`CF_HDROP`)
- **Interoperabilidad Total:**
  - Al pulsar **Copiar elemento** (o `Ctrl+C`), el archivo o carpeta se deposita en el portapapeles de Windows (`Clipboard.SetFileDropList`).
  - Puedes copiar un elemento en Axplorer y pegarlo en el Explorador de Windows o el Escritorio, o copiar desde el Explorador de Windows y pegarlo dentro de Axplorer.
- **Detección Activa del Estado del Portapapeles:**
  - El sistema detecta en tiempo real si existen archivos en el portapapeles (`Clipboard.ContainsFileDropList()`).
  - Al cambiar entre ventanas o regresar a la app (`MainWindow.Activated`), Axplorer actualiza instantáneamente su estado.
- **Visibilidad Inteligente de "Pegar":**
  - **Si el portapapeles está vacío:** La opción **"📥 Pegar elemento" se oculta completamente** en el menú contextual, tal como en el Explorador de Windows.
  - **Si contiene elementos:** Aparece al hacer clic secundario sobre una carpeta (para pegar en su interior) o en el fondo vacío del directorio actual. En archivos individuales permanece oculta.
- **Resolución Automática de Colisiones de Nombres:**
  - Si un archivo ya existe o se pega en la misma carpeta, genera sufijos sucesivos estándar: `archivo - copia.ext`, `archivo - copia (2).ext`, etc.
  - Para carpetas, genera `Carpeta - copia` y realiza una copia recursiva profunda de todos sus archivos y subdirectorios, con protección contra bucles (no permite pegar una carpeta dentro de sí misma).
- **Retroalimentación Visual Inmediata (Toast Cyberpunk):**
  - Notificaciones flotantes informan el resultado de cada acción en tiempo real (ej. *"Copiado al portapapeles: archivo.txt"* o *"Se ha pegado 'documento - copia.docx' exitosamente"*).
  - La escena 3D se recarga automáticamente tras cada operación de pegado.

### 🗜️ Integración con Compresores Externos
Axplorer detecta automáticamente las herramientas de compresión instaladas en el sistema operativo (mediante registro y rutas de programa) y las pone a disposición en el menú contextual:
- **WinRAR:**
  - En archivos comprimidos (`.zip`, `.rar`, `.7z`, `.iso`, etc.):
    - `🗜️ WinRAR: Extraer aquí`
    - `🗜️ WinRAR: Extraer en [carpeta]\`
    - `🗜️ Abrir con WinRAR`
  - En carpetas o archivos normales:
    - `🗜️ Añadir al archivo (WinRAR)...`
- **7-Zip:**
  - En archivos comprimidos: `📦 7-Zip: Extraer aquí` y `📦 Abrir con 7-Zip`.
  - En archivos/carpetas normales: `📦 Añadir a [nombre].zip (7-Zip)`.
- **Compresión Nativa de Windows:**
  - `Extraer todo (Windows)...` disponible para archivos ZIP estándar.

### 📝 Visores, Editores y Selector Universal
- **Notepad++:** Opción `📝 Editar con Notepad++` disponible automáticamente si está instalado, para archivos de código, texto plano y configuraciones.
- **Antigravity IDE:** Opción `⚡ Abrir con Antigravity` para abrir archivos de código o proyectos/carpetas completos.
- **Paint:** Opción `🎨 Editar con Paint` para archivos gráficos e imágenes (`.png`, `.jpg`, `.bmp`, `.webp`).
- **Abrir con... (Selector Universal de Windows):**
  - Opción `🌐 Abrir con... (Elegir aplicación)` que invoca el diálogo nativo de Windows (`shell32.dll,OpenAs_RunDLL`) para abrir el archivo con cualquier visor registrado en el sistema.

### 🪟 Menú Contextual Shell Completo de Windows (`IContextMenu`)
- Opción **`🪟 Más opciones (Menú de Windows)`** (y atajo **`Shift + F10`**):
  - Despliega el menú contextual nativo Win32 de Windows Explorer en la coordenada exacta del ratón utilizando las interfaces COM `IShellFolder`, `IContextMenu` y `TrackPopupMenuEx`.
  - Garantiza acceso al **100% de las extensiones shell de terceros** instaladas en el equipo (antivirus como Defender, menús contextuales de Git, clientes en la nube como OneDrive o Dropbox, y herramientas propietarias).

### 💻 Acciones Rápidas del Sistema
- **Mostrar en el Explorador (`show_in_folder`):** Abre la carpeta contenedora en Windows Explorer con el elemento seleccionado y enfocado.
- **Abrir en Terminal (`open_terminal`):** Abre PowerShell o Windows Terminal directamente en la ruta del elemento seleccionado.
- **Propiedades de Windows (`show_properties`):** Abre la ventana nativa de Propiedades de Windows (`ShellExecuteEx` con `SEE_MASK_INVOKEIDLIST`).
- **Copiar como ruta (`Ctrl + Shift + C`):** Copia la ruta absoluta al portapapeles.
- **Copiar nombre:** Copia únicamente el nombre del elemento al portapapeles.

---

## 🪟 Control y Gestión de Ventanas del Sistema

Axplorer SNX se integra con el Administrador de Ventanas de Windows para ofrecer control total sobre la aplicación y las demás ventanas del sistema:

### 🪟 Arrastre Fluido de Ventana y Soporte Aero Snap
- **Barra de Título Interactiva:**
  - Arrastre fluido mediante llamadas Win32 P/Invoke (`ReleaseCapture` y `SendMessage` con `WM_NCLBUTTONDOWN` / `HT_CAPTION`).
  - Compatible con **Windows Snap**: arrastra la ventana hacia los bordes o esquinas de la pantalla para acoplarla.
  - **Restauración al Arrastrar:** Si la ventana está maximizada y el usuario arrastra la barra de título, la ventana se restaura suavemente bajo el cursor y continúa el arrastre sin saltos.
  - **Doble Clic:** Conmuta entre maximizar y restaurar la ventana.
  - Protección con `user-select: none;` para evitar selecciones de texto accidentales.

### 🛑 Orden de Cierre Limpia para Ventanas Activas (`WM_CLOSE`)
- En el panel lateral izquierdo (**Ventanas Activas**), cada ventana abierta en Windows cuenta con un botón **`✕`** de cierre limpio:
  - **Mecanismo No Destructivo:** Envía el mensaje Win32 **`WM_CLOSE`** mediante `PostMessage`. Funciona exactamente igual a presionar la "X" superior de una ventana o pulsar `Alt + F4`.
  - **Protección de Documentos:** Las ventanas ordinarias se cierran al instante. Si se trata de un documento en edición con cambios no guardados (Word, Excel, Bloc de notas, Paint, VS Code), la aplicación se activa y despliega su propio cuadro de diálogo nativo preguntando si se desean guardar los cambios antes de salir.
  - **No Bloqueante:** Axplorer permanece totalmente fluido y no se bloquea mientras la otra aplicación espera la decisión del usuario.
  - **Retroalimentación Visual:** El botón se ilumina en rojo neón al pasar el cursor; al hacer clic, la fila se atenúa de inmediato y la lista se actualiza automáticamente a los pocos instantes.

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

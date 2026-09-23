# 🌌 Axplorer SNX — Spatial Neural Plex

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078d4.svg?logo=windows)](https://microsoft.com/windows)
[![.NET](https://img.shields.io/badge/.NET-10.0%20WPF-512bd4.svg?logo=dotnet)](https://dotnet.microsoft.com/)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20(WebGL)-000000.svg?logo=three.js)](https://threejs.org/)
[![WebView2](https://img.shields.io/badge/Bridge-Microsoft%20WebView2-008272.svg?logo=microsoftedge)](https://developer.microsoft.com/microsoft-edge/webview2/)
[![Version](https://img.shields.io/badge/Version-v0.2.9%20SNX-00f0ff.svg)](https://github.com/)

---
**Axplorer SNX** es un explorador y gestor de archivos espacial tridimensional para Windows 10 y 11. Transforma la interacción tradicional de árboles de carpetas estáticos y listas planas en un ecosistema tridimensional vivo, continuo, interactivo y cinemático impulsado por **.NET 10 WPF**, **WebView2** y **Three.js WebGL**.
La idea principal de este proyecto (aun por sobre su funcionalidad) es hacer un programa entretenido de usar, diferente y distractivo, pero manteniendo el mínimo de funcionalidad requerido para incentivar su uso.

---

## 🔮 Modos de Exploración Espacial 3D

Axplorer SNX permite conmutar en tiempo real entre tres modos de navegación espacial desde el menú de Configuración (`⚙️`), además de contar con un **Modo Galería 3D** inmersivo en primera persona:

### 1. 🏙️ Modo Ciudad 3D (*City-Grid*)
- **Arquitectura Urbana Procedimental:** Cada carpeta es un distrito o manzana urbana y cada archivo un edificio tridimensional con altura proporcional a su tamaño en disco.
- **Insignias Flotantes con Animación:** Todos los edificios cuentan con insignias de texto flotantes con el nombre y tamaño/tipo. Al pasar el cursor, los edificios se elevan reactivamente en el eje vertical.
- **Tráfico Vehicular de Luz:** Paquetes luminosos viajan a lo largo de las calles de la cuadrícula simulando el flujo de tráfico de una metrópolis cibernética.
- **Caja de Bienvenida e Hub de Almacenamiento:** Despliegue tridimensional de unidades de almacenamiento (`C:\`, `D:\`) con medidores volumétricos de espacio libre y accesos directos rápidos.
<img width="480" height="282" alt="Modo Ciudad 3D" src="https://github.com/user-attachments/assets/90aeeb15-d05a-40b0-9a94-087eda40322d" />

---

### 2. 🌐 Modo Constelación (*Spatial Plex*)
- **Ecosistema Orbital Planetario:** El elemento central actúa como sol/núcleo y los contenidos orbitan en anillos concéntricos según su jerarquía (carpetas en órbitas internas, archivos en anillos exteriores).
- **Etiquetas Zoom-Invariantes:** Etiquetas flotantes legibles desde cualquier distancia que mantienen su nitidez y tamaño relativo constante en pantalla.
- **Física de Partículas y Ondas Sincronizadas:** Ondas concéntricas expansivas y paquetes de datos en tránsito continuo entre los nodos del grafo.
<img width="480" height="280" alt="Modo Constelación" src="https://github.com/user-attachments/assets/307e7e69-cec9-4b3e-8bac-e47c2b50eaca" />

---

### 3. 🧠 Modo Red Neuronal (*Neural Network / Neuronal Nebula*)
- **Regiones Neuronales y Nebulosas:** El directorio raíz y las subcarpetas se representan como núcleos somáticos rodeados por enjambres volumétricos de partículas bioluminiscentes ("nebulosas").
- **Archivos como Neuronas:** Nodos celulares con anillos dendríticos receptores clasificados por código cromático.
- **Sinapsis Orgánicas Curvas:** Conexiones sinápticas en 3D (`CatmullRomCurve3`) con flujo constante de neurotransmisores flotantes.
- **Disparos Eléctricos en Nodos Recientes:** Detección de archivos recientemente modificados que emiten periódicamente potenciales de acción eléctricos (picos de resplandor y ondas de choque).
- **Pulsos Concéntricos Sutiles:** Ondas cerebrales rítmicas difuminadas que recorren la red con una transparencia sutil del 8% para no interferir con la visibilidad.
- **Transición con Efecto "Warp":** Al hacer doble clic en una nebulosa, la cámara acelera cinemáticamente con distorsión de campo visual (de 55° a 84°) y estelas de velocidad luz.
- **Tubo Conector de Retorno (*Wormhole Conduit*):** Conducto espiral que nace en el núcleo hacia el exterior con portal interactivo y etiqueta `⬆️ Carpeta Superior` para ascender de nivel.
<img width="480" height="280" alt="Modo Red Neuronal" src="https://github.com/user-attachments/assets/1fc7de78-1fb5-424a-ba0d-735f9c2695ef" />

---

### 4. 🏛️ Modo Galería 3D (*Cyber Museum & Media Exhibition*)
Disponible mediante clic derecho sobre cualquier carpeta (*"🖼️ Modo Galería 3D"*), transforma la carpeta seleccionada en un museo tridimensional continuo en primera persona:

<img width="480" height="282" alt="image" src="https://github.com/user-attachments/assets/5ec13f92-84b8-4726-a99e-f175fadae933" />

- **🚶 Navegación en Primera Persona y Strafe Lateral:**
  - Desplazamiento frontal y hacia atrás con <kbd>▲</kbd>/<kbd>▼</kbd> o <kbd>W</kbd>/<kbd>S</kbd>.
  - **Desplazamiento lateral (*Strafe*):** Las teclas <kbd>◄</kbd>/<kbd>►</kbd> o <kbd>A</kbd>/<kbd>D</kbd> desplazan de lado la posición de la cámara sin girar la orientación.
  - **Rotación Panorámica con Mouse:** Giro horizontal y cabeceo vertical suave arrastrando con el ratón.
  - **Tarjeta Tutorial Autodesvanecible:** Al ingresar se despliega una guía de controles que se desvanece suavemente al primer movimiento.
  - **Límites de Sala y Oclusión:** Sistema de colisiones físicas continuo y delimitación de visibilidad de metadatos exclusiva por zona (evita leer elementos detrás de las paredes).
  - **Aislamiento Inmersivo HUD:** Los paneles laterales de discos y ventanas se ocultan automáticamente al entrar y se restauran al salir.

- **🖼️ Sala A — Pinacoteca de Arte e Imágenes:**
  - Cuadros montados en los muros con iluminación perimetral neón.
  - **Dimensionamiento Proporcional Inteligente:** Los visores calculan su tamaño a partir de la resolución nativa de cada imagen, evitando distorsiones o pixelado.
  - Clic simple para previsualizar en visor emergente de alta definición y doble clic para abrir en el visor predeterminado del sistema.

- **📚 Sala B — Biblioteca de Documentos y Código:**
  - Mueble estantería con libros tridimensionales clasificados por categoría (PDF, Word, Excel, presentaciones, texto y código fuente).
  - **Lomo de Libro Auténtico:** Título del documento y extensión en orientación vertical sobre el lomo.
  - Atril central interactivo de lectura rápida con botón para abrir el archivo.

- **🎬 Sala C — Sala de Proyección y Cine 3D:**
  - Gran pantalla panorámica 16:9 (12.6m × 7.1m) con proyección en tiempo real vía `THREE.VideoTexture`.
  - **Controles de Reproducción Inteligentes:** Barra flotante inferior con Play/Pause, barra de avance (*scrubbing*), control de volumen y botón de pantalla completa.
  - **Ocultamiento Contextual:** La barra con los comandos de movimiento se oculta automáticamente al entrar a la sala de video para no superponerse con los controles de reproducción.
  - **Estantería de Videos 3D:** Cajas de video estilo Blu-ray/DVD con portada 2D procedural y lomo vertical. Un clic carga el video en la pantalla de cine; doble clic lo ejecuta en Windows.
  - **Streaming HTTP con Range Requests (`206 Partial Content`):** Soporte en backend C# para streaming y salto temporal instantáneo sin cargar archivos gigantes en RAM.

- **📦 Sala D — Depósito de Contenedores y Cajas 3D:**
  - Archivos comprimidos y de formato desconocido distribuidos en cuadrícula ordenada y separada en el suelo.
  - **Metadatos en Doble Cara:** Descripción y tamaño impresos en el frente y dorso de cada contenedor para lectura inmediata sin tener que rodearlo.

---

## ⚡ Novedades de la Versión 0.2.9

### 🎯 1. Menú Contextual Inteligente y Adaptativo
El menú contextual del botón secundario del ratón se adapta inteligentemente según el contexto:
- **Click derecho en un Área Vacía (dentro de una carpeta o unidad):**
  - La opción **Copiar** cambia dinámicamente a **"Copiar Todo"** (<kbd>Ctrl+A, C</kbd>), seleccionando y copiando automáticamente todo el contenido de la carpeta al portapapeles.
  - Se añade la opción **"Cortar Todo"** (<kbd>Ctrl+A, X</kbd>) para mover todo el contenido a otra ubicación.
  - La opción **"Pegar"** (<kbd>Ctrl+V</kbd>) se habilita automáticamente si el portapapeles contiene archivos o carpetas, permitiendo depositarlos directamente en la ruta actual.
- **Click derecho sobre un Elemento individual:**
  - Muestra exclusivamente **"Copiar"** y **"Cortar"** para trabajar únicamente con ese archivo o carpeta específico.
  - "Pegar" solo se habilita si el elemento clickeado es una carpeta/unidad y hay contenido en el portapapeles.

### 🌟 2. Selección Múltiple 3D con Halos Luminosos (<kbd>Ctrl</kbd> / <kbd>Shift</kbd> + Clic)
- **Aureola Neón 3D:** Al hacer clic sobre cualquier elemento en el espacio 3D, queda envuelto en una aureola brillante de color cian neón (`__selectionHalo__`) con resplandor difuminado y rotación continua. Compatible en todos los modos visuales (*City-Grid*, *Constelación* y *Nebulosa Neuronal*).
- **Selección Acumulativa:** Manteniendo presionada la tecla <kbd>Ctrl</kbd> o <kbd>Shift</kbd>, puedes sumar o alternar elementos en la selección.
- **Deselección Rápida:** Clic en un área vacía, pulsando la tecla <kbd>Esc</kbd> o desde el botón de cierre de la tarjeta flotante.

### 📑 3. Tarjeta Flotante Interactiva de Selección Múltiple (`#multi-selection-card`)
- **Aparición Automática:** Se despliega en la esquina superior derecha cuando hay **2 o más elementos seleccionados**.
- **Panel Cyberpunk Glassmorphism:**
  - Badge numérico con el total de elementos seleccionados.
  - Lista desplazable con iconos, nombres y botón `✕` para deseleccionar elementos puntuales.
- **Acciones por Lote Integradas:**
  - 📋 **Copiar:** Copia los elementos seleccionados al portapapeles (<kbd>Ctrl+C</kbd>).
  - ✂️ **Cortar:** Prepara los elementos seleccionados para mover (<kbd>Ctrl+X</kbd>).
  - 🗜️ **ZIP:** Comprime los elementos seleccionados directamente en un archivo `.zip` en la ruta actual.
  - ⚙️ **Más... / Clic Derecho:** Abre el menú contextual por lote (*Copiar*, *Cortar*, *Comprimir en ZIP*, *Imprimir*, *Copiar rutas de acceso*).
- **Auto-Cierre:** Una vez ejecutada cualquier acción, la tarjeta flotante desaparece y los elementos se deseleccionan automáticamente.

### 📊 4. Barra de Progreso Holográfica de Transferencia de Archivos
- **Monitoreo en Tiempo Real:** Al copiar, mover (cortar) o pegar elementos, se despliega una tarjeta holográfica con:
  - Título y nombre del archivo que se está procesando actualmente.
  - Medidor de porcentaje con efecto de brillo continuo (*shimmer*).
  - Contador de archivos (`X / Y archivos`) y volumen transferido (`X MB / Y GB`).
  - Velocidad de transferencia en tiempo real calculada dinámicamente (`MB/s`).
  - Botón interactivo para cancelar la operación en cualquier momento.
- **Soporte de Cortar/Mover Nativo:** Detección de `Preferred DropEffect` (Move); una vez copiado exitosamente cada archivo o carpeta en el destino, se elimina de la ubicación de origen y se limpia el portapapeles de forma segura.

### 🔌 5. Detección Hot-Plug de Unidades de Almacenamiento (USB / Pendrives)
- **Captura Win32 en Tiempo Real:** Interceptación del mensaje del sistema `WM_DEVICECHANGE` (`DBT_DEVICEARRIVAL`, `DBT_DEVICEREMOVECOMPLETE`).
- **Debounce y Actualización Automática:** Al conectar o retirar un pendrive o disco externo, se actualiza automáticamente el panel lateral de unidades y el visor 3D ("Mi PC") sin reiniciar.
- **Navegación Segura:** Si la unidad retirada era la carpeta que el usuario estaba explorando en ese momento, Axplorer SNX redirige de inmediato a "Mi PC" para prevenir errores de sistema.

### 🎨 6. Nuevo Icono Oficial "AX"
- **Identidad Gráfica:** Letras **AX** en tipografía futurista con biseles metálicos reflectantes, degradado cian neón a azul eléctrico y fondo *squircle* de obsidiana metálica con trazas de circuitos impresos.
- **Formato Multi-Capa Nativo:** Archivo `app.ico` con capas de 16x16, 32x32, 48x48, 64x64, 128x128 y 256x256 px a 32 bits incrustado en el ejecutable PE, ventanas WPF, accesos directos e instaladores.

---

## ⚙️ Opciones de Configuración y Personalización

Desde el panel de **Configuración Visual** (`⚙️`), los usuarios pueden adaptar la experiencia:
- **🏷️ Etiquetas Permanentes:**
  - **Activado:** Todas las etiquetas permanecen siempre visibles sobre los nodos y edificios.
  - **Desactivado:** Las etiquetas se ocultan de forma predeterminada y solo aparecen al pasar el ratón (*hover*) sobre el elemento específico (aplica de forma sincronizada en City-Grid, Constelación y Nebulosa Neuronal).
- **💍 Anillos Orbitales y Trazas:** Alternar la visualización de anillos planetarios y órbitas en el modo Constelación.
- **✨ Partículas Estelares:** Encender o apagar el fondo de estrellas y nebulosas volumétricas para optimizar rendimiento.
- **💡 Intensidad de Resplandor Neón (Bloom):** Ajuste de post-procesamiento visual en tiempo real.
- **🏎️ Velocidad de Flujo y Pulsos:** Regulador de velocidad para pulsos de datos y tráfico.
- **🚗 Tráfico Vehicular:** Encender o apagar el flujo de vehículos lumínicos en el modo Ciudad.
- **🕹️ Controles de Movimiento WASD:** Alternar entre teclas de flechas o distribución WASD en el Modo Galería.

---

## 📁 Gestión de Archivos e Integración Profunda con Windows

### 📋 Portapapeles Nativo de Windows (`CF_HDROP`)
- **Interoperabilidad Total:** Copia en Axplorer y pega en el Explorador de Windows o Escritorio, y viceversa.
- **Detección Activa del Estado del Portapapeles:** Actualización instantánea de opciones al regresar a la aplicación (`MainWindow.Activated`).
- **Resolución Automática de Colisiones de Nombres:** Generación de sufijos estándar (`archivo - copia.ext`, `archivo - copia (2).ext`) con protección contra bucles infinitos.

### 🗜️ Integración con Compresores Externos y Nativos
- **WinRAR:** Extraer aquí, extraer en carpeta, abrir con WinRAR, añadir al archivo.
- **7-Zip:** Extraer aquí, abrir con 7-Zip, añadir a archivo `.zip`.
- **Compresión Integrada:** Compresión a ZIP mediante `System.IO.Compression` nativo de .NET sin dependencias externas.

### 📝 Visores, Editores y Selector Universal
- **Notepad++:** Opción `📝 Editar con Notepad++` para código y texto.
- **Antigravity IDE:** Opción `⚡ Abrir con Antigravity` para proyectos y scripts.
- **Paint:** Opción `🎨 Editar con Paint` para edición rápida de imágenes.
- **Selector Universal de Windows:** Opción `🌐 Abrir con...` mediante el diálogo del sistema (`OpenAs_RunDLL`).

### 🪟 Menú Contextual Shell Completo de Windows (`IContextMenu`)
- Opción **`🪟 Más opciones (Menú de Windows)`** (o <kbd>Shift + F10</kbd>):
  - Despliega el menú contextual nativo Win32 de Windows Explorer en la coordenada del ratón con soporte completo para extensiones shell de terceros (Git, antivirus, OneDrive, Dropbox, etc.).

---

## 🎨 Código Cromático de Elementos

| Tipo | Color | Representación | Formatos Soportados |
| :--- | :--- | :--- | :--- |
| **Carpetas / Regiones** | `#bd00ff` / `#ffb700` | Violeta neón / Ámbar dorado | Directorios del sistema de archivos |
| **Unidades de Disco** | `#38bdf8` | Azul cielo cibernético | Discos duros, SSD, USB (`C:\`, `D:\`, etc.) |
| **Código y Scripts** | `#00ffaa` / `#00ff9d` | Verde menta / Esmeralda | `.cs`, `.js`, `.ts`, `.py`, `.html`, `.css`, `.cpp`, `.ps1`, `.bat`, etc. |
| **Documentos** | `#60a5fa` | Azul eléctrico | `.pdf`, `.docx`, `.doc`, `.xlsx`, `.pptx`, `.txt`, `.md`, `.ini`, etc. |
| **Imágenes y Arte** | `#d946ef` | Fucsia / Violeta neón | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`, `.svg`, `.jfif`, `.ico` |
| **Vídeos** | `#a855f7` | Púrpura cósmico | `.mp4`, `.mkv`, `.webm`, `.avi`, `.mov`, `.wmv`, `.m4v` |
| **Audio** | `#f43f5e` | Rosa coral | `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.wma` |
| **Comprimidos (Zip/Rar)** | `#f59e0b` | Ámbar / Naranja | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.iso`, `.cab` |
| **Ejecutables** | `#ff0055` | Carmesí intenso | `.exe`, `.msi`, `.dll` |
| **Otros / Binarios** | `#94a3b8` | Gris pizarra | Archivos sin extensión o de tipo general |

---

## 🛠️ Tecnologías y Arquitectura

- **Plataforma Base:** C# 14 • .NET 10 WPF (`net10.0-windows`).
- **Contenedor Web:** Microsoft.Web.WebView2 (`Chromium Runtime`).
- **Renderizado Gráfico 3D:** Three.js (WebGL), `EffectComposer`, `UnrealBloomPass` (resplandor neón), `VideoTexture`.
- **Integración con el SO:** Win32 API para gestión de ventanas y hot-plug (`WM_DEVICECHANGE`), portapapeles nativo `CF_HDROP`, interfaces COM `IShellFolder`/`IContextMenu` y streaming HTTP local con `Range Requests`.

---

## 🚀 Instalación y Empaquetado

### 📦 Creación de Instaladores de Distribución con 1 Clic (`crear_instalador.bat`)
1. Haz doble clic en **`crear_instalador.bat`** en la raíz del proyecto.
2. El script automáticamente:
   - Compila la aplicación en modo `Release` con arquitectura `win-x64` y modo **Self-Contained** (incluye el runtime completo de .NET 10, por lo que el usuario final no necesita instalar nada).
   - Genera el **Instalador Nativo de Windows** (`dist\Axplorer_SNX_v0.2.9_Instalador.zip`) que configura accesos directos en Escritorio y Menú Inicio con el nuevo icono AX y registra la app en el Panel de Control.
   - Genera la versión **Portable ZIP** (`dist\Axplorer_SNX_v0.2.9_Portable.zip`) para usar sin instalación.
   - Si está instalado Inno Setup, genera el ejecutable único `Setup_Axplorer_SNX_v0.2.9.exe`.

### 🛠️ Compilación para Desarrolladores

#### Requisitos Previos
1. Windows 10 (versión 1809+) o Windows 11.
2. [.NET 10.0 SDK](https://dotnet.microsoft.com/download) instalado.
3. [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (preinstalado de serie en Windows 11 y Windows 10).

#### Pasos de Compilación
```bash
git clone https://github.com/TU_USUARIO/Axplorer-SNX.git
cd Axplorer-SNX
dotnet build
dotnet run
```

---

## ⌨️ Atajos de Teclado y Controles

### Exploración Espacial (City-Grid, Constelación, Nebulosa)
| Control | Acción |
| :--- | :--- |
| **Clic Izquierdo** | Seleccionar elemento individual (activa halo 3D neón e inspector) |
| **<kbd>Ctrl</kbd> o <kbd>Shift</kbd> + Clic** | **Selección Múltiple** (agrega/quita elementos; activa tarjeta flotante con ≥ 2) |
| **Doble Clic** | Abrir archivo en Windows o sumergirse en la carpeta/nebulosa |
| **Clic Secundario (Derecho)** | Abrir Menú Contextual (adaptativo en elemento, vacío o lote) |
| **Arrastrar Clic Izquierdo** | Orbitar / Rotar libremente la escena 3D |
| **Arrastrar Clic Derecho** | Desplazar la cámara (*pan*) |
| **Rueda del Ratón** | Acercar / Alejar la vista (*zoom*) |
| **<kbd>Backspace</kbd> / <kbd>Alt + ▲</kbd>** | Ascender a la carpeta superior |
| **<kbd>Ctrl + C</kbd>** | Copiar elemento(s) al portapapeles de Windows |
| **<kbd>Ctrl + X</kbd>** | Cortar elemento(s) para mover |
| **<kbd>Ctrl + V</kbd>** | Pegar elementos del portapapeles en la carpeta actual |
| **<kbd>Ctrl + Shift + C</kbd>** | Copiar ruta(s) absoluta(s) al portapapeles |
| **<kbd>Shift + F10</kbd>** | Abrir menú contextual nativo Win32 de Windows Explorer |
| **<kbd>Esc</kbd>** | Desmarcar selecciones múltiples, cerrar tarjeta flotante o modales |

### Modo Galería 3D (Primera Persona)
| Control | Acción |
| :--- | :--- |
| **<kbd>▲</kbd> / <kbd>▼</kbd>** (o <kbd>W</kbd> / <kbd>S</kbd>) | Avanzar / Retroceder por las salas y pasillos |
| **<kbd>◄</kbd> / <kbd>►</kbd>** (o <kbd>A</kbd> / <kbd>D</kbd>) | **Desplazamiento lateral (*Strafe*)** a izquierda y derecha |
| **Arrastrar Ratón** | **Girar vista y cabeceo panorámico (Mouse Look)** |
| **Clic Izquierdo** | Abrir imagen en visor ampliado / Seleccionar libro o caja de video |
| **Doble Clic** | Abrir archivo en su aplicación predeterminada de Windows |
| **Clic en Pantalla de Cine** | Reproducir / Pausar el video en la pantalla 3D |
| **<kbd>Esc</kbd>** (o botón superior) | Salir del modo Galería y regresar al explorador de archivos |

---

## 👨‍💻 Autor y Créditos

- **Desarrollador:** David Rojas `[Axio.UK]`
- **Arquitectura:** *Spatial Neural Plex (SNX Architecture)*
- **Versión:** `v0.2.9 SNX`
- **Año:** 2026 • Todos los derechos reservados.

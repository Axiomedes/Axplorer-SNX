using System.Collections.Generic;
using System.Linq;

namespace aXplorer
{
    /// <summary>
    /// Representa una característica destacada en el diálogo Acerca De.
    /// </summary>
    public class AboutFeature
    {
        public string Icon { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Configuración y metadatos del sistema Axplorer SNX.
    /// Edite este archivo para actualizar la información mostrada en el diálogo "Acerca De".
    /// </summary>
    public static class AboutInfo
    {
        // =========================================================================
        // Identidad y Versión de la Aplicación
        // =========================================================================
        public static string AppName { get; set; } = "Axplorer";
        public static string BrandTag { get; set; } = "SNX";
        public static string Subtitle { get; set; } = "Spatial Neural Plex";
        public static string Version { get; set; } = "v0.2.5 • Edición SNX (Windows 10/11)";

        // =========================================================================
        // Descripción General del Sistema
        // =========================================================================
        public static string DescriptionTitle { get; set; } = "Descripción del Sistema";
        public static string DescriptionText { get; set; } =
            "Axplorer SNX es un navegador y gestor de archivos tridimensional diseñado para transformar la interacción tradicional de carpetas y listas en un ecosistema espacial vivo, continuo e intuitivo.";

        // =========================================================================
        // Características y Modos Principales
        // =========================================================================
        public static List<AboutFeature> Features { get; set; } = new()
        {
            new AboutFeature
            {
                Icon = "🏙️",
                Title = "Modo Ciudad 3D (City-Grid)",
                Description = "Mapeo urbano procedimental donde cada directorio es un distrito y cada archivo un edificio tridimensional con alturas proporcionales a su peso y códigos cromáticos según su tipo."
            },
            new AboutFeature
            {
                Icon = "🌐",
                Title = "Modo Constelación (Spatial Plex)",
                Description = "Grafo galáctico interactivo con física de partículas, rotación de aros orbitales, pulsos concéntricos y flujos continuos de paquetes luminosos de datos."
            },
            new AboutFeature
            {
                Icon = "⚡",
                Title = "Continuidad Espacial Cinemática",
                Description = "Transiciones tridimensionales continuas sin saltos bruscos: descenso e inmersión al ingresar en carpetas y elevación/compactación de distritos al subir de nivel."
            }
        };

        // =========================================================================
        // Información del Desarrollador & Créditos Técnicos
        // =========================================================================
        public static string DeveloperTitle { get; set; } = "Datos del Desarrollador & Créditos";
        public static string DeveloperName { get; set; } = "David Rojas";
        public static string Architecture { get; set; } = "Spatial Neural Plex (SNX Architecture)";
        public static string Technologies { get; set; } = "C# 14 • .NET 10 WPF • WebView2 • Three.js WebGL • Win32 API";
        public static string LicenseYear { get; set; } = "2026 • Todos los derechos reservados";

        /// <summary>
        /// Genera el objeto de datos que se enviará a la interfaz WebView2.
        /// </summary>
        public static object ToPayload()
        {
            return new
            {
                appName = AppName,
                brandTag = BrandTag,
                subtitle = Subtitle,
                version = Version,
                descriptionTitle = DescriptionTitle,
                descriptionText = DescriptionText,
                features = Features.Select(f => new
                {
                    icon = f.Icon,
                    title = f.Title,
                    description = f.Description
                }),
                developerTitle = DeveloperTitle,
                developerName = DeveloperName,
                architecture = Architecture,
                technologies = Technologies,
                licenseYear = LicenseYear
            };
        }
    }
}

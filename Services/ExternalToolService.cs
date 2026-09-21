using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using Microsoft.Win32;

namespace aXplorer.Services
{
    public class ExternalToolItem
    {
        public string Id { get; set; } = "";
        public string Label { get; set; } = "";
        public string Icon { get; set; } = "⚡";
        public string Category { get; set; } = "general"; // "compress", "edit", "view", "system"
    }

    public static class ExternalToolService
    {
        private static string? _winrarPath;
        private static string? _sevenZipPath;
        private static string? _notepadppPath;
        private static string? _antigravityPath;
        private static bool _pathsInitialized = false;

        public static void InitializePaths()
        {
            if (_pathsInitialized) return;
            _pathsInitialized = true;

            // 1. WinRAR
            string[] winrarCandidates =
            {
                @"C:\Program Files\WinRAR\WinRAR.exe",
                @"C:\Program Files (x86)\WinRAR\WinRAR.exe"
            };
            foreach (var p in winrarCandidates)
            {
                if (File.Exists(p)) { _winrarPath = p; break; }
            }
            if (string.IsNullOrEmpty(_winrarPath))
            {
                _winrarPath = GetAppPathFromRegistry("WinRAR.exe");
            }

            // 2. 7-Zip
            string[] sevenZipCandidates =
            {
                @"C:\Program Files\7-Zip\7zG.exe",
                @"C:\Program Files (x86)\7-Zip\7zG.exe"
            };
            foreach (var p in sevenZipCandidates)
            {
                if (File.Exists(p)) { _sevenZipPath = p; break; }
            }
            if (string.IsNullOrEmpty(_sevenZipPath))
            {
                _sevenZipPath = GetAppPathFromRegistry("7zFM.exe") ?? GetAppPathFromRegistry("7zG.exe");
            }

            // 3. Notepad++
            string[] nppCandidates =
            {
                @"C:\Program Files\Notepad++\notepad++.exe",
                @"C:\Program Files (x86)\Notepad++\notepad++.exe"
            };
            foreach (var p in nppCandidates)
            {
                if (File.Exists(p)) { _notepadppPath = p; break; }
            }
            if (string.IsNullOrEmpty(_notepadppPath))
            {
                _notepadppPath = GetAppPathFromRegistry("notepad++.exe");
            }

            // 4. Antigravity
            string userLocal = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string agyPath = Path.Combine(userLocal, @"Programs\Antigravity\Antigravity.exe");
            if (File.Exists(agyPath))
            {
                _antigravityPath = agyPath;
            }
        }

        private static string? GetAppPathFromRegistry(string exeName)
        {
            try
            {
                using var key = Registry.LocalMachine.OpenSubKey($@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{exeName}");
                if (key != null)
                {
                    string? val = key.GetValue(null) as string;
                    if (!string.IsNullOrEmpty(val) && File.Exists(val))
                    {
                        return val;
                    }
                }
            }
            catch { }
            return null;
        }

        public static List<ExternalToolItem> GetToolsForPath(string path)
        {
            InitializePaths();
            var list = new List<ExternalToolItem>();

            if (string.IsNullOrWhiteSpace(path) || path.Equals("welcome", StringComparison.OrdinalIgnoreCase) || path.Equals("root", StringComparison.OrdinalIgnoreCase))
                return list;

            bool isDir = Directory.Exists(path);
            bool isFile = File.Exists(path);
            if (!isDir && !isFile) return list;

            string ext = isFile ? Path.GetExtension(path).ToLowerInvariant() : "";
            string name = Path.GetFileName(path);
            if (string.IsNullOrEmpty(name)) name = path;

            bool isArchive = ext is ".zip" or ".rar" or ".7z" or ".tar" or ".gz" or ".bz2" or ".iso" or ".cab";
            bool isImage = ext is ".png" or ".jpg" or ".jpeg" or ".bmp" or ".gif" or ".webp" or ".ico";
            bool isAudioVideo = ext is ".mp4" or ".mkv" or ".avi" or ".mov" or ".wmv" or ".mp3" or ".wav" or ".flac" or ".m4a";
            bool isCodeOrText = ext is ".txt" or ".cs" or ".js" or ".ts" or ".html" or ".css" or ".json" or ".xml" or ".py" or ".c" or ".cpp" or ".h" or ".md" or ".sql" or ".bat" or ".cmd" or ".ps1" or ".ini" or ".log" or ".cfg";

            // --- 1. COMPRESORES (WinRAR / 7-Zip / ZIP nativo) ---
            if (!string.IsNullOrEmpty(_winrarPath))
            {
                if (isArchive)
                {
                    list.Add(new ExternalToolItem { Id = "winrar_extract_here", Label = "WinRAR: Extraer aquí", Icon = "🗜️", Category = "compress" });
                    string folderName = Path.GetFileNameWithoutExtension(name);
                    list.Add(new ExternalToolItem { Id = "winrar_extract_to", Label = $"WinRAR: Extraer en {folderName}\\", Icon = "🗜️", Category = "compress" });
                    list.Add(new ExternalToolItem { Id = "winrar_open", Label = "Abrir con WinRAR", Icon = "🗜️", Category = "compress" });
                }
                else
                {
                    list.Add(new ExternalToolItem { Id = "winrar_add", Label = "Añadir al archivo (WinRAR)...", Icon = "🗜️", Category = "compress" });
                }
            }

            if (!string.IsNullOrEmpty(_sevenZipPath))
            {
                if (isArchive)
                {
                    list.Add(new ExternalToolItem { Id = "7zip_extract_here", Label = "7-Zip: Extraer aquí", Icon = "📦", Category = "compress" });
                    list.Add(new ExternalToolItem { Id = "7zip_open", Label = "Abrir con 7-Zip", Icon = "📦", Category = "compress" });
                }
                else
                {
                    list.Add(new ExternalToolItem { Id = "7zip_add", Label = $"Añadir a {Path.GetFileNameWithoutExtension(name)}.zip (7-Zip)", Icon = "📦", Category = "compress" });
                }
            }

            // Compresión nativa ZIP de Windows
            if (isArchive && ext == ".zip")
            {
                list.Add(new ExternalToolItem { Id = "windows_extract", Label = "Extraer todo (Windows)...", Icon = "🗜️", Category = "compress" });
            }

            // --- 2. EDITORES Y VISORES INTEGRADOS ---
            if (!string.IsNullOrEmpty(_notepadppPath) && (isCodeOrText || (!isArchive && !isImage && !isAudioVideo && isFile)))
            {
                list.Add(new ExternalToolItem { Id = "notepadpp", Label = "Editar con Notepad++", Icon = "📝", Category = "edit" });
            }

            if (!string.IsNullOrEmpty(_antigravityPath))
            {
                list.Add(new ExternalToolItem { Id = "antigravity", Label = isDir ? "Abrir carpeta en Antigravity" : "Abrir con Antigravity", Icon = "⚡", Category = "edit" });
            }

            if (isImage)
            {
                list.Add(new ExternalToolItem { Id = "paint", Label = "Editar con Paint", Icon = "🎨", Category = "view" });
            }

            // --- 3. ELEGIR OTRA APLICACIÓN (Abrir con... nativo de Windows) ---
            if (isFile)
            {
                list.Add(new ExternalToolItem { Id = "open_with", Label = "Abrir con... (Elegir aplicación)", Icon = "🌐", Category = "system" });
            }

            // --- 4. MENÚ COMPLETO DE WINDOWS EXPLORER (Más opciones...) ---
            list.Add(new ExternalToolItem { Id = "native_shell_menu", Label = "Más opciones (Menú de Windows)", Icon = "🪟", Category = "system" });

            return list;
        }

        public static bool ExecuteTool(string toolId, string path, IntPtr hwndOwner, int screenX, int screenY)
        {
            InitializePaths();

            if (string.IsNullOrWhiteSpace(path) || (!File.Exists(path) && !Directory.Exists(path)))
                return false;

            try
            {
                string dir = Directory.Exists(path) ? path : (Path.GetDirectoryName(path) ?? "");
                string nameWithoutExt = Path.GetFileNameWithoutExtension(path);
                if (string.IsNullOrEmpty(nameWithoutExt)) nameWithoutExt = "archivo";

                switch (toolId.ToLowerInvariant())
                {
                    case "winrar_extract_here":
                        if (!string.IsNullOrEmpty(_winrarPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _winrarPath,
                                Arguments = $"x -ibck \"{path}\" \"{dir}\\\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "winrar_extract_to":
                        if (!string.IsNullOrEmpty(_winrarPath))
                        {
                            string targetFolder = Path.Combine(dir, nameWithoutExt);
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _winrarPath,
                                Arguments = $"x -ibck \"{path}\" \"{targetFolder}\\\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "winrar_open":
                        if (!string.IsNullOrEmpty(_winrarPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _winrarPath,
                                Arguments = $"\"{path}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "winrar_add":
                        if (!string.IsNullOrEmpty(_winrarPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _winrarPath,
                                Arguments = $"a -ibck \"{Path.Combine(dir, nameWithoutExt + ".rar")}\" \"{path}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "7zip_extract_here":
                        if (!string.IsNullOrEmpty(_sevenZipPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _sevenZipPath,
                                Arguments = $"x \"{path}\" -o\"{dir}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "7zip_open":
                        if (!string.IsNullOrEmpty(_sevenZipPath))
                        {
                            string sevenFm = Path.Combine(Path.GetDirectoryName(_sevenZipPath) ?? "", "7zFM.exe");
                            string exe = File.Exists(sevenFm) ? sevenFm : _sevenZipPath;
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = exe,
                                Arguments = $"\"{path}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "7zip_add":
                        if (!string.IsNullOrEmpty(_sevenZipPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _sevenZipPath,
                                Arguments = $"a \"{Path.Combine(dir, nameWithoutExt + ".zip")}\" \"{path}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "windows_extract":
                        Process.Start("explorer.exe", $"/select,\"{path}\"");
                        return true;

                    case "notepadpp":
                        if (!string.IsNullOrEmpty(_notepadppPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _notepadppPath,
                                Arguments = $"\"{path}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "antigravity":
                        if (!string.IsNullOrEmpty(_antigravityPath))
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = _antigravityPath,
                                Arguments = $"\"{path}\"",
                                WorkingDirectory = dir
                            });
                            return true;
                        }
                        break;

                    case "paint":
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "mspaint.exe",
                            Arguments = $"\"{path}\"",
                            WorkingDirectory = dir
                        });
                        return true;

                    case "open_with":
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "rundll32.exe",
                            Arguments = $"shell32.dll,OpenAs_RunDLL \"{path}\"",
                            UseShellExecute = false
                        });
                        return true;

                    case "native_shell_menu":
                        return ShellContextMenu.Show(hwndOwner, path, screenX, screenY);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error executing external tool '{toolId}': {ex.Message}");
                return false;
            }

            return false;
        }
    }
}

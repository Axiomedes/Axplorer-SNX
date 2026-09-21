using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using aXplorer.Models;

namespace aXplorer.Services
{
    public class FileSystemService
    {
        public List<FileSystemNode> GetDrives()
        {
            var driveNodes = new List<FileSystemNode>();
            try
            {
                foreach (var drive in DriveInfo.GetDrives())
                {
                    if (!drive.IsReady) continue;

                    string label = string.IsNullOrWhiteSpace(drive.VolumeLabel) ? "Disco Local" : drive.VolumeLabel;
                    string name = $"{label} ({drive.Name.TrimEnd('\\')})";
                    double percentUsed = drive.TotalSize > 0
                        ? Math.Round((1.0 - (double)drive.AvailableFreeSpace / drive.TotalSize) * 100, 1)
                        : 0;

                    string driveTypeDesc = drive.DriveType switch
                    {
                        DriveType.Removable => "Unidad Extraíble / USB",
                        DriveType.Fixed => "Disco Local",
                        DriveType.Network => "Unidad de Red",
                        DriveType.CDRom => "Unidad Óptica",
                        _ => "Almacenamiento"
                    };

                    driveNodes.Add(new FileSystemNode
                    {
                        Id = drive.Name,
                        Name = name,
                        FullPath = drive.Name,
                        IsDirectory = true,
                        IsDrive = true,
                        IsNetwork = drive.DriveType == DriveType.Network,
                        ItemType = drive.DriveType == DriveType.Network ? "network" : "drive",
                        DriveTypeDescription = driveTypeDesc,
                        TotalBytes = drive.TotalSize,
                        FreeBytes = drive.AvailableFreeSpace,
                        PercentUsed = percentUsed,
                        FreeSpace = FormatBytes(drive.AvailableFreeSpace),
                        TotalSpace = FormatBytes(drive.TotalSize)
                    });
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error enumerating drives: {ex.Message}");
            }
            return driveNodes;
        }

        public List<FileSystemNode> GetQuickAccess()
        {
            var items = new List<FileSystemNode>();
            void AddSpecial(Environment.SpecialFolder folder, string name, string type)
            {
                try
                {
                    string path = Environment.GetFolderPath(folder);
                    if (Directory.Exists(path))
                    {
                        items.Add(new FileSystemNode
                        {
                            Id = path,
                            Name = name,
                            FullPath = path,
                            IsDirectory = true,
                            IsLibrary = true,
                            ItemType = type
                        });
                    }
                }
                catch { }
            }

            AddSpecial(Environment.SpecialFolder.Desktop, "Escritorio", "folder");
            AddSpecial(Environment.SpecialFolder.MyDocuments, "Documentos", "document");
            AddSpecial(Environment.SpecialFolder.UserProfile, "Usuario", "folder");
            
            // Downloads folder
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string downloadsPath = Path.Combine(userProfile, "Downloads");
            if (Directory.Exists(downloadsPath))
            {
                items.Add(new FileSystemNode
                {
                    Id = downloadsPath,
                    Name = "Descargas",
                    FullPath = downloadsPath,
                    IsDirectory = true,
                    IsLibrary = true,
                    ItemType = "folder"
                });
            }

            AddSpecial(Environment.SpecialFolder.MyPictures, "Imágenes", "image");
            AddSpecial(Environment.SpecialFolder.MyMusic, "Música", "audio");
            AddSpecial(Environment.SpecialFolder.MyVideos, "Vídeos", "video");

            return items;
        }

        public PlexGraphPayload GetPlexGraph(string? targetPath)
        {
            var payload = new PlexGraphPayload();
            payload.Drives = GetDrives();
            payload.QuickAccess = GetQuickAccess();

            // Level 0: Welcome single box "Mi PC"
            if (string.IsNullOrWhiteSpace(targetPath) || targetPath.Equals("welcome", StringComparison.OrdinalIgnoreCase))
            {
                payload.ViewMode = "welcome";
                payload.CurrentNode = new FileSystemNode
                {
                    Id = "welcome",
                    Name = "Mi PC",
                    FullPath = "welcome",
                    IsDirectory = true,
                    ItemType = "system"
                };
                payload.Breadcrumbs = new List<BreadcrumbItem>
                {
                    new BreadcrumbItem { Name = "Mi PC", Path = "welcome" }
                };
                payload.StatusMessage = "Haga doble clic en Mi PC para explorar el sistema.";
                return payload;
            }

            // Level 1: "Mi PC" Hub (all drives & libraries)
            if (targetPath.Equals("root", StringComparison.OrdinalIgnoreCase) || targetPath.Equals("mypc", StringComparison.OrdinalIgnoreCase))
            {
                payload.ViewMode = "mypc";
                payload.CurrentNode = new FileSystemNode
                {
                    Id = "system_root",
                    Name = "Mi PC",
                    FullPath = "root",
                    IsDirectory = true,
                    ItemType = "system",
                    ChildCount = payload.Drives.Count + payload.QuickAccess.Count
                };

                payload.Parents = new List<FileSystemNode>
                {
                    new FileSystemNode { Name = "Inicio", FullPath = "welcome", ItemType = "system" }
                };

                var allLocations = new List<FileSystemNode>();
                allLocations.AddRange(payload.Drives);
                allLocations.AddRange(payload.QuickAccess);

                payload.Children = allLocations;
                payload.TotalItems = allLocations.Count;
                payload.Breadcrumbs = new List<BreadcrumbItem>
                {
                    new BreadcrumbItem { Name = "Mi PC", Path = "root" }
                };
                payload.StatusMessage = $"{payload.Drives.Count} unidades y {payload.QuickAccess.Count} ubicaciones listas.";
                return payload;
            }

            // Level 2: City-Grid view for drive or folder
            payload.ViewMode = "city";

            try
            {
                var dirInfo = new DirectoryInfo(targetPath);
                if (!dirInfo.Exists)
                {
                    return GetPlexGraph("root");
                }

                bool isDrive = dirInfo.Parent == null;
                string nodeName = isDrive ? dirInfo.FullName : dirInfo.Name;

                payload.CurrentNode = new FileSystemNode
                {
                    Id = dirInfo.FullName,
                    Name = nodeName,
                    FullPath = dirInfo.FullName,
                    IsDirectory = true,
                    IsDrive = isDrive,
                    ItemType = isDrive ? "drive" : "folder",
                    ModifiedDate = dirInfo.LastWriteTime
                };

                // Parents upward hierarchy
                var parentsList = new List<FileSystemNode>();
                var currParent = dirInfo.Parent;
                while (currParent != null)
                {
                    parentsList.Add(new FileSystemNode
                    {
                        Id = currParent.FullName,
                        Name = currParent.Parent == null ? currParent.FullName : currParent.Name,
                        FullPath = currParent.FullName,
                        IsDirectory = true,
                        IsDrive = currParent.Parent == null,
                        ItemType = currParent.Parent == null ? "drive" : "folder"
                    });
                    currParent = currParent.Parent;
                }

                // Add "Mi PC" as the top parent
                parentsList.Add(new FileSystemNode
                {
                    Id = "system_root",
                    Name = "Mi PC",
                    FullPath = "root",
                    IsDirectory = true,
                    ItemType = "system"
                });

                payload.Parents = parentsList;

                // Children (subdirectories and files)
                var children = new List<FileSystemNode>();
                int totalItemsCount = 0;

                try
                {
                    var dirs = dirInfo.EnumerateDirectories()
                        .Where(d => (d.Attributes & FileAttributes.Hidden) == 0 && (d.Attributes & FileAttributes.System) == 0)
                        .OrderBy(d => d.Name)
                        .Take(60);

                    foreach (var d in dirs)
                    {
                        totalItemsCount++;
                        children.Add(new FileSystemNode
                        {
                            Id = d.FullName,
                            Name = d.Name,
                            FullPath = d.FullName,
                            IsDirectory = true,
                            ItemType = "folder",
                            ModifiedDate = d.LastWriteTime
                        });
                    }
                }
                catch (UnauthorizedAccessException) { }

                try
                {
                    var files = dirInfo.EnumerateFiles()
                        .Where(f => (f.Attributes & FileAttributes.Hidden) == 0 && (f.Attributes & FileAttributes.System) == 0)
                        .OrderBy(f => f.Name)
                        .Take(90);

                    foreach (var f in files)
                    {
                        totalItemsCount++;
                        string ext = f.Extension.ToLowerInvariant();
                        children.Add(new FileSystemNode
                        {
                            Id = f.FullName,
                            Name = f.Name,
                            FullPath = f.FullName,
                            IsDirectory = false,
                            Extension = ext,
                            SizeBytes = f.Length,
                            FormattedSize = FormatBytes(f.Length),
                            ItemType = CategorizeExtension(ext),
                            ModifiedDate = f.LastWriteTime
                        });
                    }
                }
                catch (UnauthorizedAccessException) { }

                payload.Children = children;
                payload.CurrentNode.ChildCount = children.Count;
                payload.TotalItems = totalItemsCount;

                // Breadcrumbs
                var breadcrumbs = new List<BreadcrumbItem>
                {
                    new BreadcrumbItem { Name = "Mi PC", Path = "root" }
                };

                // reverse parents except root to construct breadcrumbs from top to current
                for (int i = parentsList.Count - 2; i >= 0; i--)
                {
                    breadcrumbs.Add(new BreadcrumbItem
                    {
                        Name = parentsList[i].Name,
                        Path = parentsList[i].FullPath
                    });
                }
                breadcrumbs.Add(new BreadcrumbItem
                {
                    Name = payload.CurrentNode.Name,
                    Path = payload.CurrentNode.FullPath
                });

                payload.Breadcrumbs = breadcrumbs;
                payload.StatusMessage = $"Mostrando {children.Count} elementos en {payload.CurrentNode.Name}";
            }
            catch (Exception ex)
            {
                payload.StatusMessage = $"Error al acceder: {ex.Message}";
            }

            return payload;
        }

        public bool OpenItem(string path)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(path) || path == "root") return false;

                var psi = new ProcessStartInfo
                {
                    FileName = path,
                    UseShellExecute = true
                };
                Process.Start(psi);
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error launching {path}: {ex.Message}");
                return false;
            }
        }

        public bool ShowInExplorer(string path)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(path) || path == "root" || path == "welcome") return false;

                if (Directory.Exists(path))
                {
                    Process.Start(new ProcessStartInfo("explorer.exe", $"\"{path}\"") { UseShellExecute = true });
                    return true;
                }

                if (File.Exists(path))
                {
                    Process.Start(new ProcessStartInfo("explorer.exe", $"/select,\"{path}\"") { UseShellExecute = true });
                    return true;
                }

                Process.Start(new ProcessStartInfo("explorer.exe", $"\"{path}\"") { UseShellExecute = true });
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error opening explorer for {path}: {ex.Message}");
                return false;
            }
        }

        public bool OpenTerminal(string path)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(path) || path == "root" || path == "welcome") return false;

                string targetDir = path;
                if (File.Exists(path))
                {
                    targetDir = Path.GetDirectoryName(path) ?? path;
                }

                if (!Directory.Exists(targetDir)) return false;

                try
                {
                    Process.Start(new ProcessStartInfo("wt.exe", $"-d \"{targetDir}\"") { UseShellExecute = true });
                    return true;
                }
                catch
                {
                    Process.Start(new ProcessStartInfo("powershell.exe", $"-NoExit -Command \"Set-Location -LiteralPath '{targetDir}'\"") { UseShellExecute = true });
                    return true;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error opening terminal for {path}: {ex.Message}");
                return false;
            }
        }

        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        private static extern bool ShellExecuteEx(ref SHELLEXECUTEINFO lpExecInfo);

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private struct SHELLEXECUTEINFO
        {
            public int cbSize;
            public uint fMask;
            public IntPtr hwnd;
            [MarshalAs(UnmanagedType.LPTStr)]
            public string lpVerb;
            [MarshalAs(UnmanagedType.LPTStr)]
            public string lpFile;
            [MarshalAs(UnmanagedType.LPTStr)]
            public string lpParameters;
            [MarshalAs(UnmanagedType.LPTStr)]
            public string lpDirectory;
            public int nShow;
            public IntPtr hInstApp;
            public IntPtr lpIDList;
            [MarshalAs(UnmanagedType.LPTStr)]
            public string lpClass;
            public IntPtr hkeyClass;
            public uint dwHotKey;
            public IntPtr hIcon;
            public IntPtr hProcess;
        }

        private const uint SEE_MASK_INVOKEIDLIST = 0x0000000C;
        private const int SW_SHOW = 5;

        public bool ShowProperties(string path)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(path) || path == "root" || path == "welcome") return false;

                var info = new SHELLEXECUTEINFO();
                info.cbSize = Marshal.SizeOf(info);
                info.lpVerb = "properties";
                info.lpFile = path;
                info.nShow = SW_SHOW;
                info.fMask = SEE_MASK_INVOKEIDLIST;
                return ShellExecuteEx(ref info);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error showing properties for {path}: {ex.Message}");
                return false;
            }
        }

        public bool CopyFileToClipboard(string path)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(path) || path == "root" || path == "welcome") return false;
                if (!File.Exists(path) && !Directory.Exists(path)) return false;

                Application.Current?.Dispatcher.Invoke(() =>
                {
                    var collection = new System.Collections.Specialized.StringCollection { path };
                    Clipboard.SetFileDropList(collection);
                });
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error copying file to clipboard: {ex.Message}");
                return false;
            }
        }


        public static string CategorizeExtension(string ext)
        {
            return ext switch
            {
                ".exe" or ".msi" or ".bat" or ".cmd" or ".ps1" => "executable",
                ".png" or ".jpg" or ".jpeg" or ".gif" or ".svg" or ".webp" or ".bmp" or ".ico" => "image",
                ".mp4" or ".mkv" or ".avi" or ".mov" or ".wmv" or ".webm" => "video",
                ".mp3" or ".wav" or ".flac" or ".aac" or ".ogg" or ".m4a" => "audio",
                ".zip" or ".rar" or ".7z" or ".tar" or ".gz" or ".iso" => "archive",
                ".cs" or ".js" or ".ts" or ".html" or ".css" or ".py" or ".json" or ".xml" or ".cpp" or ".h" or ".c" or ".rs" or ".md" or ".sql" => "code",
                ".pdf" or ".docx" or ".doc" or ".xlsx" or ".pptx" or ".txt" or ".csv" or ".rtf" => "document",
                _ => "file"
            };
        }

        public static string FormatBytes(long bytes)
        {
            if (bytes < 0) return "0 B";
            string[] suffixes = { "B", "KB", "MB", "GB", "TB" };
            int i = 0;
            double dblSByte = bytes;
            while (dblSByte >= 1024 && i < suffixes.Length - 1)
            {
                dblSByte /= 1024;
                i++;
            }
            return $"{dblSByte:0.##} {suffixes[i]}";
        }
    }
}

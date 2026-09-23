using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
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
                        string itemType = CategorizeExtension(ext);
                        int? imgW = null;
                        int? imgH = null;
                        string? resStr = null;

                        if (itemType == "image")
                        {
                            try
                            {
                                using var fs = new FileStream(f.FullName, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                                var decoder = System.Windows.Media.Imaging.BitmapDecoder.Create(fs,
                                    System.Windows.Media.Imaging.BitmapCreateOptions.DelayCreation,
                                    System.Windows.Media.Imaging.BitmapCacheOption.None);
                                if (decoder.Frames.Count > 0)
                                {
                                    imgW = decoder.Frames[0].PixelWidth;
                                    imgH = decoder.Frames[0].PixelHeight;
                                    if (imgW > 0 && imgH > 0)
                                    {
                                        resStr = $"{imgW} × {imgH}";
                                    }
                                }
                            }
                            catch { }
                        }

                        children.Add(new FileSystemNode
                        {
                            Id = f.FullName,
                            Name = f.Name,
                            FullPath = f.FullName,
                            IsDirectory = false,
                            Extension = ext,
                            SizeBytes = f.Length,
                            FormattedSize = FormatBytes(f.Length),
                            ItemType = itemType,
                            ModifiedDate = f.LastWriteTime,
                            ImageWidth = imgW,
                            ImageHeight = imgH,
                            Resolution = resStr
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

        public bool CopyFileToClipboard(string path, bool isCut = false)
        {
            return CopyFilesToClipboard(new[] { path }, isCut);
        }

        public bool CopyFilesToClipboard(IEnumerable<string> paths, bool isCut = false)
        {
            try
            {
                var validPaths = paths
                    .Where(p => !string.IsNullOrWhiteSpace(p) && p != "root" && p != "welcome" && (File.Exists(p) || Directory.Exists(p)))
                    .ToList();

                if (validPaths.Count == 0) return false;

                Application.Current?.Dispatcher.Invoke(() =>
                {
                    var dataObject = new DataObject();
                    var collection = new System.Collections.Specialized.StringCollection();
                    collection.AddRange(validPaths.ToArray());
                    dataObject.SetFileDropList(collection);

                    // Preferred DropEffect: 2 for Move (Cut), 5 for Copy
                    byte[] dropEffectBytes = new byte[] { (byte)(isCut ? 2 : 5), 0, 0, 0 };
                    var ms = new MemoryStream(dropEffectBytes);
                    dataObject.SetData("Preferred DropEffect", ms);

                    Clipboard.SetDataObject(dataObject, true);
                });
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error copying/cutting files to clipboard: {ex.Message}");
                return false;
            }
        }

        private static bool CheckIsCutEffect()
        {
            try
            {
                if (Clipboard.ContainsData("Preferred DropEffect"))
                {
                    var data = Clipboard.GetData("Preferred DropEffect");
                    if (data is MemoryStream ms)
                    {
                        byte[] b = new byte[4];
                        if (ms.Read(b, 0, 4) > 0)
                        {
                            int val = BitConverter.ToInt32(b, 0);
                            return (val & 2) == 2; // DROPEFFECT_MOVE
                        }
                    }
                }
            }
            catch { }
            return false;
        }

        public (bool success, string message, string? zipPath) CompressItemsToZip(IEnumerable<string> paths, string? targetZipPath = null)
        {
            try
            {
                var validPaths = paths
                    .Where(p => !string.IsNullOrWhiteSpace(p) && p != "root" && p != "welcome" && (File.Exists(p) || Directory.Exists(p)))
                    .ToList();

                if (validPaths.Count == 0)
                {
                    return (false, "No hay elementos válidos para comprimir.", null);
                }

                string baseDir = Directory.Exists(validPaths[0])
                    ? (Path.GetDirectoryName(validPaths[0]) ?? validPaths[0])
                    : (Path.GetDirectoryName(validPaths[0]) ?? "");

                if (string.IsNullOrEmpty(targetZipPath))
                {
                    string firstItemName = Path.GetFileNameWithoutExtension(validPaths[0]);
                    if (string.IsNullOrEmpty(firstItemName)) firstItemName = "Archivos";
                    string candidateName = validPaths.Count == 1 ? $"{firstItemName}.zip" : $"{firstItemName}_comprimidos.zip";
                    targetZipPath = Path.Combine(baseDir, candidateName);

                    int counter = 2;
                    while (File.Exists(targetZipPath))
                    {
                        string stem = validPaths.Count == 1 ? firstItemName : $"{firstItemName}_comprimidos";
                        targetZipPath = Path.Combine(baseDir, $"{stem} ({counter}).zip");
                        counter++;
                    }
                }

                using (var zipStream = new FileStream(targetZipPath, FileMode.Create))
                using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create))
                {
                    foreach (var path in validPaths)
                    {
                        if (File.Exists(path))
                        {
                            string entryName = Path.GetFileName(path);
                            archive.CreateEntryFromFile(path, entryName, CompressionLevel.Optimal);
                        }
                        else if (Directory.Exists(path))
                        {
                            string rootDirName = Path.GetFileName(path);
                            AddDirectoryToZip(archive, path, rootDirName);
                        }
                    }
                }

                return (true, $"Archivo comprimido creado: {Path.GetFileName(targetZipPath)}", targetZipPath);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error compressing items: {ex.Message}");
                return (false, $"Error al comprimir: {ex.Message}", null);
            }
        }

        private static void AddDirectoryToZip(ZipArchive archive, string sourceDir, string entryPrefix)
        {
            foreach (var file in Directory.GetFiles(sourceDir))
            {
                string entryName = Path.Combine(entryPrefix, Path.GetFileName(file)).Replace('\\', '/');
                archive.CreateEntryFromFile(file, entryName, CompressionLevel.Optimal);
            }
            foreach (var dir in Directory.GetDirectories(sourceDir))
            {
                string nextPrefix = Path.Combine(entryPrefix, Path.GetFileName(dir)).Replace('\\', '/');
                AddDirectoryToZip(archive, dir, nextPrefix);
            }
        }

        public (int printed, string message) PrintFiles(IEnumerable<string> paths)
        {
            int count = 0;
            try
            {
                foreach (var path in paths)
                {
                    if (File.Exists(path))
                    {
                        var psi = new ProcessStartInfo
                        {
                            FileName = path,
                            Verb = "print",
                            UseShellExecute = true,
                            CreateNoWindow = true,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };
                        try
                        {
                            Process.Start(psi);
                            count++;
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine($"Could not print {path}: {ex.Message}");
                        }
                    }
                }

                if (count == 0)
                {
                    return (0, "No se encontraron documentos imprimibles o el sistema no tiene impresora asociada.");
                }
                return (count, $"Enviado a imprimir {count} documento(s).");
            }
            catch (Exception ex)
            {
                return (count, $"Error al imprimir: {ex.Message}");
            }
        }

        public bool HasClipboardFiles()
        {
            bool hasFiles = false;
            try
            {
                Application.Current?.Dispatcher.Invoke(() =>
                {
                    for (int i = 0; i < 3; i++)
                    {
                        try
                        {
                            hasFiles = Clipboard.ContainsFileDropList();
                            break;
                        }
                        catch
                        {
                            System.Threading.Thread.Sleep(10);
                        }
                    }
                });
            }
            catch { }
            return hasFiles;
        }

        private class FileCopyItem
        {
            public string SourcePath { get; set; } = string.Empty;
            public string DestPath { get; set; } = string.Empty;
            public long FileSizeBytes { get; set; }
        }

        private static void ScanDirectoryForCopy(string sourceDir, string targetDir, List<string> dirsToCreate, List<FileCopyItem> filesToCopy)
        {
            try
            {
                foreach (string subDir in Directory.GetDirectories(sourceDir))
                {
                    string dirName = Path.GetFileName(subDir);
                    string nextTarget = Path.Combine(targetDir, dirName);
                    dirsToCreate.Add(nextTarget);
                    ScanDirectoryForCopy(subDir, nextTarget, dirsToCreate, filesToCopy);
                }
                foreach (string file in Directory.GetFiles(sourceDir))
                {
                    string fileName = Path.GetFileName(file);
                    string nextDest = Path.Combine(targetDir, fileName);
                    long len = 0;
                    try { len = new FileInfo(file).Length; } catch { }
                    filesToCopy.Add(new FileCopyItem { SourcePath = file, DestPath = nextDest, FileSizeBytes = len });
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error scanning directory {sourceDir}: {ex.Message}");
            }
        }

        public (bool success, string message) PasteFromClipboard(string? targetDirectory)
        {
            return PasteFromClipboardAsync(targetDirectory).GetAwaiter().GetResult();
        }

        public async Task<(bool success, string message)> PasteFromClipboardAsync(
            string? targetDirectory,
            IProgress<PasteProgressInfo>? progress = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(targetDirectory) ||
                    targetDirectory.Equals("root", StringComparison.OrdinalIgnoreCase) ||
                    targetDirectory.Equals("welcome", StringComparison.OrdinalIgnoreCase))
                {
                    return (false, "No se puede pegar en una ubicación raíz o virtual del sistema.");
                }

                // If targetDirectory is a file, paste into its parent directory
                if (File.Exists(targetDirectory))
                {
                    targetDirectory = Path.GetDirectoryName(targetDirectory) ?? targetDirectory;
                }

                if (!Directory.Exists(targetDirectory))
                {
                    return (false, $"El directorio de destino no existe: {targetDirectory}");
                }

                bool isCutMove = false;
                System.Collections.Specialized.StringCollection? dropList = null;
                if (Application.Current?.Dispatcher?.CheckAccess() == true)
                {
                    if (Clipboard.ContainsFileDropList())
                    {
                        dropList = Clipboard.GetFileDropList();
                        isCutMove = CheckIsCutEffect();
                    }
                }
                else
                {
                    Application.Current?.Dispatcher.Invoke(() =>
                    {
                        if (Clipboard.ContainsFileDropList())
                        {
                            dropList = Clipboard.GetFileDropList();
                            isCutMove = CheckIsCutEffect();
                        }
                    });
                }

                if (dropList == null || dropList.Count == 0)
                {
                    return (false, "El portapapeles no contiene archivos ni carpetas.");
                }

                progress?.Report(new PasteProgressInfo
                {
                    Status = "calculating",
                    Message = "Analizando elementos a transferir..."
                });

                var dirsToCreate = new List<string>();
                var filesToCopy = new List<FileCopyItem>();
                var topLevelCopiedNames = new List<string>();

                foreach (string? sourcePath in dropList)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    if (string.IsNullOrWhiteSpace(sourcePath)) continue;

                    if (File.Exists(sourcePath))
                    {
                        string originalFileName = Path.GetFileName(sourcePath);
                        string destFilePath = GetUniqueDestinationFilePath(targetDirectory, sourcePath, originalFileName);
                        long fileLength = 0;
                        try { fileLength = new FileInfo(sourcePath).Length; } catch { }

                        filesToCopy.Add(new FileCopyItem
                        {
                            SourcePath = sourcePath,
                            DestPath = destFilePath,
                            FileSizeBytes = fileLength
                        });
                        topLevelCopiedNames.Add(Path.GetFileName(destFilePath));
                    }
                    else if (Directory.Exists(sourcePath))
                    {
                        string normalizedSource = Path.GetFullPath(sourcePath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                        string normalizedDest = Path.GetFullPath(targetDirectory).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

                        // Prevent recursive copying into itself
                        if (normalizedDest.Equals(normalizedSource, StringComparison.OrdinalIgnoreCase) ||
                            normalizedDest.StartsWith(normalizedSource + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }

                        string originalDirName = Path.GetFileName(normalizedSource);
                        if (string.IsNullOrEmpty(originalDirName))
                        {
                            originalDirName = "Carpeta";
                        }
                        string destDirPath = GetUniqueDestinationDirectoryPath(targetDirectory, normalizedSource, originalDirName);
                        dirsToCreate.Add(destDirPath);
                        topLevelCopiedNames.Add(Path.GetFileName(destDirPath));

                        ScanDirectoryForCopy(normalizedSource, destDirPath, dirsToCreate, filesToCopy);
                    }
                }

                if (topLevelCopiedNames.Count == 0)
                {
                    return (false, "No se pudo pegar ningún elemento del portapapeles.");
                }

                // Create directory tree ahead of copying files
                foreach (string dir in dirsToCreate)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    if (!Directory.Exists(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }
                }

                int totalFiles = filesToCopy.Count;
                long totalBytes = filesToCopy.Sum(f => f.FileSizeBytes);
                int filesCopied = 0;
                long bytesCopied = 0;

                if (totalFiles == 0)
                {
                    if (isCutMove)
                    {
                        foreach (string? sp in dropList)
                        {
                            if (!string.IsNullOrWhiteSpace(sp) && Directory.Exists(sp))
                            {
                                try { Directory.Delete(sp, true); } catch { }
                            }
                        }
                        Application.Current?.Dispatcher.Invoke(() => Clipboard.Clear());
                    }

                    progress?.Report(new PasteProgressInfo
                    {
                        Status = "completed",
                        Percent = 100,
                        FilesCopied = 0,
                        TotalFiles = 0,
                        BytesCopied = 0,
                        TotalBytes = 0,
                        FormattedProgress = "Completado",
                        FormattedSpeed = "0 B/s",
                        Message = isCutMove ? "Carpetas movidas con éxito" : "Carpetas creadas con éxito"
                    });

                    string folderMsg = isCutMove
                        ? (topLevelCopiedNames.Count == 1 ? $"Se ha movido '{topLevelCopiedNames[0]}' exitosamente." : $"Se han movido {topLevelCopiedNames.Count} carpetas exitosamente.")
                        : (topLevelCopiedNames.Count == 1 ? $"Se ha pegado '{topLevelCopiedNames[0]}' exitosamente." : $"Se han pegado {topLevelCopiedNames.Count} carpetas exitosamente.");
                    return (true, folderMsg);
                }

                const int bufferSize = 1024 * 1024; // 1 MB buffer for fast sequential throughput
                byte[] buffer = new byte[bufferSize];

                var reportStopwatch = Stopwatch.StartNew();
                long bytesAtLastReport = 0;
                double currentSpeedBytesPerSec = 0;
                string? activeDestinationFile = null;

                try
                {
                    for (int i = 0; i < filesToCopy.Count; i++)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        var item = filesToCopy[i];
                        activeDestinationFile = item.DestPath;
                        string currentName = Path.GetFileName(item.DestPath);

                        string? parentDir = Path.GetDirectoryName(item.DestPath);
                        if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir))
                        {
                            Directory.CreateDirectory(parentDir);
                        }

                        double initialPercent = totalBytes > 0
                            ? Math.Min(100.0, (double)bytesCopied / totalBytes * 100.0)
                            : (filesCopied * 100.0 / Math.Max(totalFiles, 1));

                        progress?.Report(new PasteProgressInfo
                        {
                            Status = "copying",
                            CurrentFileName = currentName,
                            FilesCopied = filesCopied,
                            TotalFiles = totalFiles,
                            BytesCopied = bytesCopied,
                            TotalBytes = totalBytes,
                            Percent = Math.Round(initialPercent, 1),
                            BytesPerSecond = currentSpeedBytesPerSec,
                            FormattedSpeed = $"{FormatBytes((long)currentSpeedBytesPerSec)}/s",
                            FormattedProgress = $"{filesCopied + 1} de {totalFiles} ({FormatBytes(bytesCopied)} / {FormatBytes(totalBytes)})",
                            Message = $"Copiando {currentName}"
                        });

                        using (var sourceStream = new FileStream(item.SourcePath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize, FileOptions.SequentialScan | FileOptions.Asynchronous))
                        using (var destStream = new FileStream(item.DestPath, FileMode.Create, FileAccess.Write, FileShare.None, bufferSize, FileOptions.SequentialScan | FileOptions.Asynchronous))
                        {
                            int bytesRead;
                            while ((bytesRead = await sourceStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)) > 0)
                            {
                                await destStream.WriteAsync(buffer, 0, bytesRead, cancellationToken);
                                bytesCopied += bytesRead;

                                long elapsedMs = reportStopwatch.ElapsedMilliseconds;
                                if (elapsedMs >= 60)
                                {
                                    long deltaBytes = bytesCopied - bytesAtLastReport;
                                    currentSpeedBytesPerSec = (deltaBytes * 1000.0) / Math.Max(elapsedMs, 1);
                                    bytesAtLastReport = bytesCopied;
                                    reportStopwatch.Restart();

                                    double currentPercent = totalBytes > 0
                                        ? Math.Min(100.0, (double)bytesCopied / totalBytes * 100.0)
                                        : ((filesCopied + 1) * 100.0 / Math.Max(totalFiles, 1));

                                    progress?.Report(new PasteProgressInfo
                                    {
                                        Status = "copying",
                                        CurrentFileName = currentName,
                                        FilesCopied = filesCopied,
                                        TotalFiles = totalFiles,
                                        BytesCopied = bytesCopied,
                                        TotalBytes = totalBytes,
                                        Percent = Math.Round(currentPercent, 1),
                                        BytesPerSecond = currentSpeedBytesPerSec,
                                        FormattedSpeed = $"{FormatBytes((long)currentSpeedBytesPerSec)}/s",
                                        FormattedProgress = $"{filesCopied + 1} de {totalFiles} ({FormatBytes(bytesCopied)} / {FormatBytes(totalBytes)})",
                                        Message = $"Copiando {currentName}"
                                    });
                                }
                            }
                        }

                        if (isCutMove && File.Exists(item.SourcePath) && !string.Equals(Path.GetFullPath(item.SourcePath), Path.GetFullPath(item.DestPath), StringComparison.OrdinalIgnoreCase))
                        {
                            try { File.Delete(item.SourcePath); } catch { }
                        }

                        filesCopied++;
                        activeDestinationFile = null;
                    }
                }
                catch (OperationCanceledException)
                {
                    if (!string.IsNullOrEmpty(activeDestinationFile) && File.Exists(activeDestinationFile))
                    {
                        try { File.Delete(activeDestinationFile); } catch { }
                    }

                    progress?.Report(new PasteProgressInfo
                    {
                        Status = "cancelled",
                        CurrentFileName = string.Empty,
                        FilesCopied = filesCopied,
                        TotalFiles = totalFiles,
                        BytesCopied = bytesCopied,
                        TotalBytes = totalBytes,
                        Percent = totalBytes > 0 ? (double)bytesCopied / totalBytes * 100.0 : 0,
                        Message = "Operación cancelada por el usuario"
                    });

                    return (false, "Operación de pegado cancelada por el usuario.");
                }

                if (isCutMove)
                {
                    foreach (string? sourcePath in dropList)
                    {
                        if (!string.IsNullOrWhiteSpace(sourcePath) && Directory.Exists(sourcePath))
                        {
                            try
                            {
                                if (!Path.GetFullPath(targetDirectory).StartsWith(Path.GetFullPath(sourcePath) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                                {
                                    Directory.Delete(sourcePath, true);
                                }
                            }
                            catch { }
                        }
                    }

                    Application.Current?.Dispatcher.Invoke(() =>
                    {
                        Clipboard.Clear();
                    });
                }

                progress?.Report(new PasteProgressInfo
                {
                    Status = "completed",
                    CurrentFileName = string.Empty,
                    FilesCopied = totalFiles,
                    TotalFiles = totalFiles,
                    BytesCopied = totalBytes,
                    TotalBytes = totalBytes,
                    Percent = 100,
                    BytesPerSecond = 0,
                    FormattedSpeed = "0 B/s",
                    FormattedProgress = $"{totalFiles} de {totalFiles} ({FormatBytes(totalBytes)} / {FormatBytes(totalBytes)})",
                    Message = isCutMove ? "Movimiento finalizado" : "Transferencia finalizada"
                });

                string successMsg;
                if (isCutMove)
                {
                    successMsg = topLevelCopiedNames.Count == 1
                        ? $"Se ha movido '{topLevelCopiedNames[0]}' exitosamente."
                        : $"Se han movido {topLevelCopiedNames.Count} elementos exitosamente.";
                }
                else
                {
                    successMsg = topLevelCopiedNames.Count == 1
                        ? $"Se ha pegado '{topLevelCopiedNames[0]}' exitosamente."
                        : $"Se han pegado {topLevelCopiedNames.Count} elementos exitosamente.";
                }

                return (true, successMsg);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error pasting from clipboard: {ex.Message}");
                progress?.Report(new PasteProgressInfo
                {
                    Status = "error",
                    Message = $"Error: {ex.Message}"
                });
                return (false, $"Error al pegar: {ex.Message}");
            }
        }

        private static string GetUniqueDestinationFilePath(string targetDirectory, string sourcePath, string fileName)
        {
            string destPath = Path.Combine(targetDirectory, fileName);
            bool isSameFolder = Path.GetDirectoryName(Path.GetFullPath(sourcePath))?
                .Equals(Path.GetFullPath(targetDirectory), StringComparison.OrdinalIgnoreCase) == true;

            if (!File.Exists(destPath) && !isSameFolder)
            {
                return destPath;
            }

            string nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            string ext = Path.GetExtension(fileName);

            string candidate = Path.Combine(targetDirectory, $"{nameWithoutExt} - copia{ext}");
            if (!File.Exists(candidate))
            {
                return candidate;
            }

            int counter = 2;
            while (true)
            {
                candidate = Path.Combine(targetDirectory, $"{nameWithoutExt} - copia ({counter}){ext}");
                if (!File.Exists(candidate))
                {
                    return candidate;
                }
                counter++;
            }
        }

        private static string GetUniqueDestinationDirectoryPath(string targetDirectory, string sourcePath, string dirName)
        {
            string destPath = Path.Combine(targetDirectory, dirName);
            bool isSameFolder = Path.GetDirectoryName(Path.GetFullPath(sourcePath))?
                .Equals(Path.GetFullPath(targetDirectory), StringComparison.OrdinalIgnoreCase) == true;

            if (!Directory.Exists(destPath) && !isSameFolder)
            {
                return destPath;
            }

            string candidate = Path.Combine(targetDirectory, $"{dirName} - copia");
            if (!Directory.Exists(candidate))
            {
                return candidate;
            }

            int counter = 2;
            while (true)
            {
                candidate = Path.Combine(targetDirectory, $"{dirName} - copia ({counter})");
                if (!Directory.Exists(candidate))
                {
                    return candidate;
                }
                counter++;
            }
        }

        private static void CopyDirectoryRecursive(string sourceDir, string destDir)
        {
            Directory.CreateDirectory(destDir);

            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string destFile = Path.Combine(destDir, Path.GetFileName(file));
                File.Copy(file, destFile, true);
            }

            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string destSubDir = Path.Combine(destDir, Path.GetFileName(subDir));
                CopyDirectoryRecursive(subDir, destSubDir);
            }
        }


        public static string CategorizeExtension(string ext)
        {
            return ext switch
            {
                ".exe" or ".msi" => "executable",
                ".png" or ".jpg" or ".jpeg" or ".jfif" or ".pjpeg" or ".gif" or ".svg" or ".webp" or ".bmp" or ".ico" or ".avif" or ".tif" or ".tiff" => "image",
                ".mp4" or ".mkv" or ".avi" or ".mov" or ".wmv" or ".webm" => "video",
                ".mp3" or ".wav" or ".flac" or ".aac" or ".ogg" or ".m4a" => "audio",
                ".zip" or ".rar" or ".7z" or ".tar" or ".gz" or ".iso" or ".arj" or ".arc" or ".cab" or ".lzh" or ".z" or ".bz2" or ".xz" => "archive",
                ".cs" or ".js" or ".ts" or ".html" or ".css" or ".py" or ".json" or ".xml" or ".cpp" or ".h" or ".c" or ".rs" or ".md" or ".sql"
                    or ".bat" or ".cmd" or ".ps1" or ".vbs" or ".sh"
                    or ".ini" or ".cfg" or ".conf" or ".log" or ".yaml" or ".yml" or ".toml" or ".reg" or ".env" => "code",
                ".pdf" or ".docx" or ".doc" or ".xlsx" or ".xls" or ".pptx" or ".ppt" or ".txt" or ".csv" or ".rtf" or ".odt" or ".ods" or ".odp" => "document",
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

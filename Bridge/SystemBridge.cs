using System;
using System.Text.Json;
using System.Windows;
using aXplorer.Models;
using aXplorer.Services;
using Microsoft.Web.WebView2.Core;
using System.Runtime.InteropServices;

namespace aXplorer.Bridge
{
    public class SystemBridge
    {
        private readonly FileSystemService _fileSystemService;
        private readonly WindowManagerService _windowManagerService;
        private readonly Window _mainWindow;
        private CoreWebView2? _webView;
        private string _currentPath = "root";
        private System.Threading.CancellationTokenSource? _pasteCts;

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public SystemBridge(Window mainWindow, FileSystemService fileSystemService, WindowManagerService windowManagerService)
        {
            _mainWindow = mainWindow;
            _fileSystemService = fileSystemService;
            _windowManagerService = windowManagerService;
        }

        public void Register(CoreWebView2 webView)
        {
            _webView = webView;
            _webView.WebMessageReceived += OnWebMessageReceived;
        }

        private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string rawJson = string.Empty;
                try
                {
                    rawJson = e.TryGetWebMessageAsString();
                }
                catch { }

                if (string.IsNullOrWhiteSpace(rawJson))
                {
                    rawJson = e.WebMessageAsJson;
                }

                if (string.IsNullOrWhiteSpace(rawJson)) return;

                BridgeMessage? message = null;
                try
                {
                    message = JsonSerializer.Deserialize<BridgeMessage>(rawJson, JsonOpts);
                }
                catch
                {
                    // If it was double-encoded JSON string
                    if (rawJson.StartsWith("\"") && rawJson.EndsWith("\""))
                    {
                        string unquoted = JsonSerializer.Deserialize<string>(rawJson) ?? "";
                        message = JsonSerializer.Deserialize<BridgeMessage>(unquoted, JsonOpts);
                    }
                }

                if (message == null) return;

                HandleAction(message);
            }
            catch (Exception ex)
            {
                SendNotification($"Error procesando comando: {ex.Message}");
            }
        }

        private void HandleAction(BridgeMessage message)
        {
            switch (message.Action?.ToLowerInvariant())
            {
                case "init":
                    SendAboutInfo();
                    SendClipboardStatus();
                    SendPlexUpdate(_currentPath);
                    break;

                case "get_about_info":
                    SendAboutInfo();
                    break;

                case "get_clipboard_status":
                    SendClipboardStatus();
                    break;

                case "get_external_tools":
                    if (!string.IsNullOrEmpty(message.Payload))
                    {
                        var tools = ExternalToolService.GetToolsForPath(message.Payload);
                        var response = new
                        {
                            type = "external_tools",
                            path = message.Payload,
                            tools = tools
                        };
                        string json = JsonSerializer.Serialize(response, JsonOpts);
                        _webView?.PostWebMessageAsJson(json);
                    }
                    break;

                case "execute_external_tool":
                    if (!string.IsNullOrEmpty(message.Payload) && !string.IsNullOrEmpty(message.ToolId))
                    {
                        _mainWindow.Dispatcher.Invoke(() =>
                        {
                            try
                            {
                                int sx = message.ScreenX ?? 100;
                                int sy = message.ScreenY ?? 100;
                                if (message.ScreenX == null || message.ScreenY == null)
                                {
                                    GetCursorPos(out POINT pt);
                                    sx = pt.X;
                                    sy = pt.Y;
                                }
                                var helper = new System.Windows.Interop.WindowInteropHelper(_mainWindow);
                                bool ok = ExternalToolService.ExecuteTool(message.ToolId, message.Payload, helper.Handle, sx, sy);
                                if (ok)
                                {
                                    SendPlexUpdate(_currentPath);
                                }
                            }
                            catch (Exception ex)
                            {
                                SendNotification($"Error al ejecutar herramienta: {ex.Message}");
                            }
                        });
                    }
                    break;

                case "show_native_context_menu":
                    if (!string.IsNullOrEmpty(message.Payload))
                    {
                        _mainWindow.Dispatcher.Invoke(() =>
                        {
                            try
                            {
                                GetCursorPos(out POINT pt);
                                int sx = message.ScreenX ?? pt.X;
                                int sy = message.ScreenY ?? pt.Y;
                                var helper = new System.Windows.Interop.WindowInteropHelper(_mainWindow);
                                ShellContextMenu.Show(helper.Handle, message.Payload, sx, sy);
                                SendPlexUpdate(_currentPath);
                            }
                            catch (Exception ex)
                            {
                                SendNotification($"Error al abrir menú nativo: {ex.Message}");
                            }
                        });
                    }
                    break;

                case "open_about_window":
                    _mainWindow.Dispatcher.Invoke(() =>
                    {
                        try
                        {
                            var aboutWin = new aXplorer.AboutWindow
                            {
                                Owner = _mainWindow
                            };
                            aboutWin.ShowDialog();
                        }
                        catch { }
                    });
                    break;

                case "navigate":
                    _currentPath = message.Payload ?? "root";
                    SendPlexUpdate(_currentPath);
                    break;

                case "navigate_parent":
                    NavigateParent();
                    break;

                case "open":
                    if (!string.IsNullOrEmpty(message.Payload))
                    {
                        bool opened = _fileSystemService.OpenItem(message.Payload);
                        if (!opened)
                        {
                            SendNotification($"No se pudo abrir el elemento: {message.Payload}");
                        }
                    }
                    break;

                case "show_in_folder":
                    if (!string.IsNullOrEmpty(message.Payload))
                    {
                        _fileSystemService.ShowInExplorer(message.Payload);
                    }
                    break;

                case "open_terminal":
                    if (!string.IsNullOrEmpty(message.Payload))
                    {
                        _fileSystemService.OpenTerminal(message.Payload);
                    }
                    break;

                case "show_properties":
                    if (!string.IsNullOrEmpty(message.Payload))
                    {
                        _fileSystemService.ShowProperties(message.Payload);
                    }
                    break;

                case "copy_file_clipboard":
                case "copy_multiple_clipboard":
                    {
                        var paths = ParsePathsFromPayload(message.Payload);
                        if (paths.Count > 0)
                        {
                            bool copied = _fileSystemService.CopyFilesToClipboard(paths, isCut: false);
                            if (copied)
                            {
                                string msg = paths.Count == 1
                                    ? $"Copiado al portapapeles: {System.IO.Path.GetFileName(paths[0])}"
                                    : $"{paths.Count} elementos copiados al portapapeles";
                                SendNotification(msg);
                            }
                            SendClipboardStatus();
                        }
                    }
                    break;

                case "cut_file_clipboard":
                case "cut_multiple_clipboard":
                    {
                        var paths = ParsePathsFromPayload(message.Payload);
                        if (paths.Count > 0)
                        {
                            bool cut = _fileSystemService.CopyFilesToClipboard(paths, isCut: true);
                            if (cut)
                            {
                                string msg = paths.Count == 1
                                    ? $"Cortado al portapapeles: {System.IO.Path.GetFileName(paths[0])}"
                                    : $"{paths.Count} elementos cortados al portapapeles";
                                SendNotification(msg);
                            }
                            SendClipboardStatus();
                        }
                    }
                    break;

                case "compress_items":
                    {
                        var paths = ParsePathsFromPayload(message.Payload);
                        if (paths.Count > 0)
                        {
                            var (success, msg, zipPath) = _fileSystemService.CompressItemsToZip(paths);
                            SendNotification(msg);
                            if (success)
                            {
                                SendPlexUpdate(_currentPath);
                            }
                        }
                    }
                    break;

                case "print_items":
                    {
                        var paths = ParsePathsFromPayload(message.Payload);
                        if (paths.Count > 0)
                        {
                            var (count, msg) = _fileSystemService.PrintFiles(paths);
                            SendNotification(msg);
                        }
                    }
                    break;

                case "paste_file_clipboard":
                    {
                        string? destPath = message.Payload;
                        if (string.IsNullOrWhiteSpace(destPath) || destPath == "root" || destPath == "welcome")
                        {
                            destPath = _currentPath;
                        }

                        _pasteCts?.Cancel();
                        _pasteCts?.Dispose();
                        _pasteCts = new System.Threading.CancellationTokenSource();
                        var token = _pasteCts.Token;

                        var progress = new Progress<PasteProgressInfo>(info =>
                        {
                            SendPasteProgress(info);
                        });

                        System.Threading.Tasks.Task.Run(async () =>
                        {
                            var (pasted, pasteMsg) = await _fileSystemService.PasteFromClipboardAsync(destPath, progress, token);
                            SendNotification(pasteMsg);
                            SendClipboardStatus();
                            SendPasteCompleted(pasted, pasteMsg);
                            if (pasted)
                            {
                                SendPlexUpdate(_currentPath);
                            }
                        }, token);
                    }
                    break;

                case "cancel_paste":
                    {
                        _pasteCts?.Cancel();
                    }
                    break;

                case "focus_window":
                    if (message.WindowHandle.HasValue)
                    {
                        _windowManagerService.FocusWindow(message.WindowHandle.Value);
                    }
                    break;

                case "close_window":
                    if (message.WindowHandle.HasValue)
                    {
                        bool sent = _windowManagerService.CloseWindow(message.WindowHandle.Value);
                        if (sent)
                        {
                            System.Threading.Tasks.Task.Delay(600).ContinueWith(_ => SendWindowsUpdate());
                        }
                    }
                    break;

                case "refresh_windows":
                    SendWindowsUpdate();
                    break;

                case "minimize":
                    _mainWindow.WindowState = WindowState.Minimized;
                    break;

                case "toggle_fullscreen":
                    if (_mainWindow.WindowState == WindowState.Maximized)
                    {
                        _mainWindow.WindowState = WindowState.Normal;
                    }
                    else
                    {
                        _mainWindow.WindowState = WindowState.Maximized;
                    }
                    break;

                case "close":
                    _mainWindow.Close();
                    break;

                case "drag_move":
                    _mainWindow.Dispatcher.Invoke(() =>
                    {
                        try
                        {
                            if (_mainWindow.WindowState == WindowState.Maximized)
                            {
                                GetCursorPos(out POINT pt);
                                _mainWindow.WindowState = WindowState.Normal;
                                _mainWindow.Left = Math.Max(0, pt.X - (_mainWindow.ActualWidth / 2));
                                _mainWindow.Top = Math.Max(0, pt.Y - 20);
                            }
                            ReleaseCapture();
                            var helper = new System.Windows.Interop.WindowInteropHelper(_mainWindow);
                            SendMessage(helper.Handle, WM_NCLBUTTONDOWN, (IntPtr)HT_CAPTION, IntPtr.Zero);
                        }
                        catch { }
                    });
                    break;
            }
        }

        private void NavigateParent()
        {
            if (_currentPath.Equals("welcome", StringComparison.OrdinalIgnoreCase)) return;

            if (_currentPath.Equals("root", StringComparison.OrdinalIgnoreCase) || _currentPath.Equals("mypc", StringComparison.OrdinalIgnoreCase))
            {
                _currentPath = "welcome";
                SendPlexUpdate(_currentPath);
                return;
            }

            try
            {
                var dir = new System.IO.DirectoryInfo(_currentPath);
                if (dir.Parent != null)
                {
                    _currentPath = dir.Parent.FullName;
                }
                else
                {
                    _currentPath = "root";
                }
                SendPlexUpdate(_currentPath);
            }
            catch
            {
                _currentPath = "root";
                SendPlexUpdate(_currentPath);
            }
        }

        public void SendPlexUpdate(string path)
        {
            try
            {
                var graph = _fileSystemService.GetPlexGraph(path);
                graph.Windows = _windowManagerService.GetOpenWindows();

                var response = new
                {
                    type = "plex_update",
                    data = graph
                };

                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch (Exception ex)
            {
                SendNotification($"Error al construir el grafo: {ex.Message}");
            }
        }

        public void SendWindowsUpdate()
        {
            try
            {
                var windows = _windowManagerService.GetOpenWindows();
                var response = new
                {
                    type = "windows_update",
                    data = windows
                };
                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch { }
        }

        public void SendNotification(string text)
        {
            try
            {
                var response = new
                {
                    type = "notification",
                    message = text
                };
                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch { }
        }

        public void SendClipboardStatus()
        {
            try
            {
                bool hasFiles = _fileSystemService.HasClipboardFiles();
                var response = new
                {
                    type = "clipboard_status",
                    hasFiles = hasFiles
                };
                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch { }
        }

        public void SendAboutInfo()
        {
            try
            {
                var response = new
                {
                    type = "about_info",
                    data = aXplorer.AboutInfo.ToPayload()
                };
                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch { }
        }

        public void SendPasteProgress(PasteProgressInfo progress)
        {
            try
            {
                var response = new
                {
                    type = "paste_progress",
                    data = progress
                };
                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch { }
        }

        public void SendPasteCompleted(bool success, string message)
        {
            try
            {
                var response = new
                {
                    type = "paste_completed",
                    success = success,
                    message = message
                };
                string json = JsonSerializer.Serialize(response, JsonOpts);
                PostWebMessage(json);
            }
            catch { }
        }

        private void PostWebMessage(string json)
        {
            if (_mainWindow?.Dispatcher?.CheckAccess() == true)
            {
                _webView?.PostWebMessageAsJson(json);
            }
            else
            {
                _mainWindow?.Dispatcher?.InvokeAsync(() =>
                {
                    _webView?.PostWebMessageAsJson(json);
                });
            }
        }

        private static System.Collections.Generic.List<string> ParsePathsFromPayload(string? payload)
        {
            var list = new System.Collections.Generic.List<string>();
            if (string.IsNullOrWhiteSpace(payload)) return list;

            if (payload.TrimStart().StartsWith("["))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<System.Collections.Generic.List<string>>(payload, JsonOpts);
                    if (parsed != null)
                    {
                        list.AddRange(parsed);
                    }
                }
                catch { }
            }

            if (list.Count == 0 && !string.IsNullOrWhiteSpace(payload))
            {
                list.Add(payload);
            }
            return list;
        }

        public void HandleDeviceChange()
        {
            // Debounce 600ms so Windows completes volume mounting/dismounting
            System.Threading.Tasks.Task.Delay(600).ContinueWith(_ =>
            {
                _mainWindow?.Dispatcher?.InvokeAsync(() =>
                {
                    try
                    {
                        // Check if current path was on an unplugged drive
                        if (_currentPath != "root" && _currentPath != "welcome")
                        {
                            if (!System.IO.Directory.Exists(_currentPath))
                            {
                                _currentPath = "root";
                            }
                        }

                        if (_currentPath == "root" || _currentPath == "welcome")
                        {
                            SendPlexUpdate(_currentPath);
                        }
                        else
                        {
                            // Send updated drives to refresh sidebar
                            var drives = _fileSystemService.GetDrives();
                            var response = new
                            {
                                type = "drives_update",
                                data = drives
                            };
                            string json = JsonSerializer.Serialize(response, JsonOpts);
                            PostWebMessage(json);
                        }

                        SendNotification("Almacenamiento USB / Unidades actualizadas");
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"Error handling device change: {ex.Message}");
                    }
                });
            });
        }

        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT
        {
            public int X;
            public int Y;
        }

        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HT_CAPTION = 0x2;
    }
}

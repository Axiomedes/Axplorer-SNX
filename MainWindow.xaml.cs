using System;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using aXplorer.Bridge;
using aXplorer.Services;
using Microsoft.Web.WebView2.Core;

namespace aXplorer
{
    public partial class MainWindow : Window
    {
        private readonly FileSystemService _fileSystemService;
        private readonly WindowManagerService _windowManagerService;
        private SystemBridge? _systemBridge;

        public MainWindow()
        {
            InitializeComponent();

            _fileSystemService = new FileSystemService();
            _windowManagerService = new WindowManagerService();

            Loaded += MainWindow_Loaded;
            Activated += (s, e) => _systemBridge?.SendClipboardStatus();
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string userDataFolder = Path.Combine(localAppData, "aXplorer_WebView2_Cache");

                var environment = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await MainWebView.EnsureCoreWebView2Async(environment);

                MainWebView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                MainWebView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                MainWebView.CoreWebView2.Settings.IsZoomControlEnabled = false;

                // Register bridge
                _systemBridge = new SystemBridge(this, _fileSystemService, _windowManagerService);
                _systemBridge.Register(MainWebView.CoreWebView2);

                // Map local wwwroot to virtual host
                string assetsFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
                MainWebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "axplorer.local",
                    assetsFolder,
                    CoreWebView2HostResourceAccessKind.Allow
                );

                // Media virtual host for streaming local images as WebGL textures
                MainWebView.CoreWebView2.AddWebResourceRequestedFilter(
                    "https://axplorer-media.local/*",
                    CoreWebView2WebResourceContext.All
                );
                MainWebView.CoreWebView2.WebResourceRequested += (s, args) =>
                {
                    try
                    {
                        var uri = new Uri(args.Request.Uri);
                        if (uri.Host.Equals("axplorer-media.local", StringComparison.OrdinalIgnoreCase))
                        {
                            string query = uri.Query;
                            string? filePath = null;
                            if (query.StartsWith("?path="))
                            {
                                filePath = Uri.UnescapeDataString(query.Substring(6));
                            }

                            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                            {
                                string ext = Path.GetExtension(filePath).ToLowerInvariant();
                                string contentType = ext switch
                                {
                                    ".jpg" or ".jpeg" or ".jfif" or ".pjpeg" => "image/jpeg",
                                    ".png" => "image/png",
                                    ".gif" => "image/gif",
                                    ".webp" => "image/webp",
                                    ".bmp" => "image/bmp",
                                    ".ico" => "image/x-icon",
                                    ".svg" => "image/svg+xml",
                                    ".avif" => "image/avif",
                                    ".mp4" or ".m4v" => "video/mp4",
                                    ".webm" => "video/webm",
                                    ".ogg" or ".ogv" => "video/ogg",
                                    ".mkv" => "video/x-matroska",
                                    ".avi" => "video/x-msvideo",
                                    ".mov" => "video/quicktime",
                                    ".wmv" => "video/x-ms-wmv",
                                    _ => "application/octet-stream"
                                };

                                var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                                long totalLength = fs.Length;
                                string? rangeHeader = args.Request.Headers.Contains("Range") ? args.Request.Headers.GetHeader("Range") : null;

                                if (!string.IsNullOrEmpty(rangeHeader) && rangeHeader.StartsWith("bytes="))
                                {
                                    string rangeValue = rangeHeader.Substring(6).Trim();
                                    string[] parts = rangeValue.Split('-');
                                    long start = 0;
                                    long end = totalLength - 1;

                                    if (long.TryParse(parts[0], out long parsedStart))
                                    {
                                        start = Math.Clamp(parsedStart, 0, totalLength - 1);
                                    }
                                    if (parts.Length > 1 && long.TryParse(parts[1], out long parsedEnd))
                                    {
                                        end = Math.Clamp(parsedEnd, start, totalLength - 1);
                                    }

                                    long contentLength = end - start + 1;
                                    fs.Seek(start, SeekOrigin.Begin);

                                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                                        fs,
                                        206,
                                        "Partial Content",
                                        $"Content-Type: {contentType}\r\nContent-Range: bytes {start}-{end}/{totalLength}\r\nAccept-Ranges: bytes\r\nContent-Length: {contentLength}\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-cache"
                                    );
                                    args.Response = response;
                                    return;
                                }
                                else
                                {
                                    var response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                                        fs,
                                        200,
                                        "OK",
                                        $"Content-Type: {contentType}\r\nAccept-Ranges: bytes\r\nContent-Length: {totalLength}\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: max-age=3600"
                                    );
                                    args.Response = response;
                                    return;
                                }
                            }

                            args.Response = MainWebView.CoreWebView2.Environment.CreateWebResourceResponse(
                                null,
                                404,
                                "Not Found",
                                "Access-Control-Allow-Origin: *"
                            );
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"Error serving local media: {ex.Message}");
                    }
                };

                MainWebView.NavigationCompleted += (s, args) =>
                {
                    LoadingSplash.Visibility = Visibility.Collapsed;
                    _systemBridge?.SendPlexUpdate("welcome");
                };

                MainWebView.Source = new Uri("https://axplorer.local/index.html");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error al inicializar la vista 3D: {ex.Message}", "aXplorer Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.F11)
            {
                WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
                e.Handled = true;
            }
            else if (e.Key == Key.Escape)
            {
                // Can send event to webview or minimize
            }
            else if (e.Key == Key.F5)
            {
                MainWebView.Reload();
                e.Handled = true;
            }
        }

        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            var source = PresentationSource.FromVisual(this) as HwndSource;
            source?.AddHook(WndProc);
        }

        private const int WM_DEVICECHANGE = 0x0219;
        private const int DBT_DEVICEARRIVAL = 0x8000;
        private const int DBT_DEVICEREMOVECOMPLETE = 0x8004;
        private const int DBT_DEVNODES_CHANGED = 0x0007;

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WM_DEVICECHANGE)
            {
                int wp = wParam.ToInt32();
                if (wp == DBT_DEVICEARRIVAL || wp == DBT_DEVICEREMOVECOMPLETE || wp == DBT_DEVNODES_CHANGED)
                {
                    _systemBridge?.HandleDeviceChange();
                }
            }
            return IntPtr.Zero;
        }
    }
}
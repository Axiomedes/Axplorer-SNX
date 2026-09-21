using System;
using System.IO;
using System.Windows;
using System.Windows.Input;
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
    }
}
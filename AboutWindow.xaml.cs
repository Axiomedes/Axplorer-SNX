using System.Windows;
using System.Windows.Input;

namespace aXplorer
{
    /// <summary>
    /// Ventana nativa WPF independiente para el diálogo "Acerca De".
    /// Permite editar libremente el diseño, maquetación y estilos visuales en XAML y C#.
    /// </summary>
    public partial class AboutWindow : Window
    {
        public AboutWindow()
        {
            InitializeComponent();
            LoadAboutData();
        }

        /// <summary>
        /// Sincroniza los textos con los definidos en AboutInfo.cs.
        /// </summary>
        private void LoadAboutData()
        {
            // Preservar la personalización visual de XAML para TxtAppName ("Ax" + "plorer")
            if (string.IsNullOrEmpty(TxtAppName.Text))
            {
                TxtAppName.Text = AboutInfo.AppName;
            }

            if (TxtBrandTag != null && string.IsNullOrEmpty(TxtBrandTag.Text))
            {
                TxtBrandTag.Text = AboutInfo.BrandTag;
            }
            if (TxtSubtitle != null && string.IsNullOrEmpty(TxtSubtitle.Text))
            {
                TxtSubtitle.Text = AboutInfo.Subtitle.ToUpperInvariant();
            }
            if (TxtVersion != null)
            {
                TxtVersion.Text = AboutInfo.Version;
            }

            if (TxtDescTitle != null && string.IsNullOrEmpty(TxtDescTitle.Text))
            {
                TxtDescTitle.Text = $"🌌 {AboutInfo.DescriptionTitle}";
            }
            if (TxtDescBody != null && string.IsNullOrEmpty(TxtDescBody.Text))
            {
                TxtDescBody.Text = AboutInfo.DescriptionText;
            }

            if (TxtDevTitle != null && string.IsNullOrEmpty(TxtDevTitle.Text))
            {
                TxtDevTitle.Text = $"👨‍💻 {AboutInfo.DeveloperTitle}";
            }

            // Preservar los Runs personalizados en TxtDevName (David Rojas [Axio.UK])
            if (TxtDevName != null && TxtDevName.Inlines.Count == 0 && string.IsNullOrEmpty(TxtDevName.Text))
            {
                TxtDevName.Text = AboutInfo.DeveloperName;
            }

            if (TxtArchitecture != null && string.IsNullOrEmpty(TxtArchitecture.Text))
            {
                TxtArchitecture.Text = AboutInfo.Architecture;
            }
            if (TxtTechnologies != null && string.IsNullOrEmpty(TxtTechnologies.Text))
            {
                TxtTechnologies.Text = AboutInfo.Technologies;
            }
            if (TxtLicenseYear != null && string.IsNullOrEmpty(TxtLicenseYear.Text))
            {
                TxtLicenseYear.Text = AboutInfo.LicenseYear;
            }

            // Carga de seguridad para Image1.png (pack URI de ensamblado o archivo local)
            if (Img != null && Img.Source == null)
            {
                try
                {
                    Img.Source = new System.Windows.Media.Imaging.BitmapImage(
                        new System.Uri("pack://application:,,,/Image1.png", System.UriKind.RelativeOrAbsolute));
                }
                catch
                {
                    try
                    {
                        string localPath = System.IO.Path.Combine(System.AppDomain.CurrentDomain.BaseDirectory, "Image1.png");
                        if (System.IO.File.Exists(localPath))
                        {
                            Img.Source = new System.Windows.Media.Imaging.BitmapImage(
                                new System.Uri(localPath, System.UriKind.Absolute));
                        }
                    }
                    catch { }
                }
            }
        }

        private void Header_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                DragMove();
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void BtnAccept_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                Close();
            }
        }
    }
}

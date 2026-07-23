using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Diagnostics;
using System.IO;
using MFC_Youth_Area_Management_System.Forms;

namespace MFC_Youth_Database.Update
{
    public static class UpdateService
    {
        public static async Task CheckForUpdatesAsync()
        {
            try
            {
                GitHubRelease release =
                    await UpdateChecker.GetLatestReleaseAsync();

                if (!VersionHelper.IsUpdateAvailable(release.Version))
                {
                    return;
                }

                GitHubAsset updateAsset =
                    release.assets.Find(asset =>
                        asset.name.EndsWith(
                            ".zip",
                            StringComparison.OrdinalIgnoreCase));

                if (updateAsset == null)
                {
                    return;
                }

                DialogResult result = MessageBox.Show(
                    "A new version is available.\n\nWould you like to download and install it now?",
                    "Update Available",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Information);

                if (result != DialogResult.Yes)
                {
                    return;
                }

                string updatePackage =
                    await DownloadManager.DownloadUpdateAsync(
                        updateAsset.browser_download_url);
                string updaterPath = Path.Combine(
                    Application.StartupPath,
                    "MFCYouthUpdater.exe");

                if (!File.Exists(updaterPath))
                {
                    MessageBox.Show(
                        "The updater could not be found.",
                        "Update Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);

                    return;
                }

                Process updaterProcess = Process.Start(
                    new ProcessStartInfo
                    {
                        FileName = updaterPath,
                        Arguments = 
                        "\"" + Application.StartupPath + "\" " +
                        "\"" + updatePackage + "\" " +
                        "\"" + Application.ProductName + ".exe\"",
                        UseShellExecute = true
                    });

                if (updaterProcess != null)
                {
                    Application.Exit();
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }
    }
}
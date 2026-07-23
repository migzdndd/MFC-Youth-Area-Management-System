using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using MFC_Youth_Database.Update;

namespace MFC_Youth_Area_Management_System.Forms
{
    public partial class UpdateAvailableForm : Form
    {
        private readonly GitHubRelease _release;
        private readonly string _currentVersion;

        public UpdateAvailableForm(GitHubRelease release, string currentVersion)
        {
            InitializeComponent();

            _release = release;
            _currentVersion = currentVersion;
        }

        private void UpdateAvailableForm_Load(object sender, EventArgs e)
        {
            lblCurrentVersionValue.Text = _currentVersion;
            lblLatestVersionValue.Text = _release.tag_name;
            rtbReleaseNotes.Text = _release.body;
        }

        private async void btnUpdateNow_Click(object sender, EventArgs e)
        {
            try
            {
                btnUpdateNow.Enabled = false;
                btnLater.Enabled = false;

                lblStatus.Visible = true;
                lblStatus.Text = "Downloading update...";

                if (_release.assets == null || _release.assets.Count == 0)
                {
                    MessageBox.Show(
                        "No downloadable update was found in this release.",
                        "Update",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);

                    btnUpdateNow.Enabled = true;
                    btnLater.Enabled = true;

                    lblStatus.Text = "No update package found.";

                    return;
                }

                GitHubAsset asset = _release.assets[0];

                string downloadedFile =
                    await DownloadManager.DownloadUpdateAsync(asset.browser_download_url);

                lblStatus.Text = "Download complete.";

                MessageBox.Show(
                    $"Update downloaded successfully.\n\n{downloadedFile}",
                    "Download Complete",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                btnUpdateNow.Enabled = true;
                btnLater.Enabled = true;

                lblStatus.Text = "Download failed.";

                MessageBox.Show(
                    ex.Message,
                    "Download Failed",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
    }
}